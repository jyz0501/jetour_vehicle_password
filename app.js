/**
 * 格式化时间单位（补前导零）
 * @param {number} unit 时间单位（如月份、日期、小时）
 * @returns {string} 两位字符串（如 9 → '09'）
 */
function formatTimeUnit(unit) {
    return String(unit).padStart(2, '0');
}

// 当前选择的版本
let currentVersion = '04.11';

/**
 * 计算并更新密码
 */
function updatePasswords() {
    const now = new Date();

    // 提取月日时（忽略分钟）
    const month = formatTimeUnit(now.getMonth() + 1); // 月份（0-11 → 1-12 → 补零后01-12）
    const date = formatTimeUnit(now.getDate());       // 日期（1-31 → 补零后01-31）
    const hours = formatTimeUnit(now.getHours());     // 小时（0-23 → 补零后00-23）
    const minutes = formatTimeUnit(now.getMinutes()); // 分钟（0-59 → 补零后00-59）

    // 组合日期时间字符串（格式：MMDDHH，如090921表示9月9日21时）
    const dateTimeKey = `${month}${date}${hours}`;
    const dateTimeNum = parseInt(dateTimeKey, 10);    // 转换为数字（如090921 → 90921）

    let adbPassword, carPassword;
    let isFixedPassword = false;
    
    // 根据不同版本计算密码
    switch(currentVersion) {
        case '00x':
            // 00x版本的ADB密码计算逻辑
            const yymmdd = `${now.getFullYear().toString().slice(-2)}${month}${date}`;
            const lastDigit = parseInt(yymmdd.slice(-1), 10);
            let baseValue;
            switch(lastDigit) {
                case 0:
                    baseValue = 213518;
                    break;
                case 1:
                    baseValue = 658035;
                    break;
                case 2:
                    baseValue = 235657;
                    break;
                case 3:
                    baseValue = 567534;
                    break;
                case 4:
                    baseValue = 647825;
                    break;
                case 5:
                    baseValue = 234700;
                    break;
                case 6:
                    baseValue = 127347;
                    break;
                case 7:
                    baseValue = 648924;
                    break;
                case 8:
                    baseValue = 733782;
                    break;
                case 9:
                    baseValue = 553456;
                    break;
            }
            const adbFull30 = parseInt(yymmdd, 10) + baseValue;
            adbPassword = adbFull30.toString().padStart(6, '0');

            // 计算车机动态密码（使用与ADB相同的逻辑）
            carPassword = `*#20230730#*`;
            break;
        case '04.11':
        case '04.12':
            // 计算ADB密码（20250110 × 日期时间）
            const adbFull = 20250110 * dateTimeNum;
            adbPassword = (adbFull % 1000000).toString().padStart(6, '0'); // 取最后六位+补零

            // 计算车机动态密码（ADB密码 - 当前小时数）
            const carFull = adbFull - now.getHours();
            carPassword = `*#`+ (carFull % 1000000).toString().padStart(6, '0')+`#*`;  // 取最后六位+补零
            break;
        case '04.06':
            // 04.06版本使用固定工程模式密码
            isFixedPassword = true;
            carPassword = `*#20230730#*`; // 固定工程模式密码
            adbPassword = ''; // 04.06版本没有ADB密码
            break;
        case 'other':
            // 其他版本使用固定工程模式密码，ADB密码基于序列号计算
            isFixedPassword = true;
            carPassword = `*#20230730#*`; // 固定工程模式密码
            adbPassword = ''; // ADB密码需要用户输入序列号后计算
            break;

        default:
            // 默认使用04.11版本的逻辑
            const adbFullDefault = 20250110 * dateTimeNum;
            adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
            const carFullDefault = adbFullDefault - now.getHours();
            carPassword = `*#`+ (carFullDefault % 1000000).toString().padStart(6, '0')+`#*`;
    }

    // 更新页面显示
    document.getElementById('carPassword').textContent = carPassword;
    document.getElementById('updateTime').textContent = 
        `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`; // 显示真实分钟
    
    // 更新ADB密码并默认隐藏
    const adbPasswordElement = document.getElementById('adbPassword');
    const toggleAdbButton = document.getElementById('toggleAdbPassword');
    const adbInstructions = document.getElementById('adbInstructions');
    const carInstructions = document.getElementById('carInstructions');
    
    const serialNumberInput = document.getElementById('serialNumberInput');
    
    if (currentVersion === '04.06') {
        // 04.06版本使用固定密码
        adbPasswordElement.textContent = '无';
        toggleAdbButton.style.display = 'none';
        adbInstructions.style.display = 'none';
        serialNumberInput.style.display = 'none';
        // 04.06版本是固定密码，不需要下次变更时间
        document.getElementById('nextUpdateTime').textContent = '无（固定密码）';
        // 设置04.06版本的说明
        carInstructions.textContent = '应用中心——蓝牙电话，输入上方密码';
    } else if (currentVersion === 'other') {
        // 其他版本显示序列号输入框
        adbPasswordElement.textContent = '';
        toggleAdbButton.style.display = 'none';
        adbInstructions.style.display = 'block';
        serialNumberInput.style.display = 'block';
        // 其他版本的下次变更时间为下一天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowYear = tomorrow.getFullYear();
        const tomorrowMonth = formatTimeUnit(tomorrow.getMonth() + 1);
        const tomorrowDay = formatTimeUnit(tomorrow.getDate());
        document.getElementById('nextUpdateTime').textContent = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
        // 设置其他版本的说明
        carInstructions.textContent = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions.textContent = '进入工程模式后，点加密项，输入产品序列号后六位';
    } else if (currentVersion === '00x') {
        // 00x版本正常显示
        adbPasswordElement.dataset.actualPassword = adbPassword;
        adbPasswordElement.textContent = '******'; // 默认显示星号
        toggleAdbButton.style.display = 'inline-block';
        adbInstructions.style.display = 'block';
        serialNumberInput.style.display = 'none';
        // 00x版本的下次变更时间为下一天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowYear = tomorrow.getFullYear();
        const tomorrowMonth = formatTimeUnit(tomorrow.getMonth() + 1);
        const tomorrowDay = formatTimeUnit(tomorrow.getDate());
        document.getElementById('nextUpdateTime').textContent = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
        // 设置00x版本的说明
        carInstructions.textContent = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
        adbInstructions.textContent = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
    } else {
        // 其他版本正常显示
        adbPasswordElement.dataset.actualPassword = adbPassword;
        adbPasswordElement.textContent = '******'; // 默认显示星号
        toggleAdbButton.style.display = 'inline-block';
        adbInstructions.style.display = 'block';
        serialNumberInput.style.display = 'none';
        // 计算并显示下次刷新时间点（下一个整点）
        const nextHour = (now.getHours() + 1) % 24;
        document.getElementById('nextUpdateTime').textContent = `${nextHour.toString().padStart(2, '0')}:00`;
        // 设置其他版本的说明
        carInstructions.textContent = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions.textContent = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    }
}

