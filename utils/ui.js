import { carModels } from '../config/store.js';
import { fetchPasswordsWithRetry, fetchVerify } from './api.js';
import { getCarModelAlgorithm, getCountdownType, formatTimeUnit } from './password.js';
import { currentTimezoneOffset, getCountdownMs } from '../config/timezones.js';

/* ===== 车型展示分组（静态 UI 元数据；key 需与服务端 carModels 一致，未知 key 自动归入“其他”） ===== */
const CAR_BRAND_ORDER = ['纵横', '捷途', '奇瑞'];
const CAR_MODEL_BRAND = {
    g700: '纵横', zonghengF700: '纵横',
    traveler: '捷途', ziyouzhe: '捷途', shanhal7: '捷途', shanhal9: '捷途',
    x70plus: '捷途', x90plus: '捷途', x95: '捷途', dasheng: '捷途',
    fengyunA9: '奇瑞', hu8: '奇瑞'
};
const OTHER_BRAND = '其他';

function brandOf(carKey) {
    return CAR_MODEL_BRAND[carKey] || OTHER_BRAND;
}

/* ===== 车型占位图 =====
 * 每张卡片先显示“品牌渐变底 + 车型首字”的占位块；
 * 若存在 assets/cars/<车型key>.png 则加载成功后自动替换为真实车图。
 * 推荐图片：PNG/JPG，横版，建议 ≥ 400×200。 */
const THUMB_BG = {
    '纵横': 'linear-gradient(135deg, #7c6cf0 0%, #4f5bd5 100%)',
    '捷途': 'linear-gradient(135deg, #ff9a3c 0%, #f5542f 100%)',
    '奇瑞': 'linear-gradient(135deg, #2fb6ff 0%, #5b7cfa 100%)',
    '其他': 'linear-gradient(135deg, #9aa3b2 0%, #6b7480 100%)'
};
const CAR_THUMB_DIR = 'assets/cars/';

function thumbLetter(carKey, modelName) {
    const text = modelName || carKey;
    const ch = Array.from(text)[0] || '?';
    return /[a-zA-Z0-9]/.test(ch) ? ch.toUpperCase() : ch;
}

/** 构建“占位色块 → 可被真实图片接管”的缩略图节点 */
function buildCarThumb(carKey, modelName) {
    const thumb = document.createElement('div');
    thumb.className = 'car-thumb';
    thumb.style.background = THUMB_BG[brandOf(carKey)] || THUMB_BG['其他'];

    const letter = document.createElement('span');
    letter.className = 'car-thumb-letter';
    letter.textContent = thumbLetter(carKey, modelName);
    thumb.appendChild(letter);

    const img = new Image();
    img.className = 'car-thumb-img';
    img.alt = modelName || carKey;
    img.decoding = 'async';
    img.addEventListener('load', () => {
        if (!img.src) return;
        thumb.classList.add('has-img');
        thumb.innerHTML = '';
        thumb.appendChild(img);
    });
    img.src = CAR_THUMB_DIR + carKey + '.png';

    return thumb;
}

/** 判断车型是否含动态口令（任一版本非固定即算动态） */
export function isCarModelDynamic(carKey) {
    const model = carModels[carKey];
    if (!model || !Array.isArray(model.versions) || !model.versions.length) {
        return false;
    }
    return model.versions.some(v => getCountdownType(carKey, v) !== 'none');
}

/** 车型类型徽标（网格卡片与摘要共用） */
export function carModelTag(carKey) {
    return isCarModelDynamic(carKey)
        ? { cls: 'tag-dyn', txt: '每小时更新' }
        : { cls: 'tag-fixed', txt: '固定口令' };
}

/**
 * 渲染第 1 步的车型分组卡片网格
 * @param {string} selectedKey 当前选中车型 key（用于高亮）
 */
