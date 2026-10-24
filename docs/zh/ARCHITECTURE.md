# 架构与扩展

> 当前 main 架构 · 核对日期：2026-10-24。<br>
> 包版本与 HUD 仍为 v1.21.1；后续改动列入 [CHANGELOG 的 Unreleased](../../CHANGELOG.md)，不代表已发布新版本。

[返回 README](../../README.md) | [机制手册](SIMULATION.md) | [操作与 AAR](OPERATIONS.md) | [验证与发布](VERIFICATION.md)

## 所有权原则

1. 实体拥有自己的状态。舰艇弹药、通道、发射器、传感器和毁伤不得存放在舰队全局计数器中。
2. 协调器只输出意图或任务。它不能直接生成武器、扣弹或播放实体动画。
3. 视觉层只消费运行时状态。视觉事件不能反向证明或授权命中、发射和毁伤。
4. AAR/ACMI 记录真实运行时事件。导出器不得补造缺失的交战行为。
5. 平台差异优先放入目录定义。`main.ts` 不应按具体舰名、飞机名或武器 ID 实现行为分支。

## 模块边界

| 模块 | 责任 |
|---|---|
| `src/air/` | 空中目录、实例、传感器、OODA、动力学、制导、AEW 和反制 |
| `src/fleet/` | 舰队实例、编队、Link 11、指挥角色、任务协调和观察层 |
| `src/ships/` | 单舰传感器、武器执行、发射适配、ECM、CIWS 和损管 |
| `src/ship-defense/` | 舰载防空共享目标、交战、发射器和视觉状态机 |
| `src/datalink/` | 数据链协议、年代和诊断，不拥有武器权限 |
| `src/soviet-c2/` | 苏联指挥控制和目标指示，不复用 NATO 数据链语义 |
| `src/threats/` | 来袭武器目录、模型和飞行参数 |
| `src/platforms/` | 敌方水面平台目录与运行时 |
| `src/scenarios/` | 初始实体、位置、弹药、参数和功能开关 |
| `src/aar/` | 采样、事件、ACMI 映射和下载 |
| `src/visual/` | 渲染能力，不拥有战斗真值 |
| `src/defense/` | 目标源注册、观测选择、交战授权与 hit/miss/cancel 结算 |
| `src/sensors/` | IRST/ESM 被动探测与航迹契约 |
| `src/arm/` | 辐射源生命周期、观测航迹、ARM 寻的和 SEAD 集成 |
| `src/cec/` | 测量、协方差、融合、网络、交战支持与中段更新 |
| `src/radar/` | 共享视距、RCS 配置、单位换算及可选空中搜索多普勒过滤 |
| `src/tracks/` | 航迹冲突融合 |
| `src/scenario-system/` | JSON 场景校验、归一化、迁移、编译、会话、目标、引导、指令与尺度 |
| `src/space-weather/` / `src/environment/` | 确定性空间天气、空间传播退化和天气锋面 |
| `src/lost-comms/` | 失联与恢复条令 |
| `src/audio/` | 动态配乐和主题音轨生命周期 |
| `src/models/` / `src/surface/` | 程序化模型与水面资产画廊；水面打击执行另见 `surface-combat.ts` |
| `src/main.ts` / `src/input.ts` | 装配、UI、帧循环与输入保护，不承担目录特定行为 |
| `scripts/` / `.github/workflows/` | 分域、浏览器验证与 Review CI |

英文源码级说明见 [ARCHITECTURE.md](../../ARCHITECTURE.md)。

## 关键类型

| 类型 | 所有者 | 用途 |
|---|---|---|
| `CombatEntity` / `TargetableEntity` | 实体运行时 | 阵营、位置、速度、RCS、存活和损伤契约 |
| `AirPlatformDefinition` / `AirPlatformInstance` | `src/air/` | 空机目录数据与单机状态 |
| `NavalForceRuntime` | `src/fleet/` | 编队态势、角色和任务协调 |
| `ForceEngagementAssignment` | `src/fleet/` | 交战意图，不是发射事件 |
| `ShipLauncherAdapter` | `src/ships/` | 将舰队任务接入本舰发射器 |
| `DefenseTarget` | `src/combat-types.ts` | 舰空防御的统一目标引用 |

依赖方向应保持 `scenario -> runtime -> observation -> decision -> local executor -> event -> visual/AAR`。视觉、导出和舰队协调器都不能反向生成实体行为。

## 集成方向

```text
catalog/scenario -> entity runtime -> observation/track -> decision/order
                 -> local executor -> physical event -> visuals + AAR
```

