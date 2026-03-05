// 格式化时间单位（补前导零）
function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

// 车型配置
const carModels = {
  traveler: {
    name: '旅行者/山海T2',
    versions: ['00x', '0406', '0407', 'other', 'cdm'],
    versionNames: {
      '00x': '00.08及以下',
      '0406': '4.06及以下',
      '0407': '4.07以上',
      'other': '其他',
      'cdm': '26款'
    }
  },
  ziyouzhe: {
    name: '自由者/山海T1',
    versions: ['11010x', '010108'],
    versionNames: {
      '11010x': '11.01.04及以上',
      '010108': '01.01.08'
    }
  },
  shanhal7: {
    name: '山海L7/Plus/T9',
    versions: ['os10201', 'os1201000'],
    versionNames: {
      'os10201': 'OS1-02.01',
      'os1201000': 'OS1_20.10.00'
    }
  },
  shanhal9: {
    name: '山海L9',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    }
  },
  fengyunA9: {
    name: '风云A9/T9',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    }
  },
  hu8: {
    name: '虎8/8L',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    }
  },
  x70plus: {
    name: 'X70Plus/L/Pro/CDM',
    versions: ['unknown'],
    versionNames: {
      'unknown': '00.01.0x'
    }
  },
  x90plus: {
    name: 'X90/Plus/Pro/CDM',
    versions: ['040x', 'unknown'],
    versionNames: {
      '040x': '04.0x',
      'unknown': '其他版本'
    }
  },
  x95: {
    name: 'X95',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    }
  },
  dasheng: {
    name: '大圣',
    versions: ['fixed'],
    versionNames: {
      'fixed': '固定密码'
    }
  }
};

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

