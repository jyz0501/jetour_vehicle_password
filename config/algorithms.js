// 固定密码配置表
const fixedPasswords = {
    traveler: {
        '0406': '*#20230730#*'
    },
    dasheng: {
        'fixed': '*#20220730#*'
    },
    x70plus: {
        'unknown': '*#20201013#*'
    },
    ruihu8: {
        'unknown': '*#20201030#*'
    },
    fengyunA9: {
        'unknown': '*#20201030#*'
    },
    shanhal7: {
        'unknown': '*#20201030#*'
    },
    shanhal9: {
        'unknown': '*#20201030#*'
    }
};

// 获取固定密码
function getFixedPassword(carModel, version) {
    if (fixedPasswords[carModel] && fixedPasswords[carModel][version]) {
        return fixedPasswords[carModel][version];
    }
    return '*#20230730#*';
}

// 密码算法定义
export const algorithms = {
    // 固定密码算法
    fixed: {
        name: '固定密码',
        countdown: 'none',
        showSerialNumberInput: false,
        showPasswordToggle: false,
        calculate: function(params) {
            const { carModel, version } = params;
            return {
                carPassword: getFixedPassword(carModel || 'traveler', version || '0406'),
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
                carPassword: getFixedPassword('dasheng', 'fixed'),
                adbPassword: '无'
            };
        }
    },
    
    // 序列号算法
    serialNumber: {
        name: '序列号算法',
        countdown: 'none',
        showSerialNumberInput: true,
        showPasswordToggle: false,
        calculate: function(params) {
            const { dateTimeNum, serialNumber } = params;
            
            if (!serialNumber || serialNumber.length !== 6) {
                return {
                    carPassword: '*#20230730#*',
                    adbPassword: ''
                };
            }
            
            const serialNum = parseInt(serialNumber, 10);
            const adbFull = serialNum * 802018;
            const adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
            
            return {
                carPassword: '*#20230730#*',
                adbPassword: adbPassword
            };
        }
    },
    
    // 250110动态算法
    dynamic250110: {
        name: '250110动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
        calculate: function(params) {
            const { dateTimeNum, hours } = params;
            const adbFull = 250110 * dateTimeNum;
            const carFull = adbFull - hours;
            
            return {
                carPassword: `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`,
                adbPassword: (adbFull % 1000000).toString().padStart(6, '0')
            };
        }
    },
    
    // 240910动态算法
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
    
    // 其他车型算法
    otherCars: {
        name: '其他车型算法',
        countdown: 'hourly',
        showSerialNumberInput: false,
        showPasswordToggle: true,
        calculate: function(params) {
            const { carModel, version, dateTimeNum, hours } = params;
            const passwords = [];
            
            const p3 = (231030 * dateTimeNum) - hours;
            passwords.push(getFixedPassword(carModel, version));
            passwords.push('*#20230730#*');
            passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
            
            return {
                passwords: passwords
            };
        }
    }
};

// 获取指定算法
export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName];
}