反向调用必须谨慎。尤其禁止 `fleet -> spawn SAM`、`visual -> apply hit`、`exporter -> synthesize launch`。

## 尺度与观测边界

- 横向距离通过 `src/scenario-system/world-scale.ts` 解析 `worldUnitsPerKm`，默认 10；距离显示、雷达几何与 Tacview 水平坐标使用场景值。
- 传感器/Tacview 高度使用 `SENSOR_ALTITUDE_METERS_PER_UNIT = 50`；高级飞行动力学保留 `WORLD_ALTITUDE_TO_METERS = 100` 校准。飞机模型的 2 米/单位只属于视觉尺度，三者不能混用。
- `CombatPicture.Track` 与 `ShipTrackEstimate` 的 `uncertainty` 为米；空中/平台航迹和 CEC 协方差输入使用世界单位。融合、关联与投影的适配边界必须显式换算。
- 雷达视距、RCS 命名配置与换算集中于 `src/radar/model.ts`；海上提示的 RCS 因子作用于提示质量，不能随意扩大目录射程。
- AWG-9/N019 空中搜索的可选下视多普勒过滤影响探测概率与航迹质量，不模拟 PRF、地形或独立导引头过滤。具体口径见[雷达模型](RADAR-MODEL.md)。
- CEC 是独立测量融合服务，仅显式 `cec-enabled` 配置中的合格平台参与；Link 11/16 共享本身不等同 CEC，远程支持仍须遵守本舰发射、照射与末段捕获约束。

## 新增舰艇

1. 在舰艇目录声明平台、传感器、发射器、弹药、ECM、CIWS 和系统布局。
2. 在 `src/models/` 提供程序化模型，并将挂点通过统一 `userData` 契约暴露。
3. 通过 `createShipCombatant` 创建独立实例。
4. 在 `src/fleet/scenarios.ts` 或场景目录引用定义，不在 `main.ts` 添加舰名分支。
5. 验证独立模型、弹药、航迹、毁伤、发射原点和 AAR owner。

## 新增空中平台

1. 在 `src/air/catalog.ts` 声明空气动力、传感器、挂载、武器、ECM 和任务条令。
2. 在 `src/air/model-assets/` 或 `src/air/aew/model-assets/` 添加模型与挂点；`src/air/models.ts` 是兼容入口。
3. 在 `src/air/scenarios.ts` 添加出生与任务订单。
4. 复用 OODA、飞行指令和通用武器运行时；避免按机型 ID 分支。
5. 增加动力学、挂点、制导、毁伤和浏览器运行时验证。

## 新增武器

目录数据应包含目标类别、动力段、速度/高度包线、转弯限制、导引阶段、导引头、引信、战斗部和反干扰参数。运行时只能按能力字段选择行为；只有真正无法数据化的物理类别才允许新增策略实现。

## 场景数据

初始位置、阵营、弹药、编队、任务、交战参数和功能开关属于场景层。`validateNavalForceScenario()` 会拒绝空场景、重复实体 ID、缺失定义、重复指挥角色或缺少 OTC 的舰队。

版本化 JSON 的入口位于 `src/scenario-system/`，经校验、归一化、迁移和编译后交给运行时；旧场景通过适配器继续可用。新增剧情目标、引导和指令应使用这些边界，详见[场景平台](SCENARIO_SYSTEM.md)。

## 渲染与资源生命周期

稳定路径由 WebGL 2 绘制场景；实验性 WebGPU Ultra 使用 WebGL 场景与 WebGPU Compute 混合后端，已有 FFT 海洋、云和粒子计算。能力不足或初始化失败时明确回退。渲染只消费模拟状态；资源创建者负责 resize、reset 和 dispose，不由战斗帧循环直接操作其内部缓冲。现状及诊断见 [WebGPU Ultra](../WEBGPU_ULTRA.md)。

## main.ts 收敛目标

`main.ts` 当前仍包含兼容单舰路径、UI 和部分装配代码。新增功能不得继续扩大具体平台硬编码。重构优先级是：

1. 将场景数据继续移入 `src/scenarios/`。
2. 将跨域适配放入命名 bridge/integration 模块。
3. 让 `main.ts` 最终只承担依赖装配、固定帧调度、输入和 UI 映射。

新增单位应优先增加目录定义和场景数据，随后补充逻辑、模型、AAR 和验证。可导航的当前实体说明见 [Wiki 平台](../../wiki/PLATFORMS/README.md) 与 [Wiki 武器](../../wiki/WEAPONS/README.md)。
