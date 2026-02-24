#!/bin/bash

# 创建构建目录
rm -rf build
mkdir -p build

# 复制必要的静态文件
cp index.html build/
cp style.css build/
cp app.js build/
cp icon.png build/

# 复制其他可能需要的文件（如果有的话）
if [ -f "README.md" ]; then
    cp README.md build/
fi

# 显示构建结果
ls -la build/