import { carModels } from './config/carModels.js';
import { calculatePasswords, getCountdownType } from './utils/password.js';
import { 
    renderVersionButtons, 
    updateCarInstructions, 
    updateCountdown,
    updateTravelerPasswords,
    updateOtherCarPasswords,
    toggleAdbPassword,
    calculateAdbPassword
} from './utils/ui.js';

let currentCarModel = 'traveler';
let currentVersion = '0407';

function updatePasswords() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeKey = `${month}${date}${hours}`;
    const dateTimeNum = parseInt(dateTimeKey, 10);
    
    document.getElementById('updateTime').textContent = 
        `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;
    
    if (currentCarModel === 'traveler') {
        updateTravelerPasswords(dateTimeNum, currentVersion, document.getElementById('serialNumber')?.value);
    } else {
        updateOtherCarPasswords(dateTimeNum, currentCarModel, currentVersion);
    }
}

document.getElementById('carModel').addEventListener('change', function() {
    currentCarModel = this.value;
    const carModel = carModels[currentCarModel];
    currentVersion = carModel.versions[0];
    
    renderVersionButtons(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
});

document.addEventListener('DOMContentLoaded', function() {
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
    
    renderVersionButtons(currentCarModel, currentVersion);
    updateCarInstructions(currentCarModel, currentVersion);
    updatePasswords();
    
    // 版本按钮点击事件
    document.querySelector('.version-buttons').addEventListener('click', function(e) {
        if (e.target.classList.contains('version-button')) {
            document.querySelectorAll('.version-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentVersion = e.target.dataset.version;
            updateCarInstructions(currentCarModel, currentVersion);
            updatePasswords();
        }
    });
    
    // 序列号输入框事件监听器
    const serialNumberInput = document.getElementById('serialNumber');
    if (serialNumberInput) {
        serialNumberInput.addEventListener('input', updatePasswords);
    }
    
    // ADB密码切换按钮
    const toggleAdbButton = document.querySelector('.toggle-button');
    if (toggleAdbButton) {
        toggleAdbButton.addEventListener('click', toggleAdbPassword);
    }
    
    // 计算ADB密码按钮
    const calculateAdbButton = document.querySelector('.calculate-button');
    if (calculateAdbButton) {
        calculateAdbButton.addEventListener('click', function() {
            calculateAdbPassword(document.getElementById('serialNumber')?.value, currentCarModel, currentVersion);
        });
    }
});

// 每秒更新倒计时
setInterval(() => {
    updateCountdown(currentCarModel, currentVersion);
}, 1000);

// 每分钟更新密码
setInterval(updatePasswords, 60000);
