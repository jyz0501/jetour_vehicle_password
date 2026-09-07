import { carModels, applyServerConfig } from './config/store.js?v=6';
import { fetchConfig, fetchPasswordsWithRetry } from './utils/api.js?v=6';
import {
    renderCarGrid,
    renderVersionButtons,
    renderPasswordGroup,
    updateCarInstructions,
    updateCountdown,
    updatePasswordsFromApi,
    carModelTag
} from './utils/ui.js?v=6';
import {
    timezones,
    setTimezone,
    getDefaultTimezoneIndex,
    getStoredTimezoneIndex,
    formatTimezoneLabel,
    getSelectedLocalTime,
    currentTimezoneOffset
} from './config/timezones.js?v=6';

let currentCarModel = 'traveler';
let currentVersion = '0407';
let step2Shown = false;

const STORAGE_CAR = 'pw_last_car';
const STORAGE_VER = 'pw_last_version';

/* ---------- 口令拉取 ---------- */
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

    const result = await fetchPasswordsWithRetry(currentCarModel, currentVersion, serialNumber);

    if (result !== null) {
        updatePasswordsFromApi(result, currentCarModel, currentVersion);
    }
}

/* ---------- 向导状态机 ---------- */
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

function persistSelection() {
    try {
        localStorage.setItem(STORAGE_CAR, currentCarModel);
        localStorage.setItem(STORAGE_VER, currentVersion);
    } catch (e) { /* 忽略隐私模式等异常 */ }
}

/** 尝试恢复上次选择，返回是否命中 */
function restoreSelection() {
    try {
        const savedCar = localStorage.getItem(STORAGE_CAR);
        if (savedCar && carModels[savedCar]) {
            const savedVer = localStorage.getItem(STORAGE_VER);
            currentCarModel = savedCar;
            currentVersion = (savedVer && carModels[savedCar].versions.includes(savedVer))
                ? savedVer
                : carModels[savedCar].versions[0];
            return true;
        }
    } catch (e) { /* 忽略 */ }
    return false;
}

function refreshStep1Visuals() {
    document.getElementById('carCount').textContent = `共 ${Object.keys(carModels).length} 款车型`;
    renderCarGrid(currentCarModel);
}

function showCarGridOnly() {
    step2Shown = false;
    document.getElementById('stepPick').hidden = true;
    document.getElementById('carGridWrap').hidden = false;
    document.getElementById('carSummary').hidden = true;
    document.getElementById('stepBar1').classList.add('on');
    document.getElementById('stepBar2').classList.remove('on');
    // 首次进入不预高亮任何车型，引导用户主动选择
    renderCarGrid(null);
}

/** 选中车型 → 折叠网格为摘要，进入第 2 步 */
function enterStep2() {
    const model = carModels[currentCarModel];
    const tag = carModelTag(currentCarModel);

    // 第 1 步：网格折叠为摘要
    document.getElementById('carGridWrap').hidden = true;
    document.getElementById('carSummary').hidden = false;
    document.getElementById('sumName').textContent = model.name || currentCarModel;
    const badge = document.getElementById('sumBadge');
    badge.className = 'tag ' + tag.cls;
    badge.textContent = tag.txt;

    // 第 2 步展开
    step2Shown = true;
    document.getElementById('stepPick').hidden = false;
    document.getElementById('stepBar1').classList.add('on');
    document.getElementById('stepBar2').classList.add('on');

    renderVersionButtons(currentCarModel, currentVersion);
    renderPasswordGroup(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
    persistSelection();
}

function chooseCar(carKey) {
    if (!carModels[carKey]) return;
    if (carKey === currentCarModel && step2Shown) {
        // 已选中且处于第 2 步，直接回到口令区
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    currentCarModel = carKey;
    const versions = carModels[carKey].versions || [];
    // 优先沿用该车型上次记忆的版本，其次用默认（常用）版本
    let savedVer = null;
    try { savedVer = localStorage.getItem(STORAGE_VER); } catch (e) { /* 忽略 */ }
    currentVersion = (savedVer && versions.includes(savedVer)) ? savedVer : versions[0];
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
    persistSelection();
}

/* ---------- 时区 ---------- */
function initTimezoneSelector() {
    const select = document.getElementById('timezone');
    if (!select) return;

    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz.offset;
        option.textContent = tz.label;
        select.appendChild(option);
    });

    const storedIdx = getStoredTimezoneIndex();
    const idx = storedIdx !== -1 ? storedIdx : getDefaultTimezoneIndex();
    const offset = timezones[idx].offset;
    select.value = String(offset);
    setTimezone(offset);

    select.addEventListener('change', function () {
        const newOffset = parseInt(this.value, 10);
        setTimezone(newOffset);
        updatePasswords();
    });
}

/* ---------- 事件绑定 ---------- */
function bindEvents() {
    const carGrid = document.getElementById('carGrid');
    carGrid.addEventListener('click', function (e) {
        const card = e.target.closest('.car-card');
        if (card && card.dataset.key) {
            chooseCar(card.dataset.key);
        }
    });

    document.getElementById('switchCarBtn').addEventListener('click', function () {
        // 重新展开第 1 步网格（保留当前高亮与第 2 步内容，重选后自动刷新）
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
}

/* ---------- 启动 ---------- */
async function init() {
    const remoteConfig = await fetchConfig();
    if (remoteConfig && applyServerConfig(remoteConfig)) {
        ensureModelAvailable();
    }

    refreshStep1Visuals();
    bindEvents();
    initTimezoneSelector();

    // 免责弹窗
    const popup = document.getElementById('usagePopup');
    const closePopup = document.getElementById('closePopup');
    if (popup) popup.style.display = 'flex';
    if (closePopup) {
        closePopup.addEventListener('click', function () {
            if (popup) popup.style.display = 'none';
        });
    }

    // 有历史选择 → 直达第 2 步；新访客 → 从车型选择开始
    if (restoreSelection()) {
        enterStep2();
    } else {
        ensureModelAvailable();
        showCarGridOnly();
    }
}

init();

setInterval(() => {
    updateCountdown(currentCarModel, currentVersion);
}, 1000);

setInterval(updatePasswords, 60000);
