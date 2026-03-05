import { carModels } from '../config/carModels.js';
import { getAlgorithm } from '../config/algorithms.js';

// 格式化时间单位（补前导零）
export function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

// 获取指定车型和版本的算法
export function getCarModelAlgorithm(carModel, version) {
    if (carModels[carModel] && carModels[carModel].algorithms[version]) {
        const algorithmName = carModels[carModel].algorithms[version];
        return getAlgorithm(algorithmName);
    }
    // 默认返回其他车型算法
    return getAlgorithm('otherCars');
}

// 计算倒计时类型
export function getCountdownType(carModel, version) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    return algorithm.countdown;
}

// 计算口令
export function calculatePasswords(carModel, version, params) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    const now = new Date();
    
    // 添加日期参数
    const fullParams = {
        ...params,
        year: now.getFullYear(),
        month: formatTimeUnit(now.getMonth() + 1),
        date: formatTimeUnit(now.getDate()),
        hours: now.getHours(),
        dateTimeNum: parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10),
        mmddhh: parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10),
        carModel,
        version
    };
    
    return algorithm.calculate(fullParams);
}
