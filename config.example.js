/**
 * 接口配置模板（前端运行时注入）
 * ================================
 * 用法：复制本文件为同目录下的 config.local.js，并填入真实密钥。
 *       config.local.js 已加入 .gitignore，不会提交到仓库。
 *
 * Pages 部署：工作流会自动生成 config.local.js，无需手工提交，
 *             见 .github/workflows/pages.yml。
 *
 * 安全说明：前端不再持有任何密钥。调用接口所需的凭证是服务端签发的短期
 *           只读票据（默认 10 分钟），由前端在运行时向 /api/ticket 申请，
 *           因此这里只需要配置接口地址。
 */
window.__JTGJ_PW_CFG__ = {
  API_BASE_URL: 'https://api.qianxian.tech'
};
