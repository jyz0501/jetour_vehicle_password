/**
 * 接口配置模板（前端运行时注入）
 * ================================
 * 用法：复制本文件为同目录下的 config.local.js，并填入真实密钥。
 *       config.local.js 已加入 .gitignore，不会提交到仓库。
 *
 * Pages 部署：工作流会从 GitHub Secret 生成 config.local.js，无需手工提交，
 *             见 .github/workflows/pages.yml。
 *
 * ⚠ 安全提醒：静态站点无法真正“保管”密钥——部署后任何人都能从浏览器读取它。
 *   因此服务端仍必须做两件事：
 *     1) 定期轮换 API_KEY；
 *     2) 配合来源校验 + 限流（当前仅有单一共享密钥校验，见 API/app.py）。
 */
window.__JTGJ_PW_CFG__ = {
  API_BASE_URL: 'https://api.qianxian.tech',
  API_KEY: 'REPLACE_WITH_YOUR_API_KEY'
};
