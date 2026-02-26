/**
 * 格式化时间单位（补前导零）
 * @param {number} unit 时间单位（如月份、日期、小时）
 * @returns {string} 两位字符串（如 9 → '09'）
 */

import { getAlgorithm, calculatePasswords, getDisplaySettings, getCountdownType } from './algorithms.js';

// 格式化时间单位
function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

function updateCountdown() {
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

let currentCarModel = 'traveler';
let currentVersion = '0407';

const carModels = {
    traveler: {
        name: '捷途旅行者/山海T2',
        versions: ['00x', '0406', '0407', 'other'],
        versionNames: {
            '00x': '00.08及以下',
            '0406': '4.06及以下',
            '0407': '4.07以上',
            'other': '其他'
        }
    },
    ruhui8: {
        name: '瑞虎8/Pro',
        versions: ['pwd1', 'pwd2', 'pwd3'],
        versionNames: {
            'pwd1': '密码1',
            'pwd2': '密码2',
            'pwd3': '密码3'
        }
    },
    fengyunA9: {
        name: '风云A9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        }
    },
    shanhal7: {
        name: '山海L7',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        }
    },
    shanhal9: {
        name: '山海L9',
        versions: ['unknown'],
        versionNames: {
            'unknown': '未知版本'
        }
    },
    x70plus: {
        name: 'X70plus',
        versions: ['unknown'],
        versionNames: {
            'unknown': '00.01.0x'
        }
    },
    zizhe: {
        name: '自由者/山海T1',
        versions: ['11010x'],
        versionNames: {
            '11010x': '11.01.04及以上'
        }
    },
    dasheng: {
        name: '捷途大圣',
        versions: ['fixed'],
        versionNames: {
            'fixed': '固定密码'
        }
    }
};

function renderVersionButtons() {
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
    
    // 如果当前版本不在新车型的版本列表中，设置为默认版本
    if (!carModel.versions.includes(currentVersion)) {
        // 对于旅行者车型，默认使用 0407 版本
        if (currentCarModel === 'traveler') {
            currentVersion = '0407';
        } else {
            // 其他车型使用第一个版本
            currentVersion = carModel.versions[0];
        }
        // 更新按钮的 active 状态
        document.querySelectorAll('.version-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.version === currentVersion) {
                btn.classList.add('active');
            }
        });
    }
    
    document.querySelectorAll('.version-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.version-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentVersion = this.dataset.version;
            updatePasswords();
        });
    });
}

function renderPasswordGroup() {
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
                <div class="password-container">
                    <div class="password-value" id="adbPassword">--</div>
                    <button id="toggleAdbPassword" class="toggle-button">显示密码</button>
                </div>
                <div id="adbInstructions">进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码</div>
            </div>
        `;
    } else {
        let html = '';
        if (currentCarModel === 'zizhe' && currentVersion === '11010x') {
            html = `
                <div class="password-card">
                    <h2>1. 工程模式密码</h2>
                    <div class="password-value" id="password1">--</div>
                </div>
                <div class="password-card">
                    <h2>2. ADB权限密码</h2>
                    <div class="password-value" id="password2">--</div>
                </div>
            `;
        } else if (currentVersion === 'unknown') {
            for (let i = 1; i <= 3; i++) {
                html += `
                    <div class="password-card">
                        <h2>密码${i}</h2>
                        <div class="password-value" id="password${i}">--</div>
                    </div>
                `;
            }
        } else {
            for (let i = 1; i <= 3; i++) {
                html += `
                    <div class="password-card">
                        <h2>密码${i}</h2>
                        <div class="password-value" id="password${i}">--</div>
                    </div>
                `;
            }
        }
        passwordGroup.innerHTML = html;
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    const toggleAdbButton = document.getElementById('toggleAdbPassword');
    if (toggleAdbButton) {
        toggleAdbButton.addEventListener('click', function() {
            const adbPasswordElement = document.getElementById('adbPassword');
            const actualPassword = adbPasswordElement.dataset.actualPassword;
            const currentText = adbPasswordElement.textContent;
            
            if (currentText === '******') {
                adbPasswordElement.textContent = actualPassword;
                this.textContent = '隐藏密码';
            } else {
                adbPasswordElement.textContent = '******';
                this.textContent = '显示密码';
            }
        });
    }
    
    const calculateAdbButton = document.getElementById('calculateAdbButton');
    if (calculateAdbButton) {
        calculateAdbButton.addEventListener('click', function() {
            const serialNumber = document.getElementById('serialNumber').value;
            if (serialNumber.length !== 6) {
                alert('请输入车机序列号后六位');
                return;
            }
            
            const serialNum = parseInt(serialNumber, 10);
            const adbFull = serialNum * 802018;
            const adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
            
            const adbPasswordElement = document.getElementById('adbPassword');
            adbPasswordElement.dataset.actualPassword = adbPassword;
            adbPasswordElement.textContent = adbPassword;
        });
    }
}

function updatePasswords() {
    const now = new Date();
    const month = formatTimeUnit(now.getMonth() + 1);
    const date = formatTimeUnit(now.getDate());
    const hours = formatTimeUnit(now.getHours());
    const minutes = formatTimeUnit(now.getMinutes());
    
    const dateTimeKey = `${month}${date}${hours}`;
    const dateTimeNum = parseInt(dateTimeKey, 10);
    
    document.getElementById('updateTime').textContent = 
        `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;
    
    if (currentCarModel === 'traveler') {
        updateTravelerPasswords(dateTimeNum, now, hours);
    } else {
        updateOtherCarPasswords(dateTimeNum);
    }
}

