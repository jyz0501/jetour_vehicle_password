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
