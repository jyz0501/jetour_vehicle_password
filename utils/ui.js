import { carModels } from '../config/carModels.js';
import { fetchPasswordsWithRetry } from './api.js';
import { getCountdownType, formatTimeUnit } from './password.js';
import { currentTimezoneOffset, getCountdownMs } from '../config/timezones.js';

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
                const response = await fetch('https://api.qianxian.tech/api/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'jetour_password_2026'
                    },
                    body: JSON.stringify({
                        carModel: 'g700',
                        password: input.value,
                        version: currentVersion,
                        timezoneOffset: currentTimezoneOffset
                    })
                });
                const data = await response.json();
                
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