// 固定口令配置表
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

// 获取固定口令
function getFixedPassword(carModel, version) {
    if (fixedPasswords[carModel] && fixedPasswords[carModel][version]) {
        return fixedPasswords[carModel][version];
    }
    return '*#20230730#*';
}

// 计算serialNumberDaily口令
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

// 口令算法定义
export const algorithms = {
    // 固定口令算法
    fixed: {
        name: '固定口令',
        countdown: 'none',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { carModel, version } = params;
            return {
                carPassword: getFixedPassword(carModel, version),
                adbPassword: '无'
            };
        }
    },
    
    // 捷途大圣固定口令算法
    dashengFixed: {
        name: '捷途大圣固定口令',
        countdown: 'none',
        showSerialNumberInput: false,
        calculate: function(params) {
            return {
                carPassword: '*#20220730#*',
                adbPassword: '无'
            };
        }
    },
    
    // 序列号算法（固定乘数802018）
    serialNumber: {
        name: '序列号算法',
        countdown: 'none',
        showSerialNumberInput: true,
        calculate: function(params) {
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
        }
    },
    
    // 序列号动态算法（基于年月日YYMMDD最后一位，每日更新）
    serialNumberDaily: {
        name: '序列号动态算法（每日更新）',
        countdown: 'daily',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { year, month, date } = params;
            const adbPassword = calculateSerialNumberDailyPassword(year, month, date);
            return {
                carPassword: '*#20230730#*',
                adbPassword: adbPassword
            };
        }
    },
    
    // 250110动态算法（按小时更新）
    dynamic250110: {
        name: '250110动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { dateTimeNum, hours } = params;
            const adbFull = 250110 * dateTimeNum;
            const carBase = 250110 * dateTimeNum;
            const carFull = carBase - hours;
            
            return {
                carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 250930动态算法（CDM系统，按小时更新）
    dynamic250930: {
        name: '250930动态算法（CDM系统）',
        countdown: 'hourly',
        showSerialNumberInput: false,
        isEncrypted: true,
        calculate: function(params) {
            const { dateTimeNum, hours } = params;
            const adbFull = 250930 * dateTimeNum;
            const carBase = 250930 * dateTimeNum;
            const carFull = carBase - hours;
            
            return {
                carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 240910动态算法（按小时更新）
    dynamic240910: {
        name: '240910动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { mmddhh, hours } = params;
            const adbFull = 240910 * mmddhh;
            const carFull = (240910 * mmddhh) - hours;
            
            return {
                carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 自由者00.04.02版本固定口令
    ziyouzhe000402: {
        name: '自由者00.04.02固定口令',
        countdown: 'none',
        showSerialNumberInput: false,
        calculate: function(params) {
            return {
                carPassword: '*#20241130#*',
                adbPassword: '无'
            };
        }
    },
    
    // 231030动态算法（按小时更新，备用）
    dynamic231030: {
        name: '231030动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { dateTimeNum, hours } = params;
            const adbFull = 231030 * dateTimeNum;
            const carFull = adbFull - hours;
            
            return {
                carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 230830动态算法（0406版本加密项，按小时更新）
    dynamic230830: {
        name: '230830动态算法（0406版本）',
        countdown: 'hourly',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { dateTimeNum } = params;
            const adbFull = 230830 * dateTimeNum;
            
            return {
                carPassword: '*#20230730#*',
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 其他车型算法
    otherCars: {
        name: '其他车型算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        calculate: function(params) {
            const { carModel, version, year, month, date, dateTimeNum, hours } = params;
            const passwords = [];
            
            if (carModel === 'ziyouzhe' && version === '11010x') {
                const { mmddhh } = params;
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
    }
};

// 获取算法
export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.otherCars;
}
