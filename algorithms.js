// 密码算法定义
const algorithms = {
    // 固定密码算法
    fixed: {
        name: '固定密码',
        countdown: 'none',
        showSerialNumberInput: false,
        showPasswordToggle: false,
        calculate: function(params) {
            return {
                carPassword: '*#20230730#*',
                adbPassword: '无'
            };
        }
    },
    
    // 捷途大圣固定密码算法
    dashengFixed: {
        name: '捷途大圣固定密码',
        countdown: 'none',
        showSerialNumberInput: false,
        showPasswordToggle: false,
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
        showPasswordToggle: false,
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
    
    // 序列号动态算法（基于日期MMDDHH最后一位，每小时更新）
    serialNumberDaily: {
        name: '序列号动态算法（每小时更新）',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: false,
        calculate: function(params) {
            const { month, date, hours } = params;
            const mmddhh = parseInt(`${month}${date}${hours}`, 10);
            const lastDigit = mmddhh % 10;
            
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
            
            const adbFull = mmddhh + baseValue;
            return {
                carPassword: '*#20230730#*',
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 250110动态算法（按小时更新）
    dynamic250110: {
        name: '250110动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
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
    
    // 240910动态算法（按小时更新）
    dynamic240910: {
        name: '240910动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
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
    
    // 231030动态算法（按小时更新，备用）
    dynamic231030: {
        name: '231030动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
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
    
    // 其他车型算法
    otherCars: {
        name: '其他车型算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
        calculate: function(params) {
            const { carModel, version } = params;
            const passwords = [];
            
            if (carModel === 'ziyouzhe' && version === '11010x') {
                const { mmddhh, hours } = params;
                const adbPwd = (240910 * mmddhh) % 1000000;
                const carPwd = ((240910 * mmddhh) - hours) % 1000000;
                passwords.push(`*#${carPwd.toString().padStart(6, '0')}#*`);
                passwords.push(adbPwd.toString().padStart(6, '0'));
                passwords.push('--');
            } else {
                const { dateTimeNum, hours } = params;
                const p3 = (231030 * dateTimeNum) - hours;
                const p1 = carModel === 'x70plus' ? `*#20201013#*` : `*#20201030#*`;
                passwords.push(p1);
                passwords.push(`*#20230730#*`);
                passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
            }
            
            return {
                passwords: passwords
            };
        }
    }
};

// 车型版本到算法的映射
const algorithmMap = {
    traveler: {
        '00x': algorithms.serialNumberDaily,
        '0406': algorithms.fixed,
        '0407': algorithms.dynamic250110,
        'other': algorithms.serialNumber
    },
    ziyouzhe: {
        '11010x': algorithms.dynamic240910
    },
    dasheng: {
        'fixed': algorithms.dashengFixed
    },
    shanhal7: {
        'unknown': algorithms.otherCars
    },
    shanhal9: {
        'unknown': algorithms.otherCars
    },
    x70plus: {
        'unknown': algorithms.otherCars
    },
    x90plus: {
        'unknown': algorithms.otherCars
    },
    x95: {
        'unknown': algorithms.otherCars
    }
};

// 获取指定车型和版本的算法
function getAlgorithm(carModel, version) {
    if (algorithmMap[carModel] && algorithmMap[carModel][version]) {
        return algorithmMap[carModel][version];
    }
    // 默认返回其他车型算法
    return algorithms.otherCars;
}

// 计算倒计时类型
function getCountdownType(carModel, version) {
    const algorithm = getAlgorithm(carModel, version);
    return algorithm.countdown;
}

// 计算密码
function calculatePasswords(carModel, version, params) {
    const algorithm = getAlgorithm(carModel, version);
    return algorithm.calculate(params);
}

// 获取显示设置
function getDisplaySettings(carModel, version) {
    const algorithm = getAlgorithm(carModel, version);
    return {
        showSerialNumberInput: algorithm.showSerialNumberInput,
        showPasswordToggle: algorithm.showPasswordToggle
    };
}

// 导出
export { algorithms, algorithmMap, getAlgorithm, getCountdownType, calculatePasswords, getDisplaySettings };
