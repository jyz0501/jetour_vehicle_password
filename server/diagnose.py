#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JetourPasswordApi - one-shot diagnostic script (pure stdlib, Windows/Linux ok)
Put it NEXT TO app.py, then run:  py -3 diagnose.py
"""
import importlib.util
import os
import socket
import sys
import traceback

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_PY = os.path.join(BASE_DIR, "app.py")

print("=" * 60)
print(" JetourPasswordApi Diagnostic")
print("=" * 60)
print("Python   :", sys.version)
print("Executable:", sys.executable)
print("cwd      :", os.getcwd())
print("BASE_DIR :", BASE_DIR)

print("\n--- app.py ---")
if os.path.isfile(APP_PY):
    size = os.path.getsize(APP_PY)
    with open(APP_PY, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    lines = content.splitlines()
    print("exists   : True")
    print("size     : %d bytes" % size)
    print("lines    : %d" % len(lines))
    print("has bootstrap log : %s" % ("bootstrap" in content))
    print("has main()        : %s" % ("def main()" in content))
    print("version line      : %s" % [l for l in lines if "APP_VERSION" in l][:1])
    print("first 3 lines     :")
    for l in lines[:3]:
        print("   | " + l)
else:
    print("exists   : False  <-- app.py is MISSING here!")

print("\n--- logs/ ---")
logdir = os.path.join(BASE_DIR, "logs")
if os.path.isdir(logdir):
    for fn in sorted(os.listdir(logdir)):
        p = os.path.join(logdir, fn)
        print("  %-20s %d bytes" % (fn, os.path.getsize(p)))
else:
    print("  (logs dir does not exist yet)")

print("\n--- port 8080 bind test ---")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(("0.0.0.0", 8080))
    print("  8080 is FREE (can bind)")
except OSError as e:
    print("  8080 IN USE: %s" % e)
finally:
    s.close()

print("\n--- import app.py test (does NOT start server) ---")
try:
    spec = importlib.util.spec_from_file_location("jpapp", APP_PY)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    print("  import OK")
    print("  PORT      :", getattr(mod, "PORT", "?"))
    print("  APP_VERSION:", getattr(mod, "APP_VERSION", "?"))
    print("  Handler   :", hasattr(mod, "Handler"))
    print("  main      :", hasattr(mod, "main"))
except Exception:
    print("  import FAILED - traceback below:")
    traceback.print_exc()

print("\n" + "=" * 60)
print(" If import is OK and 8080 is FREE, then the code is fine")
print(" and the problem is on the NSSM/service side.")
print("=" * 60)
try:
    input("\nPress Enter to close...")
except EOFError:
    pass
