import { currentTimezoneOffset, getSelectedLocalTime } from '../config/timezones.js?v=13';
import { getCountdownType } from './password.js?v=13';

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

// 跨境链路偶发超时：缓存最近一次成功结果作为兜底。
// 关键约束——口令按小时/天轮转，缓存只在【当前口令周期内】才可信，
// 一旦跨过轮转点就必须丢弃，绝不能拿上一周期的口令冒充当前口令。
const CACHE_PREFIX = 'pw_cache_';

// 当前口令周期的起点（epoch ms）：hourly→本整点，daily→本日 0 点，none→0（固定口令无周期）
function currentPeriodStart(carModel, version) {
    const type = getCountdownType(carModel, version);
    if (type === 'none') return 0;

    const t = getSelectedLocalTime(currentTimezoneOffset);
    const base = (type === 'daily')
        ? Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())
        : Date.UTC(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours());
    return base + currentTimezoneOffset * 60000;
}

function cacheKey(carModel, version, serialNumber) {
    return CACHE_PREFIX + carModel + '_' + version + '_' + (serialNumber || '-');
}

function hasRealPassword(data) {
    if (!data) return false;
    if (data.carPassword || data.adbPassword) return true;
    return Array.isArray(data.passwords) && data.passwords.some(p => !!p);
}

export function savePasswordCache(carModel, version, serialNumber, data) {
    // 需验证口令的车型返回空值，缓存它没有意义
    if (!hasRealPassword(data)) return;
    try {
        localStorage.setItem(
            cacheKey(carModel, version, serialNumber),
            JSON.stringify({ ts: Date.now(), data })
        );
    } catch (e) {  }
}

export function readPasswordCache(carModel, version, serialNumber) {
    try {
        const raw = localStorage.getItem(cacheKey(carModel, version, serialNumber));
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || !obj.ts || !obj.data) return null;

        // 缓存必须落在当前口令周期内，否则口令已轮转，不能展示
        const periodStart = currentPeriodStart(carModel, version);
        if (periodStart && obj.ts < periodStart) {
            try { localStorage.removeItem(cacheKey(carModel, version, serialNumber)); } catch (e) {  }
            return null;
        }

        return obj;
    } catch (e) {
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