export function renderCarGrid(selectedKey) {
    const grid = document.getElementById('carGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const allKeys = Object.keys(carModels);
    const groups = [...CAR_BRAND_ORDER, OTHER_BRAND];

    groups.forEach(groupName => {
        const keys = allKeys.filter(k => brandOf(k) === groupName);
        if (!keys.length) return;

        const groupHead = document.createElement('div');
        groupHead.className = 'wz-group';
        const groupTitle = document.createElement('span');
        groupTitle.className = 'wz-group-name';
        groupTitle.textContent = groupName;
        const groupCount = document.createElement('span');
        groupCount.className = 'wz-group-count';
        groupCount.textContent = keys.length + ' 款';
        groupHead.appendChild(groupTitle);
        groupHead.appendChild(groupCount);
        grid.appendChild(groupHead);

        keys.forEach(key => {
            const model = carModels[key];
            const dyn = carModelTag(key);
            const versionText = (model.versionNames
                ? model.versions.map(v => model.versionNames[v] || v)
                : model.versions).join(' · ');

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'car-card' + (key === selectedKey ? ' selected' : '');
            card.dataset.key = key;

            const thumb = buildCarThumb(key, model.name);
            card.appendChild(thumb);

            const line = document.createElement('div');
            line.className = 'card-line';
            const name = document.createElement('span');
            name.className = 'car-name';
            name.textContent = model.name || key;
            const tag = document.createElement('span');
            tag.className = 'tag ' + dyn.cls;
            tag.textContent = dyn.txt;
            line.appendChild(name);
            line.appendChild(tag);

            const vers = document.createElement('div');
            vers.className = 'car-vers';
            vers.textContent = versionText;

            card.appendChild(line);
            card.appendChild(vers);
            grid.appendChild(card);
        });
    });
}

/** 渲染第 2 步的版本选择 chips（仅当前车型有效版本，首项标注“常用”，需要序列号的版本加角标） */
export function renderVersionButtons(currentCarModel, currentVersion) {
    const container = document.getElementById('versionChips');
    if (!container) return;

    container.innerHTML = '';
    const carModel = carModels[currentCarModel];
    if (!carModel || !Array.isArray(carModel.versions)) return;

    carModel.versions.forEach((version, index) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ver-chip' + (version === currentVersion ? ' active' : '');
        chip.dataset.version = version;

        const label = document.createElement('span');
        label.className = 'ver-label';
        label.textContent = (carModel.versionNames && carModel.versionNames[version]) || version;
        chip.appendChild(label);

        if (index === 0) {
            const common = document.createElement('i');
            common.className = 'ver-common';
            common.textContent = '常用';
            chip.appendChild(common);
        }

        const algorithm = getCarModelAlgorithm(currentCarModel, version);
        if (algorithm && algorithm.showSerialNumberInput) {
            const note = document.createElement('i');
            note.className = 'ver-note';
            note.textContent = '需序列号';
            chip.appendChild(note);
        }

        container.appendChild(chip);
    });
}

