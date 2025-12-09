use crate::models::config::Config;
use anyhow::{Result, Context};
use std::path::PathBuf;
use std::fs;

pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Result<Self> {
        let config_home = std::env::var("XDG_CONFIG_HOME")
            .unwrap_or_else(|_| format!("{}/.config", std::env::var("HOME").unwrap_or_else(|_| "/home/user".to_string())));
        
        let app_config_dir = PathBuf::from(config_home).join("cc_switcher");
        let config_path = app_config_dir.join("config.json");
        
        // Create directory if it doesn't exist
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)
                .context("Failed to create config directory")?;
        }
        
        Ok(Self { config_path })
    }

    pub fn load_config(&self) -> Result<Config> {
        if !self.config_path.exists() {
            return Ok(Config::new());
        }

        let content = fs::read_to_string(&self.config_path)
            .context("Failed to read config file")?;
        
        let config: Config = serde_json::from_str(&content)
            .context("Failed to parse config file")?;
        
        Ok(config)
    }

    pub fn save_config(&self, config: &Config) -> Result<()> {
        let content = serde_json::to_string_pretty(config)
            .context("Failed to serialize config")?;
        
        fs::write(&self.config_path, content)
            .context("Failed to write config file")?;
        
        Ok(())
    }

    pub fn export_config(&self) -> Result<String> {
        let config = self.load_config()?;
        serde_json::to_string_pretty(&config)
            .context("Failed to serialize config for export")
    }

    pub fn import_config(&self, json_content: &str) -> Result<()> {
        let config: Config = serde_json::from_str(json_content)
            .context("Failed to parse imported config")?;
        
        self.save_config(&config)
    }

    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }
}

impl Default for ConfigManager {
    fn default() -> Self {
        Self::new().expect("Failed to initialize config manager")
    }
}
