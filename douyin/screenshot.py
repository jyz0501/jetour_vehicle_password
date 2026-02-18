from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 设置竖版视口（9:16比例，适合手机显示）
        page = browser.new_page(
            viewport={"width": 720, "height": 1280}
        )
        
        # 访问你的动态页面（替换为实际 URL）
        page.goto("https://jyz0501.github.io/jetour_dynamic-password/")
        
        # 等待页面加载完成
        page.wait_for_selector("#carPassword", state="visible")
        
        # 截图并保存到douyin文件夹
        page.screenshot(path="douyin/screenshot.png")
        browser.close()

if __name__ == "__main__":
    main()
