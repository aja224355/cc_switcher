use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub base_url: String,
    pub auth_token: String,
    pub description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

impl Profile {
    pub fn new(base_url: String, auth_token: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            base_url,
            auth_token,
            description: None,
            created_at: Some(now.clone()),
            updated_at: Some(now),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub current: Option<String>,
    pub profiles: HashMap<String, Profile>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            current: None,
            profiles: HashMap::new(),
        }
    }

    pub fn get_profile(&self, name: &str) -> Option<&Profile> {
        self.profiles.get(name)
    }

    pub fn add_profile(&mut self, name: String, profile: Profile) -> bool {
        if self.profiles.contains_key(&name) {
            return false;
        }
        self.profiles.insert(name, profile);
        true
    }

    pub fn update_profile(&mut self, name: &str, profile: Profile) -> bool {
        if self.profiles.contains_key(name) {
            self.profiles.insert(name.to_string(), profile);
            true
        } else {
            false
        }
    }

    pub fn delete_profile(&mut self, name: &str) -> bool {
        if self.profiles.remove(name).is_some() {
            if self.current.as_ref() == Some(&name.to_string()) {
                self.current = None;
            }
            true
        } else {
            false
        }
    }

    pub fn set_current(&mut self, name: &str) -> bool {
        if self.profiles.contains_key(name) {
            self.current = Some(name.to_string());
            true
        } else {
            false
        }
    }

    pub fn get_current_profile(&self) -> Option<&Profile> {
        self.current.as_ref().and_then(|name| self.profiles.get(name))
    }

    pub fn list_profiles(&self) -> Vec<String> {
        self.profiles.keys().cloned().collect()
    }
}

impl Default for Config {
    fn default() -> Self {
        Self::new()
    }
}
