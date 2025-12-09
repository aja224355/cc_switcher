use eframe::egui;
use cc_switcher_gui::config::manager::ConfigManager;
use cc_switcher_gui::models::config::{Config, Profile};
use cc_switcher_gui::utils::environment::EnvironmentManager;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
enum View {
    ProfileList,
    AddProfile,
    EditProfile(String),
    RemoteConfig,
    Settings,
}

struct AppState {
    config_manager: ConfigManager,
    config: Arc<Mutex<Config>>,
    current_view: Arc<Mutex<View>>,
    // Form fields for adding/editing profiles
    new_profile_name: String,
    new_profile_url: String,
    new_profile_token: String,
    new_profile_description: String,
    // Remote config fields
    remote_host: String,
    remote_port: String,
    remote_username: String,
    remote_auth_method: String,
    remote_auth_value: String,
}

impl AppState {
    fn new() -> Self {
        let config_manager = ConfigManager::new().expect("Failed to initialize config manager");
        let config = config_manager.load_config().unwrap_or_else(|_| Config::new());
        
        Self {
            config_manager,
            config: Arc::new(Mutex::new(config)),
            current_view: Arc::new(Mutex::new(View::ProfileList)),
            new_profile_name: String::new(),
            new_profile_url: "https://api.anthropic.com".to_string(),
            new_profile_token: String::new(),
            new_profile_description: String::new(),
            remote_host: String::new(),
            remote_port: "22".to_string(),
            remote_username: String::new(),
            remote_auth_method: "password".to_string(),
            remote_auth_value: String::new(),
        }
    }

    fn save_config(&self) -> Result<(), String> {
        if let Ok(config_guard) = self.config.lock() {
            self.config_manager.save_config(&config_guard)
                .map_err(|e| e.to_string())
        } else {
            Err("Failed to lock config".to_string())
        }
    }
}

impl eframe::App for AppState {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::TopBottomPanel::top("top_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.label(egui::RichText::new("Claude Code Switcher").heading());
                ui.separator();
                if ui.button("Settings").clicked() {
                    if let Ok(mut view) = self.current_view.lock() {
                        *view = View::Settings;
                    }
                }
                if ui.button("Remote Config").clicked() {
                    if let Ok(mut view) = self.current_view.lock() {
                        *view = View::RemoteConfig;
                    }
                }
            });
        });

        let view = self
            .current_view
            .lock()
            .map(|v| v.clone())
            .unwrap_or(View::ProfileList);

        match view {
            View::ProfileList => self.show_profile_list(ctx),
            View::AddProfile => self.show_add_profile(ctx),
            View::EditProfile(name) => self.show_edit_profile(ctx, &name),
            View::RemoteConfig => self.show_remote_config(ctx),
            View::Settings => self.show_settings(ctx),
        }
    }
}

