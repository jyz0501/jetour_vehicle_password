#!/usr/bin/env bash
# 一键部署：打包后端 + 前端并上传到服务器，用 docker compose 启动/更新。
#
# 用法：
#   ./deploy.sh                        # 默认 root@81.70.24.67:/opt/jetour
#   ./deploy.sh user@host              # 指定主机
#   ./deploy.sh user@host /opt/other   # 指定主机与目录
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${1:-root@81.70.24.67}"
REMOTE_DIR="${2:-/opt/jetour}"
ENV_FILE="$ROOT/deploy/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "缺少 $ENV_FILE，请先复制 deploy/.env.example 并填入密钥" >&2
    exit 1
fi

set -a; . "$ENV_FILE"; set +a
: "${API_KEY:?deploy/.env 中缺少 API_KEY}"
WEB_PORT="${WEB_PORT:-8080}"

echo "==> 组装发布包"
STAGE="$(mktemp -d)/jetour"
mkdir -p "$STAGE/api/data" "$STAGE/web/html"

cp "$ROOT/API/app.py" "$STAGE/api/"
cp "$ROOT/deploy/api/Dockerfile" "$STAGE/api/"
cp "$ROOT/deploy/docker-compose.yml" "$STAGE/"
# compose 读取同目录 .env，一并带上（服务器侧不依赖本地文件）
cp "$ENV_FILE" "$STAGE/.env"

cp "$ROOT/index.html" "$ROOT/style.css" "$ROOT/app.js" "$ROOT/icon.png" "$STAGE/web/html/"
cp -r "$ROOT/config" "$ROOT/utils" "$ROOT/assets" "$STAGE/web/html/"
cp "$ROOT/deploy/web/Dockerfile" "$ROOT/deploy/web/nginx.conf" "$STAGE/web/"

# 前后端同机同源部署：接口地址留空即走相对路径
cat > "$STAGE/web/html/config.local.js" <<EOF
window.__JTGJ_PW_CFG__ = {
  API_BASE_URL: '',
  API_KEY: '${API_KEY}'
};
EOF

find "$STAGE" -name '.DS_Store' -delete

echo "==> 上传到 $HOST:$REMOTE_DIR"
ssh "$HOST" "mkdir -p '$REMOTE_DIR/api/data' '$REMOTE_DIR/web/html'"
if command -v rsync >/dev/null 2>&1 && ssh "$HOST" 'command -v rsync >/dev/null 2>&1'; then
    rsync -az --delete --exclude 'api/data' "$STAGE/" "$HOST:$REMOTE_DIR/"
else
    scp -rq "$STAGE"/* "$HOST:$REMOTE_DIR/"
    scp -q "$ENV_FILE" "$HOST:$REMOTE_DIR/.env"
fi

echo "==> 构建并启动容器"
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose up -d --build"

echo "==> 容器状态"
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose ps"

rm -rf "$(dirname "$STAGE")"
echo "完成，访问: http://${HOST#*@}:${WEB_PORT}"
