use anyhow::{Result, Context};
use ssh2::Session;
use std::net::TcpStream;
use std::io::{Read, Write};
use std::path::Path;
use rpassword::read_password;

#[derive(Debug, Clone)]
pub struct RemoteServer {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub key_path: Option<String>,
}

impl RemoteServer {
    pub fn new(host: String, username: String) -> Self {
        Self {
            host,
            port: 22,
            username,
            password: None,
            key_path: None,
        }
    }

    pub fn with_port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    pub fn with_password(mut self, password: String) -> Self {
        self.password = Some(password);
        self
    }

    pub fn with_key_path(mut self, key_path: String) -> Self {
        self.key_path = Some(key_path);
        self
    }
}

pub struct RemoteConfigManager;

impl RemoteConfigManager {
    pub async fn connect(server: &RemoteServer) -> Result<Session> {
        let tcp = TcpStream::connect((server.host.as_str(), server.port))
            .context("Failed to connect to remote server")?;
        
        let mut session = Session::new()
            .context("Failed to create SSH session")?;
        
        session.set_tcp_stream(tcp);
        session.handshake()
            .context("SSH handshake failed")?;
        
        // Authenticate
        if let Some(password) = &server.password {
            session.userauth_password(server.username.as_str(), password.as_str())
                .context("SSH password authentication failed")?;
        } else if let Some(key_path) = &server.key_path {
            session.userauth_pubkey_file(
                server.username.as_str(),
                None,
                Path::new(key_path.as_str()),
                None,
            ).context("SSH key authentication failed")?;
        } else {
            return Err(anyhow::anyhow!("No authentication method provided"));
        }
        
        if !session.authenticated() {
            return Err(anyhow::anyhow!("SSH authentication failed"));
        }
        
        Ok(session)
    }

    pub async fn push_config(
        session: &Session, 
        profile_name: &str,
        base_url: &str,
        auth_token: &str
    ) -> Result<()> {
        // Create remote config directory
        let remote_dir = "~/.config/cc_switcher";
        let mkdir_cmd = format!("mkdir -p {}", remote_dir);
        
        Self::execute_command(session, &mkdir_cmd)
            .await
            .context("Failed to create remote config directory")?;

        // Create config JSON
        let config_json = format!(
            r#"{{
  "current": "{}",
  "profiles": {{
    "{}": {{
      "base_url": "{}",
      "auth_token": "{}"
    }}
  }}
}}"#,
            profile_name, profile_name, base_url, auth_token
        );

        // Write config file
        let temp_file = format!("/tmp/cc_switcher_config_{}", std::process::id());
        
        // Write to temporary file first
        let write_cmd = format!("cat > {} << 'EOF'\n{}\nEOF", temp_file, config_json);
        Self::execute_command(session, &write_cmd)
            .await
            .context("Failed to write config to remote temp file")?;

        // Move to final location
        let mv_cmd = format!("mv {} ~/.config/cc_switcher/config.json", temp_file);
        Self::execute_command(session, &mv_cmd)
            .await
            .context("Failed to move config to final location")?;

        // Set proper permissions
        let chmod_cmd = "chmod 600 ~/.config/cc_switcher/config.json";
        Self::execute_command(session, chmod_cmd)
            .await
            .context("Failed to set config file permissions")?;

        Ok(())
    }

    pub async fn execute_command(session: &Session, command: &str) -> Result<String> {
        let mut channel = session.channel_session()
            .context("Failed to create channel")?;
        
        channel.exec(command)
            .context("Failed to execute command")?;
        
        let mut output = String::new();
        channel.read_to_string(&mut output)
            .context("Failed to read command output")?;
        
        let exit_status = channel.exit_status()
            .context("Failed to get exit status")?;
        
        if exit_status != 0 {
            return Err(anyhow::anyhow!("Command failed with exit code {}", exit_status));
        }
        
        Ok(output)
    }

    pub async fn test_connection(server: &RemoteServer) -> Result<bool> {
        match Self::connect(server).await {
            Ok(session) => {
                let result = Self::execute_command(&session, "echo 'Connection test successful'").await;
                match result {
                    Ok(_) => Ok(true),
                    Err(_) => Ok(false),
                }
            }
            Err(_) => Ok(false),
        }
    }

    pub fn prompt_password() -> Result<String> {
        print!("Password: ");
        std::io::stdout().flush()?;
        let password = read_password()?;
        Ok(password)
    }
}
