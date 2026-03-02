// 密码算法定义
export const algorithms = {
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
            const { carModel, version } = params;
            const passwords = [];
            
            if (carModel === 'zizhe' && version === '11010x') {
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

// 获取指定算法
export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName];
}
