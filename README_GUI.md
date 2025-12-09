# Claude Code Switcher GUI

一个基于 Rust 和 eframe/egui 的原生 GUI 应用程序，用于管理 Claude Code 配置，支持多供应商切换和远程 Linux 配置同步。

## 功能特性

### 🎯 核心功能
- **配置管理**: 添加、编辑、删除配置文件
- **供应商切换**: 快速在不同 API 端点和认证令牌间切换
- **环境变量管理**: 自动设置 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN`
- **远程配置**: 通过 SSH 连接到远程 Linux 服务器并同步配置

### 🖥️ GUI 特性
- **原生界面**: 使用 eframe/egui 构建的现代化 GUI
- **直观操作**: 简单易用的配置文件管理界面
- **实时状态**: 显示当前激活的配置文件
- **响应式设计**: 支持不同窗口大小

### 🔧 高级功能
- **配置导入/导出**: 支持配置文件的备份和迁移
- **SSH 连接**: 支持密码和 SSH 密钥认证
- **环境脚本生成**: 生成 Shell 导出脚本
- **配置验证**: 验证远程连接和配置

## 安装和构建

### 系统要求
- Rust 1.70+ 
- Cargo 包管理器
- Linux/macOS/Windows

### 构建步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd cc_switcher
   ```

2. **安装 Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

3. **构建项目**
   ```bash
   cargo build --release
   ```

4. **运行应用**
   ```bash
   cargo run --release
   ```

## 使用说明

### 配置文件管理

1. **添加配置文件**
   - 点击 "+ Add Profile" 按钮
   - 输入配置名称（如：work、personal）
   - 设置 API Base URL（默认：https://api.anthropic.com）
   - 输入认证令牌
   - 可选：添加描述信息

2. **激活配置**
   - 在配置文件列表中点击 "Activate" 按钮
   - 当前激活的配置会显示绿色状态

3. **编辑配置**
   - 点击配置项的 "Edit" 按钮
   - 修改相关信息后保存

4. **删除配置**
   - 点击配置项的 "Delete" 按钮
   - 确认删除操作

### 远程配置管理

1. **连接设置**
   - 进入 "Remote Config" 标签页
   - 输入服务器信息：
     - 服务器地址（IP 或域名）
     - 端口（默认 22）
     - 用户名
     - 认证方式（密码或 SSH 密钥）

2. **连接测试**
   - 点击 "Test Connection" 验证连接
   - 确保 SSH 访问正常

3. **推送配置**
   - 点击 "Push Current Config" 将当前配置推送到远程服务器
   - 配置会自动保存到远程的 `~/.config/cc_switcher/config.json`

### 设置选项

- **配置信息**: 查看配置文件位置
- **导入/导出**: 备份和恢复配置
- **环境变量**: 清除或生成导出脚本

## 配置文件格式

配置文件使用 JSON 格式存储在 `~/.config/cc_switcher/config.json`：

```json
{
  "current": "work",
  "profiles": {
    "work": {
      "base_url": "https://api.anthropic.com",
      "auth_token": "sk-xxx",
      "description": "Work account",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "personal": {
      "base_url": "https://api.anthropic.com",
      "auth_token": "sk-yyy",
      "description": "Personal account",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 与 CLI 版本的关系

此 GUI 版本与现有的 CLI 版本完全兼容：
- 使用相同的配置文件格式和位置
- 可以与 CLI 版本无缝切换
- 支持相互导入/导出配置

### CLI 版本功能映射

| CLI 命令 | GUI 等效功能 |
|---------|-------------|
| `ccs add` | "+ Add Profile" 按钮 |
| `ccs list` | 主界面配置文件列表 |
| `ccs select` | "Activate" 按钮 |
| `ccs delete` | "Delete" 按钮 |
| `ccs current` | 主界面状态显示 |
| 远程配置 | "Remote Config" 标签页 |

## 开发说明

### 项目结构

```
src/
├── main.rs              # 主应用程序
├── lib.rs               # 模块入口
├── models/
│   └── config.rs        # 数据模型
├── config/
│   └── manager.rs       # 配置管理器
└── utils/
    ├── environment.rs   # 环境变量管理
    └── remote.rs        # 远程连接管理
```

### 核心组件

- **AppState**: 应用程序状态管理
- **ConfigManager**: 配置文件读写操作
- **Profile**: 配置文件数据结构
- **RemoteConfigManager**: 远程服务器管理
- **EnvironmentManager**: 环境变量操作

### 依赖库

- **eframe/egui**: GUI 框架
- **serde**: JSON 序列化/反序列化
- **ssh2**: SSH 连接支持
- **tokio**: 异步操作
- **anyhow**: 错误处理

## 安全考虑

- 配置文件权限设置为用户仅读
- 认证令牌在界面中隐藏显示
- SSH 连接支持密钥认证
- 本地存储，不上传到云端

## 故障排除

### 常见问题

1. **GUI 无法启动**
   - 检查系统图形界面支持
   - 确保 Rust 和 Cargo 正确安装
   - 查看构建错误信息

2. **配置不生效**
   - 确认配置文件权限正确
   - 检查配置文件格式是否正确
   - 重启应用程序

3. **远程连接失败**
   - 验证 SSH 连接信息
   - 确认服务器网络可达
   - 检查防火墙设置

### 日志和调试

- GUI 应用程序会在控制台输出错误信息
- 可以通过环境变量 `RUST_LOG=debug` 启用详细日志
- 配置文件位置：`~/.config/cc_switcher/config.json`

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

### 开发流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

## 更新日志

### v0.1.0
- 初始版本发布
- 基础配置文件管理功能
- GUI 界面实现
- 远程配置推送功能
- 环境变量管理

---

**注意**: 这是一个 GUI 版本的 cc_switcher 工具，提供了比 CLI 版本更直观的操作界面，同时保持了完整的功能兼容性。
