# 车型图片目录

本目录用于存放第 1 步「选择车型」卡片展示的真实车图。

## 命名规则

文件名 = 车型 key（与 `config/carModels.js` / 服务端 `carModels` 键一致），后缀 `.png`：

- 纵横G700 → `g700.png`
- 纵横F700 → `zonghengF700.png`
- 旅行者 / 山海T2 → `traveler.png`
- 自由者 / 山海T1 → `ziyouzhe.png`
- 山海L7 / Plus / T9 → `shanhal7.png`
- 山海L9 → `shanhal9.png`
- X70 Plus/L/Pro/CDM → `x70plus.png`
- X90/Plus/Pro/CDM → `x90plus.png`
- X95 → `x95.png`
- 捷途大圣 → `dasheng.png`
- 风云A9 / T9 → `fengyunA9.png`
- 虎8 / 8L → `hu8.png`

## 规格建议

- 格式：PNG 或 JPG 均可（前端会自动按 key 尝试加载 `.png`，如改用 JPG 请同步修改 `utils/ui.js` 中 `CAR_THUMB_DIR` 拼接的后缀）
- 比例：横版，宽高约 2:1（卡片缩略区高 64px）
- 最小尺寸：建议 ≥ 400 × 200，避免拉伸模糊
- 白底或透明底均可；`object-fit: cover` 会自动裁切适配

## 缺图表现

目录中缺失某车型图片时，卡片自动回退为「品牌渐变底 + 车型首字」占位块，不影响任何功能。
