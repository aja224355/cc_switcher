# CC Switcher Local Agent

本地代理程序，用于配合 CC Switcher Web UI 实现一键写入配置文件功能。

由于浏览器安全限制，Web 应用无法直接写入本地文件系统。此代理程序在本地运行，接收来自 Web UI 的配置请求并写入对应的配置文件。

## 安装

```bash
cd local-agent
npm install
```

## 使用

```bash
# 启动代理服务
npm start

# 或者
node index.js
```

服务将在 `http://localhost:17532` 启动。

## 自定义端口

```bash
PORT=8080 npm start
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/info` | 获取系统信息 |
| GET | `/config/:type` | 读取配置文件 |
| POST | `/config/:type` | 写入配置文件 |
| POST | `/env/:type` | 设置环境变量 |
| POST | `/apply` | 批量应用配置 |
| GET | `/backups/:type` | 列出备份文件 |
| POST | `/restore/:type` | 恢复备份 |

其中 `:type` 可以是 `claude`、`codex` 或 `gemini`。

## 配置文件路径

| 类型 | Windows | Linux/WSL | macOS |
|------|---------|-----------|-------|
| Claude | `%USERPROFILE%\.claude\settings.json` | `~/.claude/settings.json` | `~/.claude/settings.json` |
| Codex | `%USERPROFILE%\.codex\config.toml` | `~/.codex/config.toml` | `~/.codex/config.toml` |
| Gemini | `%USERPROFILE%\.gemini\settings.json` | `~/.gemini/settings.json` | `~/.gemini/settings.json` |

## 安全说明

- 此代理仅监听 localhost，不会暴露到网络
- 每次写入配置前会自动备份原有配置
- 支持恢复历史备份

## 与 Web UI 配合使用

1. 启动本地代理: `npm start`
2. 打开 CC Switcher Web UI
3. Web UI 会自动检测本地代理是否运行
4. 如果代理在运行，可以使用 "一键应用配置" 功能直接写入文件

## 开机自启 (Windows)

创建快捷方式并放入启动文件夹:

1. 右键 `index.js` -> 创建快捷方式
2. 修改快捷方式目标为: `node "完整路径\index.js"`
3. 按 `Win+R` 输入 `shell:startup` 打开启动文件夹
4. 将快捷方式拖入启动文件夹

或者使用 PM2:

```bash
npm install -g pm2
pm2 start index.js --name cc-agent
pm2 save
pm2 startup
```

## 开机自启 (Linux/macOS)

使用 systemd (Linux):

```bash
# 创建服务文件
sudo nano /etc/systemd/system/cc-agent.service

# 内容:
[Unit]
Description=CC Switcher Local Agent
After=network.target

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/path/to/local-agent
ExecStart=/usr/bin/node index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target

# 启用服务
sudo systemctl enable cc-agent
sudo systemctl start cc-agent
```

使用 launchd (macOS):

```bash
# 创建 plist 文件
nano ~/Library/LaunchAgents/com.cc-switcher.agent.plist
```

## 故障排除

### 端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :17532  # Windows
lsof -i :17532                  # Linux/macOS

# 使用其他端口
PORT=8080 npm start
```

### 权限问题

确保对配置目录有写入权限:

```bash
# Linux/macOS
chmod 755 ~/.claude ~/.codex ~/.gemini
```

### Web UI 检测不到代理

1. 确认代理正在运行
2. 检查浏览器控制台是否有 CORS 错误
3. 确认端口号一致 (默认 17532)
