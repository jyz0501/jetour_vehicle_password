// 车型配置
export const carModels = {
    g700: {
        name: '捷途G700',
        versions: ['330335', '4.0x-4.4x'],
        versionNames: {
            '330335': '3.30-3.35',
            '4.0x-4.4x': '4.0x-4.4x'
        },
        algorithms: {
            '330335': 'g700Dynamic',
            '4.0x-4.4x': 'g700Dynamic'
        },
        encrypted: {
            '330335': false,
            '4.0x-4.4x': false
        }
    },
    traveler: {
        name: '旅行者/山海T2',
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
            '0406': 'traveler0406Dynamic',
            '0407': 'travelerDynamic',
            'other': 'serialNumberDaily',
            'cdm': 'cdmDynamic'
        },
        encrypted: {
            '00x': false,
            '0406': false,
            '0407': false,
            'other': false,
            'cdm': false
        }
    },
    ziyouzhe: {
        name: '自由者/山海T1',
        versions: ['11010x', '01010x', '000402'],
        versionNames: {
            '11010x': '11.01.04及以上',
            '01010x': '01.01.0x',
            '000402': '00.04.02'
        },
        algorithms: {
            '11010x': 'ziyouzheDynamic',
            '01010x': 'ziyouzheDynamic',
            '000402': 'ziyouzheFixed'
        },
        encrypted: {
            '11010x': false,
            '01010x': false,
            '000402': false
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
        },
        encrypted: {
            'os10201': false,
            'os1201000': false
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
        },
        encrypted: {
            'unknown': false
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
        },
        encrypted: {
            'unknown': false
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
        },
        encrypted: {
            'unknown': false
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
        },
        encrypted: {
            'unknown': false
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
        },
        encrypted: {
            '040x': false,
            'unknown': false
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
        },
        encrypted: {
            'unknown': false
        }
    },
    dasheng: {
        name: '捷途大圣',
        versions: ['fixed'],
        versionNames: {
            'fixed': '固定口令'
        },
        algorithms: {
            'fixed': 'dashengFixed'
        },
        encrypted: {
            'fixed': false
        }
    }
};
