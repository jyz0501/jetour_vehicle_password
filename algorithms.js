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
    
    // 序列号算法
    serialNumber: {
        name: '序列号算法',
        countdown: 'none',
        showSerialNumberInput: true,
        showPasswordToggle: true,
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
    
    // 其他车型算法
    otherCars: {
        name: '其他车型算法',
        countdown: 'daily',
        showSerialNumberInput: false,
        showPasswordToggle: true,
        calculate: function(params) {
            const { carModel, version } = params;
            const passwords = [];
            
            if (carModel === 'zizhe' && version === '110104') {
                const { mmddhh, hours } = params;
                const adbPwd = (240910 * mmddhh) % 1000000;
                const carPwd = ((240910 * mmddhh) - hours) % 1000000;
                passwords.push(`*#${carPwd.toString().padStart(6, '0')}#*`);
                passwords.push(adbPwd.toString().padStart(6, '0'));
                passwords.push('--');
            } else {
                const { dateTimeNum, hours } = params;
                const p3 = (20231030 * dateTimeNum) - hours;
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
        '00x': algorithms.serialNumber,
        '0407': algorithms.fixed,
        '04.11': algorithms.dynamic250110,
        '8AT': algorithms.dynamic250110,
        'other': algorithms.serialNumber
    },
    zizhe: {
        '110104': algorithms.dynamic240910,
        '110108': algorithms.dynamic240910
    },
    ruhui8: {
        'unknown': algorithms.otherCars
    },
    fengyunA9: {
        'unknown': algorithms.otherCars
    },
    shanhal7: {
        'unknown': algorithms.otherCars
    },
    shanhal9: {
        'unknown': algorithms.otherCars
    },
    x70plus: {
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
