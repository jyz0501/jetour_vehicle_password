const API_KEY = 'jetour_password_2026';

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

function calculateSerialNumberDailyPassword(year, month, date) {
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
    fixed: function(params) {
        const { carModel, version } = params;
        return {
            carPassword: getFixedPassword(carModel, version),
            adbPassword: '无'
        };
    },
    
    dashengFixed: function(params) {
        return {
            carPassword: '*#20220730#*',
            adbPassword: '无'
        };
    },
    
    serialNumber: function(params) {
        const { serialNumber } = params;
        if (serialNumber && serialNumber.length >= 6) {
            const snLastSix = serialNumber.slice(-6);
            const adbFull = 802018 * parseInt(snLastSix, 10);
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
    
    serialNumberDaily: function(params) {
        const { year, month, date } = params;
        const adbPassword = calculateSerialNumberDailyPassword(year, month, date);
        return {
            carPassword: '*#20230730#*',
            adbPassword: adbPassword
        };
    },
    
    dynamic250110: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = 250110 * dateTimeNum;
        const carBase = 250110 * dateTimeNum;
        const carFull = carBase - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    dynamic250930: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = 250930 * dateTimeNum;
        const carBase = 250930 * dateTimeNum;
        const carFull = carBase - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    dynamic240910: function(params) {
        const { mmddhh, hours } = params;
        const adbFull = 240910 * mmddhh;
        const carFull = (240910 * mmddhh) - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    ziyouzhe000402: function(params) {
        return {
            carPassword: '*#20241130#*',
            adbPassword: '无'
        };
    },
    
    dynamic231030: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = 231030 * dateTimeNum;
        const carFull = adbFull - hours;
        
        return {
            carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    dynamic230830: function(params) {
        const { dateTimeNum } = params;
        const adbFull = 230830 * dateTimeNum;
        
        return {
            carPassword: '*#20230730#*',
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    dynamic250530: function(params) {
        const { dateTimeNum, hours } = params;
        const adbFull = 250530 * dateTimeNum - hours;
        
        return {
            carPassword: '*#20240730#*',
            adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
        };
    },
    
    otherCars: function(params) {
        const { carModel, version, year, month, date, dateTimeNum, hours, mmddhh } = params;
        const passwords = [];
        
        if (carModel === 'ziyouzhe' && version === '11010x') {
            const adbPwd = (240910 * mmddhh) % 1000000;
            const carPwd = ((240910 * mmddhh) - hours) % 1000000;
            passwords.push(`*#${carPwd.toString().padStart(6, '0')}#*`);
            passwords.push(adbPwd.toString().padStart(6, '0'));
            passwords.push('--');
        } else if (carModel === 'shanhal7') {
            const p3 = (231030 * dateTimeNum) - hours;
            passwords.push(`*#20201030#*`);
            passwords.push(calculateSerialNumberDailyPassword(year, month, date));
            passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
        } else {
            const p3 = (231030 * dateTimeNum) - hours;
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
            '00x': 'serialNumber',
            '0406': 'dynamic230830',
            '0407': 'dynamic250110',
            'other': 'serialNumberDaily',
            'cdm': 'dynamic250930'
        }
    },
    ziyouzhe: {
        versions: ['11010x', '01010x', '000402'],
        algorithms: {
            '11010x': 'dynamic240910',
            '01010x': 'dynamic240910',
            '000402': 'ziyouzhe000402'
        }
    },
    shanhal7: {
        versions: ['os10201', 'os1201000'],
        algorithms: {
            'os10201': 'otherCars',
            'os1201000': 'otherCars'
        }
    },
    shanhal9: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'fixed'
        }
    },
    fengyunA9: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'serialNumberDaily'
        }
    },
    hu8: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'serialNumberDaily'
        }
    },
    x70plus: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'fixed'
        }
    },
    x90plus: {
        versions: ['040x', 'unknown'],
        algorithms: {
            '040x': 'fixed',
            'unknown': 'fixed'
        }
    },
    x95: {
        versions: ['unknown'],
        algorithms: {
            'unknown': 'fixed'
        }
    },
    dasheng: {
        versions: ['fixed'],
        algorithms: {
            'fixed': 'dashengFixed'
        }
    },
    g700: {
        versions: ['330335'],
        algorithms: {
            '330335': 'dynamic250530'
        }
    }
};

function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.otherCars;
}

function getCarModelAlgorithm(carModel, version) {
    if (carModels[carModel] && carModels[carModel].algorithms[version]) {
        const algorithmName = carModels[carModel].algorithms[version];
        return getAlgorithm(algorithmName);
    }
    return getAlgorithm('otherCars');
}

function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

function calculatePasswords(carModel, version, params) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    const now = new Date();
    
    const fullParams = {
        ...params,
        year: now.getFullYear(),
        month: formatTimeUnit(now.getMonth() + 1),
        date: formatTimeUnit(now.getDate()),
        hours: now.getHours(),
        dateTimeNum: parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10),
        mmddhh: parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10),
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
    
    let carModel, version, serialNumber;
    
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            carModel = body.carModel;
            version = body.version;
            serialNumber = body.serialNumber || '';
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
        const result = calculatePasswords(carModel, version, { serialNumber });
        const now = new Date();
        const month = formatTimeUnit(now.getMonth() + 1);
        const date = formatTimeUnit(now.getDate());
        const hours = formatTimeUnit(now.getHours());
        const minutes = formatTimeUnit(now.getMinutes());
        
        return new Response(JSON.stringify({
            success: true,
            data: result,
            updateTime: `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`,
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