// 页面加载后立即计算一次
updatePasswords();

// 添加显示/隐藏ADB密码的事件监听器
document.getElementById('toggleAdbPassword').addEventListener('click', function() {
    const adbPasswordElement = document.getElementById('adbPassword');
    const actualPassword = adbPasswordElement.dataset.actualPassword;
    const currentText = adbPasswordElement.textContent;
    
    if (currentText === '******') {
        // 显示密码
        adbPasswordElement.textContent = actualPassword;
        this.textContent = '隐藏密码';
    } else {
        // 隐藏密码
        adbPasswordElement.textContent = '******';
        this.textContent = '显示密码';
    }
});

// 添加版本切换按钮的事件监听器
document.querySelectorAll('.version-button').forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有按钮的active类
        document.querySelectorAll('.version-button').forEach(btn => btn.classList.remove('active'));
        // 为当前点击的按钮添加active类
        this.classList.add('active');
        // 更新当前版本
        currentVersion = this.dataset.version;
        // 重新计算密码
        updatePasswords();
    });
});

// 添加计算ADB密码按钮的事件监听器
document.getElementById('calculateAdbButton').addEventListener('click', function() {
    const serialNumber = document.getElementById('serialNumber').value;
    if (serialNumber.length !== 6) {
        alert('请输入车机序列号后六位');
        return;
    }
    
    // 计算ADB密码：序列号后六位 * 802018，取后六位
    const serialNum = parseInt(serialNumber, 10);
    const adbFull = serialNum * 802018;
    const adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
    
    // 更新ADB密码显示
    const adbPasswordElement = document.getElementById('adbPassword');
    adbPasswordElement.dataset.actualPassword = adbPassword;
    adbPasswordElement.textContent = adbPassword;
});

// 每分钟更新一次（60000ms）
setInterval(updatePasswords, 60000);

// 弹窗功能
window.onload = function() {
    const popup = document.getElementById('usagePopup');
    const closePopup = document.getElementById('closePopup');
    
    // 显示弹窗
    if (popup) {
        popup.style.display = 'flex';
    }
    
    // 关闭弹窗
    if (closePopup) {
        closePopup.addEventListener('click', function() {
            if (popup) {
                popup.style.display = 'none';
            }
        });
    }
};
