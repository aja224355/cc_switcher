-- Claude Code Switch 配置模板
-- 格式兼容: cc-switch (https://github.com/farion1231/cc-switch)
-- 使用说明: 将此文件导入到 cc_switcher 中，然后修改 apiKey 为你的实际密钥

-- ============================================
-- cc-switch 实际表结构
-- 使用 'app_type' 字段区分: claude / codex / gemini
-- 配置存储在 'settings_config' JSON 字段中
-- ============================================
DROP TABLE IF EXISTS providers;
CREATE TABLE providers (
  id TEXT NOT NULL,
  app_type TEXT NOT NULL,              -- cc-switch 使用 'app_type': claude/codex/gemini
  name TEXT NOT NULL,
  settings_config TEXT NOT NULL,       -- JSON 格式的完整配置
  website_url TEXT,                    -- 文档链接
  category TEXT,                       -- 分类: official/cn_official/custom
  created_at INTEGER,
  sort_index INTEGER,
  notes TEXT,                          -- 备注
  icon TEXT,
  icon_color TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  is_current BOOLEAN NOT NULL DEFAULT 0,  -- 当前激活状态
  PRIMARY KEY (id, app_type)
);

-- ============================================
-- cc-switch 实际格式示例
-- 使用 'app_type' 字段区分类型
-- 配置存储在 'settings_config' JSON 字段
-- ============================================

-- Claude 配置示例 (cc-switch 实际格式)
-- settings_config.env 包含所有环境变量
INSERT INTO providers (id, app_type, name, settings_config, website_url, category, notes, is_current) VALUES (
  'uuid-claude-001', 
  'claude',  -- 重要: cc-switch 使用 'app_type' 字段
  'Claude 官方 API', 
  '{"env":{"ANTHROPIC_AUTH_TOKEN":"sk-ant-api03-YOUR_API_KEY_HERE","ANTHROPIC_BASE_URL":"https://api.anthropic.com","ANTHROPIC_MODEL":"claude-sonnet-4-20250514","ANTHROPIC_DEFAULT_HAIKU_MODEL":"claude-3-5-haiku-20241022","ANTHROPIC_DEFAULT_SONNET_MODEL":"claude-sonnet-4-20250514","ANTHROPIC_DEFAULT_OPUS_MODEL":"claude-3-opus-20240229"}}',
  'https://www.anthropic.com',
  'official',
  'Anthropic 官方 API',
  1
);

-- Codex 配置示例 (cc-switch 实际格式)
-- settings_config.auth 包含 OPENAI_API_KEY
-- settings_config.config 包含 TOML 格式配置
INSERT INTO providers (id, app_type, name, settings_config, website_url, category, notes, is_current) VALUES (
  'uuid-codex-001', 
  'codex',  -- 重要: cc-switch 使用 'app_type' 字段
  'OpenAI Codex (官方)', 
  '{"auth":{"OPENAI_API_KEY":"sk-YOUR_OPENAI_API_KEY_HERE"},"config":"model_provider = \"openai\"\nmodel = \"gpt-5.1-codex-max\"\nmodel_reasoning_effort = \"high\"\n[model_providers.openai]\nname = \"OpenAI\"\nbase_url = \"https://api.openai.com/v1\"\nwire_api = \"responses\""}',
  'https://openai.com',
  'official',
  'OpenAI 官方 API',
  0
);

-- Gemini 配置示例 (cc-switch 实际格式)
-- settings_config.env 包含 GEMINI_API_KEY 和 GOOGLE_GEMINI_BASE_URL
INSERT INTO providers (id, app_type, name, settings_config, website_url, category, notes, is_current) VALUES (
  'uuid-gemini-001', 
  'gemini',  -- 重要: cc-switch 使用 'app_type' 字段
  'Google Gemini (官方)', 
  '{"env":{"GEMINI_API_KEY":"YOUR_GOOGLE_API_KEY_HERE","GOOGLE_GEMINI_BASE_URL":"https://generativelanguage.googleapis.com/v1beta"},"config":{"selectedAuthType":"gemini-api-key"}}',
  'https://ai.google.dev',
  'official',
  'Google AI Studio API',
  0
);

-- ============================================
-- cc-switch v3.7.x 兼容格式 (旧版)
-- 使用 'type' 字段区分类型
-- ============================================

-- Claude 官方 API (v3.7.x 格式)
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  1, 
  'claude',  -- v3.7.x 使用 'type' 字段
  'Claude 官方 API', 
  'sk-ant-api03-YOUR_API_KEY_HERE', 
  'https://api.anthropic.com', 
  '{"main":"claude-sonnet-4-20250514","haiku":"claude-3-5-haiku-20241022","sonnet":"claude-sonnet-4-20250514","opus":"claude-3-opus-20240229"}', 
  1, 
  datetime('now'), 
  datetime('now')
);

