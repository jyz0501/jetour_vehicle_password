// 车型配置
export const carModels = {
    g700: {
        name: '纵横G700',
        versions: ['330335', '335337', '04.0x-04.4x'],
        versionNames: {
            '330335': '03.30-03.35',
            '335337': '03.36-03.37',
            '04.0x-04.4x': '04.0x-04.4x'
        },
        algorithms: {
            '330335': 'g700Dynamic',
            '335337': 'g700Dynamic',
            '04.0x-04.4x': 'g700Dynamic'
        },
        encrypted: {
            '330335': false,
            '335337': false,
            '04.0x-04.4x': false
        }
    },
    traveler: {
        name: '旅行者/山海T2',
        versions: ['00x', '0406', '0407', 'cdm', 'other'],
        versionNames: {
            '00x': '≤00.00.08',
            '0406': '≤00.04.06',
            '0407': '>00.04.07',
            'cdm': '≥00.00.03',
            'other': '其他'
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
        name: '山海L7/Plus',
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
            'unknown': 'fixed'
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
            'unknown': 'fixed'
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
            'unknown': 'fixed'
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
            'unknown': 'fixed'
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
    },
    zonghengF700: {
        name: '纵横F700',
        versions: ['000302'],
        versionNames: {
            '000302': '00.03.02'
        },
        algorithms: {
            '000302': 'f700Dynamic'
        },
        encrypted: {
            '000302': false
        }
    }
};
