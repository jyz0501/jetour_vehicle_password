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

  let adbPassword, systemPassword, nextUpdateTime, countdownSeconds;
  let isFixedPassword = false;
  let isCdmVersion = false;
  let isCountdownMode = false;

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
      
      // 计算到下一个整点的倒计时秒数
      const nextHour0407 = new Date(now);
      nextHour0407.setHours(now.getHours() + 1, 0, 0, 0);
      countdownSeconds = Math.floor((nextHour0407 - now) / 1000);
      nextUpdateTime = '倒计时';
      isCountdownMode = true;
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
      
      // 计算到明天00:00:00的倒计时秒数
      const tomorrowOther = new Date();
      tomorrowOther.setDate(tomorrowOther.getDate() + 1);
      tomorrowOther.setHours(0, 0, 0, 0);
      countdownSeconds = Math.floor((tomorrowOther - now) / 1000);
      nextUpdateTime = '倒计时';
      isCountdownMode = true;
      break;
    
    case 'cdm':
      // 26款版本使用215430算法
      isCdmVersion = true;
      const adbFullCdm = 215430 * dateTimeNum;
      adbPassword = (adbFullCdm % 1000000).toString().padStart(6, '0');

      // 计算系统动态口令（ADB口令 - 当前小时数）
      const systemFullCdm = adbFullCdm - now.getHours();
      systemPassword = `*#${(systemFullCdm % 1000000).toString().padStart(6, '0')}#*`;
      
      // 计算到下一个整点的倒计时秒数
      const nextHourCdm = new Date(now);
      nextHourCdm.setHours(now.getHours() + 1, 0, 0, 0);
      countdownSeconds = Math.floor((nextHourCdm - now) / 1000);
      nextUpdateTime = '倒计时';
      isCountdownMode = true;
      break;
    
    case '010108':
      // 01.01.08版本使用240910算法
      isCdmVersion = true;
      const adbFull010108 = 240910 * dateTimeNum;
      adbPassword = (adbFull010108 % 1000000).toString().padStart(6, '0');

      // 计算系统动态口令（ADB口令 - 当前小时数）
      const systemFull010108 = adbFull010108 - now.getHours();
      systemPassword = `*#${(systemFull010108 % 1000000).toString().padStart(6, '0')}#*`;
      
      // 计算到下一个整点的倒计时秒数
      const nextHour010108 = new Date(now);
      nextHour010108.setHours(now.getHours() + 1, 0, 0, 0);
      countdownSeconds = Math.floor((nextHour010108 - now) / 1000);
      nextUpdateTime = '倒计时';
      isCountdownMode = true;
      break;
    
    default:
        // 默认使用0407版本的逻辑
        const adbFullDefault = 250110 * dateTimeNum;
        adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
        const systemFullDefault = adbFullDefault - now.getHours();
        systemPassword = `*#${(systemFullDefault % 1000000).toString().padStart(6, '0')}#*`;
        
        // 计算到下一个整点的倒计时秒数
        const nextHourDefault = new Date(now);
        nextHourDefault.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHourDefault - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
  }

  // 生成更新时间字符串
  const updateTime = `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;

  return {
    systemPassword,
    adbPassword,
    nextUpdateTime,
    updateTime,
    isFixedPassword,
    isCdmVersion,
    isCountdownMode,
    countdownSeconds
  };
}

// 页面逻辑
Page({
  data: {
    // 弹窗控制
    showPopup: true,
    
    // 车型列表
    carModelList: [
      { label: '旅行者/山海T2', value: 'lvxingzhe' },
      { label: '自由者/山海T1', value: 'ziyouzhe' },
      { label: '大圣', value: 'dasheng' },
      { label: 'X70系列', value: 'x70' },
      { label: 'X90系列', value: 'x90' },
      { label: '山海L7/Plus/T9', value: 'l7' },
      { label: '山海L9', value: 'l9' },
      { label: '其他', value: 'other' }
    ],
    
    // 当前选择的车型索引
    carModelIndex: 0,
    
    // 当前选择的车型
    currentCarModel: 'lvxingzhe',
    
    // 版本列表
    versionList: [
      { label: '4.06及以下', version: '0406' },
      { label: '00.08及以下', version: '00x' },
      { label: '4.07以上', version: '0407' },
      { label: '其他', version: 'other' },
      { label: '26款', version: 'cdm' }
    ],
    
    // 当前选择的版本索引
    versionIndex: 2,
    
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
    encryptionInstructions: '进入加密项输入上方计算后的口令',
    
    // 序列号输入
    serialNumber: '',
    
    // 26款密码保护
    isCdmVersion: false,
    cdmPasswordVerified: false,
    
    // 倒计时相关
    isCountdownMode: false,
    countdownSeconds: 0,
    countdownDisplay: '',
    
    // 定时器
    updateTimer: null,
    countdownTimer: null
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
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  // 格式化倒计时显示
  formatCountdown(seconds) {
    if (seconds <= 0) {
      return '00:00:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 启动倒计时
  startCountdown() {
    // 清除之前的定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    // 启动新的倒计时
    this.data.countdownTimer = setInterval(() => {
      this.setData({
        countdownSeconds: this.data.countdownSeconds - 1,
        countdownDisplay: this.formatCountdown(this.data.countdownSeconds - 1)
      });
      
      // 倒计时结束，更新密码
      if (this.data.countdownSeconds <= 1) {
        if (this.data.countdownTimer) {
          clearInterval(this.data.countdownTimer);
        }
        this.updatePasswords();
      }
    }, 1000);
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
    let encryptionInstructions = '进入加密项输入上方计算后的口令';
    
    // 对于固定口令版本，直接显示
    if (currentVersion === '0406') {
      encryptionPasswordDisplay = result.adbPassword;
      encryptionInstructions = '';
    } else if (currentVersion === 'other') {
      encryptionPasswordDisplay = result.adbPassword;
      encryptionInstructions = '';
    } else if (currentVersion === '00x') {
      systemInstructions = '系统界面连点 8 次';
      encryptionInstructions = '进入加密项输入上方计算后的口令';
    } else if (currentVersion === 'cdm' || currentVersion === '010108') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '';
      // 26款和01.01.08版本需要验证后才显示
      if (!this.data.cdmPasswordVerified) {
        encryptionPasswordDisplay = '********';
        systemPasswordDisplay = '********';
      }
    }
    
    // 倒计时模式处理
    let displayNextUpdateTime = result.nextUpdateTime;
    let countdownDisplay = '';
    
    if (result.isCountdownMode) {
      countdownDisplay = this.formatCountdown(result.countdownSeconds);
      displayNextUpdateTime = '倒计时';
    }
    
    this.setData({
      systemPassword: systemPasswordDisplay,
      encryptionPassword: encryptionPasswordDisplay,
      actualEncryptionPassword: actualEncryptionPassword,
      nextUpdateTime: displayNextUpdateTime,
      updateTime: result.updateTime,
      systemInstructions: systemInstructions,
      encryptionInstructions: encryptionInstructions,
      isCdmVersion: result.isCdmVersion,
      isCountdownMode: result.isCountdownMode,
      countdownSeconds: result.countdownSeconds || 0,
      countdownDisplay: countdownDisplay
    }, () => {
      // 如果是倒计时模式，启动倒计时
      if (result.isCountdownMode) {
        this.startCountdown();
      } else {
        // 清除倒计时定时器
        if (this.data.countdownTimer) {
          clearInterval(this.data.countdownTimer);
        }
      }
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

  // 车型下拉菜单变化
  onCarModelChange(e) {
    const index = parseInt(e.detail.value);
    const carModel = this.data.carModelList[index].value;

    // 根据车型更新版本列表
    let versionList = [];
    switch(carModel) {
      case 'lvxingzhe':
        versionList = [
          { label: '4.06及以下', version: '0406' },
          { label: '00.08及以下', version: '00x' },
          { label: '4.07以上', version: '0407' },
          { label: '其他', version: 'other' },
          { label: '26款', version: 'cdm' }
        ];
        break;
      case 'ziyouzhe':
        versionList = [
          { label: '11.01.04及以上', version: '11010x' },
          { label: '01.01.08', version: '010108' }
        ];
        break;
      case 'dasheng':
        versionList = [
          { label: 'OS1-02.01', version: '0201' },
          { label: 'OS1_20.10.00', version: '201000' }
        ];
        break;
      case 'x70':
        versionList = [
          { label: '其他', version: 'other' }
        ];
        break;
      case 'x90':
        versionList = [
          { label: '04.0x', version: '040x' },
          { label: '其他', version: 'other' }
        ];
        break;
      case 'l7':
        versionList = [
          { label: 'OS1-02.01', version: '0201' },
          { label: 'OS1_20.10.00', version: '201000' }
        ];
        break;
      case 'l9':
        versionList = [
          { label: '11.01.04及以上', version: '11010x' }
        ];
        break;
      default:
        versionList = [
          { label: '其他', version: 'other' }
        ];
    }

    this.setData({
      carModelIndex: index,
      currentCarModel: carModel,
      versionList: versionList,
      versionIndex: 0,
      currentVersion: versionList[0].version,
      serialNumber: '',
      cdmPasswordVerified: false
    });

    this.updatePasswords();
  },

  // 版本下拉菜单变化
  onVersionChange(e) {
    const index = parseInt(e.detail.value);
    const version = this.data.versionList[index].version;

    this.setData({
      versionIndex: index,
      currentVersion: version,
      serialNumber: '',
      cdmPasswordVerified: false
    });

    this.updatePasswords();
  },

  // 打开使用教程
  openManual() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none',
      duration: 2000
    });
  },

  // 打开安装工具
  openTool() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none',
      duration: 2000
    });
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
  },

  // 分享到抖音好友
  onShareAppMessage() {
    return {
      title: '车机口令工具',
      desc: '专业的车机工程模式口令计算工具',
      path: '/pages/index/index'
    };
  },

  // 分享到抖音朋友圈
  onShareTimeline() {
    return {
      title: '车机口令工具 - 专业的车机工程模式口令计算',
      query: {}
    };
  }
});
