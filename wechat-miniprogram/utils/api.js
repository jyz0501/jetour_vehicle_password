// 接口配置从 config.js 读取（该文件已 gitignore，含密钥，请勿提交）
const { API_BASE_URL, API_KEY } = require('../config.js');

export function fetchPasswords(carModel, version, serialNumber = '') {
    return new Promise((resolve) => {
        wx.request({
            url: `${API_BASE_URL}/api/password`,
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            data: {
                carModel,
                version,
                serialNumber,
                timezoneOffset: new Date().getTimezoneOffset()
            },
            success(res) {
                if (res.data && res.data.success) {
                    resolve(res.data.data);
                } else {
                    resolve(null);
                }
            },
            fail() {
                resolve(null);
            }
        });
    });
}

export async function fetchPasswordsWithRetry(carModel, version, serialNumber = '', maxRetries = 2) {
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