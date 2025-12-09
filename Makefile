# Claude Code Switcher GUI Makefile

.PHONY: help build run clean test install check format lint

# Default target
help:
	@echo "Claude Code Switcher GUI - Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  build           - Build the application in release mode"
	@echo "  run             - Build and run the application"
	@echo "  debug           - Build in debug mode"
	@echo "  clean           - Clean build artifacts"
	@echo "  check           - Check code without building"
	@echo "  format          - Format Rust code"
	@echo "  lint            - Run clippy linter"
	@echo "  install         - Install Rust and dependencies"
	@echo "  build-windows   - Build for Windows specifically"
	@echo "  build-all       - Build for all platforms (Linux, macOS, Windows)"
	@echo "  help            - Show this help message"
	@echo ""
	@echo "Platform Support:"
	@echo "  ✅ Linux (native)"
	@echo "  ✅ macOS"
	@echo "  ✅ Windows 10/11"

# Build in release mode
build:
	@echo "Building Claude Code Switcher GUI..."
	cargo build --release
	@echo "Build complete! Binary: target/release/cc_switcher_gui"

# Build and run
run:
	@echo "Building and running Claude Code Switcher GUI..."
	cargo run --release

# Build in debug mode
debug:
	@echo "Building in debug mode..."
	cargo build

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean

# Check code without building
check:
	@echo "Checking code..."
	cargo check

# Format Rust code
format:
	@echo "Formatting Rust code..."
	cargo fmt

# Run linter
lint:
	@echo "Running clippy linter..."
	cargo clippy --all-targets --all-features -- -D warnings

# Install Rust and dependencies
install:
	@echo "Installing Rust..."
	@curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	@source ~/.cargo/env && echo "Installing dependencies..."
	@source ~/.cargo/env && cargo install cargo-watch

# Watch for changes and rebuild
watch:
	@echo "Watching for changes..."
	cargo watch -x "run --release"

# Build for multiple platforms
build-all:
	@echo "Building for multiple platforms..."
	cargo build --release --target x86_64-unknown-linux-gnu
	cargo build --release --target x86_64-apple-darwin
	cargo build --release --target x86_64-pc-windows-msvc

# Build for Windows specifically
build-windows:
	@echo "Building for Windows..."
	rustup target add x86_64-pc-windows-msvc
	cargo build --release --target x86_64-pc-windows-msvc
	@echo "Windows build complete! Binary: target/x86_64-pc-windows-msvc/release/cc_switcher_gui.exe"

# Run tests
test:
	@echo "Running tests..."
	cargo test

# Create release package
package:
	@echo "Creating release package..."
	mkdir -p release
	cp target/release/cc_switcher_gui release/
	cp README_GUI.md release/README.md
	tar -czf release/cc_switcher_gui.tar.gz -C release .
	@echo "Package created: release/cc_switcher_gui.tar.gz"

# Install application to system
install-system:
	@echo "Installing to system..."
	sudo cp target/release/cc_switcher_gui /usr/local/bin/
	sudo chmod +x /usr/local/bin/cc_switcher_gui
	@echo "Installed to /usr/local/bin/cc_switcher_gui"
