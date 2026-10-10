import { currentTimezoneOffset } from '../config/timezones.js?v=13';

// 单次请求超时：源站偶发高延迟（实测 1s~9s 波动）时不再无限等待，
// 交给重试逻辑快速失败重试；阈值取略高于实测峰值，避免误判为超时。
const REQUEST_TIMEOUT_MS = 12000;

// 最近一次失败原因，供界面提示：no_key / timeout / network / api / http
let lastError = null;

export function getLastError() {
    return lastError;
}

export function lastErrorMessage() {
    switch (lastError) {
        case 'no_key': return '未配置接口密钥，请联系站点维护者';
        case 'timeout': return '接口响应超时';
        case 'network': return '网络请求失败';
        case 'http': return '接口返回异常状态码';
        default: return '口令获取失败';
    }
}

async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } finally {
        clearTimeout(timer);
    }
}

// ---------------------------------------------------------------------------
// 接口配置（密钥不硬编码在源码中）
// ---------------------------------------------------------------------------
// 取值优先级：
//   1. window.__JTGJ_PW_CFG__ —— 由页面引入的 config.local.js 注入
//   2. localStorage['pw_api_key'] —— 后台页输入框保存的值
// config.local.js 已加入 .gitignore；Pages 部署时由工作流从 GitHub Secret 生成。
// 本地开发：复制 config.example.js 为 config.local.js 并填入密钥。
// ---------------------------------------------------------------------------
const DEFAULT_API_BASE_URL = 'https://api.qianxian.tech';

function injectedConfig() {
    try {
        return window.__JTGJ_PW_CFG__ || {};
    } catch (e) {
        return {};
    }
}

function readLocalStorage(key) {
    try {
        return localStorage.getItem(key) || '';
    } catch (e) {
        return '';
    }
}

const API_BASE_URL = (injectedConfig().API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

function apiKey() {
    return String(injectedConfig().API_KEY || readLocalStorage('pw_api_key') || '').trim();
}

export function hasApiKey() {
    return !!apiKey();
}

const VERIFY_TOKEN_KEY = 'pw_verify_token';

export function getVerifyToken() {
    try {
        return sessionStorage.getItem(VERIFY_TOKEN_KEY) || '';
    } catch (e) {
        return '';
    }
}

export function setVerifyToken(token) {
    try {
        if (token) {
            sessionStorage.setItem(VERIFY_TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(VERIFY_TOKEN_KEY);
        }
    } catch (e) {  }
}

export function clearVerifyToken() {
    setVerifyToken('');
}

export async function fetchPasswords(carModel, version, serialNumber = '') {
    if (!apiKey()) {
        console.error('[pw] 未配置接口密钥：请复制 config.example.js 为 config.local.js 并填入 API_KEY');
        lastError = 'no_key';
        return null;
    }
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey()
            },
            body: JSON.stringify({
                carModel,
                version,
                serialNumber,
                timezoneOffset: currentTimezoneOffset,
                verifyToken: getVerifyToken()
            })
        });
        
        if (!response.ok) {
            lastError = 'http';
            console.error('API HTTP Error:', response.status);
            return null;
        }

        const data = await response.json();
        
        if (data.success) {
            lastError = null;
            return data.data;
        } else {
            lastError = 'api';
            console.error('API Error:', data.error);
            return null;
        }
    } catch (error) {
        lastError = (error && error.name === 'AbortError') ? 'timeout' : 'network';
        console.error('Fetch Error:', error);
        return null;
    }
}

export async function fetchConfig() {
    if (!apiKey()) {
        console.error('[pw] 未配置接口密钥：请复制 config.example.js 为 config.local.js 并填入 API_KEY');
        return null;
    }
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/config`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey()
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            return data.data;
        } else {
            console.error('Config API Error:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Fetch Config Error:', error);
        return null;
    }
}

export async function fetchPasswordsWithRetry(carModel, version, serialNumber = '', maxRetries = 2) {
    let lastError = null;
    
    for (let i = 0; i <= maxRetries; i++) {
        const result = await fetchPasswords(carModel, version, serialNumber);
        if (result !== null) {
            return result;
        }
        
        // 没配密钥时重试没有意义，直接失败
        if (lastError === 'no_key') {
            return null;
        }
        
        if (i < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    return null;
}


export async function fetchVerify(carModel, version, password) {
    if (!apiKey()) {
        return { success: false, verified: false, error: 'no_api_key' };
    }
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey()
            },
            body: JSON.stringify({
                carModel,
                version,
                password,
                timezoneOffset: currentTimezoneOffset
            })
        });
        const data = await response.json();
        if (data && data.verified && data.verifyToken) {
            setVerifyToken(data.verifyToken);
        }
        return data;
    } catch (error) {
        console.error('Verify Fetch Error:', error);
        return { success: false, verified: false, error: 'network' };
    }
}