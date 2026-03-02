// 车型配置
export const carModels = {
    traveler: {
        name: '捷途旅行者/山海T2',
        versions: ['00x', '0406', '0407', 'other'],
        versionNames: {
            '00x': '00.08及以下',
            '0406': '4.06及以下',
            '0407': '4.07以上',
            'other': '其他'
        },
        algorithms: {
            '00x': 'serialNumber',
            '0406': 'fixed',
            '0407': 'dynamic250110',
            'other': 'serialNumber'
        }
    },
    ruihu8: {
        name: '瑞虎8/Pro',
        versions: ['unknown'],
        versionNames: {
            'unknown': '00.01.0x'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    fengyunA9: {
        name: '风云A9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    shanhal7: {
        name: '山海L7',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    shanhal9: {
        name: '山海L9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    x70plus: {
        name: 'X70plus',
        versions: ['unknown'],
        versionNames: {
            'unknown': '00.01.0x'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    ziyouzhe: {
        name: '自由者/山海T1',
        versions: ['11010x'],
        versionNames: {
            '11010x': '11.01.04及以上'
        },
        algorithms: {
            '11010x': 'dynamic240910'
        }
    },
    dasheng: {
        name: '捷途大圣',
        versions: ['fixed'],
        versionNames: {
            'fixed': '固定密码'
        },
        algorithms: {
            'fixed': 'dashengFixed'
        }
    }
};
