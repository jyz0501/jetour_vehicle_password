#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
捷途车机动态口令计算 API —— Python 版（自有服务器部署）

完整移植自 Cloudflare Workers 版 server/index.js，算法与接口保持 100% 一致，
仅使用 Python 标准库实现，服务器无需 Node.js。

接口：
  GET  /healthz                   健康检查（不校验 API_KEY）
  GET  /api/config                配置下发（车型/算法/时区元数据）
  POST /api/verify                G700 口令验证
  GET|POST /api/password          口令计算

环境变量：
  PORT    监听端口（默认 8080）
  HOST    监听地址（默认 0.0.0.0）
  API_KEY 接口密钥（默认与 JS 版 fallback 一致）

运行：
  python app.py
"""
import json
import os
import sys
import threading
import time
import traceback
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, parse_qs

# 兼容低版本 Python：ThreadingHTTPServer 3.7+ 才有
try:
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
except ImportError:
    from http.server import BaseHTTPRequestHandler, HTTPServer as ThreadingHTTPServer

# =====================================================================
# 输出编码兼容（Windows 服务环境 stdout/stderr 可能是 GBK）
# 避免 print 中文时 UnicodeEncodeError 导致进程崩溃
# =====================================================================
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass

# =====================================================================
# 配置
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")
BOOTSTRAP_LOG = os.path.join(LOG_DIR, "bootstrap.log")

PORT = int(os.environ.get("PORT", "8080"))
HOST = os.environ.get("HOST", "0.0.0.0")
API_KEY = os.environ.get("API_KEY", "") or "6c3dc45c96644bf08d0918e0966af662930aa2507ad8419692af2e8f39221c1f"
APP_VERSION = "v2.1.5"


def _log_bootstrap(msg):
    """将启动/异常信息写入 logs/bootstrap.log，服务环境无终端时也能排查。"""
    try:
        if not os.path.isdir(LOG_DIR):
            os.makedirs(LOG_DIR)
        with open(BOOTSTRAP_LOG, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass


# 模块导入即记录：用于区分「NSSM 未拉起 Python 进程」vs「Python 已启动但 main 未执行」
_log_bootstrap(f"=== module imported === exe={sys.executable} cwd={os.getcwd()}")

# 简单内存级频率限制（防爆破 /api/verify 与防刷 /api/password）
RATE_LIMIT_WINDOW_MS = 60 * 1000
RATE_LIMIT_MAX = 30
_rate_lock = threading.Lock()
_rate_counters = {}  # ip -> {"count": int, "reset_at": float(ms)}


def check_rate_limit(ip):
    now = time.time() * 1000
    with _rate_lock:
        entry = _rate_counters.get(ip)
        if not entry or now > entry["reset_at"]:
            _rate_counters[ip] = {"count": 1, "reset_at": now + RATE_LIMIT_WINDOW_MS}
            return True
        entry["count"] += 1
        return entry["count"] <= RATE_LIMIT_MAX


# =====================================================================
# 算法常量与固定口令
# =====================================================================
MUL_A = 250110
MUL_B = 250930
MUL_C = 250830
MUL_D = 240910
MUL_E = 231030
MUL_F = 230830
MUL_G = 250530
MUL_SN = 802018

FIXED_PASSWORDS = {
    "traveler": {"0406": "*#20230730#*"},
    "dasheng": {"fixed": "*#20220730#*"},
    "x70plus": {"unknown": "*#20201030#*"},
    "x90plus": {"040x": "*#20230730#*", "unknown": "*#20201030#*"},
    "x95": {"unknown": "*#20201030#*"},
    "shanhal7": {"unknown": "*#20201030#*"},
    "shanhal9": {"unknown": "*#20201030#*"},
}

DAILY_SN_BASE = {
    0: 213518, 1: 658035, 2: 235657, 3: 567534, 4: 647825,
    5: 234700, 6: 127347, 7: 875634, 8: 345678, 9: 982345,
}


def get_fixed_password(car_model, version):
    if car_model in FIXED_PASSWORDS and version in FIXED_PASSWORDS[car_model]:
        return FIXED_PASSWORDS[car_model][version]
    return "*#20230730#*"


def calc_daily_sn_pwd(year, month, date):
    yymmdd = int(f"{year % 100:02d}{month:02d}{date:02d}")
    base_value = DAILY_SN_BASE.get(yymmdd % 10, 213518)
    return f"{(yymmdd + base_value) % 1000000:06d}"


# =====================================================================
# 算法（与 index.js 的 algorithms 一一对应）
# =====================================================================
def algo_12(params):  # 固定口令
    return {"carPassword": get_fixed_password(params["carModel"], params["version"]),
            "adbPassword": "无"}


def algo_10(params):  # 大圣固定
    return {"carPassword": "*#20220730#*", "adbPassword": "无"}


def algo_08(params):  # 序列号算法
    sn = params.get("serialNumber") or ""
    if len(sn) >= 6:
        sn_last_six = int(sn[-6:])
        adb_full = MUL_SN * sn_last_six
        return {"carPassword": "*#20230730#*", "adbPassword": f"{adb_full % 1000000:06d}"}
    return {"carPassword": "*#20230730#*", "adbPassword": "请输入序列号"}


def algo_09(params):  # 序列号动态（每日）
    return {"carPassword": "*#20230730#*",
            "adbPassword": calc_daily_sn_pwd(params["year"], params["month"], params["date"])}


def algo_01(params):  # traveler 4.07+
    dt, hours = params["dateTimeNum"], params["hours"]
    return {"carPassword": f"*#{(MUL_A * dt - hours) % 1000000:06d}#*",
            "adbPassword": f"{(MUL_A * dt) % 1000000:06d}"}


def algo_02(params):  # cdm
    dt, hours = params["dateTimeNum"], params["hours"]
    return {"carPassword": f"*#{(MUL_B * dt - hours) % 1000000:06d}#*",
            "adbPassword": f"{(MUL_B * dt) % 1000000:06d}"}


def algo_03(params):  # G700 4.0x-4.4x
    dt, hours = params["dateTimeNum"], params["hours"]
    adb_full = MUL_C * dt
    return {"carPassword": f"*#{(adb_full - hours) % 1000000:06d}#*",
            "adbPassword": f"{adb_full % 1000000:06d}"}


def algo_04(params):  # 自由者动态
    mmddhh, hours = params["mmddhh"], params["hours"]
    adb_full = MUL_D * mmddhh
    return {"carPassword": f"*#{(adb_full - hours) % 1000000:06d}#*",
            "adbPassword": f"{adb_full % 1000000:06d}"}


def algo_11(params):  # 自由者固定
    return {"carPassword": "*#20241130#*", "adbPassword": "无"}


def algo_05(params):  # 动态算法 E
    dt, hours = params["dateTimeNum"], params["hours"]
    adb_full = MUL_E * dt
    return {"carPassword": f"*#{(adb_full - hours) % 1000000:06d}#*",
            "adbPassword": f"{adb_full % 1000000:06d}"}


def algo_06(params):  # traveler 0406
    dt = params["dateTimeNum"]
    return {"carPassword": "*#20230730#*", "adbPassword": f"{(MUL_F * dt) % 1000000:06d}"}


def algo_07(params):  # G700 330335
    dt, hours = params["dateTimeNum"], params["hours"]
    return {"carPassword": "*#20240730#*", "adbPassword": f"{(MUL_G * dt - hours) % 1000000:06d}"}


def algo_13(params):  # 其他车型（山海L7/T9等）
    car_model = params["carModel"]
    year, month, date = params["year"], params["month"], params["date"]
    dt, hours = params["dateTimeNum"], params["hours"]
    mmddhh = params["mmddhh"]
    if car_model == "ziyouzhe" and params.get("version") == "11010x":
        adb_pwd = (MUL_D * mmddhh) % 1000000
        car_pwd = (MUL_D * mmddhh - hours) % 1000000
        return {"passwords": [f"*#{car_pwd:06d}#*", f"{adb_pwd:06d}", "--"]}
    p3 = (MUL_E * dt - hours) % 1000000
    if car_model == "shanhal7":
        return {"passwords": ["*#20201030#*", calc_daily_sn_pwd(year, month, date),
                              f"*#{p3:06d}#*"]}
    return {"passwords": ["*#20201030#*", "*#20230730#*", f"*#{p3:06d}#*"]}


ALGORITHMS = {
    "algo_12": algo_12, "algo_10": algo_10, "algo_08": algo_08,
    "algo_09": algo_09, "algo_01": algo_01, "algo_02": algo_02,
    "algo_03": algo_03, "algo_04": algo_04, "algo_11": algo_11,
    "algo_05": algo_05, "algo_06": algo_06, "algo_07": algo_07,
    "algo_13": algo_13,
}

# 车型 -> 版本 -> 算法（与 index.js carModels 一致）
CAR_MODELS = {
    "traveler": {"versions": ["00x", "0406", "0407", "other", "cdm"],
                 "algorithms": {"00x": "algo_08", "0406": "algo_06",
                                "0407": "algo_01", "other": "algo_09", "cdm": "algo_02"}},
    "ziyouzhe": {"versions": ["11010x", "01010x", "000402"],
                 "algorithms": {"11010x": "algo_04", "01010x": "algo_04", "000402": "algo_11"}},
    "shanhal7": {"versions": ["os10201", "os1201000"],
                 "algorithms": {"os10201": "algo_13", "os1201000": "algo_13"}},
    "shanhal9": {"versions": ["unknown"], "algorithms": {"unknown": "algo_12"}},
    "fengyunA9": {"versions": ["unknown"], "algorithms": {"unknown": "algo_09"}},
    "hu8": {"versions": ["unknown"], "algorithms": {"unknown": "algo_09"}},
    "x70plus": {"versions": ["unknown"], "algorithms": {"unknown": "algo_12"}},
    "x90plus": {"versions": ["040x", "unknown"], "algorithms": {"040x": "algo_12", "unknown": "algo_12"}},
    "x95": {"versions": ["unknown"], "algorithms": {"unknown": "algo_12"}},
    "dasheng": {"versions": ["fixed"], "algorithms": {"fixed": "algo_10"}},
    "g700": {"versions": ["330335", "4.0x-4.4x"],
             "algorithms": {"330335": "algo_07", "4.0x-4.4x": "algo_03"}},
}

# =====================================================================
# 配置下发元数据（与 index.js 一致）
# =====================================================================
CONFIG_CAR_MODELS = {
    "g700": {"name": "捷途G700", "versions": ["330335", "4.0x-4.4x"],
             "versionNames": {"330335": "3.30-3.35", "4.0x-4.4x": "4.0x-4.4x"},
             "algorithms": {"330335": "g700Dynamic", "4.0x-4.4x": "g700Dynamic"},
             "encrypted": {"330335": False, "4.0x-4.4x": False}},
    "traveler": {"name": "旅行者/山海T2", "versions": ["00x", "0406", "0407", "other", "cdm"],
                 "versionNames": {"00x": "00.08及以下", "0406": "4.06及以下", "0407": "4.07以上",
                                  "other": "其他", "cdm": "26款"},
                 "algorithms": {"00x": "serialNumber", "0406": "traveler0406Dynamic",
                                "0407": "travelerDynamic", "other": "serialNumberDaily",
                                "cdm": "cdmDynamic"},
                 "encrypted": {"00x": False, "0406": False, "0407": False,
                               "other": False, "cdm": False}},
    "ziyouzhe": {"name": "自由者/山海T1", "versions": ["11010x", "01010x", "000402"],
                 "versionNames": {"11010x": "11.01.04及以上", "01010x": "01.01.0x",
                                  "000402": "00.04.02"},
                 "algorithms": {"11010x": "ziyouzheDynamic", "01010x": "ziyouzheDynamic",
                                "000402": "ziyouzheFixed"},
                 "encrypted": {"11010x": False, "01010x": False, "000402": False}},
    "shanhal7": {"name": "山海L7/Plus/T9", "versions": ["os10201", "os1201000"],
                 "versionNames": {"os10201": "OS1-02.01", "os1201000": "OS1_20.10.00"},
                 "algorithms": {"os10201": "otherCars", "os1201000": "otherCars"},
                 "encrypted": {"os10201": False, "os1201000": False}},
    "shanhal9": {"name": "山海L9", "versions": ["unknown"],
                 "versionNames": {"unknown": "其他版本"},
                 "algorithms": {"unknown": "fixed"}, "encrypted": {"unknown": False}},
    "fengyunA9": {"name": "风云A9/T9", "versions": ["unknown"],
                  "versionNames": {"unknown": "其他版本"},
                  "algorithms": {"unknown": "serialNumberDaily"},
                  "encrypted": {"unknown": False}},
    "hu8": {"name": "虎8/8L", "versions": ["unknown"],
            "versionNames": {"unknown": "其他版本"},
            "algorithms": {"unknown": "serialNumberDaily"},
            "encrypted": {"unknown": False}},
    "x70plus": {"name": "X70Plus/L/Pro/CDM", "versions": ["unknown"],
                "versionNames": {"unknown": "00.01.0x"},
                "algorithms": {"unknown": "fixed"}, "encrypted": {"unknown": False}},
    "x90plus": {"name": "X90/Plus/Pro/CDM", "versions": ["040x", "unknown"],
                "versionNames": {"040x": "04.0x", "unknown": "其他版本"},
                "algorithms": {"040x": "fixed", "unknown": "fixed"},
                "encrypted": {"040x": False, "unknown": False}},
    "x95": {"name": "X95", "versions": ["unknown"],
            "versionNames": {"unknown": "其他版本"},
            "algorithms": {"unknown": "fixed"}, "encrypted": {"unknown": False}},
    "dasheng": {"name": "捷途大圣", "versions": ["fixed"],
                "versionNames": {"fixed": "固定口令"},
                "algorithms": {"fixed": "dashengFixed"}, "encrypted": {"fixed": False}},
}

CONFIG_ALGORITHMS = {
    "fixed": {"name": "固定口令", "countdown": "none", "showSerialNumberInput": False},
    "dashengFixed": {"name": "捷途大圣固定口令", "countdown": "none", "showSerialNumberInput": False},
    "serialNumber": {"name": "序列号算法", "countdown": "none", "showSerialNumberInput": True},
    "serialNumberDaily": {"name": "序列号动态算法（每日更新）", "countdown": "daily",
                          "showSerialNumberInput": False},
    "travelerDynamic": {"name": "动态算法", "countdown": "hourly", "showSerialNumberInput": False},
    "cdmDynamic": {"name": "动态算法（CDM系统）", "countdown": "hourly", "showSerialNumberInput": False},
    "ziyouzheDynamic": {"name": "动态算法", "countdown": "hourly", "showSerialNumberInput": False},
    "ziyouzheFixed": {"name": "自由者固定口令", "countdown": "none", "showSerialNumberInput": False},
    "dynamicA": {"name": "动态算法", "countdown": "hourly", "showSerialNumberInput": False},
    "traveler0406Dynamic": {"name": "动态算法（0406版本）", "countdown": "hourly",
                            "showSerialNumberInput": False},
    "g700Dynamic": {"name": "动态算法（G700车型）", "countdown": "hourly",
                    "showSerialNumberInput": False},
    "otherCars": {"name": "其他车型算法", "countdown": "hourly", "showSerialNumberInput": False},
}

CONFIG_TIMEZONES = [
    {"value": "UTC-11", "label": "(UTC-11:00) 美属萨摩亚", "offset": 660},
    {"value": "UTC-10", "label": "(UTC-10:00) 夏威夷", "offset": 600},
    {"value": "UTC-09", "label": "(UTC-09:00) 阿拉斯加", "offset": 540},
    {"value": "UTC-08", "label": "(UTC-08:00) 洛杉矶/蒂华纳", "offset": 480},
    {"value": "UTC-07", "label": "(UTC-07:00) 丹佛/凤凰城", "offset": 420},
    {"value": "UTC-06", "label": "(UTC-06:00) 芝加哥/墨西哥城", "offset": 360},
    {"value": "UTC-05", "label": "(UTC-05:00) 纽约/利马", "offset": 300},
    {"value": "UTC-04", "label": "(UTC-04:00) 哈利法克斯/加拉加斯", "offset": 240},
    {"value": "UTC-03", "label": "(UTC-03:00) 圣保罗/布宜诺斯艾利斯", "offset": 180},
    {"value": "UTC-02", "label": "(UTC-02:00) 中大西洋", "offset": 120},
    {"value": "UTC-01", "label": "(UTC-01:00) 亚速尔/佛得角", "offset": 60},
    {"value": "UTC+00", "label": "(UTC+00:00) 伦敦/里斯本/都柏林", "offset": 0},
    {"value": "UTC+01", "label": "(UTC+01:00) 巴黎/柏林/罗马", "offset": -60},
    {"value": "UTC+02", "label": "(UTC+02:00) 开罗/雅典/开普敦", "offset": -120},
    {"value": "UTC+03", "label": "(UTC+03:00) 莫斯科/伊斯坦布尔/内罗毕", "offset": -180},
    {"value": "UTC+03:30", "label": "(UTC+03:30) 德黑兰", "offset": -210},
    {"value": "UTC+04", "label": "(UTC+04:00) 迪拜/巴库", "offset": -240},
    {"value": "UTC+05", "label": "(UTC+05:00) 伊斯兰堡/塔什干", "offset": -300},
    {"value": "UTC+05:30", "label": "(UTC+05:30) 新德里/孟买/科伦坡", "offset": -330},
    {"value": "UTC+05:45", "label": "(UTC+05:45) 加德满都", "offset": -345},
    {"value": "UTC+06", "label": "(UTC+06:00) 达卡/阿斯塔纳", "offset": -360},
    {"value": "UTC+06:30", "label": "(UTC+06:30) 仰光", "offset": -390},
    {"value": "UTC+07", "label": "(UTC+07:00) 曼谷/雅加达/河内", "offset": -420},
    {"value": "UTC+08", "label": "(UTC+08:00) 北京/上海/香港/台北", "offset": -480},
    {"value": "UTC+09", "label": "(UTC+09:00) 东京/首尔", "offset": -540},
    {"value": "UTC+09:30", "label": "(UTC+09:30) 阿德莱德/达尔文", "offset": -570},
    {"value": "UTC+10", "label": "(UTC+10:00) 悉尼/墨尔本/布里斯班", "offset": -600},
    {"value": "UTC+11", "label": "(UTC+11:00) 所罗门/努美阿", "offset": -660},
    {"value": "UTC+12", "label": "(UTC+12:00) 奥克兰/惠灵顿/斐济", "offset": -720},
]

# =====================================================================
# 时间与口令计算（与 index.js calculatePasswords 语义一致）
# =====================================================================
def get_local_datetime(tz_offset):
    """返回按指定时区偏移解释的本地时间。
    JS 语义: localTime = new Date(utc - timezoneOffset * 60000)，即
    timezoneOffset 采用 getTimezoneOffset 风格（UTC-本地，单位分钟）。
    """
    utc_ms = time.time() * 1000
    if tz_offset is not None:
        local_ms = utc_ms - tz_offset * 60000
    else:
        local_ms = utc_ms + 8 * 3600000  # 默认 UTC+8
    return datetime.fromtimestamp(local_ms / 1000, tz=timezone.utc)


def format_timezone_label(offset):
    total_minutes = -offset
    sign = "+" if total_minutes >= 0 else "-"
    abs_minutes = abs(total_minutes)
    h, m = divmod(abs_minutes, 60)
    return f"UTC{sign}{h:02d}:{m:02d}"


def get_car_model_algorithm(car_model, version):
    if car_model in CAR_MODELS and version in CAR_MODELS[car_model]["algorithms"]:
        return ALGORITHMS[CAR_MODELS[car_model]["algorithms"][version]]
    return ALGORITHMS["algo_13"]


def calculate_passwords(car_model, version, tz_offset, serial_number=""):
    algo = get_car_model_algorithm(car_model, version)
    local = get_local_datetime(tz_offset)
    month_s = f"{local.month:02d}"
    date_s = f"{local.day:02d}"
    hour_s = f"{local.hour:02d}"
    date_time_num = int(f"{month_s}{date_s}{hour_s}")
    params = {
        "carModel": car_model,
        "version": version,
        "serialNumber": serial_number or "",
        "year": local.year,
        "month": local.month,
        "date": local.day,
        "hours": local.hour,
        "dateTimeNum": date_time_num,
        "mmddhh": date_time_num,
    }
    return algo(params), local


def update_time_str(local, tz_offset):
    tz_label = format_timezone_label(tz_offset) if tz_offset is not None else "UTC+08:00"
    return f"{local.year}-{local.month:02d}-{local.day:02d} {local.hour:02d}:{local.minute:02d} {tz_label}"


# =====================================================================
# HTTP 服务
# =====================================================================
class Handler(BaseHTTPRequestHandler):
    server_version = "JetourPasswordAPI/1.0"

    # ---------- 工具 ----------
    def _send_json(self, obj, status=200, extra_headers=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self):
        ip = self.headers.get("CF-Connecting-IP")
        if ip:
            return ip
        fwd = self.headers.get("X-Forwarded-For")
        if fwd:
            return fwd.split(",")[0].strip()
        real = self.headers.get("X-Real-IP")
        if real:
            return real
        return self.client_address[0]

    def _read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return None

    # ---------- 路由 ----------
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._handle("GET")

    def do_POST(self):
        self._handle("POST")

    def _handle(self, method):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # 健康检查（不校验 API_KEY）
        if path == "/healthz":
            self._send_json({"status": "ok", "time": datetime.now(timezone.utc).isoformat()})
            return

        # API Key 校验
        if self.headers.get("X-API-Key") != API_KEY:
            self._send_json({"error": "Unauthorized"}, status=401,
                            extra_headers={"Cache-Control": "no-store"})
            return

        # 限流
        if not check_rate_limit(self._client_ip()):
            self._send_json({"error": "Too many requests, please try later"}, status=429,
                            extra_headers={"Retry-After": "60"})
            return

        if path == "/api/config":
            self._send_json({"success": True, "data": {
                "version": APP_VERSION,
                "carModels": CONFIG_CAR_MODELS,
                "algorithms": CONFIG_ALGORITHMS,
                "timezones": CONFIG_TIMEZONES,
            }})
            return

        if path == "/api/verify" and method == "POST":
            self._handle_verify()
            return

        if path == "/api/password":
            self._handle_password(method, query)
            return

        self._send_json({"error": "Not found"}, status=404)

    def _handle_verify(self):
        body = self._read_body()
        if body is None:
            self._send_json({"error": "Invalid request body"}, status=400)
            return
        car_model = body.get("carModel")
        password = body.get("password")
        tz_offset = body.get("timezoneOffset")
        version = body.get("version")

        if car_model != "g700":
            self._send_json({"success": False, "verified": False, "error": "Invalid car model"})
            return

        try:
            if tz_offset is not None:
                tz_offset = int(tz_offset)
        except (TypeError, ValueError):
            tz_offset = None

        local = get_local_datetime(tz_offset)
        date_time_num = int(f"{local.month:02d}{local.day:02d}{local.hour:02d}")
        verify_password = f"{(MUL_B * date_time_num - local.hour) % 1000000:06d}"

        if str(password) == verify_password:
            verify_version = version or "330335"
            result, _ = calculate_passwords("g700", verify_version, tz_offset)
            self._send_json({"success": True, "verified": True, "data": result})
        else:
            self._send_json({"success": True, "verified": False})

    def _handle_password(self, method, query):
        if method == "POST":
            body = self._read_body()
            if body is None:
                self._send_json({"error": "Invalid request body"}, status=400)
                return
            car_model = body.get("carModel")
            version = body.get("version")
            serial_number = body.get("serialNumber") or ""
            tz_offset = body.get("timezoneOffset")
        else:
            car_model = (query.get("carModel") or [None])[0]
            version = (query.get("version") or [None])[0]
            serial_number = (query.get("serialNumber") or [""])[0]
            raw_tz = (query.get("timezoneOffset") or [None])[0]
            tz_offset = None
            if raw_tz is not None:
                try:
                    tz_offset = int(raw_tz)
                except (TypeError, ValueError):
                    tz_offset = None

        if not car_model or not version:
            self._send_json({"error": "Missing parameters"}, status=400)
            return

        if tz_offset is not None:
            try:
                tz_offset = int(tz_offset)
            except (TypeError, ValueError):
                tz_offset = None

        try:
            result, local = calculate_passwords(car_model, version, tz_offset, serial_number)
        except Exception:
            self._send_json({"error": "Internal server error"}, status=500)
            return

        # G700 所有密码都需验证后获取
        if car_model == "g700":
            self._send_json({
                "success": True,
                "data": {"carPassword": None, "adbPassword": None, "needVerify": True},
                "updateTime": update_time_str(local, tz_offset),
                "timestamp": int(time.time() * 1000),
            })
            return

        self._send_json({
            "success": True,
            "data": result,
            "updateTime": update_time_str(local, tz_offset),
            "timestamp": int(time.time() * 1000),
        })

    def log_message(self, fmt, *args):
        # 精简日志：仅记录状态码与路径
        if args and len(args) >= 2:
            print(f"[req] {self.client_address[0]} {args[0]} {args[1]}")
        else:
            print(f"[req] {self.client_address[0]} {fmt % args}")


def main():
    try:
        _log_bootstrap(f"=== 启动 ===")
        _log_bootstrap(f"Python: {sys.version.split()[0]}, exe: {sys.executable}")
        _log_bootstrap(f"app.py: {os.path.abspath(__file__)}")
        _log_bootstrap(f"cwd: {os.getcwd()}")
        _log_bootstrap(f"PORT={PORT} HOST={HOST} API_KEY={'SET' if os.environ.get('API_KEY') else 'DEFAULT'}")
        print(f"[server] Python: {sys.version.split()[0]}")
        print(f"[server] app.py: {os.path.abspath(__file__)}")
        print(f"[server] 正在监听 http://{HOST}:{PORT} ...")
        server = ThreadingHTTPServer((HOST, PORT), Handler)
        _log_bootstrap(f"监听成功: http://{HOST}:{PORT}")
        print(f"[server] 监听成功: http://{HOST}:{PORT}")
        print(f"[server] 健康检查: http://{HOST}:{PORT}/healthz")
        print(f"[server] API_KEY 使用: {'环境变量' if os.environ.get('API_KEY') else '内置默认值'}")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[server] 已停止")
        try:
            server.shutdown()
        except Exception:
            pass
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[server] 启动失败: {e}", file=sys.stderr)
        print(tb, file=sys.stderr)
        _log_bootstrap(f"启动失败: {e}\n{tb}")
        sys.exit(1)


if __name__ == "__main__":
    main()