export function renderPasswordGroup(currentCarModel, currentVersion) {
    const passwordGroup = document.getElementById('passwordGroup');
    
    if (currentCarModel === 'traveler' || currentCarModel === 'zonghengF700') {
        const adbCardTitle = currentCarModel === 'zonghengF700' ? 'ADB权限口令' : '加密项口令';
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>1. 工程模式口令</h2>
                <div class="password-value" id="carPassword">--</div>
                <div id="carInstructions">应用中心——蓝牙电话，输入上方口令</div>
            </div>
            <div class="password-card">
                <h2>2. ${adbCardTitle}</h2>
                <div id="serialNumberInput" style="display: none; margin-bottom: 15px;">
                    <input type="text" id="serialNumber" maxlength="6" placeholder="请输入序列号后六位">
                    <button id="calculateAdbButton" class="toggle-button">计算口令</button>
                </div>
                <div class="password-value" id="adbPassword">--</div>
                <div id="adbInstructions">加密设置——进入加密设置，输入上方口令</div>
            </div>
        `;
        
        const serialNumberInput = document.getElementById('serialNumberInput');
        
        if (currentVersion === '00x') {
            serialNumberInput.style.display = 'block';
        }
    } else if (currentCarModel === 'ziyouzhe') {
        let html = `
            <div class="password-card">
                <h2>1. 工程模式口令</h2>
                <div class="password-value" id="password1">--</div>
            </div>
            <div class="password-card">
                <h2>2. ADB权限口令</h2>
                <div class="password-value" id="password2">--</div>
            </div>
        `;
        
        passwordGroup.innerHTML = html;
    } else if (currentCarModel === 'dasheng') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>工程模式口令</h2>
                <div class="password-value" id="password1">--</div>
            </div>
        `;
    } else if (currentCarModel === 'g700') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>1. 工程模式口令</h2>
                <div class="password-value" id="carPassword">--</div>
                <div id="carInstructions">应用中心——蓝牙电话，输入上方口令</div>
            </div>
            <div class="password-card">
                <h2>2. ADB权限口令</h2>
                <div class="password-value" id="adbPassword">--</div>
                <div id="g700PasswordInput" style="display: none; margin-top: 10px;">
                    <input type="text" id="g700VerifyPassword" maxlength="6" placeholder="请输入密码" style="width: 100%; padding: 8px; font-size: 14px; text-align: center; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    <button id="g700VerifyButton" class="toggle-button" style="margin-top: 8px;">验证</button>
                    <p id="g700VerifyError" style="color: #e74c3c; margin-top: 8px; display: none; font-size: 12px;">密码错误</p>
                </div>
                <div id="adbInstructions">进入加密项输入上方计算后的口令</div>
            </div>
        `;
        
        const adbPasswordEl = document.getElementById('adbPassword');
        if (adbPasswordEl) {
            adbPasswordEl.textContent = '请验证密码';
            adbPasswordEl.style.color = '#95a5a6';
        }
        document.getElementById('g700PasswordInput').style.display = 'block';
        
        document.getElementById('g700VerifyButton').addEventListener('click', async function() {
            const input = document.getElementById('g700VerifyPassword');
            const errorEl = document.getElementById('g700VerifyError');
            const adbPwdEl = document.getElementById('adbPassword');
            const button = document.getElementById('g700VerifyButton');
            
            button.textContent = '验证中...';
            button.disabled = true;
            
            try {
                const data = await fetchVerify('g700', currentVersion, input.value);

                if (data.verified) {
                    errorEl.style.display = 'none';
                    const carPwdEl = document.getElementById('carPassword');
                    const adbPwdEl = document.getElementById('adbPassword');
                    carPwdEl.textContent = data.data.carPassword || '--';
                    carPwdEl.style.color = '';
                    adbPwdEl.textContent = data.data.adbPassword || '--';
                    adbPwdEl.style.color = '#e74c3c';
                    document.getElementById('g700PasswordInput').style.display = 'none';
                } else {
                    errorEl.style.display = 'block';
                    input.value = '';
                }
            } catch (e) {
                errorEl.textContent = '验证失败，请重试';
                errorEl.style.display = 'block';
            } finally {
                button.textContent = '验证';
                button.disabled = false;
            }
        });
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
        let html = '';
        for (let i = 1; i <= 3; i++) {
            html += `
                <div class="password-card">
                    <h2>口令${i}</h2>
                    <div class="password-value" id="password${i}">--</div>
                </div>
            `;
        }
        html += `
            <div class="password-card">
                <h2>使用说明</h2>
                <div id="carInstructions">系统界面点击系统升级——快速点击8次系统版本——ADB切换——ADB模式</div>
            </div>
        `;
        passwordGroup.innerHTML = html;
    } else {
        let html = '';
        for (let i = 1; i <= 3; i++) {
            html += `
                <div class="password-card">
                    <h2>口令${i}</h2>
                    <div class="password-value" id="password${i}">--</div>
                </div>
            `;
        }
        passwordGroup.innerHTML = html;
    }
    
    setupPasswordEventListeners(currentCarModel, currentVersion);
}

function setupPasswordEventListeners(currentCarModel, currentVersion) {
    const calculateAdbButton = document.getElementById('calculateAdbButton');
    if (calculateAdbButton) {
        calculateAdbButton.addEventListener('click', function() {
            const serialNumber = document.getElementById('serialNumber').value;
            if (serialNumber.length !== 6) {
                alert('请输入车机序列号后六位');
                return;
            }
            
            const event = new CustomEvent('passwordUpdate', { 
                detail: { serialNumber } 
            });
            document.dispatchEvent(event);
        });
    }
}

export function updateCarInstructions(currentCarModel, currentVersion) {
    const carInstructionsEl = document.getElementById('carInstructions');
    const adbInstructionsEl = document.getElementById('adbInstructions');
    
    if (!carInstructionsEl || !adbInstructionsEl) return;
    
    let carInstructions = '应用中心——蓝牙电话，输入上方口令';
    let adbInstructions = '加密设置——进入加密设置，输入上方口令';
    
    if (currentCarModel === 'traveler' || currentCarModel === 'zonghengF700') {
        if (currentCarModel === 'zonghengF700') {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '进入加密项输入上方计算后的口令';
        } else if (currentVersion === '00x') {
            carInstructions = '系统界面连点 8 次';
            adbInstructions = '进入加密项输入上方计算后的口令';
        } else if (currentVersion === 'other') {
            carInstructions = '应用中心——蓝牙电话，输入上方口令 或者 通用——系统——右侧空白处连点8下';
            adbInstructions = '';
        } else if (currentVersion === '0406') {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '';
        } else if (currentVersion === 'cdm') {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '';
        }
    } else if (currentCarModel === 'ziyouzhe') {
        if (currentVersion === '00x') {
            carInstructions = '系统界面连点 8 次';
            adbInstructions = '进入加密项输入上方计算后的口令';
        } else {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '加密设置——进入加密设置，输入上方口令';
        }
    } else if (currentCarModel === 'dasheng') {
        if (currentVersion === '00x') {
            carInstructions = '系统界面连点 8 次';
            adbInstructions = '进入加密项输入上方计算后的口令';
        } else {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '';
        }
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
        carInstructions = '系统界面点击系统升级——快速点击8次系统版本——ADB切换——ADB模式';
        adbInstructions = '';
    } else {
        if (currentVersion === '00x') {
            carInstructions = '系统界面连点 8 次';
            adbInstructions = '进入加密项输入上方计算后的口令';
        } else {
            carInstructions = '应用中心——蓝牙电话，输入上方口令';
            adbInstructions = '';
        }
    }
    
    carInstructionsEl.textContent = carInstructions;
    adbInstructionsEl.textContent = adbInstructions;
}

export function updateCountdown(currentCarModel, currentVersion) {
    const countdownEl = document.getElementById('nextUpdateTime');
    if (!countdownEl) return;

    const countdownType = getCountdownType(currentCarModel, currentVersion);

    if (countdownType === 'none') {
        countdownEl.textContent = '无（固定口令）';
        return;
    }

    const diff = getCountdownMs(currentTimezoneOffset, countdownType);

    if (countdownType === 'daily') {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        countdownEl.textContent = `${hours}时${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        countdownEl.textContent = `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    }
}

export function updatePasswordsFromApi(result, currentCarModel, currentVersion) {
    if (currentCarModel === 'traveler' || currentCarModel === 'zonghengF700') {
        const carPasswordEl = document.getElementById('carPassword');
        const adbPasswordEl = document.getElementById('adbPassword');
        
        if (carPasswordEl) {
            carPasswordEl.textContent = result.carPassword || '--';
        }
        if (adbPasswordEl) {
            adbPasswordEl.textContent = result.adbPassword || '--';
        }
    } else if (currentCarModel === 'ziyouzhe') {
        const password1El = document.getElementById('password1');
        const password2El = document.getElementById('password2');
        
        if (password1El) {
            password1El.textContent = result.carPassword || '--';
        }
        if (password2El) {
            password2El.textContent = result.adbPassword || '--';
        }
    } else if (currentCarModel === 'dasheng') {
        const password1El = document.getElementById('password1');
        
        if (password1El) {
            password1El.textContent = result.carPassword || '--';
        }
    } else if (currentCarModel === 'g700') {
        const carPasswordEl = document.getElementById('carPassword');
        const adbPasswordEl = document.getElementById('adbPassword');
        
        if (carPasswordEl) {
            const g700PasswordInput = document.getElementById('g700PasswordInput');
            if (g700PasswordInput && g700PasswordInput.style.display !== 'none') {
                carPasswordEl.textContent = '请验证密码';
                carPasswordEl.style.color = '#95a5a6';
            } else {
                carPasswordEl.textContent = result.carPassword || '--';
                carPasswordEl.style.color = '';
            }
        }
        if (adbPasswordEl) {
            const g700PasswordInput = document.getElementById('g700PasswordInput');
            if (g700PasswordInput && g700PasswordInput.style.display !== 'none') {
                adbPasswordEl.textContent = '请验证密码';
                adbPasswordEl.style.color = '#95a5a6';
            } else {
                adbPasswordEl.textContent = result.adbPassword || '--';
                adbPasswordEl.style.color = '';
            }
        }
    } else {
        if (result.passwords && Array.isArray(result.passwords)) {
            for (let i = 1; i <= 3; i++) {
                const el = document.getElementById(`password${i}`);
                if (el) {
                    el.textContent = result.passwords[i - 1] || '--';
                }
            }
        } else {
            const password1El = document.getElementById('password1');
            const password2El = document.getElementById('password2');
            
            if (password1El) {
                password1El.textContent = result.carPassword || '--';
            }
            if (password2El) {
                password2El.textContent = result.adbPassword || '--';
            }
        }
    }
}