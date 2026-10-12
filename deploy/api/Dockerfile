FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    PORT=8080 \
    DATA_DIR=/app/data

WORKDIR /app

# 后端仅用标准库，无需安装依赖
COPY app.py ./

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["python", "-u", "app.py"]
