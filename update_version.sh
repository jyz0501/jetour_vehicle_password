#!/usr/bin/env bash
# 根据提交次数自动生成版本号：MAJOR.MINOR.PATCH
# 若工作区存在未提交改动，按「下一次提交后的次数」计算，保证版本号与所在提交一致


COMMIT_COUNT=$(git rev-list --count HEAD)


if [ -n "$(git status --porcelain)" ]; then
    COMMIT_COUNT=$((COMMIT_COUNT + 1))
fi


PADDED_COUNT=$(printf "%03d" "$COMMIT_COUNT")


MAJOR="${PADDED_COUNT:0:1}"
MINOR="${PADDED_COUNT:1:1}"
PATCH="${PADDED_COUNT:2}"


VERSION="v${MAJOR}.${MINOR}.${PATCH}"


NEW_SPAN="<span id=\"app-version\" class=\"app-ver\">${VERSION}</span>"


# 静态资源缓存串统一为提交次数：避免 index.html 与内部模块各自维护版本号导致
# 同一文件被 ?v=12 / ?v=2 等不同 URL 重复加载（模块状态被复制成两份）
for f in index.html app.js config/store.js utils/api.js utils/ui.js utils/password.js; do
    if [ -f "$f" ]; then
        sed -i.bak -E "s/\?v=[0-9]+/?v=${COMMIT_COUNT}/g" "$f"
        rm -f "$f.bak"
    fi
done

awk -v new_span="$NEW_SPAN" '
{
    if ($0 ~ /<span id="app-version"/) {
        sub(/<span id="app-version"[^>]*>[^<]*<\/span>/, new_span)
    }
    print
}
' index.html > index.html.tmp && mv index.html.tmp index.html


echo "提交次数: ${COMMIT_COUNT}"
echo "版本号已更新为: ${VERSION}"
