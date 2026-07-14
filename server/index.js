const API_KEY = 'jetour_password_2026';

const MUL_A = 250110;
const MUL_B = 250930;
const MUL_C = 250830;
const MUL_D = 240910;
const MUL_E = 231030;
const MUL_F = 230830;
const MUL_G = 250530;
const MUL_SN = 802018;

const fixedPasswords = {
    traveler: {
        '0406': '*#20230730#*'
    },
    dasheng: {
        'fixed': '*#20220730#*'
    },
    x70plus: {
        'unknown': '*#20201030#*'
    },
    x90plus: {
        '040x': '*#20230730#*',
        'unknown': '*#20201030#*'
    },
    x95: {
        'unknown': '*#20201030#*'
    },
    shanhal7: {
        'unknown': '*#20201030#*'
    },
    shanhal9: {
        'unknown': '*#20201030#*'
    }
};

function getFixedPassword(carModel, version) {
    if (fixedPasswords[carModel] && fixedPasswords[carModel][version]) {
        return fixedPasswords[carModel][version];
    }
    return '*#20230730#*';
}

function calcDailySnPwd(year, month, date) {
    const yymmdd = parseInt(`${year.toString().slice(-2)}${month}${date}`, 10);
    const lastDigit = yymmdd % 10;
    
    let baseValue;
    switch(lastDigit) {
        case 0: baseValue = 213518; break;
        case 1: baseValue = 658035; break;
        case 2: baseValue = 235657; break;
        case 3: baseValue = 567534; break;
        case 4: baseValue = 647825; break;
        case 5: baseValue = 234700; break;
        case 6: baseValue = 127347; break;
        case 7: baseValue = 875634; break;
        case 8: baseValue = 345678; break;
        case 9: baseValue = 982345; break;
        default: baseValue = 213518;
    }
    
    const adbFull = yymmdd + baseValue;
    return (adbFull % 1000000).toString().padStart(6, '0');
}

const algorithms = {
    algo_12: function(params) {
        const { carModel, version } = params;
        return {
            carPassword: getFixedPassword(carModel, version),
            adbPassword: '无'
        };
    },
    
    algo_10: function(params) {
        return {
            carPassword: '*#20220730#*',
            adbPassword: '无'
        };
    },
    
    algo_08: function(params) {
        const { serialNumber } = params;
        if (serialNumber && serialNumber.length >= 6) {
            const snLastSix = serialNumber.slice(-6);
            const adbFull = MUL_SN * parseInt(snLastSix, 10);
            return {
                carPassword: '*#20230730#*',
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        } else {
            return {
                carPassword: '*#20230730#*',
                adbPassword: '请输入序列号'
            };
        }
    },
    
    algo_09: function(params) {
        const { year, month, date } = params;
        const adbPassword = calcDailySnPwd(year, month, date);
        return {
            carPassword: '*#20230730#*',
            adbPassword: adbPassword
        };
    },
    
    algo_01: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = MUL_A * dateTimeNum;
        const carBase = MUL_A * dateTimeNum;
        const carFull = carBase - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_02: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = MUL_B * dateTimeNum;
        const carBase = MUL_B * dateTimeNum;
        const carFull = carBase - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },

    algo_03: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = MUL_C * dateTimeNum;
        const carFull = adbFull - hours;

        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_04: function(params) {
        const { mmddhh, hours } = params;
        const adbFull = MUL_D * mmddhh;
        const carFull = (MUL_D * mmddhh) - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_11: function(params) {
        return {
            carPassword: '*#20241130#*',
            adbPassword: '无'
        };
    },
    
    algo_05: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = MUL_E * dateTimeNum;
        const carFull = adbFull - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_06: function(params) {
        const { dateTimeNum } = params;
        const adbFull = MUL_F * dateTimeNum;
        
        return {
            carPassword: '*#20230730#*',
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_07: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = MUL_G * dateTimeNum - hours;
        
        return {
            carPassword: '*#20240730#*',
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    algo_13: function(params) {
        const { carModel, version, year, month, date, dateTimeNum, hours, mmddhh } = params;
        const passwords = [];
        
        if (carModel === 'ziyouzhe' && version === '11010x') {
            const adbPwd = (MUL_D * mmddhh) % 1000000;
            const carPwd = ((MUL_D * mmddhh) - hours) % 1000000;
            passwords.push(`*#${carPwd.toString().padStart(6, '0')}#*`);
            passwords.push(adbPwd.toString().padStart(6, '0'));
            passwords.push('--');
        } else if (carModel === 'shanhal7') {
            const p3 = (MUL_E * dateTimeNum) - hours;
            passwords.push(`*#20201030#*`);
            passwords.push(calcDailySnPwd(year, month, date));
            passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
        } else {
            const p3 = (MUL_E * dateTimeNum) - hours;
            passwords.push(`*#20201030#*`);
            passwords.push(`*#20230730#*`);
            passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
        }
        
        return {
            passwords: passwords
        };
    }
};

const carModels = {
    traveler: {
        versions: ['00x', '0406', '0407', 'other', 'cdm'],
        algorithms: {
            '00x': 'algo_08',
            '0406': 'algo_06',
            '0407': 'algo_01',
            'other': 'algo_09',
            'cdm': 'algo_02'
        }
    },
    ziyouzhe: {
        versions: ['11010x', '01010x', '000402'],
        algorithms: {
            '11010x': 'algo_04',
            '01010x': 'algo_04',
            '000402': 'algo_11'
        }
    },
    shanhal7: {
        versions: ['os10201', 'os1201000'],
        algorithms: {
            'os10201': 'algo_13',
            'os1201000': 'algo_13'
        }
    },
    shanhal9: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'algo_12'
        }
    },
    fengyunA9: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'algo_09'
        }
    },
    hu8: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'algo_09'
        }
    },
    x70plus: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'algo_12'
        }
    },
    x90plus: {
        versions: ['040x', 'unknown'],
        algorithms: {
            '040x': 'algo_12',
            'unknown': 'algo_12'
        }
    },
    x95: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'algo_12'
        }
    },
    dasheng: {
        versions: ['fixed'],
        algorithms: {
            'fixed': 'algo_10'
        }
    },
    g700: {
        versions: ['330335', '4.0x-4.4x'],
        algorithms: {
            '330335': 'algo_07',
            '4.0x-4.4x': 'algo_03'
        }
    }
};

