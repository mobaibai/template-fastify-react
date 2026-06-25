# 部署指南

## 概述

GitHub Actions 在推送 `main` 分支时自动执行以下步骤：

1. 安装依赖 → 构建所有子项目（使用 Node.js 22）
2. 将 `apps/web/dist/`（前端静态文件）部署到服务器
3. 将 `apps/api/dist/bundle.cjs`（API 服务端打包文件）部署到服务器
4. 将 `ecosystem.config.js`（PM2 配置）部署到服务器
5. 通过 SSH 执行 `pm2 restart/start` 重启 API 服务

> **说明**：GitHub Actions 构建使用 Node.js 22，服务器运行使用 nvm 管理的 Node.js 18，两者完全独立互不影响。

---

## 一、服务器准备工作（首次部署执行一次）

### 1. 创建部署目录

```bash
# 前端静态文件目录
mkdir -p /path/web

# API 服务端目录
mkdir -p /path/api
```

### 2. 安装 nvm 与 Node.js

服务器已有系统级 Node.js 16，通过 nvm 安装 Node 18 后两者互不影响。

```bash
# 安装 nvm（使用 gitee 镜像，避免 GitHub 访问慢）
wget -O ~/install_nvm.sh "https://gitee.com/mirrors/nvm/raw/v0.40.3/install.sh"
bash ~/install_nvm.sh

# 写入 zsh 配置（服务器使用 zsh）
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node' >> ~/.zshrc
source ~/.zshrc

# 安装 Node.js 18
nvm install 18
nvm use 18

# 验证版本
node -v   # 应显示 v18.x

# 在 Node 22 环境下全局安装 PM2
npm install -g pm2
```

> **注意**：`nvm use 18` 仅在当前 shell 生效。PM2 通过 `ecosystem.config.js` 的 `interpreter` 字段指定 Node 16 绝对路径，服务器重启后自动使用正确版本，无需手动切换。

### 3. 设置 PM2 开机自启（只需执行一次）

```bash
# 确保在 nvm Node 18 环境下
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 18

# 首次手动启动
cd /path/api
pm2 start ecosystem.config.js

# 设置开机自启（复制并执行输出的那条 sudo 命令）
pm2 startup

# 根据提示执行相应sudo命令
sudo env PATH=$PATH:/home/ubuntu/.nvm/versions/node/v16.20.2/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 保存当前进程列表
pm2 save
```

> 之后每次服务器重启，PM2 会自动恢复进程，无需人工干预。后续部署由 GitHub Actions 自动重启，也不需要手动操作。

### 4. 创建 SSH 密钥（供 GitHub Actions 使用）

```bash
# 生成密钥对（一路回车即可）
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# 将公钥添加到 authorized_keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 查看私钥内容（后续需要复制到 GitHub Secrets）
cat ~/.ssh/deploy_key
```

> GitHub Actions 通过私钥连接服务器，**全程免密，不需要知道服务器登录密码**。

### 5. 开放 SSH 端口

确保服务器 SSH 端口（默认 `22`）已在外网防火墙中放行。

---

## 二、GitHub 仓库设置

### 1. 配置 Secrets

进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**，添加以下 secrets：

| Secret            | 说明                                                  | 实际值                                                |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `SSH_PRIVATE_KEY` | 服务器 SSH 私钥（`cat ~/.ssh/deploy_key` 的完整内容） | `-----BEGIN OPENSSH PRIVATE KEY-----\n...`            |
| `SERVER_HOST`     | 服务器 IP 地址(纯IP无http)                            | 服务器公网 IP                                         |
| `SERVER_PORT`     | SSH 端口                                              | `22`                                                  |
| `SERVER_USER`     | SSH 登录用户名                                        | `ubuntu`                                              |
| `SERVER_WEB_PATH` | 前端静态文件部署路径                                  | `/path/web`             |
| `SERVER_API_PATH` | API 服务端文件部署路径                                | `/path/api` |

