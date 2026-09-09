import { currentTimezoneOffset } from '../config/timezones.js?v=2';


const API_BASE_URL = 'https://api.qianxian.tech';
const API_KEY = '7860be3779e8520826fa085203ef857ab561299afa7bb049';


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
                timezoneOffset: currentTimezoneOffset,
                verifyToken: getVerifyToken()
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
        if (data && data.verified && data.verifyToken) {
            setVerifyToken(data.verifyToken);
        }
        return data;
    } catch (error) {
        console.error('Verify Fetch Error:', error);
        return { success: false, verified: false, error: 'network' };
    }
}