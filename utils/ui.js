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
            adbInstructions = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
        } else if (currentVersion === '0406') {
            carInstructions = '应用中心——蓝牙电话，输入上方密码';
            adbInstructions = '';
        }
    } else if (currentCarModel === 'zizhe') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    } else if (currentCarModel === 'dasheng') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
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
    const params = {
        dateTimeNum,
        hours: new Date().getHours(),
        serialNumber,
        carModel: 'traveler',
        version: currentVersion
    };
    
    const result = calculatePasswords('traveler', currentVersion, params);
    
    document.getElementById('password1').textContent = result.carPassword || '--';
    document.getElementById('password2').textContent = result.adbPassword || '--';
    document.getElementById('password3').textContent = '--';
}

// 更新其他车型密码
export function updateOtherCarPasswords(dateTimeNum, currentCarModel, currentVersion) {
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

// 切换ADB密码显示/隐藏
export function toggleAdbPassword() {
    const adbPasswordEl = document.getElementById('password2');
    const toggleButton = document.querySelector('.toggle-button');
    
    if (!adbPasswordEl || !toggleButton) return;
    
    if (toggleButton.textContent === '显示密码') {
        adbPasswordEl.textContent = adbPasswordEl.dataset.actualPassword;
        toggleButton.textContent = '隐藏密码';
    } else {
        adbPasswordEl.textContent = '******';
        toggleButton.textContent = '显示密码';
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
        serialNumber
    };
    
    const result = calculatePasswords(currentCarModel, currentVersion, params);
    
    const adbPasswordEl = document.getElementById('password2');
    if (adbPasswordEl) {
        adbPasswordEl.textContent = result.adbPassword;
        adbPasswordEl.dataset.actualPassword = result.adbPassword;
    }
}
