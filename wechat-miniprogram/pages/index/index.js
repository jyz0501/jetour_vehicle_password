// 格式化时间单位（补前导零）
function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

// 计算密码的核心函数
function calculatePasswords(version, now, serialNumber = '') {
  // 提取月日时（忽略分钟）
  const month = formatTimeUnit(now.getMonth() + 1);
  const date = formatTimeUnit(now.getDate());
  const hours = formatTimeUnit(now.getHours());
  const minutes = formatTimeUnit(now.getMinutes());

  // 组合日期时间字符串
  const dateTimeKey = `${month}${date}${hours}`;
  const dateTimeNum = parseInt(dateTimeKey, 10);

  let adbPassword, carPassword, nextUpdateTime;
  let isFixedPassword = false;

  // 根据不同版本计算密码
  switch(version) {
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
      carPassword = `*#20230730#*`;
      
      // 00x版本的下次变更时间为下一天
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = formatTimeUnit(tomorrow.getMonth() + 1);
      const tomorrowDay = formatTimeUnit(tomorrow.getDate());
      nextUpdateTime = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
      break;
    
    case '04.11':
    case '04.12':
      // 计算ADB密码（20250110 × 日期时间）
      const adbFull = 20250110 * dateTimeNum;
      adbPassword = (adbFull % 1000000).toString().padStart(6, '0');

      // 计算车机动态密码（ADB密码 - 当前小时数）
      const carFull = adbFull - now.getHours();
      carPassword = `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`;
      
      // 下次变更时间为下一个整点
      const nextHour = (now.getHours() + 1) % 24;
      nextUpdateTime = `${nextHour.toString().padStart(2, '0')}:00`;
      break;
    
    case '04.06':
      // 04.06版本使用固定工程模式密码
      isFixedPassword = true;
      carPassword = `*#20230730#*`;
      adbPassword = '无';
      nextUpdateTime = '无（固定密码）';
      break;
    
    case 'other':
      // 其他版本使用固定工程模式密码，ADB密码基于序列号计算
      isFixedPassword = true;
      carPassword = `*#20230730#*`;
      
      if (serialNumber && serialNumber.length === 6) {
        // 计算ADB密码：序列号后六位 * 802018，取后六位
        const serialNum = parseInt(serialNumber, 10);
        const adbFull = serialNum * 802018;
        adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
      } else {
        adbPassword = '';
      }
      
      // 其他版本的下次变更时间为下一天
      const tomorrowOther = new Date();
      tomorrowOther.setDate(tomorrowOther.getDate() + 1);
      const tomorrowYearOther = tomorrowOther.getFullYear();
      const tomorrowMonthOther = formatTimeUnit(tomorrowOther.getMonth() + 1);
      const tomorrowDayOther = formatTimeUnit(tomorrowOther.getDate());
      nextUpdateTime = `${tomorrowYearOther}-${tomorrowMonthOther}-${tomorrowDayOther}`;
      break;
    
    default:
      // 默认使用04.11版本的逻辑
      const adbFullDefault = 20250110 * dateTimeNum;
      adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
      const carFullDefault = adbFullDefault - now.getHours();
      carPassword = `*#${(carFullDefault % 1000000).toString().padStart(6, '0')}#*`;
      
      // 下次变更时间为下一个整点
      const nextHourDefault = (now.getHours() + 1) % 24;
      nextUpdateTime = `${nextHourDefault.toString().padStart(2, '0')}:00`;
  }

  // 生成更新时间字符串
  const updateTime = `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`;

  return {
    carPassword,
    adbPassword,
    nextUpdateTime,
    updateTime,
    isFixedPassword
  };
}

// 页面逻辑
Page({
  data: {
    // 弹窗控制
    showPopup: true,
    
    // 版本列表
    versionList: [
      { label: '4.06及以下', version: '04.06' },
      { label: '00.00.x', version: '00x' },
      { label: '4.07及以上', version: '04.11' },
      { label: 'v04.12', version: '04.12' },
      { label: '其他', version: 'other' }
    ],
    
    // 当前选择的版本
    currentVersion: '04.11',
    
    // 密码相关
    carPassword: '--',
    adbPassword: '******',
    actualAdbPassword: '',
    adbPasswordVisible: false,
    nextUpdateTime: '--',
    updateTime: '--',
    
    // 说明文本
    carInstructions: '应用中心——蓝牙电话，输入上方密码',
    adbInstructions: '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码',
    
    // 序列号输入
    serialNumber: '',
    
    // 定时器
    updateTimer: null
  },

  // 页面加载
  onLoad() {
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
  },

  // 更新密码
  updatePasswords() {
    const now = new Date();
    const { currentVersion, serialNumber } = this.data;
    
    const result = calculatePasswords(currentVersion, now, serialNumber);
    
    let adbPasswordDisplay = '******';
    let actualAdbPassword = result.adbPassword;
    let carInstructions = '应用中心——蓝牙电话，输入上方密码';
    let adbInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    
    // 对于固定密码版本，直接显示
    if (currentVersion === '04.06') {
      adbPasswordDisplay = result.adbPassword;
    } else if (currentVersion === 'other') {
      adbPasswordDisplay = result.adbPassword;
      adbInstructions = '进入工程模式后，点加密项，输入产品序列号后六位';
    } else if (currentVersion === '00x') {
      carInstructions = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
      adbInstructions = '进入加密项输入上方计算后的密码。同样适用：瑞虎8、风云车型';
    }
    
    this.setData({
      carPassword: result.carPassword,
      adbPassword: adbPasswordDisplay,
      actualAdbPassword: actualAdbPassword,
      nextUpdateTime: result.nextUpdateTime,
      updateTime: result.updateTime,
      carInstructions: carInstructions,
      adbInstructions: adbInstructions
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

  // 输入序列号
  inputSerialNumber(e) {
    const serialNumber = e.detail.value;
    this.setData({
      serialNumber: serialNumber
    });
  },

  // 计算ADB密码（其他版本）
  calculateAdbPassword() {
    const { serialNumber, currentVersion } = this.data;
    
    if (currentVersion !== 'other') return;
    
    if (serialNumber.length !== 6) {
      wx.showToast({
        title: '请输入车机序列号后六位',
        icon: 'none'
      });
      return;
    }
    
    this.updatePasswords();
  },

  // 切换ADB密码显示/隐藏
  toggleAdbPassword() {
    const { adbPasswordVisible, adbPassword, actualAdbPassword } = this.data;
    
    this.setData({
      adbPasswordVisible: !adbPasswordVisible,
      adbPassword: adbPasswordVisible ? '******' : actualAdbPassword
    });
  },
  
  // 关闭弹窗
  closePopup() {
    this.setData({
      showPopup: false
    });
  }
});