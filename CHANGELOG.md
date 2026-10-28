# 更新日志 / Changelog

本项目所有重要变更都记录在此。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
All notable changes are documented here, following Keep a Changelog and Semantic Versioning.

## [Unreleased]

- 暂无。 / Nothing yet.

## [0.1.0] - 2026-10-28

### 新增 / Added

- 首个可运行版本上线：单页引力沙盒，拖拽发射行星，速度箭头实时预览。
  Initial release: single-page gravity sandbox, drag to launch planets with a live velocity arrow.
- 三个预设场景：类太阳系、双星、三体混沌（figure-8 起手）。
  Three presets: Solar-like, Binary, Three-body chaos (figure-8 start).
- 物理核心 `physics.js`：N 体万有引力、速度 Verlet 积分、Plummer 软化（ε = 4）、动量守恒的碰撞合并、系统总能量计算。
  Physics core: N-body gravity, velocity Verlet integration, Plummer softening (ε = 4), momentum-conserving merges, total energy readout.
- 参数与控制：引力强度（0–2.5×）、拖尾长度（0–300）、模拟速度（0.25–3×）滑杆；暂停 / 重置 / 随机 / 清除；碰撞合并开关；顶栏实时显示天体数与总能量。
  Controls: sliders for gravity, trail length and simulation speed; pause / reset / random / clear; merge toggle; live body-count and energy status bar.
- Node 测试套件（无第三方依赖），覆盖软化奇点防护、两体圆轨道稳定、能量近似守恒、碰撞合并守恒，4/4 通过。
  Dependency-free Node test suite covering softening, orbit stability, energy conservation and merges — 4/4 passing.
- 中英双语 README 与 MIT 许可证；GitHub Pages 在线演示开启。
  Bilingual README, MIT license, and a live GitHub Pages demo.

### 已知未办成 / Known gaps

- Codex 优化咨询未取得：调用时撞账号用量上限，物理参数与视觉设计先按通行实践定稿，待额度恢复后重跑对照并在本日志记录差异。
  Codex review not obtained (account usage limit); parameters and design follow common best practice for now and will be revisited.
