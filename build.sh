#!/usr/bin/env bash
# 本地构建：产出可直接部署的目录（与 .github/workflows/pages.yml 保持一致）
set -euo pipefail

OUT_DIR="${1:-build}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# 根目录静态文件
for f in index.html style.css app.js admin.html icon.png; do
    [ -f "$f" ] && cp "$f" "$OUT_DIR/"
done

# 模块化子目录（缺一不可：config/ utils/ 是 ES 模块入口，assets/ 是车型图）
for d in config utils assets; do
    [ -d "$d" ] && cp -R "$d" "$OUT_DIR/"
done

# 接口配置：本地存在则带上，缺失时用模板占位（运行时可从 localStorage 兜底）
if [ -f "config.local.js" ]; then
    cp config.local.js "$OUT_DIR/"
else
    echo "[warn] 缺少 config.local.js，已改用 config.example.js（请填入真实 API_KEY）"
    cp config.example.js "$OUT_DIR/config.local.js"
fi

find "$OUT_DIR" -name '.DS_Store' -delete

echo "--- 构建产物 ---"
find "$OUT_DIR" -type f | sort
