import { carModels } from '../config/carModels.js';
import { calculatePasswords, getCountdownType, formatTimeUnit } from './password.js';

// 渲染版本按钮
export function renderVersionButtons(currentCarModel, currentVersion) {
    const versionButtonsContainer = document.querySelector('.version-buttons');
    versionButtonsContainer.innerHTML = '';
    
    const carModel = carModels[currentCarModel];
    carModel.versions.forEach((version, index) => {
        const button = document.createElement('button');
        button.className = 'version-button' + (version === currentVersion ? ' active' : '');
        button.dataset.version = version;
        button.textContent = carModel.versionNames[version];
        versionButtonsContainer.appendChild(button);
    });
}

// 渲染密码区域
export function renderPasswordGroup(currentCarModel, currentVersion) {
    const passwordGroup = document.getElementById('passwordGroup');
    
    if (currentCarModel === 'traveler') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>1. 工程模式密码</h2>
                <div class="password-value" id="carPassword">--</div>
                <div id="carInstructions">应用中心——蓝牙电话，输入上方密码</div>
            </div>
            <div class="password-card">
                <h2>2. 加密项密码</h2>
                <div id="serialNumberInput" style="display: none; margin-bottom: 15px;">
                    <input type="text" id="serialNumber" maxlength="6" placeholder="请输入序列号后六位">
                    <button id="calculateAdbButton" class="toggle-button">计算密码</button>
                </div>
                <div id="cdmPasswordInput" style="display: none; margin-bottom: 15px;">
                    <input type="password" id="cdmPassword" maxlength="6" placeholder="请输入密码查看">
                    <button id="showCdmPasswordButton" class="toggle-button">显示密码</button>
                </div>
                <div class="password-value" id="adbPassword">--</div>
                <div id="adbInstructions">进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码</div>
            </div>
        `;
        
        // 根据版本显示/隐藏序列号输入框或CDM密码输入框
        const serialNumberInput = document.getElementById('serialNumberInput');
        const cdmPasswordInput = document.getElementById('cdmPasswordInput');
        
        if (currentVersion === '00x') {
            serialNumberInput.style.display = 'block';
        } else if (currentVersion === 'cdm') {
            cdmPasswordInput.style.display = 'block';
        }
    } else if (currentCarModel === 'ziyouzhe') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>1. 工程模式密码</h2>
                <div class="password-value" id="password1">--</div>
            </div>
            <div class="password-card">
                <h2>2. ADB权限密码</h2>
                <div class="password-value" id="password2">--</div>
            </div>
        `;
    } else if (currentCarModel === 'dasheng') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>工程模式密码</h2>
                <div class="password-value" id="password1">--</div>
            </div>
        `;
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
        let html = '';
        for (let i = 1; i <= 3; i++) {
            html += `
                <div class="password-card">
                    <h2>密码${i}</h2>
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
                    <h2>密码${i}</h2>
                    <div class="password-value" id="password${i}">--</div>
                </div>
            `;
        }
        passwordGroup.innerHTML = html;
    }
    
    setupPasswordEventListeners(currentCarModel, currentVersion);
}

// 获取当前时间的MMDHH密码
function getCdmPassword() {
    const now = new Date();
    const month = formatTimeUnit(now.getMonth() + 1);
    const date = formatTimeUnit(now.getDate());
    const hours = formatTimeUnit(now.getHours());
    return `${month}${date}${hours}`;
}

// 设置密码区域事件监听器
function setupPasswordEventListeners(currentCarModel, currentVersion) {
    const calculateAdbButton = document.getElementById('calculateAdbButton');
    if (calculateAdbButton) {
        calculateAdbButton.addEventListener('click', function() {
            const serialNumber = document.getElementById('serialNumber').value;
            if (serialNumber.length !== 6) {
                alert('请输入车机序列号后六位');
                return;
            }
            
            const now = new Date();
            const month = formatTimeUnit(now.getMonth() + 1);
            const date = formatTimeUnit(now.getDate());
            const hours = formatTimeUnit(now.getHours());
            const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
            
            const params = {
                dateTimeNum,
                hours: now.getHours(),
                serialNumber
            };
            
            const result = calculatePasswords(currentCarModel, currentVersion, params);
            
            const adbPasswordElement = document.getElementById('adbPassword');
            adbPasswordElement.textContent = result.adbPassword;
        });
    }
    
    // CDM版本显示密码按钮
    const showCdmPasswordButton = document.getElementById('showCdmPasswordButton');
    if (showCdmPasswordButton) {
        showCdmPasswordButton.addEventListener('click', function() {
            const cdmPasswordInput = document.getElementById('cdmPassword');
            const adbPasswordEl = document.getElementById('adbPassword');
            const inputPassword = cdmPasswordInput.value;
            const correctPassword = getCdmPassword();
            
            if (inputPassword === correctPassword) {
                // 密码正确，显示ADB密码
                const now = new Date();
                const month = formatTimeUnit(now.getMonth() + 1);
                const date = formatTimeUnit(now.getDate());
                const hours = formatTimeUnit(now.getHours());
                const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
                
                const params = {
                    dateTimeNum,
                    hours: now.getHours(),
                    year: now.getFullYear(),
                    month: month,
                    date: date,
                    carModel: currentCarModel,
                    version: currentVersion
                };
                
                const result = calculatePasswords(currentCarModel, currentVersion, params);
                adbPasswordEl.textContent = result.adbPassword;
                cdmPasswordInput.value = '';
            } else {
                alert('密码错误，请输入当前时间的MMDDHH格式密码（如030318表示3月3日18时）');
            }
        });
    }
}

// 更新车型说明
export function updateCarInstructions(currentCarModel, currentVersion) {
    const carInstructionsEl = document.getElementById('carInstructions');
    const adbInstructionsEl = document.getElementById('adbInstructions');
    
    if (!carInstructionsEl || !adbInstructionsEl) return;
    
    let carInstructions = '应用中心——蓝牙电话，输入上方密码';
    let adbInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    
    if (currentCarModel === 'traveler') {
        if (currentVersion === '00x' || currentVersion === 'other') {
            carInstructions = '应用中心——蓝牙电话，输入上方密码 或者 通用——系统——右侧空白处连点10下';
            adbInstructions = '进入加密项输入上方计算后的密码';
        } else if (currentVersion === '0406') {
            carInstructions = '应用中心——蓝牙电话，输入上方密码';
            adbInstructions = '';
        } else if (currentVersion === 'cdm') {
            carInstructions = '应用中心——蓝牙电话，输入上方密码';
            adbInstructions = '输入当前时间的MMDDHH格式密码查看加密项密码';
        }
    } else if (currentCarModel === 'ziyouzhe') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    } else if (currentCarModel === 'dasheng') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '';
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
        carInstructions = '系统界面点击系统升级——快速点击8次系统版本——ADB切换——ADB模式';
        adbInstructions = '';
    }
    
    carInstructionsEl.textContent = carInstructions;
    adbInstructionsEl.textContent = adbInstructions;
}

// 更新倒计时
export function updateCountdown(currentCarModel, currentVersion) {
    const now = new Date();
    const countdownEl = document.getElementById('nextUpdateTime');
    if (!countdownEl) return;
    
    const countdownType = getCountdownType(currentCarModel, currentVersion);
    
    if (countdownType === 'none') {
        countdownEl.textContent = '无（固定密码）';
        return;
    } else if (countdownType === 'daily') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const diff = tomorrow - now;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        countdownEl.textContent = `${hours}时${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    } else if (countdownType === 'hourly') {
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        const diff = nextHour - now;
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        countdownEl.textContent = `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    }
}

// 更新旅行者车型密码
export function updateTravelerPasswords(dateTimeNum, currentVersion, serialNumber) {
    const now = new Date();
    const params = {
        dateTimeNum,
        hours: now.getHours(),
        serialNumber,
        year: now.getFullYear(),
        month: formatTimeUnit(now.getMonth() + 1),
        date: formatTimeUnit(now.getDate()),
        carModel: 'traveler',
        version: currentVersion
    };
    
    const result = calculatePasswords('traveler', currentVersion, params);
    
    const carPasswordEl = document.getElementById('carPassword');
    const adbPasswordEl = document.getElementById('adbPassword');
    
    if (carPasswordEl) {
        carPasswordEl.textContent = result.carPassword || '--';
    }
    
    // CDM版本不自动显示ADB密码，需要输入密码查看
    if (adbPasswordEl && currentVersion !== 'cdm') {
        adbPasswordEl.textContent = result.adbPassword || '--';
    } else if (adbPasswordEl && currentVersion === 'cdm') {
        adbPasswordEl.textContent = '********';
    }
}

// 更新其他车型密码
export function updateOtherCarPasswords(dateTimeNum, currentCarModel, currentVersion) {
    const now = new Date();
    const mmddhh = parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10);
    
    const params = {
        dateTimeNum,
        hours: now.getHours(),
        mmddhh,
        year: now.getFullYear(),
        month: formatTimeUnit(now.getMonth() + 1),
        date: formatTimeUnit(now.getDate()),
        carModel: currentCarModel,
        version: currentVersion
    };
    
    const result = calculatePasswords(currentCarModel, currentVersion, params);
    
    if (currentCarModel === 'ziyouzhe' || currentCarModel === 'dasheng') {
        const { carPassword, adbPassword } = result;
        const password1El = document.getElementById('password1');
        const password2El = document.getElementById('password2');
        
        if (password1El) {
            password1El.textContent = carPassword || '--';
        }
        if (password2El) {
            password2El.textContent = adbPassword || '--';
        }
    } else {
        const { passwords } = result;
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`password${i}`);
            if (el) {
                el.textContent = passwords[i - 1] || '--';
            }
        }
    }
}

// 计算ADB密码（用于00x和other版本）
export function calculateAdbPassword(serialNumber, currentCarModel, currentVersion) {
    if (!serialNumber || serialNumber.length !== 6) {
        alert('请输入6位序列号');
        return;
    }
    
    const now = new Date();
    const month = formatTimeUnit(now.getMonth() + 1);
    const date = formatTimeUnit(now.getDate());
    const hours = formatTimeUnit(now.getHours());
    const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
    
    const params = {
        dateTimeNum,
        hours: now.getHours(),
        serialNumber,
        year: now.getFullYear(),
        month: formatTimeUnit(now.getMonth() + 1),
        date: formatTimeUnit(now.getDate())
    };
    
    const result = calculatePasswords(currentCarModel, currentVersion, params);
    
    const adbPasswordEl = document.getElementById('adbPassword');
    if (adbPasswordEl) {
        adbPasswordEl.textContent = result.adbPassword;
    }
}
