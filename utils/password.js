import { carModels, getAlgorithm } from '../config/store.js?v=2';


export function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}


export function getCarModelAlgorithm(carModel, version) {
    if (carModels[carModel] && carModels[carModel].algorithms[version]) {
        const algorithmName = carModels[carModel].algorithms[version];
        return getAlgorithm(algorithmName);
    }
    return getAlgorithm('otherCars');
}


export function getCountdownType(carModel, version) {
    const algorithm = getCarModelAlgorithm(carModel, version);
    return algorithm.countdown;
}
