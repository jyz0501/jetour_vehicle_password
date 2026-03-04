// 格式化时间单位（补前导零）
function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

// 计算serialNumberDaily密码
function calculateSerialNumberDailyPassword(year, month, date) {
  const yymmdd = parseInt(`${year.toString().slice(-2)}${month}${date}`, 10);
  const lastDigit = yymmdd % 10;
  
  let baseValue;
  switch(lastDigit) {
    case 0: baseValue = 213518; break;
    case 1: baseValue = 658035; break;
    case 2: baseValue = 235657; break;
    case 3: baseValue = 567534; break;
    case 4: baseValue = 647825; break;
    case 5: baseValue = 234700; break;
    case 6: baseValue = 127347; break;
    case 7: baseValue = 875634; break;
    case 8: baseValue = 345678; break;
    case 9: baseValue = 982345; break;
    default: baseValue = 213518;
  }
  
  const adbFull = yymmdd + baseValue;
  return (adbFull % 1000000).toString().padStart(6, '0');
}

// 获取dynamic250110的ADB密码值（用于26款验证）
function getCdmVerifyPassword(dateTimeNum) {
  const adbFull = 250110 * dateTimeNum;
  return (adbFull % 1000000).toString().padStart(6, '0');
}

// 计算口令的核心函数
function calculatePasswords(version, now, serialNumber = '') {
  // 提取月日时（忽略分钟）
  const month = formatTimeUnit(now.getMonth() + 1);
  const date = formatTimeUnit(now.getDate());
  const hours = formatTimeUnit(now.getHours());
  const minutes = formatTimeUnit(now.getMinutes());
  const year = now.getFullYear();

  // 组合日期时间字符串
  const dateTimeKey = `${month}${date}${hours}`;
  const dateTimeNum = parseInt(dateTimeKey, 10);

  let adbPassword, systemPassword, nextUpdateTime;
  let isFixedPassword = false;
  let isCdmVersion = false;

  // 根据不同版本计算口令
  switch(version) {
    case '00x':
      // 00x版本使用serialNumber算法（序列号 * 802018）
      if (serialNumber && serialNumber.length === 6) {
        const serialNum = parseInt(serialNumber, 10);
        const adbFull = serialNum * 802018;
        adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
      } else {
        adbPassword = '';
      }
      
      systemPassword = `*#20230730#*`;
      
      // 00x版本的下次变更时间为无（固定口令）
      nextUpdateTime = '无（固定口令）';
      isFixedPassword = true;
      break;
    
    case '0407':
      // 计算ADB口令（250110 × 日期时间）
      const adbFull = 250110 * dateTimeNum;
      adbPassword = (adbFull % 1000000).toString().padStart(6, '0');

      // 计算系统动态口令（ADB口令 - 当前小时数）
      const systemFull = adbFull - now.getHours();
      systemPassword = `*#${(systemFull % 1000000).toString().padStart(6, '0')}#*`;
      
      // 下次变更时间为下一个整点
      const nextHour = (now.getHours() + 1) % 24;
      nextUpdateTime = `${nextHour.toString().padStart(2, '0')}:00`;
      break;
    
    case '0406':
      // 0406版本使用固定工程模式口令
      isFixedPassword = true;
      systemPassword = `*#20230730#*`;
      adbPassword = '无';
      nextUpdateTime = '无（固定口令）';
      break;
    
    case 'other':
      // other版本使用serialNumberDaily算法（基于日期YYMMDD）
      systemPassword = `*#20230730#*`;
      adbPassword = calculateSerialNumberDailyPassword(year, month, date);
      
      // 下次变更时间为下一天
      const tomorrowOther = new Date();
      tomorrowOther.setDate(tomorrowOther.getDate() + 1);
      const tomorrowYearOther = tomorrowOther.getFullYear();
      const tomorrowMonthOther = formatTimeUnit(tomorrowOther.getMonth() + 1);
      const tomorrowDayOther = formatTimeUnit(tomorrowOther.getDate());
      nextUpdateTime = `${tomorrowYearOther}-${tomorrowMonthOther}-${tomorrowDayOther}`;
      break;
    
    case 'cdm':
      // 26款版本使用215430算法
      isCdmVersion = true;
      const adbFullCdm = 215430 * dateTimeNum;
      adbPassword = (adbFullCdm % 1000000).toString().padStart(6, '0');

      // 计算系统动态口令（ADB口令 - 当前小时数）
      const systemFullCdm = adbFullCdm - now.getHours();
      systemPassword = `*#${(systemFullCdm % 1000000).toString().padStart(6, '0')}#*`;
      
      // 下次变更时间为下一个整点
      const nextHourCdm = (now.getHours() + 1) % 24;
      nextUpdateTime = `${nextHourCdm.toString().padStart(2, '0')}:00`;
      break;
    
    default:
      // 默认使用0407版本的逻辑
      const adbFullDefault = 250110 * dateTimeNum;
      adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
      const systemFullDefault = adbFullDefault - now.getHours();
      systemPassword = `*#${(systemFullDefault % 1000000).toString().padStart(6, '0')}#*`;
      
      // 下次变更时间为下一个整点
      const nextHourDefault = (now.getHours() + 1) % 24;
      nextUpdateTime = `${nextHourDefault.toString().padStart(2, '0')}:00`;
  }

  // 生成更新时间字符串
  const updateTime = `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;

  return {
    systemPassword,
    adbPassword,
    nextUpdateTime,
    updateTime,
    isFixedPassword,
    isCdmVersion
  };
}

// 页面逻辑
Page({
  data: {
    // 弹窗控制
    showPopup: true,
    
    // 版本列表
    versionList: [
      { label: '4.06及以下', version: '0406' },
      { label: '00.08及以下', version: '00x' },
      { label: '4.07以上', version: '0407' },
      { label: '其他', version: 'other' },
      { label: '26款', version: 'cdm' }
    ],
    
    // 当前选择的版本
    currentVersion: '0407',
    
    // 口令相关
    systemPassword: '--',
    encryptionPassword: '******',
    actualEncryptionPassword: '',
    encryptionPasswordVisible: false,
    nextUpdateTime: '--',
    updateTime: '--',
    
    // 说明文本
    systemInstructions: '应用中心——蓝牙电话，输入上方口令',
    encryptionInstructions: '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方口令',
    
    // 序列号输入
    serialNumber: '',
    
    // 26款密码保护
    isCdmVersion: false,
    cdmPasswordVerified: false,
    
    // 定时器
    updateTimer: null
  },

  // 页面加载
  onLoad() {
    this.updatePasswords();
    
    // 每分钟更新一次口令
    this.data.updateTimer = setInterval(() => {
      this.updatePasswords();
    }, 60000);
  },

  // 页面卸载
  onUnload() {
    // 清除定时器
    if (this.data.updateTimer) {
      clearInterval(this.data.updateTimer);
    }
  },

  // 更新口令
  updatePasswords() {
    const now = new Date();
    const { currentVersion, serialNumber } = this.data;
    
    const result = calculatePasswords(currentVersion, now, serialNumber);
    
    let encryptionPasswordDisplay = '******';
    let systemPasswordDisplay = result.systemPassword;
    let actualEncryptionPassword = result.adbPassword;
    let systemInstructions = '应用中心——蓝牙电话，输入上方口令';
    let encryptionInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方口令';
    
    // 对于固定口令版本，直接显示
    if (currentVersion === '0406') {
      encryptionPasswordDisplay = result.adbPassword;
      encryptionInstructions = '';
    } else if (currentVersion === 'other') {
      encryptionPasswordDisplay = result.adbPassword;
      encryptionInstructions = '';
    } else if (currentVersion === '00x') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令 或者 通用—系统—右侧空白处连点10下';
      encryptionInstructions = '进入加密项输入上方计算后的口令';
    } else if (currentVersion === 'cdm') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '';
      // 26款版本需要验证后才显示
      if (!this.data.cdmPasswordVerified) {
        encryptionPasswordDisplay = '********';
        systemPasswordDisplay = '********';
      }
    }
    
    this.setData({
      systemPassword: systemPasswordDisplay,
      encryptionPassword: encryptionPasswordDisplay,
      actualEncryptionPassword: actualEncryptionPassword,
      nextUpdateTime: result.nextUpdateTime,
      updateTime: result.updateTime,
      systemInstructions: systemInstructions,
      encryptionInstructions: encryptionInstructions,
      isCdmVersion: result.isCdmVersion
    });
  },

  // 切换版本
  switchVersion(e) {
    const version = e.currentTarget.dataset.version;
    this.setData({
      currentVersion: version,
      serialNumber: '',
      cdmPasswordVerified: false
    });
    this.updatePasswords();
  },

  // 输入序列号
  inputSerialNumber(e) {
    const serialNumber = e.detail.value;
    this.setData({
      serialNumber: serialNumber
    });
  },

  // 计算加密项口令（00x版本）
  calculateEncryptionPassword() {
    const { serialNumber, currentVersion } = this.data;
    
    if (currentVersion !== '00x') return;
    
    if (serialNumber.length !== 6) {
      wx.showToast({
        title: '请输入系统序列号后六位',
        icon: 'none'
      });
      return;
    }
    
    this.updatePasswords();
  },

  // 显示26款密码（需要验证）
  showCdmPassword() {
    const now = new Date();
    const month = formatTimeUnit(now.getMonth() + 1);
    const date = formatTimeUnit(now.getDate());
    const hours = formatTimeUnit(now.getHours());
    const dateTimeNum = parseInt(`${month}${date}${hours}`, 10);
    
    const correctPassword = getCdmVerifyPassword(dateTimeNum);
    
    wx.showModal({
      title: '请输入密码',
      editable: true,
      placeholderText: '请输入6位密码',
      success: (res) => {
        if (res.confirm) {
          const inputPassword = res.content;
          if (inputPassword === correctPassword) {
            const result = calculatePasswords(this.data.currentVersion, now, '');
            this.setData({
              systemPassword: result.systemPassword,
              encryptionPassword: result.adbPassword,
              actualEncryptionPassword: result.adbPassword,
              cdmPasswordVerified: true
            });
          } else {
            wx.showToast({
              title: '密码错误',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换加密项口令显示/隐藏
  toggleEncryptionPassword() {
    const { encryptionPasswordVisible, encryptionPassword, actualEncryptionPassword } = this.data;
    
    this.setData({
      encryptionPasswordVisible: !encryptionPasswordVisible,
      encryptionPassword: encryptionPasswordVisible ? '******' : actualEncryptionPassword
    });
  },
  
  // 关闭弹窗
  closePopup() {
    this.setData({
      showPopup: false
    });
  }
});