function updateTravelerPasswords(dateTimeNum, now, hours) {
    const serialNumber = document.getElementById('serialNumberInput').value;
    
    const params = {
        dateTimeNum,
        hours,
        serialNumber,
        now,
        mmddhh: parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10)
    };
    
    const result = calculatePasswords(currentCarModel, currentVersion, params);
    const { carPassword, adbPassword } = result;
    
    // 获取显示设置
    const displaySettings = getDisplaySettings(currentCarModel, currentVersion);
    const { showSerialNumberInput, showPasswordToggle } = displaySettings;
    
    // 更新说明文本
    if (currentVersion === '00x' || currentVersion === 'other') {
        document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
        document.getElementById('adbInstructions').textContent = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
    } else if (currentVersion === '8AT') {
        document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
        document.getElementById('adbInstructions').textContent = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    } else if (currentVersion === '0406') {
        document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码';
        document.getElementById('adbInstructions').textContent = '';
    } else {
        document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码';
        document.getElementById('adbInstructions').textContent = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    }
    
    // 更新显示状态
    const snInput = document.getElementById('serialNumberInput');
    const toggleBtn = document.getElementById('toggleAdbPassword');
    const adbInst = document.getElementById('adbInstructions');
    
    if (snInput) {
        if (showSerialNumberInput) {
            snInput.style.display = 'inline-block';
            snInput.placeholder = '请输入产品序列号后六位';
        } else {
            snInput.style.display = 'none';
        }
    }
    
    if (toggleBtn) {
        if (showPasswordToggle) {
            toggleBtn.style.display = 'inline-block';
        } else {
            toggleBtn.style.display = 'none';
        }
    }
    
    if (adbInst) {
        adbInst.style.display = 'block';
    }
    
    const carPasswordElement = document.getElementById('carPassword');
    if (carPasswordElement) {
        carPasswordElement.textContent = carPassword || '--';
    }
    
    const adbPasswordElement = document.getElementById('adbPassword');
    if (adbPasswordElement) {
        if (currentVersion === '0406') {
            adbPasswordElement.textContent = adbPassword;
        } else if (currentVersion === '00x' || currentVersion === 'other') {
            adbPasswordElement.textContent = adbPassword;
        } else {
            adbPasswordElement.dataset.actualPassword = adbPassword;
            adbPasswordElement.textContent = '******';
        }
    }
    
    const toggleAdbButton = document.getElementById('toggleAdbPassword');
    if (toggleAdbButton) {
        toggleAdbButton.textContent = '显示密码';
    }
}

function updateOtherCarPasswords(dateTimeNum) {
    const now = new Date();
    const mmddhh = parseInt(`${formatTimeUnit(now.getMonth() + 1)}${formatTimeUnit(now.getDate())}${formatTimeUnit(now.getHours())}`, 10);
    
    const params = {
        dateTimeNum,
        hours: now.getHours(),
        mmddhh,
        carModel: currentCarModel,
        version: currentVersion
    };
    
    const result = calculatePasswords(currentCarModel, currentVersion, params);
    
    // 处理特殊情况
    if (currentCarModel === 'zizhe' && currentVersion === '11010x') {
        // 自由者车型使用dynamic240910算法，返回{carPassword, adbPassword}格式
        const { carPassword, adbPassword } = result;
        document.getElementById('password1').textContent = carPassword || '--';
        document.getElementById('password2').textContent = adbPassword || '--';
        document.getElementById('password3').textContent = '--';
    } else if (currentCarModel === 'dasheng' && currentVersion === 'fixed') {
        // 捷途大圣车型使用dashengFixed算法，返回{carPassword, adbPassword}格式
        const { carPassword, adbPassword } = result;
        document.getElementById('password1').textContent = carPassword || '--';
        document.getElementById('password2').textContent = adbPassword || '--';
        document.getElementById('password3').textContent = '--';
    } else {
        // 其他车型使用标准格式{passwords: []}
        const { passwords } = result;
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`password${i}`);
            if (el) {
                el.textContent = passwords[i - 1] || '--';
            }
        }
    }
}

document.getElementById('carModel').addEventListener('change', function() {
    currentCarModel = this.value;
    renderVersionButtons();
    renderPasswordGroup();
    updatePasswords();
});

window.onload = function() {
    const popup = document.getElementById('usagePopup');
    const closePopup = document.getElementById('closePopup');
    
    if (popup) {
        popup.style.display = 'flex';
    }
    
    if (closePopup) {
        closePopup.addEventListener('click', function() {
            if (popup) {
                popup.style.display = 'none';
            }
        });
    }
    
    renderVersionButtons();
    renderPasswordGroup();
    updatePasswords();
    
    // 添加序列号输入框事件监听器
    const serialNumberInput = document.getElementById('serialNumberInput');
    if (serialNumberInput) {
        serialNumberInput.addEventListener('input', updatePasswords);
    }
};

setInterval(updateCountdown, 1000);
setInterval(updatePasswords, 60000);