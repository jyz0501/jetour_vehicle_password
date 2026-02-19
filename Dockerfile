# Dockerfile
# 使用轻量级Nginx作为静态服务器
FROM nginx:alpine
FROM python:3.10-slim
# 复制项目文件到Nginx默认静态目录（/usr/share/nginx/html）
COPY . /usr/share/nginx/html
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y chromium
RUN pip install playwright requests beautifulsoup4
# 暴露80端口（Nginx默认监听80）
EXPOSE 80

# 启动Nginx（禁用后台模式，确保容器持续运行）
CMD ["nginx", "-g", "daemon off;"]
CMD ["python", "screenshot.py"]
