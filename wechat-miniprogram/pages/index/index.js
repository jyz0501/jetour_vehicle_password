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
    },
    countdownType: {
      '00x': 'none',
      '0406': 'hourly',
      '0407': 'hourly',
      'other': 'daily',
      'cdm': 'hourly'
    }
  },
  ziyouzhe: {
    name: '自由者/山海T1',
    versions: ['11010x', '01010x', '000402'],
    versionNames: {
      '11010x': '11.01.04及以上',
      '01010x': '01.01.0x',
      '000402': '00.04.02'
    },
    countdownType: {
      '11010x': 'hourly',
      '01010x': 'hourly',
      '000402': 'none'
    }
  },
  shanhal7: {
    name: '山海L7/Plus/T9',
    versions: ['os10201', 'os1201000'],
    versionNames: {
      'os10201': 'OS1-02.01',
      'os1201000': 'OS1_20.10.00'
    },
    countdownType: {
      'os10201': 'none',
      'os1201000': 'none'
    }
  },
  shanhal9: {
    name: '山海L9',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    },
    countdownType: {
      'unknown': 'none'
    }
  },
  fengyunA9: {
    name: '风云A9/T9',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    },
    countdownType: {
      'unknown': 'daily'
    }
  },
  hu8: {
    name: '虎8/8L',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    },
    countdownType: {
      'unknown': 'daily'
    }
  },
  x70plus: {
    name: 'X70Plus/L/Pro/CDM',
    versions: ['unknown'],
    versionNames: {
      'unknown': '00.01.0x'
    },
    countdownType: {
      'unknown': 'none'
    }
  },
  x90plus: {
    name: 'X90/Plus/Pro/CDM',
    versions: ['040x', 'unknown'],
    versionNames: {
      '040x': '04.0x',
      'unknown': '其他版本'
    },
    countdownType: {
      '040x': 'none',
      'unknown': 'none'
    }
  },
  x95: {
    name: 'X95',
    versions: ['unknown'],
    versionNames: {
      'unknown': '其他版本'
    },
    countdownType: {
      'unknown': 'none'
    }
  },
  dasheng: {
    name: '大圣',
    versions: ['fixed'],
    versionNames: {
      'fixed': '固定口令'
    },
    countdownType: {
      'fixed': 'none'
    }
  },
  g700: {
    name: 'G700',
    versions: ['330335', '4.0x-4.4x'],
    versionNames: {
      '330335': '3.30-3.35',
      '4.0x-4.4x': '4.0x-4.4x'
    },
    countdownType: {
      '330335': 'hourly',
      '4.0x-4.4x': 'hourly'
    }
  }
};

function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
}

const timezones = [
  { value: 'UTC-11', label: '(UTC-11:00) 美属萨摩亚', offset: 660 },
  { value: 'UTC-10', label: '(UTC-10:00) 夏威夷', offset: 600 },
  { value: 'UTC-09', label: '(UTC-09:00) 阿拉斯加', offset: 540 },
  { value: 'UTC-08', label: '(UTC-08:00) 洛杉矶/蒂华纳', offset: 480 },
  { value: 'UTC-07', label: '(UTC-07:00) 丹佛/凤凰城', offset: 420 },
  { value: 'UTC-06', label: '(UTC-06:00) 芝加哥/墨西哥城', offset: 360 },
  { value: 'UTC-05', label: '(UTC-05:00) 纽约/利马', offset: 300 },
  { value: 'UTC-04', label: '(UTC-04:00) 哈利法克斯/加拉加斯', offset: 240 },
  { value: 'UTC-03', label: '(UTC-03:00) 圣保罗/布宜诺斯艾利斯', offset: 180 },
  { value: 'UTC-02', label: '(UTC-02:00) 中大西洋', offset: 120 },
  { value: 'UTC-01', label: '(UTC-01:00) 亚速尔/佛得角', offset: 60 },
  { value: 'UTC+00', label: '(UTC+00:00) 伦敦/里斯本/都柏林', offset: 0 },
  { value: 'UTC+01', label: '(UTC+01:00) 巴黎/柏林/罗马', offset: -60 },
  { value: 'UTC+02', label: '(UTC+02:00) 开罗/雅典/开普敦', offset: -120 },
  { value: 'UTC+03', label: '(UTC+03:00) 莫斯科/伊斯坦布尔/内罗毕', offset: -180 },
  { value: 'UTC+03:30', label: '(UTC+03:30) 德黑兰', offset: -210 },
  { value: 'UTC+04', label: '(UTC+04:00) 迪拜/巴库', offset: -240 },
  { value: 'UTC+05', label: '(UTC+05:00) 伊斯兰堡/塔什干', offset: -300 },
  { value: 'UTC+05:30', label: '(UTC+05:30) 新德里/孟买/科伦坡', offset: -330 },
  { value: 'UTC+05:45', label: '(UTC+05:45) 加德满都', offset: -345 },
  { value: 'UTC+06', label: '(UTC+06:00) 达卡/阿斯塔纳', offset: -360 },
  { value: 'UTC+06:30', label: '(UTC+06:30) 仰光', offset: -390 },
  { value: 'UTC+07', label: '(UTC+07:00) 曼谷/雅加达/河内', offset: -420 },
  { value: 'UTC+08', label: '(UTC+08:00) 北京/上海/香港/台北', offset: -480 },
  { value: 'UTC+09', label: '(UTC+09:00) 东京/首尔', offset: -540 },
  { value: 'UTC+09:30', label: '(UTC+09:30) 阿德莱德/达尔文', offset: -570 },
  { value: 'UTC+10', label: '(UTC+10:00) 悉尼/墨尔本/布里斯班', offset: -600 },
  { value: 'UTC+11', label: '(UTC+11:00) 所罗门/努美阿', offset: -660 },
  { value: 'UTC+12', label: '(UTC+12:00) 奥克兰/惠灵顿/斐济', offset: -720 }
];

