// 共享配置存储：默认使用本地配置，启动时若 /api/config 拉取成功则以服务端配置为准
// （单一数据源：新增车型/算法/时区只需更新 Server 的 CONFIG_* 常量）
import { carModels as localCarModels } from './carModels.js';
import { timezones as localTimezones } from './timezones.js';
import { algorithms as localAlgorithms } from './algorithms.js';

export let carModels = localCarModels;
export let timezones = localTimezones;
export let algorithms = localAlgorithms;

/**
 * 用服务端下发的配置覆盖本地配置
 * @param {Object} config /api/config 返回的 data
 * @returns {boolean} 是否应用了任一配置
 */
export function applyServerConfig(config) {
    if (!config || typeof config !== 'object') return false;
    let applied = false;

    if (config.carModels && typeof config.carModels === 'object' && Object.keys(config.carModels).length) {
        carModels = config.carModels;
        applied = true;
    }
    if (config.timezones && Array.isArray(config.timezones) && config.timezones.length) {
        timezones = config.timezones;
        applied = true;
    }
    if (config.algorithms && typeof config.algorithms === 'object' && Object.keys(config.algorithms).length) {
        algorithms = config.algorithms;
        applied = true;
    }
    return applied;
}

/** 根据业务算法名取算法元数据（含 countdown/showSerialNumberInput），未知算法回退 otherCars */
export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.otherCars;
}