-- Claude Max (Claude Pro 订阅用户)
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  2, 
  'claude', 
  'Claude Max (Pro 订阅)', 
  'YOUR_SESSION_KEY_HERE', 
  'https://api.claude.ai', 
  '{"main":"claude-sonnet-4-20250514","haiku":"claude-3-5-haiku-20241022","sonnet":"claude-sonnet-4-20250514","opus":"claude-3-opus-20240229"}', 
  0, 
  datetime('now'), 
  datetime('now')
);

-- OpenAI 官方 API (v3.7.x 格式)
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  3, 
  'codex',  -- v3.7.x 使用 'type' 字段
  'OpenAI Codex (官方)', 
  'sk-YOUR_OPENAI_API_KEY_HERE', 
  'https://api.openai.com/v1', 
  '{"main":"gpt-5.1-codex-max","approvalPolicy":"on-request","sandboxMode":"workspace-write","modelProvider":"openai"}', 
  0, 
  datetime('now'), 
  datetime('now')
);

-- OpenAI ChatGPT Plus (订阅用户)
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  4, 
  'codex', 
  'OpenAI ChatGPT Plus', 
  'YOUR_CHATGPT_SESSION_KEY_HERE', 
  'https://api.openai.com/v1', 
  '{"main":"gpt-5-codex","approvalPolicy":"untrusted","sandboxMode":"workspace-write","modelProvider":"openai"}', 
  0, 
  datetime('now'), 
  datetime('now')
);

-- ============================================
-- Google Gemini 配置
-- 官网: https://ai.google.dev/
-- 文档: https://ai.google.dev/docs
-- 配置文件: ~/.gemini/settings.json
-- ============================================

-- Gemini 官方 API
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  5, 
  'gemini', 
  'Google Gemini (官方)', 
  'YOUR_GOOGLE_API_KEY_HERE', 
  'https://generativelanguage.googleapis.com/v1beta', 
  '{"main":"gemini-2.0-flash"}', 
  0, 
  datetime('now'), 
  datetime('now')
);

-- ============================================
-- 第三方代理服务配置示例
-- ============================================

-- OpenRouter (多模型代理)
-- 官网: https://openrouter.ai
INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (
  6, 
  'claude', 
  'OpenRouter 代理', 
  'sk-or-v1-YOUR_OPENROUTER_KEY_HERE', 
  'https://openrouter.ai/api/v1', 
  '{"main":"anthropic/claude-sonnet-4","haiku":"anthropic/claude-3-5-haiku","sonnet":"anthropic/claude-sonnet-4","opus":"anthropic/claude-3-opus"}', 
  0, 
  datetime('now'), 
  datetime('now')
);

-- ============================================
-- 模型说明
-- ============================================
-- Claude 模型:
--   claude-sonnet-4-20250514  - 最新 Sonnet 4 模型，平衡性能和速度
--   claude-3-5-haiku-20241022 - 快速响应模型，适合简单任务
--   claude-3-opus-20240229    - 最强大模型，适合复杂推理
--
-- OpenAI/Codex 模型:
--   codex-mini-latest - Codex 最新迷你模型
--   gpt-4o            - GPT-4 Omni，多模态模型
--   gpt-4o-mini       - GPT-4 Omni 迷你版
--   o1 / o1-preview   - OpenAI 推理模型
--
-- Gemini 模型:
--   gemini-2.0-flash  - 最新快速模型
--   gemini-1.5-pro    - 高性能模型
--
-- Codex 配置说明 (官方值):
--   approvalPolicy: on-request (请求时) | never (从不) | untrusted (不信任) | on-failure (失败时)
--   sandboxMode: off (关闭) | workspace-write (工作区写入) | read-only (只读) | danger-full-access (完全访问)
--
-- 使用提示:
-- 1. 将 YOUR_API_KEY_HERE 替换为你的实际 API 密钥
-- 2. 导入后可在 UI 中编辑和切换配置
-- 3. 支持本地、WSL、SSH Remote 三种环境
