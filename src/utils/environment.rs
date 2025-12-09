use crate::models::config::Profile;
use std::env;

pub struct EnvironmentManager;

impl EnvironmentManager {
    pub fn apply_profile(profile: &Profile) -> Result<(), Box<dyn std::error::Error>> {
        // Set environment variables for the current process
        env::set_var("ANTHROPIC_BASE_URL", &profile.base_url);
        env::set_var("ANTHROPIC_AUTH_TOKEN", &profile.auth_token);
        
        Ok(())
    }

    pub fn get_current_env_vars() -> (Option<String>, Option<String>) {
        let base_url = env::var("ANTHROPIC_BASE_URL").ok();
        let auth_token = env::var("ANTHROPIC_AUTH_TOKEN").ok();
        
        (base_url, auth_token)
    }

    pub fn clear_env_vars() {
        env::remove_var("ANTHROPIC_BASE_URL");
        env::remove_var("ANTHROPIC_AUTH_TOKEN");
    }

    pub fn generate_export_script(profile: &Profile) -> String {
        format!(
            "export ANTHROPIC_BASE_URL='{}'\nexport ANTHROPIC_AUTH_TOKEN='{}'",
            escape_shell_var(&profile.base_url),
            escape_shell_var(&profile.auth_token)
        )
    }
}

fn escape_shell_var(var: &str) -> String {
    // Simple shell variable escaping - replace single quotes with escaped version
    var.replace("'", "'\\''")
}
