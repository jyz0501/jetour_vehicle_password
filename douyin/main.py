#!/usr/bin/env python3
"""
主脚本：整合截图和抖音上传功能
"""
import os
import sys
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_screenshot():
    """运行截图功能"""
    logger.info("开始执行截图...")
    try:
        # 导入截图模块
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from douyin.screenshot import main as screenshot_main
        screenshot_main()
        logger.info("截图完成")
        return True
    except Exception as e:
        logger.error(f"截图失败: {str(e)}")
        return False


def run_upload():
    """运行抖音上传功能"""
    logger.info("开始执行抖音上传...")
    try:
        # 导入上传模块
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from douyin.upload_to_douyin import main as upload_main
        upload_main()
        logger.info("抖音上传完成")
        return True
    except Exception as e:
        logger.error(f"抖音上传失败: {str(e)}")
        return False


def main():
    """主函数"""
    logger.info("=== 捷途车机动态密码自动截图上传任务 ===")
    logger.info(f"执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. 执行截图
    screenshot_success = run_screenshot()
    
    if not screenshot_success:
        logger.error("截图失败，任务终止")
        return False
    
    # 2. 执行上传
    upload_success = run_upload()
    
    if not upload_success:
        logger.error("上传失败，任务终止")
        return False
    
    logger.info("任务执行成功！")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
