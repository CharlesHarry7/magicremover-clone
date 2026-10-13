# MagicRemover Clone｜AI 图片物体移除工具

上传照片，用画笔标记需要移除的区域，通过 Replicate 图像修复模型生成结果，再比较前后效果并下载。项目使用 Next.js，通过 OpenNext 适配 Cloudflare Workers。

## 功能

- 上传 JPG、PNG、WebP 图片，大小上限约 10 MB。
- 调整画笔大小、撤销与清空遮罩。
- 调用 Replicate 的 `dpakkk/image-object-removal` 模型进行物体移除。
- 查看移除前后效果并下载结果。
- 缺少模型令牌时，移除接口返回明确错误。

这是 MagicRemover 的学习与复刻项目，当前不包含支付功能。

## 本地运行

```bash
npm ci
cp .dev.vars.example .env.local
cp .dev.vars.example .dev.vars
npm run dev
```

在 `.env.local` 和 `.dev.vars` 中填写 `REPLICATE_API_TOKEN`，打开 [localhost:3000](http://localhost:3000)。Next.js 开发服务使用 `.env.local`；OpenNext／Workers 本地预览使用 `.dev.vars`。开发配置通过 OpenNext 初始化 Cloudflare 环境。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `REPLICATE_API_TOKEN` | 真实物体移除所需的 Replicate API 令牌；缺失时 `/api/remove-object` 返回 HTTP 503 |

本地 Next.js 开发使用 `.env.local`，Workers 预览使用 `.dev.vars`。生产环境通过 Workers Secret 配置：

```bash
npx wrangler secret put REPLICATE_API_TOKEN
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | Next.js 开发服务 |
| `npm run build` | Next.js 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run preview` | OpenNext 构建与 Cloudflare 本地预览 |
| `npm run deploy` | OpenNext 构建与 Cloudflare 部署 |

## 仓库导航

| 路径 | 用途 |
| --- | --- |
| [src/](src/) | 页面、组件和图片移除 API |
| [.dev.vars.example](.dev.vars.example) | 本地变量模板 |
| [next.config.ts](next.config.ts) | Next.js 与 Cloudflare 开发初始化 |
| [open-next.config.ts](open-next.config.ts) | OpenNext 适配配置 |
| [wrangler.jsonc](wrangler.jsonc) | Workers 运行配置 |

## 部署

```bash
npm run deploy
npx wrangler secret put REPLICATE_API_TOKEN
```

部署后使用一张有权处理的图片验证上传、遮罩、模型结果与下载；模型请求的费用取决于 Replicate 账户配置。
