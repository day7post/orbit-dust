# Orbit Dust · 星尘轨道沙盒

一个完全独立的单页互动物理玩具：在画布上拖拽发射行星，看它们在 N 体引力下绕转、交缠、合并。
A self-contained single-page interactive physics toy: drag to launch planets and watch them orbit, tangle and merge under N-body gravity.

无构建、无依赖，原生 HTML / CSS / JS。No build step, no dependencies — vanilla HTML/CSS/JS.

## 玩法 / How to play

- **拖拽发射**：在画布空白处按住拖拽，出现速度箭头，松手即以该方向与长度发射一颗行星。
  Drag on empty canvas → a velocity arrow appears → release to launch a planet.
- **预设场景**：类太阳系（Solar-like）/ 双星（Binary）/ 三体混沌（Three-body chaos, figure-8 起手）。
- **控制**：暂停 / 重置 / 随机行星 / 清除行星；碰撞合并开关。
- **参数滑杆**：引力强度 G（0–2.5×）、拖尾长度（0–300）、模拟速度（0.25–3×）。

## 物理模型 / Physics

- **万有引力 N 体**：每对天体互相吸引，`a_i = -G · Σ_j m_j (r_i − r_j) / (|r_i − r_j|² + ε²)^(3/2)`。
- **Plummer 软化** ε = 4 px：近距离时引力被抹平，不会出现 1/r² 奇点与数值爆炸。
- **速度 Verlet 积分**：辛积分器，长时间能量只小幅振荡、不系统漂移（优于显式欧拉）。
  子步进：每帧 3 个子步，dt = 0.35（× 模拟速度）。
- **碰撞合并**：天体盘重叠到大者半径内时按完全非弹性碰撞合并，质量、质心与动量守恒。
- 顶部状态栏实时显示天体数与系统总能量，可直观看到能量近似守恒。

物理核心在 `physics.js`，浏览器与 Node 共用同一份代码（UMD），测试直接 `require` 它。

## 本地运行 / Run locally

```bash
# 方式一：直接用浏览器打开
open index.html        # 或双击 index.html

# 方式二：起一个静态服务器
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

## 测试 / Tests

```bash
node tests/physics.test.js
```

覆盖：软化避免奇点（重合天体加速度有限）、两体圆轨道稳定（半径保持在 ±15% 内）、
三体系统总能量近似守恒（漂移 < 2%）、碰撞合并的质量与动量守恒。
Covers: softening singularity guard, two-body circular-orbit stability,
approximate energy conservation, and momentum-conserving merges.

## 文件 / Files

| 文件 | 说明 |
|---|---|
| `index.html` | 页面结构 |
| `styles.css` | 深色视觉样式（响应式，窄屏单列） |
| `main.js` | 画布渲染、交互、预设场景 |
| `physics.js` | 物理核心（Verlet + 软化 + 合并） |
| `tests/physics.test.js` | Node 测试（无第三方依赖） |
| `docs/codex-review.md` | Codex 优化咨询记录（含失败实情） |

## 更新日志 / Changelog

见 [CHANGELOG.md](CHANGELOG.md) — 每次更新都会在那里留一条记录。
See [CHANGELOG.md](CHANGELOG.md) — every update gets an entry there.

## License

MIT — see [LICENSE](LICENSE).
