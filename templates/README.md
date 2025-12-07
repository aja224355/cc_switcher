# 配置模板

本目录包含 Claude Code、Codex 和 Gemini 的预设配置模板。

## 文件说明

| 文件 | 说明 |
|------|------|
| `providers-template.sql` | SQL 格式配置模板，兼容 cc-switch |

## 支持的导出格式

cc_switcher 现在支持多种官方格式导出：

| 格式 | 文件 | 说明 |
|------|------|------|
| JSON | `providers.json` | 通用 JSON 格式 |
| SQL | `providers.sql` | cc-switch 兼容格式 |
| Claude settings.json | `~/.claude/settings.json` | Claude Code 官方格式 |
| Codex config.toml | `~/.codex/config.toml` | Codex CLI 官方格式 |
| Shell 环境变量 | `.env.sh` | Bash/Zsh 环境变量 |

## 使用方法

### 方法一：通过 Web UI 导入

1. 打开 cc_switcher Web UI
2. 点击「导入配置」按钮
3. 选择 `providers-template.sql` 文件
4. 导入后在列表中编辑，填入你的实际 API Key

### 方法二：直接编辑 SQL 文件

1. 复制 `providers-template.sql` 到你的工作目录
2. 用文本编辑器打开，替换以下占位符：
   - `sk-ant-api03-YOUR_API_KEY_HERE` → 你的 Anthropic API Key
   - `sk-YOUR_OPENAI_API_KEY_HERE` → 你的 OpenAI API Key
   - `YOUR_GOOGLE_API_KEY_HERE` → 你的 Google API Key
   - `YOUR_SESSION_KEY_HERE` → 你的会话密钥（如适用）
3. 导入修改后的文件

### 方法三：导出为官方格式

在 Web UI 中选择供应商后，可以导出为官方格式：

**Claude Code (settings.json)**:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "ANTHROPIC_MODEL": "claude-sonnet-4-20250514",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-3-5-haiku-20241022",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-20250514",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-3-opus-20240229"
  }
}
```

**Codex CLI (config.toml)**:
```toml
model = "codex-mini-latest"
model_provider = "openai"
approval_policy = "suggest"
sandbox_mode = "workspace-write"

[model_providers.openai]
api_key_env_var = "OPENAI_API_KEY"
```

**Shell 环境变量**:
```bash
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
export ANTHROPIC_API_KEY="sk-ant-..."
export ANTHROPIC_MODEL="claude-sonnet-4-20250514"
```

## 官方文档链接

### Claude Code
- 官网: https://claude.ai/code
- API 文档: https://docs.anthropic.com/
- 获取 API Key: https://console.anthropic.com/
- 配置文件位置: `~/.claude/settings.json`

### OpenAI Codex
- 官网: https://openai.com/codex
- API 文档: https://platform.openai.com/docs
- 获取 API Key: https://platform.openai.com/api-keys
- 配置文件位置: `~/.codex/config.toml`

### Google Gemini
- 官网: https://ai.google.dev/
- API 文档: https://ai.google.dev/docs
- 获取 API Key: https://aistudio.google.com/apikey
- 配置文件位置: `~/.gemini/settings.json`

### 第三方代理
- OpenRouter: https://openrouter.ai/docs

## 模型推荐

### Claude 模型
| 模型 | 用途 | 特点 |
|------|------|------|
| `claude-sonnet-4-20250514` | 日常编码 | 平衡性能和速度 |
| `claude-3-5-haiku-20241022` | 快速任务 | 响应快，成本低 |
| `claude-3-opus-20240229` | 复杂推理 | 最强大，成本高 |

### OpenAI/Codex 模型
| 模型 | 用途 | 特点 |
|------|------|------|
| `gpt-5.1-codex-max` | 长周期编码 | 最新最强 Codex 模型 |
| `gpt-5.1-codex` | 通用编码 | 平衡性能版 |
| `gpt-5.1-codex-mini` | 快速任务 | 成本低，速度快 |
| `gpt-5-codex` | 通用编码 | GPT-5 Codex 版 |

### Gemini 模型
| 模型 | 用途 | 特点 |
|------|------|------|
| `gemini-2.0-flash` | 快速任务 | 最新快速模型 |
| `gemini-1.5-pro` | 复杂任务 | 高性能模型 |

## Codex 配置说明 (官方文档)

配置文件位置: `~/.codex/config.toml`

Codex 支持以下特有配置 (官方值)：

| 配置项 | 可选值 | 说明 |
|--------|--------|------|
| `approval_policy` | `on-request`, `never`, `untrusted`, `on-failure` | 审批策略 |
| `sandbox_mode` | `off`, `workspace-write`, `read-only`, `none` | 沙箱模式 |
| `model_provider` | `openai`, `azure`, `ollama`, 等 | 模型提供商 |
| `model_reasoning_effort` | `low`, `medium`, `high` | 推理力度 |
| `model_reasoning_summary` | `auto`, `always`, `never` | 推理摘要 |

### Codex Profiles 支持

Codex 支持定义多个配置档案，在 config.toml 中使用 `[profiles.<name>]`：

```toml
[profiles.deep-review]
model = "gpt-5-pro"
model_reasoning_effort = "high"
approval_policy = "never"

[profiles.lightweight]
model = "gpt-4.1"
approval_policy = "untrusted"
```

启动时使用: `codex --profile deep-review`

## 注意事项

⚠️ **安全提醒**：
- 不要将包含真实 API Key 的配置文件提交到 Git
- 建议将修改后的配置文件添加到 `.gitignore`
- 定期轮换 API Key 以确保安全
