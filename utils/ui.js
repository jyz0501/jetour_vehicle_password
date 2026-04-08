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

// 渲染口令区域
export function renderPasswordGroup(currentCarModel, currentVersion) {
    const passwordGroup = document.getElementById('passwordGroup');
    const showPasswordOverlay = document.getElementById('showPasswordOverlay');
    
    // 判断是否需要显示全局口令按钮
    const needsPasswordOverlay = isEncryptedVersion(currentCarModel, currentVersion);
    if (showPasswordOverlay) {
        showPasswordOverlay.style.display = needsPasswordOverlay ? 'block' : 'none';
    }
    
    if (currentCarModel === 'traveler') {
        passwordGroup.innerHTML = `
            <div class="password-card">
                <h2>1. 工程模式口令</h2>
                <div class="password-value" id="carPassword">--</div>
                <div id="carInstructions">应用中心——蓝牙电话，输入上方口令</div>
            </div>
            <div class="password-card">
                <h2>2. 加密项口令</h2>
                <div id="serialNumberInput" style="display: none; margin-bottom: 15px;">
                    <input type="text" id="serialNumber" maxlength="6" placeholder="请输入序列号后六位">
                    <button id="calculateAdbButton" class="toggle-button">计算口令</button>
                </div>
                <div class="password-value" id="adbPassword">--</div>
                <div id="adbInstructions">加密设置——进入加密设置，输入上方口令</div>
            </div>
        `;
        
        // 根据版本显示/隐藏序列号输入框
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

// 获取dynamic250110的ADB口令值
function getCdmPassword() {
    const now = new Date();
    const month = formatTimeUnit(now.getMonth() + 1);
    const date = formatTimeUnit(now.getDate());
    const hours = formatTimeUnit(now.getHours());
    const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
    const adbFull = 250110 * dateTimeNum;
    return (adbFull % 1000000).toString().padStart(6, '0');
}

// 判断是否为加密版本
function isEncryptedVersion(currentCarModel, currentVersion) {
    // 使用配置文件中的encrypted字段判断
    const carModel = carModels[currentCarModel];
    if (carModel && carModel.encrypted && carModel.encrypted[currentVersion] !== undefined) {
        return carModel.encrypted[currentVersion];
    }
    // 默认不加密
    return false;
}

// 设置口令区域事件监听器
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
    
    // 全局显示口令按钮（覆盖层）
    const showPasswordOverlay = document.getElementById('showPasswordOverlay');
    const passwordVerifyPopup = document.getElementById('passwordVerifyPopup');
    const verifyPasswordInput = document.getElementById('verifyPasswordInput');
    const verifyError = document.getElementById('verifyError');
    const confirmVerify = document.getElementById('confirmVerify');
    const cancelVerify = document.getElementById('cancelVerify');
    
    if (showPasswordOverlay && passwordVerifyPopup) {
        // 移除旧的事件监听器（如果有的话）
        const newOverlay = showPasswordOverlay.cloneNode(true);
        showPasswordOverlay.parentNode.replaceChild(newOverlay, showPasswordOverlay);
        
        // 显示验证弹窗
        function showVerifyPopup() {
            passwordVerifyPopup.style.display = 'flex';
            verifyPasswordInput.value = '';
            verifyError.style.display = 'none';
            verifyPasswordInput.focus();
        }
        
        // 隐藏验证弹窗
        function hideVerifyPopup() {
            passwordVerifyPopup.style.display = 'none';
        }
        
        // 验证口令
        function verifyAndShowPassword() {
            const inputPassword = verifyPasswordInput.value;
            const correctPassword = getCdmPassword();
            
            if (inputPassword === correctPassword) {
                // 口令正确，隐藏覆盖层按钮和弹窗，并显示所有口令
                hideVerifyPopup();
                newOverlay.style.display = 'none';
                
                const now = new Date();
                const month = formatTimeUnit(now.getMonth() + 1);
                const date = formatTimeUnit(now.getDate());
                const hours = formatTimeUnit(now.getHours());
                const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
                const mmddhh = parseInt(`${month}${date}${hours}`, 10);
                
                const params = {
                    dateTimeNum,
                    hours: now.getHours(),
                    mmddhh,
                    year: now.getFullYear(),
                    month: month,
                    date: date,
                    carModel: currentCarModel,
                    version: currentVersion
                };
                
                const result = calculatePasswords(currentCarModel, currentVersion, params);
                
                // 根据车型更新对应的口令显示
                if (currentCarModel === 'traveler') {
                    const carPasswordEl = document.getElementById('carPassword');
                    const adbPasswordEl = document.getElementById('adbPassword');
                    if (carPasswordEl) carPasswordEl.textContent = result.carPassword;
                    if (adbPasswordEl) adbPasswordEl.textContent = result.adbPassword;
                } else if (currentCarModel === 'ziyouzhe') {
                    const password1El = document.getElementById('password1');
                    const password2El = document.getElementById('password2');
                    if (password1El) password1El.textContent = result.carPassword;
                    if (password2El) password2El.textContent = result.adbPassword;
                }
            } else {
                verifyError.style.display = 'block';
                verifyPasswordInput.value = '';
                verifyPasswordInput.focus();
            }
        }
        
        newOverlay.addEventListener('click', showVerifyPopup);
        confirmVerify.addEventListener('click', verifyAndShowPassword);
        cancelVerify.addEventListener('click', hideVerifyPopup);
        
        // 输入框回车确认
        verifyPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyAndShowPassword();
            }
        });
    }
}

// 更新车型说明
export function updateCarInstructions(currentCarModel, currentVersion) {
    const carInstructionsEl = document.getElementById('carInstructions');
    const adbInstructionsEl = document.getElementById('adbInstructions');
    
    if (!carInstructionsEl || !adbInstructionsEl) return;
    
    let carInstructions = '应用中心——蓝牙电话，输入上方口令';
    let adbInstructions = '加密设置——进入加密设置，输入上方口令';
    
    if (currentCarModel === 'traveler') {
        if (currentVersion === '00x') {
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

// 更新倒计时
export function updateCountdown(currentCarModel, currentVersion) {
    const now = new Date();
    const countdownEl = document.getElementById('nextUpdateTime');
    if (!countdownEl) return;
    
    const countdownType = getCountdownType(currentCarModel, currentVersion);
    
    if (countdownType === 'none') {
        countdownEl.textContent = '无（固定口令）';
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

// 更新旅行者车型口令
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
    
    // 直接显示所有版本的口令，无需验证
    if (carPasswordEl) {
        carPasswordEl.textContent = result.carPassword || '--';
    }
    if (adbPasswordEl) {
        adbPasswordEl.textContent = result.adbPassword || '--';
    }
}

// 更新其他车型口令
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
        
        // 直接显示所有版本的口令，无需验证
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

// 计算ADB口令（用于00x和other版本）
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
