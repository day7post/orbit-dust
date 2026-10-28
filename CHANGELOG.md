# 更新日志 / Changelog

本项目所有重要变更都记录在此。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
All notable changes are documented here, following Keep a Changelog and Semantic Versioning.

## [Unreleased]

- 暂无。 / Nothing yet.

## [0.2.0] - 2026-10-29

### 新增 / Added

- **可玩性五项**（本版主线，围绕「保证可玩性，吸引用户」）：
  Five playability features (this release's theme — playability first, made to attract players):
  - 天体上限 240：发射 / 随机 / 惊喜添加超限时自动移除最旧的非恒星天体，避免天体堆积把帧率拖死；顶栏显示「天体 n/240」。
    Body cap of 240: launches and spawns past the cap drop the oldest non-star bodies; the status bar shows "bodies n/240".
  - FPS 显示与自适应降质：顶栏新增 FPS；帧率持续低于约 45 时先缩短拖尾、再减少物理子步（下限 1），恢复 55 以上逐步还原，降质时状态栏明示「流畅模式」。
    FPS readout plus adaptive quality: below ~45fps it shortens trails, then cuts physics substeps (floor 1), recovering above 55fps; the status bar discloses a "smooth mode" badge while degraded.
  - 首次发射提示：画布上浮一行「按住拖拽，松手发射你的第一颗行星」，不挡操作，第一次成功发射后淡出。
    First-launch hint overlaid on the canvas (non-blocking), fading out after the first successful launch.
  - 场景分享链接：「复制分享链接」把当前天体编进 URL hash，朋友打开即可还原同一片星尘；编码带长度与数值校验，坏链接静默回退默认预设。编解码在独立的 `share.js` 中，附 Node 往返自测。
    Shareable scene links: the current bodies are encoded into the URL hash and restored on open, with length/range validation and a silent fallback for bad hashes. Codec lives in `share.js` with a Node round-trip test.
  - 「✦ 惊喜一下」按钮：一键甩出一条偏心彗星轨道，再撒一簇星尘，点下去立刻有画面。
    A "Surprise me" button: one click throws an eccentric comet plus a cluster of stardust — instant eye candy.
- [ROADMAP.md](ROADMAP.md) 顶部立「最高原则：可玩性第一，吸引用户」与每次迭代验收清单（打开即玩 / 流畅红线 / 操作有反馈 / 留可分享钩子），后续优先级以此为准。
  ROADMAP now opens with the top principle "playability first" and a per-iteration acceptance checklist.
- 新增 [ROADMAP.md](ROADMAP.md)：长期优化 backlog（性能、物理精度、体验、工程质量）与迭代原则。
  Added ROADMAP.md with the long-term optimization backlog and maintenance principles.
- 立下硬性规矩并写入路线图：若推出游戏模式，必须先落地账号系统（托管身份服务、不自存密码、最小数据、游客可玩但进度仅本地）；沙盒模式永远免账号。
  Recorded a hard gate: any future game mode ships only after an account system (managed auth, no self-stored passwords, minimal data, guest play with local-only progress); the sandbox remains account-free.

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
