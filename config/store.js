

import { carModels as localCarModels } from './carModels.js?v=2';
import { timezones as localTimezones } from './timezones.js?v=2';
import { algorithms as localAlgorithms } from './algorithms.js?v=2';

export let carModels = localCarModels;
export let timezones = localTimezones;
export let algorithms = localAlgorithms;

export let verifyConfig = {};


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
    if (config.verifyConfig && typeof config.verifyConfig === 'object') {
        verifyConfig = config.verifyConfig;
        applied = true;
    }
    return applied;
}


export function isVerifyRequired(carModel, version) {
    const modelCfg = verifyConfig[carModel];
    if (modelCfg && typeof modelCfg === 'object' && version in modelCfg) {
        return !!modelCfg[version];
    }
    return carModel === 'g700' || carModel === 'zonghengF700';
}


export function getAlgorithm(algorithmName) {
    return algorithms[algorithmName] || algorithms.otherCars;
}
