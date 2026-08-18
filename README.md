# tommax-web

Tommax 前端（Phase 1 画布切片）：React 18 + TypeScript + Vite + React Flow + zustand。

## 本地启动
```bash
pnpm install          # .npmrc 已固定 npmmirror 源（覆盖公司内网源）
pnpm dev              # http://127.0.0.1:5173
# 若 pnpm dev 的前置检查报错，可直接 ./node_modules/.bin/vite
```
前置：generation-svc(:8080) 与 model-adapter-svc(:9101) 已运行（见 tommax-generation-svc README）。

## 已实现
- 无限画布（React Flow）：文本 / AI 图片 / AI 视频 三类节点，拖拽连线、删除、小地图
- 连线驱动生成（docs/06 §A.2 的一跳收集规则）：text→prompt 槽、image→参考图/首帧槽；
  任务类型自动推导（有参考图 → ref2img / img2video，无 → text2img / text2video）
- 生成进度轮询与节点内预览（图片 img / 视频 video 标签）

## 例外登记
| 例外 | 原因 | 回收条件 |
|---|---|---|
| 画布仅内存态，无持久化 | canvas-svc 未落地 | canvas-svc 上线后接 REST 保存 |
| fetch 手写客户端，未用 openapi-typescript | 契约字段少 | proto→OpenAPI 管线打通后替换 |
| 无 TanStack Query（手写轮询） | 单页面切片 | 页面增多时引入 |

负责人：TBD
