#!/usr/bin/env node
/**
 * Jetour Password API —— 自有服务器部署入口
 *
 * 将 Cloudflare Workers 风格的 index.js 适配为原生 Node.js HTTP 服务，
 * 无需修改任何业务代码即可在 VPS/云主机上直接运行。
 *
 * 运行方式：
 *   node server.js          # 或 npm start
 *
 * 环境变量：
 *   PORT    监听端口（默认 8080）
 *   HOST    监听地址（默认 0.0.0.0）
 *   API_KEY 接口密钥，不设置则使用 index.js 内置 fallback 常量
 *
 * 健康检查：GET /healthz（不经过 API Key 校验）
 */
const http = require('http');
const { URL } = require('url');

// ---------- 1. 注入环境变量（index.js 会优先读取全局 API_KEY） ----------
if (process.env.API_KEY) {
    global.API_KEY = process.env.API_KEY;
}

// ---------- 2. Web API 兼容层（Node 18+ 已内置 fetch/Request/Response/Headers） ----------
// index.js 使用 addEventListener('fetch', ...) 注册入口，Node 无此全局，此处做 shim
if (typeof globalThis.addEventListener === 'undefined') {
    globalThis.addEventListener = function (type, handler) {
        if (type === 'fetch') {
            globalThis.__workerFetchHandler = handler;
        }
    };
}

// ---------- 3. 加载 Worker 业务代码 ----------
require('./index.js');

const workerHandler = globalThis.__workerFetchHandler;
if (!workerHandler) {
    console.error('[server] 未找到 Worker fetch handler，请确认 index.js 存在且注册了 addEventListener("fetch", ...)');
    process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// ---------- 4. 工具函数 ----------
function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function resolveClientIp(req, url) {
    if (url.pathname === '/healthz') return 'healthcheck';
    // 优先取真实客户端 IP，供 index.js 内存限流使用
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return String(cfIp);
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return String(forwarded).split(',')[0].trim();
    const realIp = req.headers['x-real-ip'];
    if (realIp) return String(realIp);
    return req.socket.remoteAddress || 'unknown';
}

function writeResponse(res, response) {
    const headersObj = {};
    for (const [key, value] of response.headers.entries()) {
        headersObj[key] = value;
    }
    // 兜底 CORS：若 Worker 响应未携带 CORS 头则补上
    if (!headersObj['access-control-allow-origin']) {
        headersObj['access-control-allow-origin'] = '*';
    }

    if (res.headersSent) return;
    res.writeHead(response.status, headersObj);

    // HEAD 请求不返回 body；响应无 body 直接结束
    if (res.req.method === 'HEAD' || !response.body) {
        res.end();
        return;
    }

    const reader = response.body.getReader();
    const pump = () => {
        reader.read().then(({ done, value }) => {
            if (done) {
                res.end();
                return;
            }
            res.write(Buffer.from(value));
            pump();
        }).catch((err) => {
            console.error('[server] 响应流读取失败:', err);
            res.end();
        });
    };
    pump();
}

// ---------- 5. HTTP 服务 ----------
const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

        // 内置健康检查（不经过 API Key 校验）
        if (url.pathname === '/healthz') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
            return;
        }

        // 组装 Headers（透传原始请求头）
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(key, value);
        }
        // 注入真实客户端 IP，供 index.js 的 checkRateLimit 使用
        headers.set('CF-Connecting-IP', resolveClientIp(req, url));

        // GET/HEAD 不允许携带 body，其余方法读取原始 body 传给 Worker
        const canHaveBody = !['GET', 'HEAD'].includes(req.method);
        const body = canHaveBody ? await readRawBody(req) : undefined;

        const request = new Request(url.toString(), {
            method: req.method,
            headers,
            body: body !== undefined ? body : undefined
        });

        const event = {
            request,
            respondWith: (promise) => {
                Promise.resolve(promise)
                    .then((response) => writeResponse(res, response))
                    .catch((err) => {
                        console.error('[server] respondWith 异常:', err);
                        if (!res.headersSent) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            });
                        }
                        res.end(JSON.stringify({ error: 'Internal server error' }));
                    });
            }
        };

        workerHandler(event);
    } catch (err) {
        console.error('[server] 请求处理异常:', err);
        if (!res.headersSent) {
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
        }
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

server.listen(PORT, HOST, () => {
    console.log(`[server] Jetour Password API 已启动: http://${HOST}:${PORT}`);
    console.log(`[server] 健康检查: http://${HOST}:${PORT}/healthz`);
});
