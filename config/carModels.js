// 车型配置
export const carModels = {
    traveler: {
        name: '捷途旅行者/山海T2',
        versions: ['00x', '0406', '0407', 'other', 'cdm'],
        versionNames: {
            '00x': '00.08及以下',
            '0406': '4.06及以下',
            '0407': '4.07以上',
            'other': '其他',
            'cdm': '26款'
        },
        algorithms: {
            '00x': 'serialNumber',
            '0406': 'fixed',
            '0407': 'dynamic250110',
            'other': 'serialNumberDaily',
            'cdm': 'dynamic215430'
        }
    },
    ziyouzhe: {
        name: '自由者/山海T1',
        versions: ['11010x', '010108'],
        versionNames: {
            '11010x': '11.01.04及以上',
            '010108': '01.01.08'
        },
        algorithms: {
            '11010x': 'dynamic240910',
            '010108': 'dynamic240910_encrypted'
        }
    },
    shanhal7: {
        name: '山海L7/Plus/T9',
        versions: ['os10201', 'os1201000'],
        versionNames: {
            'os10201': 'OS1-02.01',
            'os1201000': 'OS1_20.10.00'
        },
        algorithms: {
            'os10201': 'otherCars',
            'os1201000': 'otherCars'
        }
    },
    shanhal9: {
        name: '山海L9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '其他版本'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    fengyunA9: {
        name: '风云A9/T9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '其他版本'
        },
        algorithms: {
            'unknown': 'serialNumberDaily'
        }
    },
    hu8: {
        name: '虎8/8L',
        versions: ['unknown'],
        versionNames: {
            'unknown': '其他版本'
        },
        algorithms: {
            'unknown': 'serialNumberDaily'
        }
    },
    x70plus: {
        name: 'X70Plus/L/Pro/CDM',
        versions: ['unknown'],
        versionNames: {
            'unknown': '00.01.0x'
        },
        algorithms: {
            'unknown': 'otherCars'
        }
    },
    x90plus: {
        name: 'X90/Plus/Pro/CDM',
        versions: ['040x', 'unknown'],
        versionNames: {
            '040x': '04.0x',
            'unknown': '其他版本'
        },
        algorithms: {
            '040x': 'fixed',
            'unknown': 'otherCars'
        }
    },
    x95: {
        name: 'X95',
        versions: ['unknown'],
        versionNames: {
            'unknown': '其他版本'
        },
        algorithms: {
            'unknown': 'otherCars'
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
