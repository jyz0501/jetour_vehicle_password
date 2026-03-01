// 格式化时间单位（补前导零）
function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

// 车型配置
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

// 计算密码的核心函数
function calculatePasswords(carModel, version, now, serialNumber = '') {
  // 提取月日时（忽略分钟）
  const month = formatTimeUnit(now.getMonth() + 1);
  const date = formatTimeUnit(now.getDate());
  const hours = formatTimeUnit(now.getHours());
  const minutes = formatTimeUnit(now.getMinutes());

  // 组合日期时间字符串
  const dateTimeKey = `${month}${date}${hours}`;
  const dateTimeNum = parseInt(dateTimeKey, 10);
  const mmddhh = parseInt(`${month}${date}${hours}`, 10);

  let adbPassword, carPassword, nextUpdateTime;
  let isFixedPassword = false;

  // 旅行者车型
  if (carModel === 'traveler') {
    switch(version) {
      case '00x':
        // 00x版本的ADB密码计算逻辑
        const yymmdd = `${now.getFullYear().toString().slice(-2)}${month}${date}`;
        const lastDigit = parseInt(yymmdd.slice(-1), 10);
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
        
        if (serialNumber && serialNumber.length === 6) {
          const serialNum = parseInt(serialNumber, 10);
          const adbFull = serialNum * baseValue;
          adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
        } else {
          adbPassword = '';
        }
        
        carPassword = `*#230730#*`;
        
        // 00x版本的下次变更时间为下一天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowYear = tomorrow.getFullYear();
        const tomorrowMonth = formatTimeUnit(tomorrow.getMonth() + 1);
        const tomorrowDay = formatTimeUnit(tomorrow.getDate());
        nextUpdateTime = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
        break;
      
      case '0407':
        // 计算ADB密码（250110 × 日期时间）
        const adbFull = 250110 * dateTimeNum;
        adbPassword = (adbFull % 1000000).toString().padStart(6, '0');

        // 计算系统动态密码（ADB密码 - 当前小时数）
        const carFull = adbFull - now.getHours();
        carPassword = `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`;
        
        // 下次变更时间为下一个整点
        const nextHour = (now.getHours() + 1) % 24;
        nextUpdateTime = `${nextHour.toString().padStart(2, '0')}:00`;
        break;
      
      case '0406':
        // 0406版本使用固定工程模式密码
        isFixedPassword = true;
        carPassword = `*#230730#*`;
        adbPassword = '无';
        nextUpdateTime = '无（固定密码）';
        break;
      
      case 'other':
        // 其他版本使用固定工程模式密码，ADB密码基于序列号计算
        isFixedPassword = true;
        carPassword = `*#230730#*`;
        
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
        // 默认使用0407版本的逻辑
        const adbFullDefault = 250110 * dateTimeNum;
        adbPassword = (adbFullDefault % 1000000).toString().padStart(6, '0');
        const carFullDefault = adbFullDefault - now.getHours();
        carPassword = `*#${(carFullDefault % 1000000).toString().padStart(6, '0')}#*`;
        
        // 下次变更时间为下一个整点
        const nextHourDefault = (now.getHours() + 1) % 24;
        nextUpdateTime = `${nextHourDefault.toString().padStart(2, '0')}:00`;
    }
  }
  // 自由者车型
  else if (carModel === 'zizhe') {
    // 计算ADB密码（240910 × 日期时间）
    const adbFull = 240910 * mmddhh;
    adbPassword = (adbFull % 1000000).toString().padStart(6, '0');
    
    // 计算系统动态密码（ADB密码 - 当前小时数）
    const carFull = adbFull - now.getHours();
    carPassword = `*#${(carFull % 1000000).toString().padStart(6, '0')}#*`;
    
    // 下次变更时间为下一个整点
    const nextHour = (now.getHours() + 1) % 24;
    nextUpdateTime = `${nextHour.toString().padStart(2, '0')}:00`;
  }
  // 捷途大圣车型
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
    isFixedPassword
  };
}

// 页面逻辑
Page({
  data: {
    // 弹窗控制
    showPopup: true,
    
    // 车型列表
    carModelList: [
      { label: '捷途旅行者/山海T2', value: 'traveler' },
      { label: '自由者/山海T1', value: 'zizhe' },
      { label: '捷途大圣', value: 'dasheng' }
    ],
    
    // 当前选择的车型
    currentCarModel: 'traveler',
    
    // 版本列表（根据车型动态更新）
    versionList: [],
    
    // 当前选择的版本
    currentVersion: '0407',
    
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
              title: '链接已复制',
              icon: 'success'
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
              title: '链接已复制',
              icon: 'success'
            });
          }
        });
      }
    });
  },

  // 切换车型
  switchCarModel(e) {
    const carModel = e.currentTarget.dataset.model;
    const carModelConfig = carModels[carModel];
    
    // 设置默认版本为第一个版本
    const defaultVersion = carModelConfig.versions[0];
    
    this.setData({
      currentCarModel: carModel,
      currentVersion: defaultVersion,
      serialNumber: '',
      adbPasswordVisible: false
    }, () => {
      this.updateVersionList();
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

  // 切换版本
  switchVersion(e) {
    const version = e.currentTarget.dataset.version;
    this.setData({
      currentVersion: version,
      serialNumber: '',
      adbPasswordVisible: false
    }, () => {
      this.updatePasswords();
    });
  },

  // 输入序列号
  inputSerialNumber(e) {
    this.setData({
      serialNumber: e.detail.value
    });
  },

  // 计算ADB密码（用于00x和other版本）
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

  // 切换ADB密码显示/隐藏
  toggleAdbPassword() {
    const { adbPasswordVisible, actualAdbPassword } = this.data;
    
    if (adbPasswordVisible) {
      // 当前是显示状态，切换到隐藏
      this.setData({
        adbPassword: '******',
        adbPasswordVisible: false
      });
    } else {
      // 当前是隐藏状态，切换到显示
      this.setData({
        adbPassword: actualAdbPassword,
        adbPasswordVisible: true
      });
    }
  },

  // 更新密码
  updatePasswords() {
    const { currentCarModel, currentVersion, serialNumber } = this.data;
    const now = new Date();
    
    const result = calculatePasswords(currentCarModel, currentVersion, now, serialNumber);
    
    // 更新说明文本
    let carInstructions = '应用中心——蓝牙电话，输入上方密码';
    let adbInstructions = '进入工程模式之后，下滑到最下方——加密设置——进入加密设置，输入上方密码';
    
    if (currentCarModel === 'traveler') {
      if (currentVersion === '00x' || currentVersion === 'other') {
        carInstructions = '应用中心——蓝牙电话，输入上方密码 或者 通用—系统—右侧空白处连点10下';
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
    
    this.setData({
      carPassword: result.carPassword,
      actualAdbPassword: result.adbPassword,
      adbPassword: result.isFixedPassword ? result.adbPassword : '******',
      adbPasswordVisible: false,
      nextUpdateTime: result.nextUpdateTime,
      updateTime: result.updateTime,
      carInstructions: carInstructions,
      adbInstructions: adbInstructions
    });
  }
});