function formatTimezoneLabel(offset) {
  const totalMinutes = -offset;
  const sign = totalMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(totalMinutes);
  const h = Math.floor(absMinutes / 60);
  const m = absMinutes % 60;
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getSelectedLocalTime(timezoneOffset) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc - timezoneOffset * 60000);
}

function getCountdownMs(timezoneOffset, countdownType) {
  const localTime = getSelectedLocalTime(timezoneOffset);
  const year = localTime.getFullYear();
  const month = localTime.getMonth();
  const date = localTime.getDate();
  const hours = localTime.getHours();

  let targetEpoch;
  if (countdownType === 'daily') {
    targetEpoch = Date.UTC(year, month, date + 1, 0, 0, 0) + timezoneOffset * 60000;
  } else {
    targetEpoch = Date.UTC(year, month, date, hours + 1, 0, 0) + timezoneOffset * 60000;
  }
  return targetEpoch - Date.now();
}

function getDefaultTimezoneIndex() {
  const deviceOffset = new Date().getTimezoneOffset();
  let exactIdx = timezones.findIndex(tz => tz.offset === deviceOffset);
  if (exactIdx !== -1) return exactIdx;

  let closestIdx = 0;
  let minDiff = Math.abs(timezones[0].offset - deviceOffset);
  for (let i = 1; i < timezones.length; i++) {
    const diff = Math.abs(timezones[i].offset - deviceOffset);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx;
}

Page({
  data: {
    showPopup: true,
    
    carModelList: [
      { label: '捷途G700', value: 'g700' },
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
    
    carModelIndex: 1,
    currentCarModel: 'traveler',
    
    versionList: [],
    versionIndex: 0,
    
    currentVersion: '0407',
    
    carPassword: '--',
    settingPassword: '--',
    actualSettingPassword: '',
    nextUpdateTime: '--',
    updateTime: '--',
    
    isCountdownMode: false,
    countdownSeconds: 0,
    countdownDisplay: '',
    
    carInstructions: '应用中心——蓝牙电话，输入对应口令',
    settingInstructions: '系统设置——输入对应口令',
    
    serialNumber: '',

    g700VerifyPassword: '',
    g700ShowAdb: false,

    timezoneList: timezones,
    timezoneIndex: 23,
    timezoneOffset: -480,

    updateTimer: null,
    countdownTimer: null
  },

  onLoad() {
    const storedOffset = wx.getStorageSync('selectedTimezoneOffset');
    let tzIndex;
    if (storedOffset !== '' && storedOffset !== undefined && storedOffset !== null) {
      const idx = timezones.findIndex(tz => tz.offset === storedOffset);
      tzIndex = idx !== -1 ? idx : getDefaultTimezoneIndex();
    } else {
      tzIndex = getDefaultTimezoneIndex();
    }
    const tzOffset = timezones[tzIndex].offset;
    this.setData({
      timezoneIndex: tzIndex,
      timezoneOffset: tzOffset
    }, () => {
      this.updateVersionList();
      this.updatePasswords();
    });

    this.data.updateTimer = setInterval(() => {
      this.updatePasswords();
    }, 60000);
  },

  onUnload() {
    if (this.data.updateTimer) {
      clearInterval(this.data.updateTimer);
    }
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  closePopup() {
    this.setData({
      showPopup: false
    });
  },

  openManual() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none',
      duration: 2000
    });
  },

  openTool() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none',
      duration: 2000
    });
  },

  onCarModelChange(e) {
    const index = parseInt(e.detail.value);
    const carModel = this.data.carModelList[index].value;
    const carModelConfig = carModels[carModel];
    
    const defaultVersion = carModelConfig.versions[0];
    
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    this.setData({
      carModelIndex: index,
      currentCarModel: carModel,
      currentVersion: defaultVersion,
      versionIndex: 0,
      serialNumber: '',
      g700VerifyPassword: '',
      g700ShowAdb: false,
      isCountdownMode: false,
      countdownSeconds: 0,
      countdownDisplay: ''
    }, () => {
      this.updateVersionList();
      this.updatePasswords();
    });
  },

  onVersionChange(e) {
    const index = parseInt(e.detail.value);
    const version = this.data.versionList[index].version;
    
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    this.setData({
      versionIndex: index,
      currentVersion: version,
      serialNumber: '',
      g700VerifyPassword: '',
      g700ShowAdb: false,
      isCountdownMode: false,
      countdownSeconds: 0,
      countdownDisplay: ''
    }, () => {
      this.updatePasswords();
    });
  },

  onTimezoneChange(e) {
    const index = parseInt(e.detail.value);
    const offset = timezones[index].offset;
    wx.setStorageSync('selectedTimezoneOffset', offset);

    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }

    this.setData({
      timezoneIndex: index,
      timezoneOffset: offset,
      isCountdownMode: false,
      countdownSeconds: 0,
      countdownDisplay: ''
    }, () => {
      this.updatePasswords();
    });
  },

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

  inputSerialNumber(e) {
    this.setData({
      serialNumber: e.detail.value
    });
  },

  inputG700VerifyPassword(e) {
    this.setData({
      g700VerifyPassword: e.detail.value,
      g700VerifyError: false
    });
  },

  verifyG700Password() {
    const { g700VerifyPassword, currentVersion, timezoneOffset } = this.data;

    wx.request({
      url: 'https://api.qianxian.tech/api/verify',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': 'jetour_password_2026'
      },
      data: {
        carModel: 'g700',
        password: g700VerifyPassword,
        version: currentVersion,
        timezoneOffset: timezoneOffset
      },
      success: (res) => {
        if (res.data.verified) {
          this.setData({
            g700ShowAdb: true,
            carPassword: res.data.data.carPassword || '--',
            settingPassword: res.data.data.adbPassword || '--',
            g700VerifyError: false
          });
        } else {
          this.setData({
            g700VerifyError: true,
            g700VerifyPassword: ''
          });
        }
      },
      fail: () => {
        this.setData({
          g700VerifyError: true,
          g700VerifyPassword: ''
        });
      }
    });
  },

  calculatePassword() {
    const { currentCarModel, currentVersion, serialNumber } = this.data;
    
    if (!serialNumber || serialNumber.length !== 6) {
      wx.showToast({
        title: '请输入6位序列号',
        icon: 'none'
      });
      return;
    }
    
    this.updatePasswords();
  },

  formatCountdown(seconds) {
    if (seconds <= 0) {
      return '00:00:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  startCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    this.data.countdownTimer = setInterval(() => {
      this.setData({
        countdownSeconds: this.data.countdownSeconds - 1,
        countdownDisplay: this.formatCountdown(this.data.countdownSeconds - 1)
      });
      
      if (this.data.countdownSeconds <= 1) {
        if (this.data.countdownTimer) {
          clearInterval(this.data.countdownTimer);
        }
        this.updatePasswords();
      }
    }, 1000);
  },

  getCountdownType(carModel, version) {
    const carModelConfig = carModels[carModel];
    if (carModelConfig && carModelConfig.countdownType[version]) {
      return carModelConfig.countdownType[version];
    }
    return 'hourly';
  },

  updateCountdown() {
    const countdownType = this.getCountdownType(this.data.currentCarModel, this.data.currentVersion);
    const tzOffset = this.data.timezoneOffset;

    let countdownSeconds = 0;

    if (countdownType === 'none') {
      this.setData({
        isCountdownMode: false,
        nextUpdateTime: '无（固定口令）'
      });
      return;
    }

    countdownSeconds = Math.floor(getCountdownMs(tzOffset, countdownType) / 1000);

    this.setData({
      isCountdownMode: true,
      countdownSeconds: countdownSeconds,
      countdownDisplay: this.formatCountdown(countdownSeconds),
      nextUpdateTime: '倒计时'
    });

    this.startCountdown();
  },

  async updatePasswords() {
    const { currentCarModel, currentVersion, serialNumber, timezoneOffset } = this.data;
    const localTime = getSelectedLocalTime(timezoneOffset);
    const tzLabel = formatTimezoneLabel(timezoneOffset);

    const API_BASE_URL = 'https://api.qianxian.tech';
    const API_KEY = 'jetour_password_2026';

    wx.request({
      url: `${API_BASE_URL}/api/password`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      data: {
        carModel: currentCarModel,
        version: currentVersion,
        serialNumber: serialNumber,
        timezoneOffset: timezoneOffset
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const result = res.data.data;
          const month = formatTimeUnit(localTime.getMonth() + 1);
          const date = formatTimeUnit(localTime.getDate());
          const hours = formatTimeUnit(localTime.getHours());
          const minutes = formatTimeUnit(localTime.getMinutes());
          
          let carInstructions = '应用中心——蓝牙电话，输入对应口令';
          let settingInstructions = '系统设置——输入对应口令';
          
          if (currentCarModel === 'traveler') {
            if (currentVersion === '00x') {
              carInstructions = '系统界面连续点击 8 次';
              settingInstructions = '设置项输入计算后的口令';
            } else if (currentVersion === '0406') {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '系统设置——输入对应口令';
            } else if (currentVersion === 'other') {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '';
            } else if (currentVersion === 'cdm') {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '';
            }
          } else if (currentCarModel === 'ziyouzhe') {
            if (currentVersion === '00x') {
              carInstructions = '系统界面连续点击 8 次';
              settingInstructions = '设置项输入计算后的口令';
            } else {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '系统设置——输入对应口令';
            }
          } else if (currentCarModel === 'x70plus' || currentCarModel === 'x90plus') {
            carInstructions = '系统界面点击系统升级——快速点击8次系统版本';
            settingInstructions = '';
          } else if (currentCarModel === 'dasheng') {
            if (currentVersion === '00x') {
              carInstructions = '系统界面连续点击 8 次';
              settingInstructions = '设置项输入计算后的口令';
            } else {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '';
            }
          } else {
            if (currentVersion === '00x') {
              carInstructions = '系统界面连续点击 8 次';
              settingInstructions = '设置项输入计算后的口令';
            } else {
              carInstructions = '应用中心——蓝牙电话，输入对应口令';
              settingInstructions = '';
            }
          }
          
          const countdownType = this.getCountdownType(currentCarModel, currentVersion);
          let isCountdownMode = false;
          let countdownSeconds = 0;
          let countdownDisplay = '';
          let nextUpdateTime = '';

          if (countdownType === 'none') {
            nextUpdateTime = '无（固定口令）';
          } else {
            isCountdownMode = true;
            nextUpdateTime = '倒计时';
            countdownSeconds = Math.floor(getCountdownMs(timezoneOffset, countdownType) / 1000);
            countdownDisplay = this.formatCountdown(countdownSeconds);
          }

          let carPassword = result.carPassword || '--';
          let settingPassword = result.adbPassword || '--';
          if (currentCarModel === 'g700' && !this.data.g700ShowAdb) {
            carPassword = '请验证密码';
            settingPassword = '请验证密码';
          }

          this.setData({
            carPassword: carPassword,
            actualSettingPassword: result.adbPassword || '',
            settingPassword: settingPassword,
            nextUpdateTime: nextUpdateTime,
            updateTime: `${localTime.getFullYear()}-${month}-${date} ${hours}:${minutes} ${tzLabel}`,
            carInstructions: carInstructions,
            settingInstructions: settingInstructions,
            isCountdownMode: isCountdownMode,
            countdownSeconds: countdownSeconds,
            countdownDisplay: countdownDisplay
          }, () => {
            if (isCountdownMode) {
              this.startCountdown();
            } else if (this.data.countdownTimer) {
              clearInterval(this.data.countdownTimer);
            }
          });
        }
      },
      fail: () => {
        console.error('API request failed');
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '车机工具',
      desc: '便捷的车机技术信息查询工具',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '车机工具 - 便捷的车机技术信息查询',
      query: {}
    };
  }
});