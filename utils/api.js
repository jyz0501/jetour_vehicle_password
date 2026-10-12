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
        case 'no_ticket': return '接口授权失败，请刷新页面重试';
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
// 接口配置
// ---------------------------------------------------------------------------
// 前端不再持有任何密钥。原先注入 config.local.js 的 API_KEY，任何人打开
// DevTools 就能原样读到，等同于公开。现在改为向 /api/ticket 申请一张服务端
// 签名的短期只读票据（默认 10 分钟），请求时放进 X-Access-Ticket 头。
// 即便票据被抓包，也只能在有效期内使用，服务端换掉 SIGNING_SECRET 即可全部作废。
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

// 空字符串表示“与页面同源”（前后端部署在同一台机器时），
// 是合法取值，因此不能用 || 回落到默认值。
const _injectedBase = injectedConfig().API_BASE_URL;
const API_BASE_URL = (_injectedBase === undefined || _injectedBase === null
    ? DEFAULT_API_BASE_URL
    : _injectedBase).replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// 访问票据
// ---------------------------------------------------------------------------
const TICKET_STORAGE_KEY = 'pw_access_ticket';
// 续期余量：票据临期前主动换一张，避免请求打到已过期的票据上
const TICKET_REFRESH_MARGIN_MS = 60 * 1000;

let ticketInflight = null;

function loadTicket() {
    try {
        const raw = sessionStorage.getItem(TICKET_STORAGE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (obj && obj.token && obj.expireAt) return obj;
    } catch (e) {  }
    return null;
}

function saveTicket(ticket) {
    try {
        if (ticket) {
            sessionStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(ticket));
        } else {
            sessionStorage.removeItem(TICKET_STORAGE_KEY);
        }
    } catch (e) {  }
}

async function requestTicket() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !data.ticket) return null;
    const ticket = { token: data.ticket, expireAt: (data.expireAt || 0) * 1000 };
    saveTicket(ticket);
    return ticket;
}

// 取一张可用票据；force=true 时忽略本地缓存强制换新（票据失效后重试用）
async function getTicket(force = false) {
    if (!force) {
        const cached = loadTicket();
        if (cached && cached.expireAt - Date.now() > TICKET_REFRESH_MARGIN_MS) {
            return cached.token;
        }
    }
    // 并发去重：多个请求同时发现没有票据时，只发出一次申请
    if (!ticketInflight) {
        ticketInflight = requestTicket().finally(() => { ticketInflight = null; });
    }
    const ticket = await ticketInflight;
    return ticket ? ticket.token : '';
}

// 统一发起带票据的请求，并在票据失效（401）时自动换新重试一次
async function fetchWithTicket(path, options, allowRetry = true) {
    const token = await getTicket();
    if (!token) {
        lastError = 'no_ticket';
        return null;
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, Object.assign({}, options, {
        headers: Object.assign({}, options.headers, { 'X-Access-Ticket': token })
    }));
    if (response.status === 401 && allowRetry) {
        const fresh = await getTicket(true);
        if (fresh) {
            return fetchWithTicket(path, options, false);
        }
        lastError = 'no_ticket';
        return null;
    }
    return response;
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
    try {
        const response = await fetchWithTicket('/api/password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
    try {
        const response = await fetchWithTicket('/api/config', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
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
        
        // 拿不到票据时重试没有意义，直接失败
        if (lastError === 'no_ticket') {
            return null;
        }
        
        if (i < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    return null;
}


export async function fetchVerify(carModel, version, password) {
    try {
        const response = await fetchWithTicket('/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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