impl AppState {
    fn show_profile_list(&mut self, ctx: &egui::Context) {
        let (profiles, current) = if let Ok(config_guard) = self.config.lock() {
            let current = config_guard.current.clone();
            let profiles = config_guard
                .list_profiles()
                .into_iter()
                .filter_map(|name| {
                    config_guard
                        .get_profile(&name)
                        .cloned()
                        .map(|profile| (name, profile))
                })
                .collect::<Vec<_>>();

            (profiles, current)
        } else {
            (Vec::new(), None)
        };

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.heading("Profiles");
                ui.add_space(ui.available_width() - 100.0);
                if ui.button("+ Add Profile").clicked() {
                    if let Ok(mut view) = self.current_view.lock() {
                        *view = View::AddProfile;
                    }
                }
            });

            if profiles.is_empty() {
                ui.label("No profiles configured. Click 'Add Profile' to get started.");
            } else {
                egui::ScrollArea::vertical().show(ui, |ui| {
                    for (name, profile) in profiles.iter() {
                        let is_current = current.as_ref() == Some(name);
                        self.show_profile_item(ui, name, profile, is_current);
                    }
                });
            }
        });
    }

    fn show_profile_item(&mut self, ui: &mut egui::Ui, name: &str, profile: &Profile, is_current: bool) {
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.horizontal(|ui| {
                ui.vertical(|ui| {
                    ui.label(egui::RichText::new(name).heading());
                    ui.label(egui::RichText::new(&profile.base_url).monospace().small());
                    ui.label(
                        egui::RichText::new(if is_current { "Currently Active" } else { "Inactive" })
                            .small()
                            .color(if is_current { egui::Color32::GREEN } else { egui::Color32::GRAY })
                    );
                    if let Some(desc) = &profile.description {
                        ui.label(egui::RichText::new(desc).small().italics());
                    }
                });
                
                ui.add_space(ui.available_width() - 200.0);
                
                ui.vertical(|ui| {
                    if !is_current {
                        if ui.button("Activate").clicked() {
                            if let Ok(mut config_guard) = self.config.lock() {
                                config_guard.set_current(name);
                                
                                // Apply to environment
                                if let Some(profile) = config_guard.get_profile(name) {
                                    let _ = EnvironmentManager::apply_profile(profile);
                                }
                                
                                let _ = self.save_config();
                            }
                        }
                    } else {
                        ui.add_enabled(false, egui::Button::new("Active"));
                    }
                    
                    if ui.button("Edit").clicked() {
                        if let Ok(mut view) = self.current_view.lock() {
                            *view = View::EditProfile(name.to_string());
                        }
                    }
                    
                    if ui.button("Delete").clicked() {
                        if let Ok(mut config_guard) = self.config.lock() {
                            config_guard.delete_profile(name);
                            let _ = self.save_config();
                        }
                    }
                });
            });
        });
    }

    fn show_add_profile(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Add New Profile");

            egui::Grid::new("add_profile_grid")
                .num_columns(2)
                .spacing([10.0, 10.0])
                .show(ui, |ui| {
                    ui.label("Profile Name:");
                    ui.text_edit_singleline(&mut self.new_profile_name);
                    
                    ui.label("Base URL:");
                    ui.text_edit_singleline(&mut self.new_profile_url);
                    
                    ui.label("Auth Token:");
                    ui.add(egui::TextEdit::singleline(&mut self.new_profile_token).password(true));
                    
                    ui.label("Description:");
                    ui.add(egui::TextEdit::multiline(&mut self.new_profile_description));
                });

            ui.add_space(20.0);

            ui.horizontal(|ui| {
                if ui.button("Save").clicked() {
                    if !self.new_profile_name.is_empty() && !self.new_profile_token.is_empty() {
                        let profile = Profile::new(
                            self.new_profile_url.clone(),
                            self.new_profile_token.clone(),
                        );
                        
                        if let Ok(mut config_guard) = self.config.lock() {
                            config_guard.add_profile(self.new_profile_name.clone(), profile);
                            let _ = self.save_config();
                        }
                        
                        // Clear form
                        self.new_profile_name.clear();
                        self.new_profile_url = "https://api.anthropic.com".to_string();
                        self.new_profile_token.clear();
                        self.new_profile_description.clear();
                        
                        // Go back to list
                        if let Ok(mut view) = self.current_view.lock() {
                            *view = View::ProfileList;
                        }
                    }
                }
                
                if ui.button("Cancel").clicked() {
                    if let Ok(mut view) = self.current_view.lock() {
                        *view = View::ProfileList;
                    }
                }
            });
        });
    }

    fn show_edit_profile(&mut self, ctx: &egui::Context, name: &str) {
        if let Ok(config_guard) = self.config.lock() {
            if let Some(profile) = config_guard.get_profile(name) {
                egui::CentralPanel::default().show(ctx, |ui| {
                    ui.heading(format!("Edit Profile: {}", name));

                    // Create mutable copies for editing
                    let mut edit_url = profile.base_url.clone();
                    let mut edit_token = profile.auth_token.clone();
                    let mut edit_description = profile.description.clone().unwrap_or_default();

                    egui::Grid::new("edit_profile_grid")
                        .num_columns(2)
                        .spacing([10.0, 10.0])
                        .show(ui, |ui| {
                            ui.label("Base URL:");
                            ui.text_edit_singleline(&mut edit_url);
                            
                            ui.label("Auth Token:");
                            ui.add(egui::TextEdit::singleline(&mut edit_token).password(true));
                            
                            ui.label("Description:");
                            ui.add(egui::TextEdit::multiline(&mut edit_description));
                        });

                    ui.add_space(20.0);

                    ui.horizontal(|ui| {
                        if ui.button("Save").clicked() {
                            let mut updated_profile = Profile::new(edit_url, edit_token);
                            updated_profile.description = Some(edit_description);
                            
                            if let Ok(mut config_guard) = self.config.lock() {
                                config_guard.update_profile(name, updated_profile);
                                let _ = self.save_config();
                            }
                            
                            // Go back to list
                            if let Ok(mut view) = self.current_view.lock() {
                                *view = View::ProfileList;
                            }
                        }
                        
                        if ui.button("Cancel").clicked() {
                            if let Ok(mut view) = self.current_view.lock() {
                                *view = View::ProfileList;
                            }
                        }
                    });
                });
            }
        }
    }

    fn show_remote_config(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Remote Configuration");
            ui.label("Configure remote Linux servers to sync Claude Code settings");

            egui::Grid::new("remote_config_grid")
                .num_columns(2)
                .spacing([10.0, 10.0])
                .show(ui, |ui| {
                    ui.label("Server Host:");
                    ui.text_edit_singleline(&mut self.remote_host);
                    
                    ui.label("Port:");
                    ui.text_edit_singleline(&mut self.remote_port);
                    
                    ui.label("Username:");
                    ui.text_edit_singleline(&mut self.remote_username);
                    
                    ui.label("Auth Method:");
                    egui::ComboBox::from_id_source("auth_method")
                        .selected_text(&self.remote_auth_method)
                        .show_ui(ui, |ui| {
                            ui.selectable_value(&mut self.remote_auth_method, "password".to_string(), "Password");
                            ui.selectable_value(&mut self.remote_auth_method, "key".to_string(), "SSH Key");
                        });
                    
                    ui.label(if self.remote_auth_method == "password" { "Password:" } else { "Key Path:" });
                    if self.remote_auth_method == "password" {
                        ui.add(egui::TextEdit::singleline(&mut self.remote_auth_value).password(true));
                    } else {
                        ui.text_edit_singleline(&mut self.remote_auth_value);
                    }
                });

            ui.add_space(20.0);

            ui.horizontal(|ui| {
                if ui.button("Test Connection").clicked() {
                    // TODO: Implement connection test
                    ui.label("Connection test would be implemented here");
                }
                
                if ui.button("Push Current Config").clicked() {
                    // TODO: Implement config push
                    ui.label("Config push would be implemented here");
                }
                
                if ui.button("Back").clicked() {
                    if let Ok(mut view) = self.current_view.lock() {
                        *view = View::ProfileList;
                    }
                }
            });
        });
    }

    fn show_settings(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Settings");

            ui.collapsing("Configuration", |ui| {
                if let Some(config_path) = self.config_manager.config_path().to_str() {
                    ui.label(format!("Config file: {}", config_path));
                }
                
                ui.horizontal(|ui| {
                    if ui.button("Export Configuration").clicked() {
                        // TODO: Implement export
                        ui.label("Export would be implemented here");
                    }
                    
                    if ui.button("Import Configuration").clicked() {
                        // TODO: Implement import
                        ui.label("Import would be implemented here");
                    }
                });
            });

            ui.collapsing("Environment", |ui| {
                if ui.button("Clear Environment Variables").clicked() {
                    EnvironmentManager::clear_env_vars();
                    ui.label("Environment variables cleared");
                }
                
                if ui.button("Generate Export Script").clicked() {
                    if let Ok(config_guard) = self.config.lock() {
                        if let Some(profile) = config_guard.get_current_profile() {
                            let _script = EnvironmentManager::generate_export_script(profile);
                            ui.label("Export script generated");
                            // TODO: Show script in a dialog
                        }
                    }
                }
            });

            ui.add_space(20.0);
            
            if ui.button("Back").clicked() {
                if let Ok(mut view) = self.current_view.lock() {
                    *view = View::ProfileList;
                }
            }
        });
    }
}

fn main() -> Result<(), eframe::Error> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([800.0, 600.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Claude Code Switcher",
        options,
        Box::new(|_cc| Box::new(AppState::new())),
    )
}
