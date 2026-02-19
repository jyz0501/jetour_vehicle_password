#!/usr/bin/env python3
"""
定时任务脚本：每小时执行一次截图和上传功能
"""
import schedule
import time
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def job():
    """定时执行的任务"""
    logger.info("=== 开始执行定时任务 ===")
    try:
        # 导入并执行主脚本
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from douyin.main import main as main_func
        success = main_func()
        if success:
            logger.info("定时任务执行成功")
        else:
            logger.error("定时任务执行失败")
    except Exception as e:
        logger.error(f"定时任务执行异常: {str(e)}")
    logger.info("=== 定时任务执行完成 ===")


def main():
    """主函数"""
    logger.info("=== 启动定时任务调度器 ===")
    logger.info(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 每小时执行一次，在整点执行
    schedule.every().hour.at(":00").do(job)
    
    # 立即执行一次任务
    logger.info("立即执行一次任务...")
    job()
    
    # 循环运行调度器
    logger.info("调度器已启动，每小时整点执行任务")
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次


if __name__ == "__main__":
    main()
