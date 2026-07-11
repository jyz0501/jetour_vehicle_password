import { carModels } from '../config/carModels.js';
import { fetchPasswordsWithRetry } from './api.js';
import { getCountdownType, formatTimeUnit } from './password.js';

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

export function renderPasswordGroup(currentCarModel, currentVersion) {
    const passwordGroup = document.getElementById('passwordGroup');
    
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
                <div id="adbInstructions">进入加密项输入上方计算后的口令</div>
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

export function updatePasswordsFromApi(result, currentCarModel, currentVersion) {
    if (currentCarModel === 'traveler') {
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
            carPasswordEl.textContent = result.carPassword || '--';
        }
        if (adbPasswordEl) {
            adbPasswordEl.textContent = result.adbPassword || '--';
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