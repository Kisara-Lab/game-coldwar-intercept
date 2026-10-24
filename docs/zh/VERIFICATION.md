# 验证与发布

> 当前 main 验证入口 · 核对日期：2026-10-24。<br>
> 最近发布标签为 v1.21.1；下列命令说明验证范围，不代表本次运行过所有用例。

[返回 README](../../README.md) | [机制手册](SIMULATION.md) | [架构与扩展](ARCHITECTURE.md) | [操作与 AAR](OPERATIONS.md)

## 基础门槛

```bash
npm run build
```

构建执行 TypeScript 检查和 Vite 生产打包。提交前还应运行 `git diff --check`。

## 分域验证

项目脚本较多，应按改动范围选择验证，而不是每次并行运行全部浏览器用例。

| 领域 | 代表命令 |
|---|---|
| 舰队域与编队 | `verify:fleet-domain`, `verify:fleet-runtime` |
| 多舰防空 | `verify:fleet-air-defense`, `verify:fleet-ship-defense`, `verify:fleet-launch-cycle` |
| 联合场景 | `verify:fleet-scene`, `verify:joint-air`, `verify:air-strike-defense` |
| 空战 AI 与动力学 | `verify:air-dynamics`, `verify:advanced-air-flight`, `verify:advanced-air-bvr-runtime` |
| 导引与反制 | `verify:air-guidance`, `verify:anti-ship-guidance`, `verify:air-countermeasures` |
| 数据链 | `verify:link11`, `verify:link16`, `verify:datalink-era-runtime` |
| 苏联 C2 | `verify:soviet-gci-runtime`, `verify:soviet-maritime-runtime`, `verify:soviet-salvo-runtime` |
| AAR/ACMI | `verify:acmi-export`, `verify:fleet-aar`, `verify:datalink-aar` |
| WebGPU Ultra | `verify:webgpu-ultra`, `verify:webgpu-ultra-active` |
| 文档与发现入口 | `verify:docs`, `verify:seo` |
| 尺度与雷达 | `verify:world-scale`, `verify:radar-model`, `verify:radar-doppler`, `verify:fleet-radar-scale` |
| 被动传感器与 CEC | `verify:passive-sensors`, `verify:cec-runtime`, `verify:cec-engagement` |
| ARM 生命周期与交战结算 | `verify:arm-emitter-health`, `verify:air-engagement-settlement` |

完整命令清单以 `package.json` 的 `scripts` 为准。

## 代表性证据矩阵

| 功能 | 权威证据 | 类型 |
|---|---|---|
| CG-57 独立 Mk 41 发射 | `verify:fleet-launch-cycle`、`readme-cg57-ultra-aurora.png` | 浏览器 + 实体事件 |
| F-14/Tu-16K/A-6E 联合闭环 | `verify:joint-air` | 浏览器运行时 |
| Link 11/16 年代差异 | `verify:link11`、`verify:link16`、`verify:datalink-era-runtime` | 逻辑 + 运行时 |
| ECM/诱饵分型 | `verify:air-countermeasures`、`verify:air-asm-ecm` | 逻辑 |
| Tacview 导出 | `verify:acmi-export`、`verify:fleet-aar` | ACMI 内容 |
| WebGPU Ultra fallback | `verify:webgpu-ultra`、`verify:webgpu-ultra-active` | 浏览器能力检测 |

截图只证明画面状态，不能单独证明实体发射；每项交战验收都应同时检查运行时事件、弹药和 owner。

## 浏览器验证规则

1. 一次只运行一个 Chromium renderer。
2. 使用固定短场景超时。
3. 同时捕获 `console.error` 和 `pageerror`。
4. 对 3D 功能既检查运行时字段，也人工读取截图。
5. 实体发射必须验证 owner、弹药、发射点、导弹对象和画面，不得用 DOM 计数替代。
6. WebGPU 失败时应明确报告 capability/fallback，不能静默伪装成 Ultra 成功。

## Review CI

`.github/workflows/review-ci.yml` 定义构建/文档和分域检查，并单独执行浏览器冒烟与设置输入保护。分域覆盖防御轴、场景尺度/ACMI、雷达、ARM、年代限制、航迹策略与交战结算。具体步骤以工作流为准；文档检查不替代运行时验证。TypeScript 编译共用 `dist-test`，相关命令顺序执行，避免输出互相覆盖。

## 发布门槛

- [ ] 中文入口与子文档无乱码，内部链接有效。
- [ ] 英文入口与中文结构一致，明确其维护状态。
- [ ] 按目标版本同步 `package.json`、锁文件与 HUD；当前基线为 `1.21.1`。
- [ ] 将已验证的 Unreleased 改动整理到目标版本的 `CHANGELOG.md`，记录边界与已知问题。
- [ ] 生产构建通过。
- [ ] 舰队实体发射、联合空战、AAR/ACMI 和默认单舰回归通过。
- [ ] WebGL 高画质通过；WebGPU Ultra 能力检测和 fallback 通过。
- [ ] 文档中的命令、平台目录和许可证与源码一致。
- [ ] 工作区不包含密钥、参考资料、临时构建或无关截图提交。
- [ ] GitHub `main` 与本地一致；获准发布后创建与目标提交对应的版本标签和 Release Notes。

发布前逐项保留证据；仅更新文档不创建版本标签。

## 当前已知边界

- CEC 参与者与远程测量必须单独验证；Link 11/16 不应被描述为 CEC，苏联平台不得产生 CEC 活动。
- 航母起降、空中加油和拖曳诱饵仍未实现；反辐射导弹/SEAD 已实现基础实体回路与确定性验证。
- 性能数值为游戏化缩放，不是现实装备数据库。
- WebGPU Ultra 仍是实验路径，受浏览器、驱动和平台能力限制。
- `main.ts` 仍包含兼容路径和较多装配代码，后续需继续收敛。

雷达单位、视距及 RCS 校准约定见 [雷达模型](RADAR-MODEL.md)。
