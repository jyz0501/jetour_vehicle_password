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
    x90plus: {
        'unknown': '*#20201030#*'
    },
    x95: {
        'unknown': '*#20201030#*'
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