function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.algo_13;
}

function getCarModelAlgorithm(carModel, version) {
    if (carModels[carModel] && carModels[carModel].algorithms[version]) {
        const algorithmName = carModels[carModel].algorithms[version];
        return getAlgorithm(algorithmName);
    }
    return getAlgorithm('algo_13');
}

function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

function formatTimezoneLabel(offset) {
    const totalMinutes = -offset;
    const sign = totalMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(totalMinutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calculatePasswords(carModel, version, params) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    const now = new Date();
    
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    
    let localTime;
    if (params.timezoneOffset !== undefined && params.timezoneOffset !== null) {
        localTime = new Date(utc - params.timezoneOffset * 60000);
    } else {
        localTime = new Date(utc + 8 * 3600000);
    }
    
    const fullParams = {
        ...params,
        year: localTime.getFullYear(),
        month: formatTimeUnit(localTime.getMonth() + 1),
        date: formatTimeUnit(localTime.getDate()),
        hours: localTime.getHours(),
        dateTimeNum: parseInt(`${formatTimeUnit(localTime.getMonth() + 1)}${formatTimeUnit(localTime.getDate())}${formatTimeUnit(localTime.getHours())}`, 10),
        mmddhh: parseInt(`${formatTimeUnit(localTime.getMonth() + 1)}${formatTimeUnit(localTime.getDate())}${formatTimeUnit(localTime.getHours())}`, 10),
        carModel,
        version
    };
    
    return algorithm(fullParams);
}

function validateApiKey(request) {
    const apiKey = request.headers.get('X-API-Key');
    return apiKey === API_KEY;
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    if (!validateApiKey(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // 验证端点
    if (path === '/api/verify' && request.method === 'POST') {
        try {
            const body = await request.json();
            const { carModel, password, timezoneOffset, version } = body;
            
            if (carModel !== 'g700') {
                return new Response(JSON.stringify({ success: false, verified: false, error: 'Invalid car model' }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
            
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            
            let localTime;
            if (timezoneOffset !== undefined && timezoneOffset !== null) {
                localTime = new Date(utc - timezoneOffset * 60000);
            } else {
                localTime = new Date(utc + 8 * 3600000);
            }
            
            const month = formatTimeUnit(localTime.getMonth() + 1);
            const date = formatTimeUnit(localTime.getDate());
            const hours = localTime.getHours();
            const dateTimeNum = parseInt(`${month}${date}${String(hours).padStart(2, '0')}`, 10);
            
            const carBase = MUL_B * dateTimeNum;
            const carFull = carBase - hours;
            const verifyPassword = (carFull % 1000000).toString().padStart(6, '0');
            
            if (password === verifyPassword) {
                const verifyVersion = version || '330335';
                const result = calculatePasswords('g700', verifyVersion, { timezoneOffset });
                return new Response(JSON.stringify({
                    success: true,
                    verified: true,
                    data: { carPassword: result.carPassword, adbPassword: result.adbPassword }
                }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
            } else {
                return new Response(JSON.stringify({ success: true, verified: false }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid request body' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
    
    let carModel, version, serialNumber, timezoneOffset;
    
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            carModel = body.carModel;
            version = body.version;
            serialNumber = body.serialNumber || '';
            timezoneOffset = body.timezoneOffset;
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid request body' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } else {
        carModel = url.searchParams.get('carModel');
        version = url.searchParams.get('version');
        serialNumber = url.searchParams.get('serialNumber') || '';
        timezoneOffset = url.searchParams.get('timezoneOffset');
    }
    
    if (!carModel || !version) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    try {
        const result = calculatePasswords(carModel, version, { serialNumber, timezoneOffset });
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const hasOffset = timezoneOffset !== undefined && timezoneOffset !== null;
        const localTime = hasOffset ? new Date(utc - timezoneOffset * 60000) : new Date(utc + 8 * 3600000);
        const tzLabel = hasOffset ? formatTimezoneLabel(timezoneOffset) : 'UTC+08:00';
        const month = formatTimeUnit(localTime.getMonth() + 1);
        const date = formatTimeUnit(localTime.getDate());
        const hours = formatTimeUnit(localTime.getHours());
        const minutes = formatTimeUnit(localTime.getMinutes());
        
        // G700 所有密码都需验证后获取
        if (carModel === 'g700') {
            return new Response(JSON.stringify({
                success: true,
                data: { carPassword: null, adbPassword: null, needVerify: true },
                updateTime: `${localTime.getFullYear()}-${month}-${date} ${hours}:${minutes} ${tzLabel}`,
                timestamp: now.getTime()
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            data: result,
            updateTime: `${localTime.getFullYear()}-${month}-${date} ${hours}:${minutes} ${tzLabel}`,
            timestamp: now.getTime()
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
