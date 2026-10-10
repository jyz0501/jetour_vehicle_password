import { carModels, applyServerConfig } from './config/store.js?v=13';
import {
    fetchConfig,
    fetchPasswordsWithRetry,
    lastErrorMessage,
    savePasswordCache,
    readPasswordCache
} from './utils/api.js?v=13';
import {
    renderCarGrid,
    renderVersionButtons,
    renderPasswordGroup,
    updateCarInstructions,
    updateCountdown,
    updatePasswordsFromApi,
    setFetchState,
    closeVerifyModal,
    carModelTag
} from './utils/ui.js?v=13';
import {
    formatTimezoneLabel,
    getSelectedLocalTime,
    currentTimezoneOffset
} from './config/timezones.js?v=13';

let currentCarModel = 'traveler';
let currentVersion = '0407';
let step2Shown = false;

const STORAGE_CAR = 'pw_last_car';
const STORAGE_VER = 'pw_last_version';


async function updatePasswords() {
    if (!step2Shown) return;

    const localTime = getSelectedLocalTime(currentTimezoneOffset);
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const date = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const tzLabel = formatTimezoneLabel(currentTimezoneOffset);

    const updateTimeEl = document.getElementById('updateTime');
    if (updateTimeEl) {
        updateTimeEl.textContent =
            `${localTime.getFullYear()}-${month}-${date} ${hours}:${minutes} ${tzLabel}`;
    }

    const serialNumber = document.getElementById('serialNumber')?.value || '';

    setFetchState('loading');
    const result = await fetchPasswordsWithRetry(currentCarModel, currentVersion, serialNumber);

    if (result !== null) {
        savePasswordCache(currentCarModel, currentVersion, result);
        setFetchState('ok');
        updatePasswordsFromApi(result, currentCarModel, currentVersion);
        return;
    }

    const cached = readPasswordCache(currentCarModel, currentVersion);
    if (cached) {
        const t = new Date(cached.ts);
        const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        updatePasswordsFromApi(cached.data, currentCarModel, currentVersion);
        setFetchState('error', `${lastErrorMessage()}，当前显示 ${hhmm} 获取的口令（可能已过期），点击重试`);
    } else {
        setFetchState('error', lastErrorMessage() + '，口令暂不可用');
    }
}


function ensureModelAvailable() {
    const keys = Object.keys(carModels);
    if (!keys.length) return false;
    if (!carModels[currentCarModel]) {
        currentCarModel = keys[0];
    }
    const versions = carModels[currentCarModel].versions || [];
    if (!versions.includes(currentVersion)) {
        currentVersion = versions[0];
    }
    return true;
}


function clearSavedSelection() {
    try {
        localStorage.removeItem(STORAGE_CAR);
        localStorage.removeItem(STORAGE_VER);
    } catch (e) {  }
}

function refreshStep1Visuals() {
    document.getElementById('carCount').textContent = `共 ${Object.keys(carModels).length} 款车型`;
    renderCarGrid(currentCarModel);
}

function setStep2Expanded(expanded) {
    const body = document.getElementById('stepPickBody');
    const placeholder = document.getElementById('stepPickPlaceholder');
    if (body) body.hidden = !expanded;
    if (placeholder) placeholder.hidden = !!expanded;
    if (!expanded) setFetchState('ok');
    document.getElementById('stepBar2').classList.toggle('on', !!expanded);
}


function showCarGridOnly() {
    step2Shown = false;
    setStep2Expanded(false);
    document.getElementById('carGridWrap').hidden = false;
    document.getElementById('carSummary').hidden = true;
    document.getElementById('stepBar1').classList.add('on');
    
    renderCarGrid(null);
}


function enterStep2() {
    const model = carModels[currentCarModel];
    const tag = carModelTag(currentCarModel);

    
    document.getElementById('carGridWrap').hidden = true;
    document.getElementById('carSummary').hidden = false;
    document.getElementById('sumName').textContent = model.name || currentCarModel;
    const badge = document.getElementById('sumBadge');
    badge.className = 'tag ' + tag.cls;
    badge.textContent = tag.txt;

    
    step2Shown = true;
    setStep2Expanded(true);
    document.getElementById('stepBar1').classList.add('on');

    renderVersionButtons(currentCarModel, currentVersion);
    renderPasswordGroup(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
}

function chooseCar(carKey) {
    if (!carModels[carKey]) return;
    if (carKey === currentCarModel && step2Shown) {
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    currentCarModel = carKey;
    const versions = carModels[carKey].versions || [];
    currentVersion = versions[0];
    enterStep2();
}

function setVersion(version) {
    const versions = carModels[currentCarModel].versions || [];
    if (!versions.includes(version)) return;
    currentVersion = version;
    renderVersionButtons(currentCarModel, currentVersion);
    renderPasswordGroup(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
}




function bindEvents() {
    const carGrid = document.getElementById('carGrid');
    carGrid.addEventListener('click', function (e) {
        const card = e.target.closest('.car-card');
        if (card && card.dataset.key) {
            chooseCar(card.dataset.key);
        }
    });

    document.getElementById('switchCarBtn').addEventListener('click', function () {
        
        closeVerifyModal();
        step2Shown = false;
        setStep2Expanded(false);
        document.getElementById('carGridWrap').hidden = false;
        document.getElementById('carSummary').hidden = true;
        renderCarGrid(currentCarModel);
        document.getElementById('stepCar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('versionChips').addEventListener('click', function (e) {
        const chip = e.target.closest('.ver-chip');
        if (chip && chip.dataset.version) {
            setVersion(chip.dataset.version);
        }
    });

    document.addEventListener('passwordUpdate', function (e) {
        if (e.detail && e.detail.serialNumber) {
            updatePasswords();
        }
    });

    document.addEventListener('retryFetch', function () {
        updatePasswords();
    });
}


function applyRemoteConfigAndRefresh(remoteConfig) {
    if (!remoteConfig || !applyServerConfig(remoteConfig)) return;
    if (!ensureModelAvailable()) return;

    if (step2Shown) {
        const versions = carModels[currentCarModel].versions || [];
        if (!versions.includes(currentVersion)) {
            currentVersion = versions[0];
        }
        renderVersionButtons(currentCarModel, currentVersion);
        renderPasswordGroup(currentCarModel, currentVersion);
        updateCarInstructions(currentCarModel, currentVersion);
    } else {
        refreshStep1Visuals();
    }
}

async function init() {
    // 每次打开都重置为未选车型状态，同时清掉旧版本遗留的选择记录
    clearSavedSelection();

    // 先用本地配置同步渲染首屏，避免等待远程接口导致页面卡住数秒
    ensureModelAvailable();
    refreshStep1Visuals();
    bindEvents();

    // 远程配置后台拉取，返回后再刷新界面
    fetchConfig().then(applyRemoteConfigAndRefresh).catch(function () { });

    
    if (!localStorage.getItem('jp_disclaimer_agreed')) {
        const popup = document.getElementById('usagePopup');
        const closePopup = document.getElementById('closePopup');
        if (popup) popup.style.display = 'flex';
        if (closePopup) {
            closePopup.addEventListener('click', function () {
                if (popup) popup.style.display = 'none';
                try { localStorage.setItem('jp_disclaimer_agreed', '1'); } catch (e) {}
            });
        }
    }

    
    ensureModelAvailable();
    showCarGridOnly();
}

init();

setInterval(() => {
    updateCountdown(currentCarModel, currentVersion);
}, 1000);

setInterval(updatePasswords, 60000);
