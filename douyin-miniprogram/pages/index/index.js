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
    versions: ['330335'],
    versionNames: {
      '330335': '3.30-3.35'
    },
    countdownType: {
      '330335': 'hourly'
    }
  }
};

function formatTimeUnit(unit) {
  return String(unit).padStart(2, '0');
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

    versionList: [
      { label: '4.06及以下', version: '0406' },
      { label: '00.08及以下', version: '00x' },
      { label: '4.07以上', version: '0407' },
      { label: '其他', version: 'other' },
      { label: '26款', version: 'cdm' }
    ],
    
    versionIndex: 2,
    
    currentVersion: '0407',
    
    systemPassword: '--',
    encryptionPassword: '--',
    actualEncryptionPassword: '',
    nextUpdateTime: '--',
    updateTime: '--',
    
    systemInstructions: '应用中心——蓝牙电话，输入上方口令',
    encryptionInstructions: '进入加密项输入上方计算后的口令',
    
    serialNumber: '',

    g700VerifyPassword: '',
    g700ShowAdb: false,
    g700AdbPassword: '',
    g700VerifyError: false,
    
    isCountdownMode: false,
    countdownSeconds: 0,
    countdownDisplay: '',
    
    updateTimer: null,
    countdownTimer: null
  },

  onLoad() {
    this.updatePasswords();
    
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

  updatePasswords() {
    const now = new Date();
    const { currentCarModel, currentVersion, serialNumber } = this.data;

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
        serialNumber: serialNumber
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const result = res.data.data;
          const month = formatTimeUnit(now.getMonth() + 1);
          const date = formatTimeUnit(now.getDate());
          const hours = formatTimeUnit(now.getHours());
          const minutes = formatTimeUnit(now.getMinutes());
          
          let systemInstructions = '应用中心——蓝牙电话，输入上方口令';
          let encryptionInstructions = '进入加密项输入上方计算后的口令';

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
            
            if (countdownType === 'daily') {
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);
              countdownSeconds = Math.floor((tomorrow - now) / 1000);
            } else {
              const nextHour = new Date(now);
              nextHour.setHours(now.getHours() + 1, 0, 0, 0);
              countdownSeconds = Math.floor((nextHour - now) / 1000);
            }
            countdownDisplay = this.formatCountdown(countdownSeconds);
          }
          
          let encryptionPassword = result.adbPassword || '--';
            if (currentCarModel === 'g700' && !this.data.g700ShowAdb) {
              encryptionPassword = '请验证密码';
            }
            
            this.setData({
            systemPassword: result.carPassword || '--',
            g700AdbPassword: result.adbPassword || '',
            encryptionPassword: encryptionPassword,
            actualEncryptionPassword: result.adbPassword || '',
            nextUpdateTime: nextUpdateTime,
            updateTime: `${now.getFullYear()}-${month}-${date} ${hours}:${minutes}`,
            systemInstructions: systemInstructions,
            encryptionInstructions: encryptionInstructions,
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

  switchVersion(e) {
    const version = e.currentTarget.dataset.version;
    this.setData({
      currentVersion: version,
      serialNumber: ''
    });
    this.updatePasswords();
  },

  onCarModelChange(e) {
    const index = parseInt(e.detail.value);
    const carModel = this.data.carModelList[index].value;

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

  inputSerialNumber(e) {
    const serialNumber = e.detail.value;
    this.setData({
      serialNumber: serialNumber
    });
  },

  inputG700VerifyPassword(e) {
    const g700VerifyPassword = e.detail.value;
    this.setData({
      g700VerifyPassword: g700VerifyPassword,
      g700VerifyError: false
    });
  },

  verifyG700Password() {
    const { g700VerifyPassword, g700AdbPassword } = this.data;
    
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const chinaTime = new Date(utc + 8 * 3600000);
    const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
    const date = String(chinaTime.getDate()).padStart(2, '0');
    const hours = chinaTime.getHours();
    const dateTimeNum = parseInt(`${month}${date}${String(hours).padStart(2, '0')}`, 10);
    
    const carBase = 250930 * dateTimeNum;
    const carFull = carBase - hours;
    const verifyPassword = (carFull % 1000000).toString().padStart(6, '0');
    
    if (g700VerifyPassword === verifyPassword) {
      this.setData({
        g700ShowAdb: true,
        encryptionPassword: g700AdbPassword || '--',
        g700VerifyError: false
      });
    } else {
      this.setData({
        g700VerifyError: true,
        g700VerifyPassword: ''
      });
    }
  },

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

  closePopup() {
    this.setData({
      showPopup: false
    });
  },

  onShareAppMessage() {
    return {
      title: '车机口令工具',
      desc: '专业的车机工程模式口令计算工具',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '车机口令工具 - 专业的车机工程模式口令计算',
      query: {}
    };
  }
});