// 计算密码的核心函数
function calculatePasswords(carModel, version, now, serialNumber = '') {
  // 提取月日时（忽略分钟）
  const month = formatTimeUnit(now.getMonth() + 1);
  const date = formatTimeUnit(now.getDate());
  const hours = formatTimeUnit(now.getHours());
  const minutes = formatTimeUnit(now.getMinutes());
  const year = now.getFullYear();

  // 组合日期时间字符串
  const dateTimeKey = `${month}${date}${hours}`;
  const dateTimeNum = parseInt(dateTimeKey, 10);
  const mmddhh = parseInt(`${month}${date}${hours}`, 10);

  let adbPassword, carPassword, nextUpdateTime, countdownSeconds;
  let isFixedPassword = false;
  let isCdmVersion = false;
  let isCountdownMode = false;

  // 旅行者车型
  if (carModel === 'traveler') {
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
        
        carPassword = `*#20230730#*`;
        
        // 00x版本的下次变更时间为无（固定密码）
        nextUpdateTime = '无（固定密码）';
        isFixedPassword = true;
        break;
      
      case '0407':
        // 计算ADB密码（250110 × 日期时间）
        const adbFull0407 = 250110 * dateTimeNum;
        adbPassword = (adbFull0407 % 1000000).toString().padStart(6, '0');

        // 计算系统动态密码（ADB密码 - 当前小时数）
        const carFull0407 = adbFull0407 - now.getHours();
        carPassword = `*#${(carFull0407 % 1000000).toString().padStart(6, '0')}#*`;
        
        // 计算到下一个整点的倒计时秒数
        const nextHour0407 = new Date(now);
        nextHour0407.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHour0407 - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
        break;
      
      case '0406':
        // 0406版本使用固定工程模式密码
        isFixedPassword = true;
        carPassword = `*#20230730#*`;
        adbPassword = '无';
        nextUpdateTime = '无（固定密码）';
        break;
      
      case 'other':
        // other版本使用serialNumberDaily算法（基于日期YYMMDD）
        carPassword = `*#20230730#*`;
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

        // 计算系统动态密码（ADB密码 - 当前小时数）
        const carFullCdm = adbFullCdm - now.getHours();
        carPassword = `*#${(carFullCdm % 1000000).toString().padStart(6, '0')}#*`;
        
        // 计算到下一个整点的倒计时秒数
        const nextHourCdm = new Date(now);
        nextHourCdm.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHourCdm - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
        break;
      
      default:
        // 默认使用0407版本的逻辑
        const adbFullDefault = 250110 * dateTimeNum;
        adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
        const carFullDefault = adbFullDefault - now.getHours();
        carPassword = `*#${(carFullDefault % 1000000).toString().padStart(6, '0')}#*`;
        
        // 计算到下一个整点的倒计时秒数
        const nextHourDefault = new Date(now);
        nextHourDefault.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHourDefault - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
    }
  }
  // 自由者车型
  else if (carModel === 'ziyouzhe') {
    // 计算ADB密码（240910 × 日期时间）
    const adbFull = 240910 * mmddhh;
    adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
    
    // 计算系统动态密码（ADB密码 - 当前小时数）
    const carFull = adbFull - now.getHours();
    carPassword = `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`;
    
    // 计算到下一个整点的倒计时秒数
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    countdownSeconds = Math.floor((nextHour - now) / 1000);
    nextUpdateTime = '倒计时';
    isCountdownMode = true;
  }
  // 山海L7/Plus/T9
  else if (carModel === 'shanhal7') {
    carPassword = `*#20230730#*`;
    adbPassword = '20201030';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }
  // 山海L9
  else if (carModel === 'shanhal9') {
    carPassword = `*#20230730#*`;
    adbPassword = '20201030';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }
  // 风云A9/T9
  else if (carModel === 'fengyunA9') {
    carPassword = `*#20230730#*`;
    adbPassword = calculateSerialNumberDailyPassword(year, month, date);
    
    // 计算到明天00:00:00的倒计时秒数
    const tomorrowFengyun = new Date();
    tomorrowFengyun.setDate(tomorrowFengyun.getDate() + 1);
    tomorrowFengyun.setHours(0, 0, 0, 0);
    countdownSeconds = Math.floor((tomorrowFengyun - now) / 1000);
    nextUpdateTime = '倒计时';
    isCountdownMode = true;
  }
  // 虎8/8L
  else if (carModel === 'hu8') {
    carPassword = `*#20230730#*`;
    adbPassword = calculateSerialNumberDailyPassword(year, month, date);
    
    // 计算到明天00:00:00的倒计时秒数
    const tomorrowHu8 = new Date();
    tomorrowHu8.setDate(tomorrowHu8.getDate() + 1);
    tomorrowHu8.setHours(0, 0, 0, 0);
    countdownSeconds = Math.floor((tomorrowHu8 - now) / 1000);
    nextUpdateTime = '倒计时';
    isCountdownMode = true;
  }
  // X70Plus/L/Pro/CDM
  else if (carModel === 'x70plus') {
    carPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }
  // X90/Plus/Pro/CDM
  else if (carModel === 'x90plus') {
    carPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }
  // X95
  else if (carModel === 'x95') {
    carPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }
  // 大圣车型
  else if (carModel === 'dasheng') {
    carPassword = `*#20220730#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定密码）';
    isFixedPassword = true;
  }

  // 生成更新时间字符串
  const updateTime = `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;

  return {
    carPassword,
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
      { label: '旅行者/山海T2', value: 'traveler' },
      { label: '自由者/山海T1', value: 'ziyouzhe' },
      { label: '山海L7/Plus/T9', value: 'shanhal7' },
      { label: '山海L9', value: 'shanhal9' },
      { label: '风云A9/T9', value: 'fengyunA9' },
      { label: '虎8/8L', value: 'hu8' },
      { label: 'X70Plus/L/Pro/CDM', value: 'x70plus' },
      { label: 'X90/Plus/Pro/CDM', value: 'x90plus' },
      { label: 'X95', value: 'x95' },
      { label: '大圣', value: 'dasheng' }
    ],
    
    // 当前选择的车型索引
    carModelIndex: 0,
    currentCarModel: 'traveler',
    
    // 版本列表（根据车型动态更新）
    versionList: [],
    versionIndex: 0,
    
    // 当前选择的版本
    currentVersion: '0407',
    
    // 密码相关
    carPassword: '--',
    adbPassword: '******',
    actualAdbPassword: '',
    nextUpdateTime: '--',
    updateTime: '--',
    
    // 倒计时相关
    isCountdownMode: false,
    countdownSeconds: 0,
    countdownDisplay: '',
    
    // 说明文本
    carInstructions: '应用中心——蓝牙电话，输入上方密码',
    adbInstructions: '加密设置——进入加密设置，输入上方密码',
    
    // 序列号输入
    serialNumber: '',
    
    // 26款密码保护
    isCdmVersion: false,
    cdmPasswordVerified: false,
    
    // 定时器
    updateTimer: null,
    countdownTimer: null
  },

  // 页面加载
  onLoad() {
    this.updateVersionList();
    this.updatePasswords();
    
    // 每分钟更新一次密码
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

  // 关闭弹窗
  closePopup() {
    this.setData({
      showPopup: false
    });
  },

  // 打开使用教程
  openManual() {
    wx.navigateToMiniProgram({
      appId: '',
      path: '',
      extraData: {},
      envVersion: 'release',
      success(res) {
        // 打开成功
      },
      fail(err) {
        // 如果小程序跳转失败，复制链接到剪贴板
        wx.setClipboardData({
          data: 'https://manual.qianxian.tech/',
          success() {
            wx.showToast({
              title: '链接已复制，请转到 EDGE 或 Chrome 浏览器中打开',
              icon: 'none',
              duration: 2000
            });
          }
        });
      }
    });
  },

  // 打开安装工具
  openTool() {
    wx.navigateToMiniProgram({
      appId: '',
      path: '',
      extraData: {},
      envVersion: 'release',
      success(res) {
        // 打开成功
      },
      fail(err) {
        // 如果小程序跳转失败，复制链接到剪贴板
        wx.setClipboardData({
          data: 'https://tool.qianxian.tech/',
          success() {
            wx.showToast({
              title: '链接已复制，请转到 EDGE 或 Chrome 浏览器中打开',
              icon: 'none',
              duration: 2000
            });
          }
        });
      }
    });
  },

  // 复制ID关注大伦哥
  copyId() {
    wx.setClipboardData({
      data: 'JetourTravel',
      success() {
        wx.showToast({
          title: 'ID已复制，请前往平台搜索关注',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 车型下拉菜单变化
  onCarModelChange(e) {
    const index = parseInt(e.detail.value);
    const carModel = this.data.carModelList[index].value;
    const carModelConfig = carModels[carModel];
    
    // 设置默认版本为第一个版本
    const defaultVersion = carModelConfig.versions[0];
    
    // 清除之前的倒计时定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    this.setData({
      carModelIndex: index,
      currentCarModel: carModel,
      currentVersion: defaultVersion,
      versionIndex: 0,
      serialNumber: '',
      cdmPasswordVerified: false,
      isCountdownMode: false,
      countdownSeconds: 0,
      countdownDisplay: ''
    }, () => {
      this.updateVersionList();
      this.updatePasswords();
    });
  },

  // 版本下拉菜单变化
  onVersionChange(e) {
    const index = parseInt(e.detail.value);
    const version = this.data.versionList[index].version;
    
    // 清除之前的倒计时定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    this.setData({
      versionIndex: index,
      currentVersion: version,
      serialNumber: '',
      cdmPasswordVerified: false,
      isCountdownMode: false,
      countdownSeconds: 0,
      countdownDisplay: ''
    }, () => {
      this.updatePasswords();
    });
  },

  // 更新版本列表
  updateVersionList() {
    const carModel = carModels[this.data.currentCarModel];
    const versionList = carModel.versions.map(version => ({
      label: carModel.versionNames[version],
      version: version
    }));
    
    this.setData({
      versionList: versionList
    });
  },

  // 输入序列号
  inputSerialNumber(e) {
    this.setData({
      serialNumber: e.detail.value
    });
  },

  // 计算ADB密码（用于00x版本）
  calculateAdbPassword() {
    const { currentCarModel, currentVersion, serialNumber } = this.data;
    
    if (!serialNumber || serialNumber.length !== 6) {
      wx.showToast({
        title: '请输入6位序列号',
        icon: 'none'
      });
      return;
    }
    
    const now = new Date();
    const result = calculatePasswords(currentCarModel, currentVersion, now, serialNumber);
    
    this.setData({
      adbPassword: result.adbPassword,
      actualAdbPassword: result.adbPassword
    });
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
            const result = calculatePasswords(this.data.currentCarModel, this.data.currentVersion, now, '');
            this.setData({
              adbPassword: result.adbPassword,
              actualAdbPassword: result.adbPassword,
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

  // 更新密码
  updatePasswords() {
    const { currentCarModel, currentVersion, serialNumber } = this.data;
    const now = new Date();
    
    const result = calculatePasswords(currentCarModel, currentVersion, now, serialNumber);
    
    // 更新说明文本
    let carInstructions = '应用中心——蓝牙电话，输入上方密码';
    let adbInstructions = '加密设置——进入加密设置，输入上方密码';
    
    if (currentCarModel === 'traveler') {
      if (currentVersion === '00x') {
        carInstructions = '系统界面连点 8 次';
        adbInstructions = '进入加密项输入上方计算后的密码';
      } else if (currentVersion === '0406') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '';
      } else if (currentVersion === 'other') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点8下';
        adbInstructions = '';
      } else if (currentVersion === 'cdm') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '';
      }
    } else if (currentCarModel === 'ziyouzhe') {
      if (currentVersion === '00x') {
        carInstructions = '系统界面连点 8 次';
        adbInstructions = '进入加密项输入上方计算后的密码';
      } else {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '加密设置——进入加密设置，输入上方密码';
      }
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
      carInstructions = '系统界面点击系统升级——快速点击8次系统版本——ADB切换——ADB模式';
      adbInstructions = '';
    } else if (currentCarModel === 'dasheng') {
      if (currentVersion === '00x') {
        carInstructions = '系统界面连点 8 次';
        adbInstructions = '进入加密项输入上方计算后的密码';
      } else {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '';
      }
    } else {
      if (currentVersion === '00x') {
        carInstructions = '系统界面连点 8 次';
        adbInstructions = '进入加密项输入上方计算后的密码';
      } else {
        carInstructions = '应用中心——蓝牙电话，输入上方密码';
        adbInstructions = '';
      }
    }
    
    // 26款版本特殊处理：不自动显示ADB密码和工程密码
    let displayAdbPassword = result.adbPassword;
    let displayCarPassword = result.carPassword;
    
    if (result.isCdmVersion && !this.data.cdmPasswordVerified) {
      displayAdbPassword = '********';
      displayCarPassword = '********';
    } else if (currentCarModel === 'ziyouzhe' && currentVersion === '010108' && !this.data.cdmPasswordVerified) {
      displayAdbPassword = '********';
      displayCarPassword = '********';
    } else if (result.isFixedPassword) {
      displayAdbPassword = result.adbPassword;
      displayCarPassword = result.carPassword;
    } else if (!result.isCdmVersion) {
      displayAdbPassword = result.adbPassword;
      displayCarPassword = result.carPassword;
    }
    
    // 倒计时模式处理
    let displayNextUpdateTime = result.nextUpdateTime;
    let countdownDisplay = '';
    
    if (result.isCountdownMode) {
      countdownDisplay = this.formatCountdown(result.countdownSeconds);
      displayNextUpdateTime = '倒计时';
    }
    
    this.setData({
      carPassword: displayCarPassword,
      actualAdbPassword: result.adbPassword,
      adbPassword: displayAdbPassword,
      nextUpdateTime: displayNextUpdateTime,
      updateTime: result.updateTime,
      carInstructions: carInstructions,
      adbInstructions: adbInstructions,
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
  }
});
