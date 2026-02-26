/**
 * 格式化时间单位（补前导零）
 * @param {number} unit 时间单位（如月份、日期、小时）
 * @returns {string} 两位字符串（如 9 → '09'）
 */
function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

function updateCountdown() {
    const now = new Date();
    const countdownEl = document.getElementById('nextUpdateTime');
    if (!countdownEl) return;
    
    if (currentVersion === '04.06') {
        countdownEl.textContent = '无（固定密码）';
        return;
    }
    
    if (currentVersion === '00x' || currentVersion === 'other' || (currentCarModel !== 'traveler' && currentCarModel !== 'zizhe')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const diff = tomorrow - now;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        countdownEl.textContent = `${hours}时${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    } else {
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        const diff = nextHour - now;
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        countdownEl.textContent = `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    }
}

let currentCarModel = 'traveler';
let currentVersion = '04.11';

const carModels = {
    traveler: {
        name: '捷途旅行者/山海T2',
        versions: ['00x', '04.06', '04.11', '8AT', 'other'],
        versionNames: {
            '00x': '00.08及以下',
            '04.06': '4.05以下',
            '04.11': '4.06-4.12',
            '8AT': '8AT/7DCT',
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
        versions: ['110104'],
        versionNames: {
            '110104': '11.01.04-11.01.08'
        }
    }
};

function renderVersionButtons() {
    const versionButtonsContainer = document.querySelector('.version-buttons');
    versionButtonsContainer.innerHTML = '';
    
    const carModel = carModels[currentCarModel];
    carModel.versions.forEach((version, index) => {
        const button = document.createElement('button');
        button.className = 'version-button' + (index === carModel.versions.length - 1 ? ' active' : '');
        button.dataset.version = version;
        button.textContent = carModel.versionNames[version];
        versionButtonsContainer.appendChild(button);
    });
    
    currentVersion = carModel.versions[carModel.versions.length - 1];
    
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
        if (currentCarModel === 'zizhe' && currentVersion === '110104') {
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
    let adbPassword, carPassword;
    let isFixedPassword = false;
    
    switch(currentVersion) {
        case '00x':
            const serialNumber = document.getElementById('serialNumberInput').value;
            if (serialNumber && serialNumber.length >= 6) {
                const snLastSix = serialNumber.slice(-6);
                const adbFull30 = 802018 * parseInt(snLastSix, 10);
                adbPassword = (adbFull30 % 1000000).toString().padStart(6, '0');
            } else {
                adbPassword = '请输入序列号';
            }
            carPassword = `*#20230730#*`;
            
            document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
            document.getElementById('adbInstructions').textContent = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
            
            const snInput00x = document.getElementById('serialNumberInput');
            const toggleBtn00x = document.getElementById('toggleAdbPassword');
            const adbInst00x = document.getElementById('adbInstructions');
            if (snInput00x) {
                snInput00x.style.display = 'inline-block';
                snInput00x.placeholder = '请输入产品序列号后六位';
            }
            if (toggleBtn00x) toggleBtn00x.style.display = 'inline-block';
            if (adbInst00x) adbInst00x.style.display = 'block';
            break;
            
        case '04.06':
            isFixedPassword = true;
            carPassword = `*#20230730#*`;
            adbPassword = '无';
            document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码';
            const serialNumberInput = document.getElementById('serialNumberInput');
            const toggleAdbButton = document.getElementById('toggleAdbPassword');
            const adbInstructions = document.getElementById('adbInstructions');
            if (serialNumberInput) serialNumberInput.style.display = 'none';
            if (toggleAdbButton) toggleAdbButton.style.display = 'none';
            if (adbInstructions) adbInstructions.style.display = 'none';
            break;
            
        case '8AT':
            const adbFull8AT = 250110 * dateTimeNum;
            adbPassword = (adbFull8AT % 1000000).toString().padStart(6, '0');
            
            const carBase8AT = 250110 * dateTimeNum;
            const carFull8AT = carBase8AT - now.getHours();
            carPassword = `*#`+ (carFull8AT % 1000000).toString().padStart(6, '0')+`#*`;
            
            document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
            document.getElementById('adbInstructions').textContent = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
            
            const snInput8AT = document.getElementById('serialNumberInput');
            const toggleBtn8AT = document.getElementById('toggleAdbPassword');
            const adbInst8AT = document.getElementById('adbInstructions');
            if (snInput8AT) snInput8AT.style.display = 'none';
            if (toggleBtn8AT) toggleBtn8AT.style.display = 'inline-block';
            if (adbInst8AT) adbInst8AT.style.display = 'block';
            break;
            
        case '04.11':
            const adbFull = 250110 * dateTimeNum;
            adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
            
            const carBase = 250110 * dateTimeNum;
            const carFull = carBase - now.getHours();
            carPassword = `*#`+ (carFull % 1000000).toString().padStart(6, '0')+`#*`;
            
            document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码';
            document.getElementById('adbInstructions').textContent = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
            
            const snInput = document.getElementById('serialNumberInput');
            const toggleBtn = document.getElementById('toggleAdbPassword');
            const adbInst = document.getElementById('adbInstructions');
            if (snInput) snInput.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'inline-block';
            if (adbInst) adbInst.style.display = 'block';
            break;
            
        case 'other':
            const serialNumberOther = document.getElementById('serialNumberInput').value;
            if (serialNumberOther && serialNumberOther.length >= 6) {
                const snLastSixOther = serialNumberOther.slice(-6);
                const adbFull30Other = 802018 * parseInt(snLastSixOther, 10);
                adbPassword = (adbFull30Other % 1000000).toString().padStart(6, '0');
            } else {
                adbPassword = '请输入序列号';
            }
            carPassword = `*#20230730#*`;
            
            document.getElementById('carInstructions').textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
            document.getElementById('adbInstructions').textContent = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
            
            const snInputOther = document.getElementById('serialNumberInput');
            const toggleBtnOther = document.getElementById('toggleAdbPassword');
            const adbInstOther = document.getElementById('adbInstructions');
            if (snInputOther) {
                snInputOther.style.display = 'inline-block';
                snInputOther.placeholder = '请输入产品序列号后六位';
            }
            if (toggleBtnOther) toggleBtnOther.style.display = 'inline-block';
            if (adbInstOther) adbInstOther.style.display = 'block';
            break;
    }
    
    const carPasswordElement = document.getElementById('carPassword');
    if (carPasswordElement) {
        carPasswordElement.textContent = carPassword || '--';
    }
    
    const adbPasswordElement = document.getElementById('adbPassword');
    if (adbPasswordElement) {
        if (currentVersion === '04.06') {
            adbPasswordElement.textContent = adbPassword;
        } else if (currentVersion === '00x') {
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
    
    const passwords = [];
    
    if (currentCarModel === 'zizhe' && currentVersion === '110104') {
        const adbPwd = (240910 * mmddhh) % 1000000;
        const carPwd = ((240910 * mmddhh) - now.getHours()) % 1000000;
        passwords.push(`*#${carPwd.toString().padStart(6, '0')}#*`);
        passwords.push(adbPwd.toString().padStart(6, '0'));
        passwords.push('--');
    } else {
        const p3 = (20231030 * mmddhh) - now.getHours();
        
        const p1 = currentCarModel === 'x70plus' ? `*#20201013#*` : `*#20201030#*`;
        passwords.push(p1);
        
        const p2 = `*#20230730#*`;
        passwords.push(p2);
        
        passwords.push(`*#${(p3 % 1000000).toString().padStart(6, '0')}#*`);
    }
    
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`password${i}`);
        if (el) {
            el.textContent = passwords[i - 1] || '--';
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