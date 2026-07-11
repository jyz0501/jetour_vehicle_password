const API_BASE_URL = 'https://api.qianxian.tech';
const API_KEY = 'jetour_password_2026';

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
                serialNumber
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