
export const algorithms = {
    fixed: {
        name: '固定口令',
        countdown: 'none',
        showSerialNumberInput: false
    },
    dashengFixed: {
        name: '捷途大圣固定口令',
        countdown: 'none',
        showSerialNumberInput: false
    },
    serialNumber: {
        name: '序列号算法',
        countdown: 'none',
        showSerialNumberInput: true
    },
    serialNumberDaily: {
        name: '序列号动态算法（每日更新）',
        countdown: 'daily',
        showSerialNumberInput: false
    },
    travelerDynamic: {
        name: '动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    cdmDynamic: {
        name: '动态算法（CDM系统）',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    ziyouzheDynamic: {
        name: '动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    ziyouzheFixed: {
        name: '自由者固定口令',
        countdown: 'none',
        showSerialNumberInput: false
    },
    dynamicA: {
        name: '动态算法',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    traveler0406Dynamic: {
        name: '动态算法（0406版本）',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    g700Dynamic: {
        name: '动态算法（纵横G700车型）',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    otherCars: {
        name: '其他车型算法',
        countdown: 'hourly',
        showSerialNumberInput: false
    },
    f700Dynamic: {
        name: '动态算法（纵横F700车型）',
        countdown: 'hourly',
        showSerialNumberInput: false
    }
};


export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.otherCars;
}
