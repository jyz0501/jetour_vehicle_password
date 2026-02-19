import requests
import os
from tenacity import retry, stop_after_attempt
import json


@retry(stop=stop_after_attempt(3))
def upload_image(access_token, image_path):
    """上传图片到抖音"""
    url = "https://open.douyin.com/image/upload/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    files = {"image": open(image_path, "rb")}
    
    response = requests.post(url, headers=headers, files=files)
    return response.json()


def create_photo_album(access_token, image_id, title, description):
    """创建图文作品"""
    url = "https://open.douyin.com/photo/list/create/"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    data = {
        "image_ids": [image_id],
        "title": title,
        "description": description
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()


def main():
    # 从环境变量读取配置
    ACCESS_TOKEN = os.environ.get("DOUYIN_ACCESS_TOKEN", "")
    IMAGE_PATH = "douyin/screenshot.png"
    
    if not ACCESS_TOKEN:
        print("请设置DOUYIN_ACCESS_TOKEN环境变量")
        return
    
    # 上传图片
    print("正在上传图片...")
    upload_result = upload_image(ACCESS_TOKEN, IMAGE_PATH)
    print(f"上传结果: {json.dumps(upload_result, ensure_ascii=False)}")
    
    # 检查上传是否成功
    if upload_result.get("data", {}).get("image_id"):
        image_id = upload_result["data"]["image_id"]
        
        # 创建图文作品
        print("正在创建图文作品...")
        title = "捷途车机动态密码更新"
        description = "每小时更新的捷途车机动态密码，包含工程模式密码和ADB权限密码。\n\n适用车型：\n- 2024款捷途山海T2\n- 2023/2024款捷途旅行者\n\n使用方法：\n1. 工程模式密码：应用中心——蓝牙电话，输入密码\n2. ADB权限密码：工程模式——加密设置，输入密码\n\n密码每小时更新一次，请使用最新密码。"
        
        create_result = create_photo_album(ACCESS_TOKEN, image_id, title, description)
        print(f"创建结果: {json.dumps(create_result, ensure_ascii=False)}")
        
        if create_result.get("data", {}).get("item_id"):
            print("发布成功！")
        else:
            print("发布失败")
    else:
        print("图片上传失败")


if __name__ == "__main__":
    main()
