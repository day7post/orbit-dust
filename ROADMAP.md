# 路线图 / Roadmap

长期维护原则：小步更新、先验证后发布、每次更新必写 [CHANGELOG](CHANGELOG.md)、版本号递增。迭代成果只在每日晨报里汇总，不另行打扰。
Long-term maintenance: small verified steps, a changelog entry for every update, results reported only in the daily morning report.

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
