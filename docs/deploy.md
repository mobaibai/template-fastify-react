# 部署指南

## 概述

GitHub Actions 在推送 `main` 分支时自动执行以下步骤：

1. 安装依赖 → 构建所有子项目
2. 将 `apps/web/dist/`（前端静态文件）部署到服务器
3. 将 `apps/api/dist/bundle.cjs`（API 服务端打包文件）部署到服务器
4. 将 `ecosystem.config.js`（PM2 配置）部署到服务器
5. 通过 SSH 执行 `pm2 start/restart` 重启 API 服务

---

## 一、服务器准备工作

### 1. 创建部署目录

```bash
# 前端静态文件目录（示例路径，可按需修改）
mkdir -p /www/wwwroot/your-project/web

# API 服务端目录（示例路径，可按需修改）
mkdir -p /www/wwwroot/your-project/api
```

### 2. 安装 nvm 与 Node.js 22

**服务器当前 Node.js 版本如果过低，通过 nvm 安装 Node 22 后，两者互不影响。**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

# 用 nvm 安装 Node.js 22（不会覆盖系统旧版本）
nvm install 22
nvm use 22

# 验证版本
node -v   # 应显示 v22.x

# 在 Node 22 环境下全局安装 PM2
npm install -g pm2
```

> **注意**：`nvm use 22` 仅在当前 shell 生效。PM2 通过 `ecosystem.config.js` 的 `interpreter` 字段指定使用 nvm 安装的 Node 22 二进制路径，不受系统默认版本影响（详见下文 PM2 启动部分）。

### 3. 创建 SSH 密钥（供 GitHub Actions 使用）

在服务器上执行：

```bash
# 生成密钥对（一路回车即可）
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# 将公钥添加到 authorized_keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 查看私钥内容（后续需要复制到 GitHub Secrets）
cat ~/.ssh/deploy_key
```

> **注意**：使用 `root` 用户或创建专用部署用户均可。如果使用非 root 用户，请确保该用户对部署目录有读写权限。

### 4. 开放 SSH 端口

确保服务器 SSH 端口（默认 `22`）已在外网防火墙和服务器中安全中放行。

---

## 二、GitHub 仓库设置

### 1. 配置 Secrets

进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**，添加以下 secrets：

| Secret | 说明 | 示例值 |
|--------|------|--------|
| `SSH_PRIVATE_KEY` | 服务器 SSH 私钥（上一步 `cat ~/.ssh/deploy_key` 的内容） | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `SERVER_HOST` | 服务器 IP 或域名 | `123.123.123.123` 或 `yourdomain.com` |
| `SERVER_PORT` | SSH 端口（可选，默认 `22`） | `22` |
| `SERVER_USER` | SSH 登录用户名 | `root` |
| `SERVER_WEB_PATH` | 前端静态文件部署路径 | `/www/wwwroot/your-project/web` |
| `SERVER_API_PATH` | API 服务端文件部署路径 | `/www/wwwroot/your-project/api` |

> **提示**：SSH_PRIVATE_KEY 的私钥内容需**完整复制**，包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----` 标记行。

### 2. 确认工作流文件

确保 `.github/workflows/deploy.yml` 存在于仓库默认分支（`main`）。

---

## 三、触发部署

### 自动触发

向 `main` 分支推送代码即可自动触发部署：

```bash
git push origin main
```

### 手动触发

也可以进入 GitHub 仓库 → **Actions** → **Deploy** → **Run workflow** 手动触发。

---

## 四、验证部署

### 1. 查看 GitHub Actions 状态

仓库 → **Actions** → **Deploy** → 点击最新运行，确认所有步骤为绿色 ✅。

### 2. 检查服务器文件

```bash
# 检查前端文件是否已同步
ls -la /www/wwwroot/your-project/web/

# 检查 API 文件是否已同步
ls -la /www/wwwroot/your-project/api/
```

### 3. 确认 PM2 运行状态

```bash
pm2 list
pm2 logs api
pm2 show api   # 确认 interpreter 指向 Node 22 路径
```

> PM2 使用哪个 Node 版本由 `ecosystem.config.js` 中的 `interpreter` 字段控制，它指向 `~/.nvm/versions/node/v22.x/bin/node`。部署前先在服务器确认该路径存在：
> ```bash
> ls -l /root/.nvm/versions/node/v22.*/bin/node
> ```
> 如果路径不符（例如你使用的是非 root 用户），请修改 `ecosystem.config.js` 中的 `NVM_NODE_PATH` 路径或用户名。

### 4. 配置 Nginx

在服务器添加网站，配置如下（示例）：

```nginx
# 前端静态服务
server {
    listen 80;
    server_name yourdomain.com;

    root /www/wwwroot/your-project/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
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

> API 的端口号请根据 `apps/api` 的实际监听端口进行调整。

---

## 五、常见问题

### 部署失败：Permission denied (publickey)

- 确认 `SSH_PRIVATE_KEY` 与服务器公钥配对
- 确认公钥已添加到 `~/.ssh/authorized_keys`
- 测试本地 SSH 连接：`ssh -i ~/.ssh/deploy_key root@your-server-ip`

### 部署失败：目录不存在

- 确认 `SERVER_WEB_PATH` 和 `SERVER_API_PATH` 已在服务器上创建
- 工作流中 `SCRIPT_BEFORE` 会自动执行 `mkdir -p`，但请确保 SSH 用户有权限写入

### PM2 启动失败

- 确认服务器已安装 PM2：`pm2 --version`
- SSH 到服务器手动测试：`cd /www/wwwroot/your-project/api && node server.cjs`
- 查看 PM2 日志：`pm2 logs api`

### PM2 仍在使用系统 Node.js 14 运行

确认 `ecosystem.config.js` 中的 `interpreter` 路径与实际安装的 Node 22 路径一致：

```bash
# 查看 nvm 安装的 Node 22 具体路径
ls /root/.nvm/versions/node/v22.*/bin/node

# 在 PM2 中验证
pm2 show api | grep "interpreter"
```

如果使用非 root 用户，需将 `ecosystem.config.js` 中的 `/root/.nvm` 改为对应家目录，例如 `/home/deploy/.nvm`。

### Git Actions 构建失败（Node 版本不匹配）

工作流使用 Node.js 22 构建，与服务器版本无关。构建失败请检查 `package.json` 中的 `engines` 要求，或修改 `.github/workflows/deploy.yml` 中的 `node-version`。
