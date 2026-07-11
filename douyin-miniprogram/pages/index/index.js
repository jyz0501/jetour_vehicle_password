// 格式化时间单位（补前导零）
function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

// 计算serialNumberDaily口令
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

// 计算口令的核心函数
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

  let adbPassword, systemPassword, nextUpdateTime, countdownSeconds;
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

        systemPassword = `*#20230730#*`;

        // 00x版本的下次变更时间为无（固定口令）
        nextUpdateTime = '无（固定口令）';
        isFixedPassword = true;
        break;

      case '0407':
        // 计算ADB口令（250110 × 日期时间）
        const adbFull0407 = 250110 * dateTimeNum;
        adbPassword = (adbFull0407 % 1000000).toString().padStart(6, '0');

        // 计算系统动态口令（ADB口令 - 当前小时数）
        const systemFull0407 = adbFull0407 - now.getHours();
        systemPassword = `*#${(systemFull0407 % 1000000).toString().padStart(6, '0')}#*`;

        // 计算到下一个整点的倒计时秒数
        const nextHour0407 = new Date(now);
        nextHour0407.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHour0407 - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
        break;

      case '0406':
        // 0406版本使用固定工程模式口令，加密项使用230830算法
        isFixedPassword = true;
        systemPassword = `*#20230730#*`;
        // 加密项口令：230830 × 月日时（MMDDHH）取后六位
        const adbFull0406 = 230830 * dateTimeNum;
        adbPassword = (adbFull0406 % 1000000).toString().padStart(6, '0');

        // 计算到下一个整点的倒计时秒数
        const nextHour0406 = new Date(now);
        nextHour0406.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHour0406 - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
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
        // 26款版本使用250930算法
        isCdmVersion = true;
        const adbFullCdm = 250930 * dateTimeNum;
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

      default:
        // 默认使用0407版本的逻辑
        const adbFullTravelerDefault = 250110 * dateTimeNum;
        adbPassword = (adbFullTravelerDefault % 1000000).toString().padStart(6, '0');
        const systemFullTravelerDefault = adbFullTravelerDefault - now.getHours();
        systemPassword = `*#${(systemFullTravelerDefault % 1000000).toString().padStart(6, '0')}#*`;

        // 计算到下一个整点的倒计时秒数
        const nextHourTravelerDefault = new Date(now);
        nextHourTravelerDefault.setHours(now.getHours() + 1, 0, 0, 0);
        countdownSeconds = Math.floor((nextHourTravelerDefault - now) / 1000);
        nextUpdateTime = '倒计时';
        isCountdownMode = true;
    }
  }
  // 自由者车型
  else if (carModel === 'ziyouzhe') {
    // 计算ADB口令（240910 × 日期时间）
    const adbFullZiyouzhe = 240910 * mmddhh;
    adbPassword = (adbFullZiyouzhe % 1000000).toString().padStart(6, '0');

    // 计算系统动态口令（ADB口令 - 当前小时数）
    const systemFullZiyouzhe = adbFullZiyouzhe - now.getHours();
    systemPassword = `*#${(systemFullZiyouzhe % 1000000).toString().padStart(6, '0')}#*`;

    // 计算到下一个整点的倒计时秒数
    const nextHourZiyouzhe = new Date(now);
    nextHourZiyouzhe.setHours(now.getHours() + 1, 0, 0, 0);
    countdownSeconds = Math.floor((nextHourZiyouzhe - now) / 1000);
    nextUpdateTime = '倒计时';
    isCountdownMode = true;
  }
  // 山海L7/Plus/T9
  else if (carModel === 'shanhal7') {
    systemPassword = `*#20230730#*`;
    adbPassword = '20201030';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // 山海L9
  else if (carModel === 'shanhal9') {
    systemPassword = `*#20230730#*`;
    adbPassword = '20201030';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // 风云A9/T9
  else if (carModel === 'fengyunA9') {
    systemPassword = `*#20230730#*`;
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
    systemPassword = `*#20230730#*`;
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
    systemPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // X90/Plus/Pro/CDM
  else if (carModel === 'x90plus') {
    systemPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // X95
  else if (carModel === 'x95') {
    systemPassword = `*#20201030#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // 大圣车型
  else if (carModel === 'dasheng') {
    systemPassword = `*#20220730#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
  }
  // G700车型
  else if (carModel === 'g700') {
    systemPassword = `*#20240730#*`;
    const adbFullG700 = 240730 * dateTimeNum;
    adbPassword = (adbFullG700 % 1000000).toString().padStart(6, '0');

    const nextHourG700 = new Date(now);
    nextHourG700.setHours(now.getHours() + 1, 0, 0, 0);
    countdownSeconds = Math.floor((nextHourG700 - now) / 1000);
    nextUpdateTime = '倒计时';
    isCountdownMode = true;
  }
  // 其他车型
  else {
    systemPassword = `*#20230730#*`;
    adbPassword = '无';
    nextUpdateTime = '无（固定口令）';
    isFixedPassword = true;
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
      { label: '旅行者/山海T2', value: 'traveler' },
      { label: '自由者/山海T1', value: 'ziyouzhe' },
      { label: '山海L7/Plus/T9', value: 'shanhal7' },
      { label: '山海L9', value: 'shanhal9' },
      { label: '风云A9/T9', value: 'fengyunA9' },
      { label: '虎8/8L', value: 'hu8' },
      { label: 'X70Plus/L/Pro/CDM', value: 'x70plus' },
      { label: 'X90/Plus/Pro/CDM', value: 'x90plus' },
      { label: 'X95', value: 'x95' },
      { label: '大圣', value: 'dasheng' },
      { label: 'G700', value: 'g700' }
    ],
    
    // 当前选择的车型索引
    carModelIndex: 0,

    // 当前选择的车型
    currentCarModel: 'traveler',

    // 版本列表（根据车型动态更新）
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
      
      // 倒计时结束，更新口令
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
    const { currentCarModel, currentVersion, serialNumber } = this.data;

    const result = calculatePasswords(currentCarModel, currentVersion, now, serialNumber);

    let encryptionPasswordDisplay = result.adbPassword;
    let systemPasswordDisplay = result.systemPassword;
    let actualEncryptionPassword = result.adbPassword;
    let systemInstructions = '应用中心——蓝牙电话，输入上方口令';
    let encryptionInstructions = '进入加密项输入上方计算后的口令';

    // 对于固定口令版本的特殊处理
    if (currentVersion === '0406') {
      encryptionInstructions = '加密设置——进入加密设置，输入上方口令';
    } else if (currentVersion === 'other') {
      encryptionInstructions = '';
    } else if (currentVersion === '00x') {
      systemInstructions = '系统界面连点 8 次';
      encryptionInstructions = '进入加密项输入上方计算后的口令';
    } else if (currentVersion === 'cdm') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '';
    } else if (currentCarModel === 'ziyouzhe') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '加密设置——进入加密设置，输入上方口令';
    } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus' || currentCarModel === 'x95') {
      systemInstructions = '系统界面点击系统升级——快速点击8次系统版本——ADB切换——ADB模式';
      encryptionInstructions = '';
    } else if (currentCarModel === 'dasheng') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '';
    } else if (currentCarModel === 'shanhal7' || currentCarModel === 'shanhal9') {
      systemInstructions = '应用中心——蓝牙电话，输入上方口令';
      encryptionInstructions = '';
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
      serialNumber: ''
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
      case 'traveler':
        versionList = [
          { label: '00.08及以下', version: '00x' },
          { label: '4.06及以下', version: '0406' },
          { label: '4.07以上', version: '0407' },
          { label: '其他', version: 'other' },
          { label: '26款', version: 'cdm' }
        ];
        break;
      case 'ziyouzhe':
        versionList = [
          { label: '11.01.04及以上', version: '11010x' },
          { label: '01.01.0x', version: '01010x' },
          { label: '00.04.02', version: '000402' }
        ];
        break;
      case 'shanhal7':
        versionList = [
          { label: 'OS1-02.01', version: 'os10201' },
          { label: 'OS1_20.10.00', version: 'os1201000' }
        ];
        break;
      case 'shanhal9':
        versionList = [
          { label: '其他版本', version: 'unknown' }
        ];
        break;
      case 'fengyunA9':
        versionList = [
          { label: '其他版本', version: 'unknown' }
        ];
        break;
      case 'hu8':
        versionList = [
          { label: '其他版本', version: 'unknown' }
        ];
        break;
      case 'x70plus':
        versionList = [
          { label: '00.01.0x', version: 'unknown' }
        ];
        break;
      case 'x90plus':
        versionList = [
          { label: '04.0x', version: '040x' },
          { label: '其他版本', version: 'unknown' }
        ];
        break;
      case 'x95':
        versionList = [
          { label: '其他版本', version: 'unknown' }
        ];
        break;
      case 'dasheng':
        versionList = [
          { label: '固定口令', version: 'fixed' }
        ];
        break;
      case 'g700':
        versionList = [
          { label: '3.30-3.35', version: '330335' }
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
      serialNumber: ''
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
      serialNumber: ''
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
    const { serialNumber, currentCarModel, currentVersion } = this.data;

    if (currentCarModel !== 'traveler' || currentVersion !== '00x') return;

    if (serialNumber.length !== 6) {
      wx.showToast({
        title: '请输入系统序列号后六位',
        icon: 'none'
      });
      return;
    }

    this.updatePasswords();
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