> **提示**：`SSH_PRIVATE_KEY` 需完整复制，包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----` 标记行。

### 2. 工作流文件

确保 `.github/workflows/deploy.yml` 存在于仓库 `main` 分支，内容如下：

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy_target:
        description: '选择部署目标'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - web
          - api

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      api: ${{ steps.filter.outputs.api }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/**'
            api:
              - 'apps/api/**'
              - 'packages/**'

  deploy:
    needs: changes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 构建 Web（自动触发：文件有变更；手动触发：选择 web 或 all）
      - name: Build Web
        if: needs.changes.outputs.web == 'true' || github.event.inputs.deploy_target == 'web' || github.event.inputs.deploy_target == 'all'
        run: pnpm --filter ./apps/web build

      # 构建 API（自动触发：文件有变更；手动触发：选择 web 或 api）
      - name: Build API
        if: needs.changes.outputs.api == 'true' || github.event.inputs.deploy_target == 'api' || github.event.inputs.deploy_target == 'all'
        run: pnpm --filter ./apps/api build

      # 部署 Web
      - name: Deploy Web (static files)
        if: needs.changes.outputs.web == 'true' || github.event.inputs.deploy_target == 'web' || github.event.inputs.deploy_target == 'all'
        uses: easingthemes/ssh-deploy@main
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SERVER_HOST }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          REMOTE_PORT: ${{ secrets.SERVER_PORT }}
          ARGS: -rlgoDzvc -i --delete
          SOURCE: apps/web/dist/
          TARGET: ${{ secrets.SERVER_WEB_PATH }}
          SCRIPT_BEFORE: |
            mkdir -p ${{ secrets.SERVER_WEB_PATH }}
            rm -rf ${{ secrets.SERVER_WEB_PATH }}/*

      # 部署 API bundle
      - name: Deploy API (server bundle)
        if: needs.changes.outputs.api == 'true' || github.event.inputs.deploy_target == 'api' || github.event.inputs.deploy_target == 'all'
        uses: easingthemes/ssh-deploy@main
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SERVER_HOST }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          REMOTE_PORT: ${{ secrets.SERVER_PORT }}
          ARGS: -rlgoDzvc -i --delete
          SOURCE: apps/api/dist/bundle.cjs
          TARGET: ${{ secrets.SERVER_API_PATH }}
          SCRIPT_BEFORE: |
            mkdir -p ${{ secrets.SERVER_API_PATH }}
            rm -f ${{ secrets.SERVER_API_PATH }}/bundle.cjs

      # 部署 PM2 配置
      - name: Deploy PM2 config
        if: needs.changes.outputs.api == 'true' || github.event.inputs.deploy_target == 'api' || github.event.inputs.deploy_target == 'all'
        uses: easingthemes/ssh-deploy@main
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SERVER_HOST }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          REMOTE_PORT: ${{ secrets.SERVER_PORT }}
          ARGS: -rlgoDzvc -i --delete
          SOURCE: ecosystem.config.js
          TARGET: ${{ secrets.SERVER_API_PATH }}

      # 重启 PM2（只有 API 变更时才执行）
      - name: Restart PM2
        if: needs.changes.outputs.api == 'true' || github.event.inputs.deploy_target == 'api' || github.event.inputs.deploy_target == 'all'
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets.SERVER_API_PATH }}
            pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
            pm2 save
```

### 3. PM2 配置文件

项目根目录的 `ecosystem.config.js`：

```javascript
const NODE_VERSION = 'v18'
const NVM_NODE_PATH = `/home/ubuntu/.nvm/versions/node/v${NODE_VERSION}/bin/node`

const fs = require('fs')
const nodePath = fs.existsSync(NVM_NODE_PATH) ? NVM_NODE_PATH : process.execPath

module.exports = {
  apps: [
    {
      name: 'api',
      script: './bundle.cjs',
      interpreter: nodePath,
      env: {
        NODE_ENV: 'production',
        PORT: 39005
      },
    },
  ],
}
```

---

## 三、触发部署

### 自动触发

向 `main` 分支推送代码即可自动触发：

```bash
git push origin main
```

### 手动触发

GitHub 仓库 → **Actions** → **Deploy** → **Run workflow**

---

## 四、验证部署

### 1. 查看 GitHub Actions 状态

仓库 → **Actions** → **Deploy** → 点击最新运行，确认所有步骤为绿色 ✅。

### 2. 检查服务器文件

```bash
# 检查前端文件
ls -la /path/web

# 检查 API 文件
ls -la /path/api
```

### 3. 确认 PM2 运行状态

```bash
pm2 list
pm2 logs api
pm2 show api | grep interpreter  # 确认使用 Node 16 路径
```

### 4. 配置 Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /tapi/ {
        proxy_pass http://127.0.0.1:39005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 五、常见问题

### 部署失败：Permission denied (publickey)

- 确认 `SSH_PRIVATE_KEY` 与服务器公钥配对
- 确认公钥已添加到 `~/.ssh/authorized_keys`
- 本地测试连接：`ssh -i ~/.ssh/deploy_key ubuntu@your-server-ip`

### 部署失败：目录不存在

- 确认 `SERVER_WEB_PATH` 和 `SERVER_API_PATH` 已在服务器上创建
- 工作流中 `SCRIPT_BEFORE` 会自动执行 `mkdir -p`，确保 SSH 用户有写入权限

### PM2 启动失败

- 确认 PM2 已安装：`pm2 --version`
- 手动测试：`cd /path/api && node bundle.cjs`
- 查看日志：`pm2 logs api`

### PM2 使用了错误的 Node 版本

```bash
# 确认 Node 16 路径存在
ls /home/ubuntu/.nvm/versions/node/v18/bin/node

# 验证 PM2 使用的 interpreter
pm2 show api | grep interpreter
```

### API 端口不正确

确认 `ecosystem.config.js` 中 `PORT` 与 `apps/api/.env.production` 一致，均为 `39005`。esbuild 打包时通过 `--define` 将端口内联到 bundle，无需在服务器上放置 `.env` 文件。

### GitHub Actions 构建失败

工作流使用 Node.js 22 构建，与服务器运行版本无关。构建失败请检查 `package.json` 的依赖版本，或查看 Actions 日志定位具体错误。
