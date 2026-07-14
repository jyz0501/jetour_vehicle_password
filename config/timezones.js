// 时区列表（offset 遵循 getTimezoneOffset() 约定：东八区=-480，西五区=300）
export const timezones = [
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

// 当前生效的时区 offset，初值为客户端时区
export let currentTimezoneOffset = new Date().getTimezoneOffset();

const STORAGE_KEY = 'selectedTimezoneOffset';

export function setTimezone(offset) {
    currentTimezoneOffset = offset;
    try {
        localStorage.setItem(STORAGE_KEY, String(offset));
    } catch (e) {}
}

export function getDefaultTimezoneIndex() {
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

export function getStoredTimezoneIndex() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            const offset = parseInt(stored, 10);
            const idx = timezones.findIndex(tz => tz.offset === offset);
            if (idx !== -1) return idx;
        }
    } catch (e) {}
    return -1;
}

export function formatTimezoneLabel(offset) {
    const totalMinutes = -offset;
    const sign = totalMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(totalMinutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getSelectedLocalTime(timezoneOffset) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc - timezoneOffset * 60000);
}

export function getCountdownMs(timezoneOffset, countdownType) {
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
