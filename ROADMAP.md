# 路线图 / Roadmap

长期维护原则：小步更新、先验证后发布、每次更新必写 [CHANGELOG](CHANGELOG.md)、版本号递增。迭代成果只在每日晨报里汇总，不另行打扰。
Long-term maintenance: small verified steps, a changelog entry for every update, results reported only in the daily morning report.

更新节奏（2026-10-29 定，同日改定）：**每周一小更新，每月一大更新，质量优先。**
Cadence (set 2026-10-29, revised same day): one small update every week, one major update every month, quality first.

- **每周小更新**：每周日晚完成一项小而完整的改进（backlog 里的最小颗粒，或小修小补），跑通测试并过总监质量门后推送，版本号进一位补丁号（如 0.2.1、0.2.2）。成果在次日晨报连同更新日志一并交付；当周无可做项、质量门不过，或当周已发布每月大更新，如实记录原因并跳过，不硬凑。
  Weekly small update: one small, complete improvement each Sunday evening, gated by the director sign-off, patch version bump, reported in the next morning report with its changelog entry.
- **每月大更新**：每月 1 日做一次成规模的更新——当月路线图里程碑（如新模式方向的大功能、性能架构升级），版本号进一位次版本号（如 0.3.0），打 tag 发布 Release，更新日志写完整条目。大更新同样先过可玩性验收清单；涉及游戏模式时账号系统前置规矩不破例。
  Monthly major update: on the 1st of each month, a milestone-scale update with a minor version bump and a tagged release; the playability checklist and the account-system gate still apply.

## 最高原则：可玩性第一，吸引用户 / Top principle: playability first

后续一切优先级以本节为准；下面的 backlog 与此冲突时，以可玩性为准。
Every priority below yields to this section: if it is not fun and inviting, it does not ship first.

每次迭代的验收清单（全过才算完成）/ Acceptance checklist for every iteration:

- [ ] **打开即玩**：首屏场景自动运行，零注册、零学习成本，第一眼就知道能动手。
  Instant play: the first screen is already moving; no sign-up, no learning curve.
- [ ] **流畅红线**：天体再多也不能明显卡顿——有天体上限、有 FPS 监测与自适应降质，降质要让用户知情。
  Smoothness red line: body caps, FPS monitoring and adaptive quality, disclosed to the player.
- [ ] **操作有反馈**：每个动作都有即时可见的回应（箭头、动效、状态文字），不让用户猜有没有生效。
  Feedback for every action: arrows, motion or status text — never make the player guess.
- [ ] **留一个分享钩子**：每版至少留一个可分享 / 可炫耀的钩子（分享链接、惊喜画面、值得截图的瞬间）。
  A shareable hook in every release: a share link, a surprise moment, a screenshot worth keeping.

## 总监签字：质量门 / Director sign-off — the quality gate

每一版（含每日小更新）发布前由总监按此清单亲自验收，任一项不过，整版退回重做，不将就：
Every release, daily ones included, is personally reviewed against this list; any failure sends the whole release back:

- [ ] **视觉秩序**：配色统一克制，字体、字号、间距成系统；无错位、无溢出，窄屏不破版。
  Visual order: a disciplined palette, systematic type and spacing; no misalignment, no overflow, no broken narrow-screen layout.
- [ ] **细节完整**：文案准确无错字；按钮有正常/悬停/禁用状态；空状态、失败兜底都有交代，没有半成品入口。
  Complete details: accurate copy, full button states, considered empty and failure states, no half-finished entry points.
- [ ] **功能闭环**：新功能从入口到结果走得通，旧功能不被带坏；物理与分享等核心逻辑测试全过。
  Closed loops: new features work end to end, old ones unharmed, core tests green.
- [ ] **如实**：更新日志与实际改动一一对应，不夸大、不冒充。
  Honesty: the changelog matches exactly what changed.

与更新节奏的关系：每周小更新不为凑数降标准——达不到，宁可不更新、在次日晨报里说明原因。每月大更新同理，规模服从质量。
Cadence yields to quality: a day with nothing up to standard is reported as such, never filled with a substandard release.

## 优化 backlog（按优先级）/ Optimization backlog

1. **性能**：天体数量上升时引入 Barnes–Hut 近似或空间划分；子步数自适应；拖尾渲染优化，保证帧率稳定。
   Performance: Barnes–Hut approximation or spatial partitioning at high body counts, adaptive substeps, cheaper trail rendering.
2. **物理精度**：Codex 额度恢复后重跑优化咨询，与现行参数（Verlet + Plummer ε=4）做差异对照，结论写入 CHANGELOG；可选的更高阶辛积分与能量漂移面板。
   Physics accuracy: re-run the Codex review when quota recovers and diff it against current parameters; optional higher-order symplectic integration and an energy-drift panel.
3. **体验与视觉**：移动端触控打磨、点选天体跟随/改质量、预设图库、深色视觉细节精修。
   UX and visuals: mobile touch polish, click-to-follow and mass editing, a preset gallery, visual refinement.
4. **工程质量**：扩充物理测试；GitHub Actions 在每次 push 自动跑测试；正式版本打 tag 并发布 Release。
   Engineering: more physics tests, GitHub Actions CI on push, tagged releases.

## 游戏模式与账号系统（硬性前置）/ Game mode & accounts — hard gate

**规矩：不出游戏模式则已，一出游戏模式，必须先有账号系统。沙盒模式永远免账号，不受此限。**
Rule: no game mode without an account system shipped first. The sandbox stays account-free forever.

为什么游戏模式需要账号 / Why game mode needs accounts:

- 进度、挑战成绩与解锁内容要跨设备保存，不能只存本地。
  Persistent progress, challenge scores and unlocks across devices.
- 排行榜与成绩对比需要稳定身份。
  Leaderboards need a stable identity.
- 本地存档可被随意改，成绩类功能没有身份就没有可信度。
  Local-only saves are trivially editable; score features need identity to mean anything.

账号系统设计口径（到时按此落地）/ Design decisions:

- **不自存密码**：用托管身份服务（如 Supabase / Firebase Auth），登录方式优先 GitHub OAuth + 邮箱魔法链接，服务端只存用户 id、昵称、存档与成绩。
  No self-hosted passwords: use a managed auth provider (e.g. Supabase / Firebase Auth), GitHub OAuth plus email magic links; store only id, display name, saves and scores.
- **最小数据**：只收游戏必需数据；排行榜默认可选加入（opt-in）；提供数据导出与账号删除。
  Minimal data, opt-in leaderboard, data export and account deletion.
- **游客仍可玩**：未登录可玩全部沙盒与游戏模式试玩，但进度只存本地、成绩不上榜；登录后再把本地存档迁移上云。
  Guests can play everything, with local-only progress; local saves migrate to the cloud on first sign-in.
- **静态站限制**：GitHub Pages 本身没有后端，账号系统落地时需接入上述托管服务；若开通服务需要项目所有者本人注册或付费，会先在晨报里列为「等拍板」，不擅自开通。
  GitHub Pages has no backend; if enabling a provider ever needs the owner's own signup or payment, that becomes a morning-report decision item first, never a silent action.
- **上线清单**：登录/登出与找回、个人资料、云存档 schema、成绩防作弊的基本校验、本地存档迁移、隐私说明。清单全过，游戏模式才发布。
  Launch checklist: sign-in/out and recovery, profile, cloud-save schema, basic score validation, local-save migration, privacy note — all required before a game mode ships.
