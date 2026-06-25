# template-fastify-react

Fastify + React 全栈项目模板，基于 pnpm monorepo + Turborepo 构建。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | ^19.1.0 |
| 构建工具 | Vite | ^7.0.5 |
| UI 组件库 | Ant Design | ^5.26.6 |
| CSS 方案 | UnoCSS + SCSS | ^66.3.3 |
| 状态管理 | Zustand | ^5.0.6 |
| 数据请求 | Axios + SWR | ^1.11.0 / ^2.3.4 |
| 动画引擎 | @react-spring/web | ^10.0.1 |
| 路由 | react-router-dom | ^7.7.0 |
| 后端框架 | Fastify | ^5.3.2 |
| 运行时验证 | Zod | ^4.4.3 |
| 包管理器 | pnpm | 11.0.9 |
| Monorepo | Turborepo | ^2.9.16 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（并行启动前后端）
pnpm dev

# 仅启动前端
pnpm dev:web

# 仅启动 API
pnpm dev:api
```

- 前端: http://localhost:5173
- API: http://localhost:3001
- API 文档: `apps/api/API.md`

## 项目结构

```
├── apps/
│   ├── api/                 # Fastify 后端
│   │   ├── src/
│   │   │   ├── routes/      # 路由（health + items CRUD）
│   │   │   └── server.ts    # 服务入口
│   │   └── API.md           # API 接口文档
│   └── web/                 # React 前端
│       └── src/
│           ├── components/  # 通用组件
│           │   ├── Animations/   # 动画组件库（7 种动画组件）
│           │   ├── Header.tsx
│           │   ├── NavFollow.tsx # 跟随指示器导航
│           │   └── Popup.tsx     # 全局弹窗
│           ├── hooks/       # 自定义 Hooks
│           │   ├── useData.tsx
│           │   ├── useResize.tsx
│           │   └── useViewTransitions.tsx
│           ├── pages/       # 页面
│           │   ├── home/          # 首页（计数器）
│           │   ├── request/       # API 接口测试面板
│           │   ├── components/    # 功能组件演示
│           │   ├── animations/    # 动画效果演示
│           │   └── 404/
│           ├── stores/      # Zustand 状态
│           ├── lib/         # Axios 封装
│           ├── router/      # 路由配置
│           ├── config/      # 应用配置
│           └── storage/     # 加密本地存储
├── packages/
│   ├── types/               # 共享 TS 类型
│   ├── schema/              # Zod 校验 schema
│   ├── tsconfig/            # 共享 TS 配置
│   └── eslint-config/       # 共享 ESLint 配置
├── docs/
│   └── deploy.md            # 部署指南
└── ecosystem.config.js      # PM2 配置
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动前后端开发服务器 |
| `pnpm dev:web` | 仅启动前端 |
| `pnpm dev:api` | 仅启动 API（tsx watch 热重载） |
| `pnpm build` | 构建所有应用 |
| `pnpm build:web` | 仅构建前端 |
| `pnpm build:api` | 仅构建 API（esbuild 单文件打包） |
| `pnpm start:api` | 生产模式启动 API |
| `pnpm lint` | ESLint 检查 |
| `pnpm check-types` | TypeScript 类型检查 |
| `pnpm format` | Prettier 格式化 |

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/home` | 首页 | Zustand 计数器演示 |
| `/request` | API 测试 | 在线接口测试面板 |
| `/components` | 组件总览 | 功能组件聚合页 |
| `/components/nav` | 跟随导航 | 跟随指示器 |
| `/components/modal` | 全局弹窗 | Popup 组件演示 |
| `/components/icons` | 图标展示 | SVG + UnoCSS 图标 |
| `/animations` | 动画展示 | 动画组件库演示 |

## 特性

- **动画组件库** — 基于 @react-spring/web，7 种动画组件 + 预设系统 + View Transitions API
- **路由懒加载** — React.lazy + 骨架屏 + 悬停预加载
- **手动分包** — React / Ant Design / 动画库 / 工具库分离打包
- **UnoCSS Attributify** — 原子化 CSS 支持 HTML 属性写法
- **加密存储** — AES-CBC 加密 localStorage
- **性能监控** — Web Vitals + 路由切换耗时
- **全栈 CI/CD** — GitHub Actions 自动构建部署

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/items` | 创建 Item |
| GET | `/api/items` | 获取列表 |
| GET | `/api/items/:id` | 获取单个 |
| PUT | `/api/items/:id` | 更新 |
| DELETE | `/api/items/:id` | 删除 |

## 部署(传统服务器)

详见 [docs/deploy.md](docs/deploy.md)。

通过 GitHub Actions 推送 `main` 分支自动部署：
1. 构建前端静态文件与 API bundle
2. SSH 同步到服务器
3. PM2 重启服务

所需 GitHub Secrets: `SSH_PRIVATE_KEY`, `SERVER_HOST`, `SERVER_PORT`, `SERVER_USER`, `SERVER_WEB_PATH`, `SERVER_API_PATH`

## License

[MIT](LICENSE)
