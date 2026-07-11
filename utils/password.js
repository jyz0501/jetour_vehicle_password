import { carModels } from '../config/carModels.js';
import { getAlgorithm } from '../config/algorithms.js';

// 格式化时间单位（补前导零）
export function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

// 获取指定车型和版本的算法元数据
export function getCarModelAlgorithm(carModel, version) {
    if (carModels[carModel] && carModels[carModel].algorithms[version]) {
        const algorithmName = carModels[carModel].algorithms[version];
        return getAlgorithm(algorithmName);
    }
    return getAlgorithm('otherCars');
}

// 计算倒计时类型
export function getCountdownType(carModel, version) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    return algorithm.countdown;
}
