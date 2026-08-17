#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jetour Password API - Windows Service Manager (NSSM)

Usage (run as Administrator):
    py -3 install_service.py [install|uninstall|start|stop|restart|status]

Requirements:
    1) Python 3
    2) nssm.exe  -> put in .\\nssm\\nssm.exe next to this script, or in PATH
       (download from https://nssm.cc/download)

This Python script replaces install_service.bat entirely: it does NOT rely
on cmd/batch parsing, so encoding (UTF-8/GBK) and line-ending (CRLF/LF)
issues can never break it.
"""

import os
import shutil
import subprocess
import sys

SERVICE_NAME = "JetourPasswordApi"
SERVICE_DISPLAY = "Jetour Password API"
SERVICE_DESC = "Jetour vehicle dynamic password calculation API (Python)"
PORT = "8080"
# Leave empty to use the built-in fallback inside app.py
API_KEY = ""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_PY = os.path.join(BASE_DIR, "app.py")
LOG_DIR = os.path.join(BASE_DIR, "logs")


def log(msg):
    print("[INFO] " + str(msg), flush=True)


def err(msg):
    print("[ERROR] " + str(msg), flush=True)


def find_nssm():
    local = os.path.join(BASE_DIR, "nssm", "nssm.exe")
    if os.path.isfile(local):
        return local
    p = shutil.which("nssm")
    if p:
        return p
    return None


def find_python():
    # Prefer full python.exe over the 'py' launcher for service sessions
    for name in ("python", "py"):
        p = shutil.which(name)
        if p:
            return p
    return None


def run(cmd, check=False):
    log("$ " + " ".join('"%s"' % c if " " in c else c for c in cmd))
    r = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
    out = (r.stdout or "").strip()
    eout = (r.stderr or "").strip()
    if out:
        print(out)
    if eout:
        print(eout, file=sys.stderr)
    if check and r.returncode != 0:
        err("Command failed (exit %d): %s" % (r.returncode, " ".join(cmd)))
        sys.exit(1)
    return r


def tail_file(path, n=15):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        return "".join(lines[-n:])
    except Exception:
        return None


def service_running(nssm):
    r = run([nssm, "status", SERVICE_NAME])
    return r.returncode == 0 and "RUNNING" in (r.stdout or "")


def install(nssm, py_exe):
    if not os.path.isfile(APP_PY):
        err("app.py not found: %s" % APP_PY)
        err("Please deploy app.py next to this script.")
        sys.exit(1)

    log("Syntax check app.py ...")
    r = subprocess.run([py_exe, "-m", "py_compile", APP_PY],
                       capture_output=True, text=True, errors="replace")
    if r.returncode != 0:
        err("app.py syntax check FAILED:")
        print((r.stdout or "") + (r.stderr or ""))
        sys.exit(1)
    log("app.py syntax OK")

    log("Removing old service (if any) ...")
    run([nssm, "stop", SERVICE_NAME])
    run([nssm, "remove", SERVICE_NAME, "confirm"])

    log("Registering service ...")
    run([nssm, "install", SERVICE_NAME, py_exe, APP_PY], check=True)

    run([nssm, "set", SERVICE_NAME, "DisplayName", SERVICE_DISPLAY])
    run([nssm, "set", SERVICE_NAME, "Description", SERVICE_DESC])
    run([nssm, "set", SERVICE_NAME, "AppDirectory", BASE_DIR])
    run([nssm, "set", SERVICE_NAME, "Start", "SERVICE_AUTO_START"])

    try:
        os.makedirs(LOG_DIR, exist_ok=True)
    except Exception:
        pass
    run([nssm, "set", SERVICE_NAME, "AppStdout", os.path.join(LOG_DIR, "stdout.log")])
    run([nssm, "set", SERVICE_NAME, "AppStderr", os.path.join(LOG_DIR, "stderr.log")])
    run([nssm, "set", SERVICE_NAME, "AppRotateFiles", "1"])
    run([nssm, "set", SERVICE_NAME, "AppRotateBytes", "10485760"])
    run([nssm, "set", SERVICE_NAME, "AppExit", "Default", "Restart"])
    run([nssm, "set", SERVICE_NAME, "AppRestartDelay", "5000"])

    env = "PORT=%s" % PORT
    if API_KEY:
        env += " API_KEY=%s" % API_KEY
    run([nssm, "set", SERVICE_NAME, "AppEnvironmentExtra", env])

    log("Starting service ...")
    r = run([nssm, "start", SERVICE_NAME])
    if r.returncode != 0 or not service_running(nssm):
        err("Service failed to start. Last lines of stderr.log:")
        tail = tail_file(os.path.join(LOG_DIR, "stderr.log"))
        print(tail if tail else "(stderr.log not found yet)")
        if tail is None:
            boot = tail_file(os.path.join(LOG_DIR, "bootstrap.log"))
            if boot:
                err("Last lines of bootstrap.log:")
                print(boot)
        sys.exit(1)

    run([nssm, "status", SERVICE_NAME])
    log("Health check: http://localhost:%s/healthz" % PORT)
    log("Done! Service name: %s (see services.msc)" % SERVICE_NAME)


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "install"

    nssm = find_nssm()
    if not nssm:
        err("nssm.exe not found. Download from https://nssm.cc/download")
        err("and put it here: %s" % os.path.join(BASE_DIR, "nssm", "nssm.exe"))
        err("or add nssm.exe to PATH.")
        sys.exit(1)
    log("NSSM: %s" % nssm)

    if action == "install":
        py_exe = find_python()
        if not py_exe:
            err("Python not found. Please install Python 3 and add it to PATH.")
            sys.exit(1)
        log("Python: %s" % py_exe)
        install(nssm, py_exe)
    elif action == "uninstall":
        run([nssm, "stop", SERVICE_NAME])
        run([nssm, "remove", SERVICE_NAME, "confirm"])
        log("Service removed.")
    elif action == "start":
        run([nssm, "start", SERVICE_NAME])
        run([nssm, "status", SERVICE_NAME])
    elif action == "stop":
        run([nssm, "stop", SERVICE_NAME])
        run([nssm, "status", SERVICE_NAME])
    elif action == "restart":
        run([nssm, "restart", SERVICE_NAME])
        run([nssm, "status", SERVICE_NAME])
    elif action == "status":
        run([nssm, "status", SERVICE_NAME])
    else:
        err("Unknown action: %s" % action)
        err("Usage: py -3 install_service.py [install|uninstall|start|stop|restart|status]")
        sys.exit(1)


if __name__ == "__main__":
    main()
