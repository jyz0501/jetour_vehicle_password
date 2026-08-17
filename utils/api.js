import { currentTimezoneOffset } from '../config/timezones.js';

// 后端地址集中管理：若 api.qianxian.tech 部署冲突，只需改这里（如 pwd-api.qianxian.tech）
const API_BASE_URL = 'https://api.qianxian.tech';
const API_KEY = '6c3dc45c96644bf08d0918e0966af662930aa2507ad8419692af2e8f39221c1f';

export async function fetchPasswords(carModel, version, serialNumber = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                carModel,
                version,
                serialNumber,
                timezoneOffset: currentTimezoneOffset
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('API Error:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        return null;
    }
}

export async function fetchConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
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
        
        if (i < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    return null;
}

// G700 等需密码验证的车型：验证通过后返回口令
export async function fetchVerify(carModel, version, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                carModel,
                version,
                password,
                timezoneOffset: currentTimezoneOffset
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Verify Fetch Error:', error);
        return { success: false, verified: false, error: 'network' };
    }
}