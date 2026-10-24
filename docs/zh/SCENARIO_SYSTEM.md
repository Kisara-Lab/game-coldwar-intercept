# 场景平台与“极夜断链”

> 当前 main 场景平台 · 核对日期：2026-10-24。<br>
> 场景平台自 v1.21.0 引入；后续修正见 [CHANGELOG](../../CHANGELOG.md)。模块所有权见[架构](ARCHITECTURE.md)。

场景平台使用版本化JSON保存兵力、位置、航向、航线、任务、环境、时间线、目标和引导。JSON只包含数据；Three.js对象、平台构造函数、AI运行时和武器执行器由TypeScript编译层注入。

## 数据流

```text
Scenario JSON
  -> migrate / validate / normalize
  -> ScenarioCompiler
  -> naval forces + air spawns + surface platforms
  -> existing sensor / OODA / fire-control / launcher runtimes
  -> observation + AAR + Tacview
```

场景文件不能直接生成导弹、修改命中结果或读取隐藏真值。舰载SAM仍必须经过本舰航迹、交战队列、火控通道、弹药、发射器动画和物理离架。

## 世界尺度

场景在 `simulation.worldUnitsPerKm` 中声明世界单位与公里的换算比例，支持有限值 `0.001`–`1000000`。控制台的距离播报、战术雷达的距离环与航迹公里标注，以及 AAR 距离播报和 Tacview 水平坐标，都按场景声明的比例换算；引导小地图使用同一个字段。内置场景声明 `10`，因此现有播报文本与画面标注保持不变。以米表示的不确定度仍直接换算为公里；Tacview 高度沿用独立的高度比例。

未加载场景或声明值非法时，运行时回退到默认比例 `10`，不会用零或负值去除距离。

## 导入与导出

- 沙盒面板中的 `IMPORT SCENARIO JSON` 会先迁移、校验和规范化；非法文件不会部分启动。
- 文件上限为2 MB，不允许脚本或外部资源引用。
- `EXPORT SCENARIO JSON` 输出稳定排序的规范化文档，便于版本控制。
- 内置场景与用户导入场景使用同一编译器，为未来沙盒编辑器保留统一保存格式。

## 全频带阻塞干扰：极夜断链

特殊场景位于挪威海—巴伦支海，持续1080秒。Long Beach、CG-57、E-2C、F-14、A-6E与Project 1164、Tu-126、Tu-16K、MiG-29分别执行预定航线和任务。

空间天气依次经过正常、预警、耀斑、退化、全阻塞、间歇窗口和恢复阶段。Link 11/16的消息仍经过真实队列，但传播环境会改变成功率、延迟、质量和不确定度；断链不会清空平台本地航迹，也不会停止本舰传感器。

## 引导

场景引导只消费显式观察事件，不读取敌方真值。三档模式为：

- `FULL GUIDANCE`：简报、阶段说明、机制解释和观察建议。
- `KEY EVENTS`：断链、天气、发射、损伤和目标变化。
- `OFF`：关闭弹出提示，保留阶段HUD及AAR。

提示可以建议镜头目标，但必须由玩家点击，不能强制抢夺镜头。

## 验证

```bash
npm run verify:scenario-system
npm run verify:space-weather
npm run verify:scenario-guidance
npm run verify:lost-comms
npm run verify:blackout-runtime
```

浏览器验证限定为一个Chromium renderer，并在短时间窗口内确认简报、场景装配、两舰独立实体、十架飞机、天气诊断和极光环境控制。
