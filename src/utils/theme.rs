use eframe::egui;

#[derive(Clone)]
pub struct ThemePalette {
    pub primary: egui::Color32,
    pub surface: egui::Color32,
    pub border: egui::Color32,
    pub muted: egui::Color32,
    pub success: egui::Color32,
}

impl ThemePalette {
    pub fn default() -> Self {
        Self {
            primary: egui::Color32::from_rgb(58, 106, 255),
            surface: egui::Color32::from_rgb(247, 248, 251),
            border: egui::Color32::from_rgb(220, 224, 233),
            muted: egui::Color32::from_rgb(118, 126, 146),
            success: egui::Color32::from_rgb(46, 204, 113),
        }
    }
}

pub fn apply_theme(ctx: &egui::Context) {
    let mut style = (*ctx.style()).clone();
    style.spacing.item_spacing = egui::vec2(10.0, 10.0);
    style.spacing.window_margin = egui::Margin::symmetric(16.0, 16.0);
    style.spacing.button_padding = egui::vec2(12.0, 8.0);
    style.visuals.widgets.inactive.rounding = egui::Rounding::same(8.0);
    style.visuals.widgets.hovered.rounding = egui::Rounding::same(8.0);
    style.visuals.widgets.active.rounding = egui::Rounding::same(8.0);
    style.visuals.widgets.inactive.bg_fill = egui::Color32::from_rgb(240, 242, 247);
    style.visuals.widgets.hovered.bg_fill = egui::Color32::from_rgb(232, 236, 244);
    style.visuals.widgets.active.bg_fill = egui::Color32::from_rgb(220, 224, 233);
    style.visuals.window_rounding = egui::Rounding::same(12.0);
    style.visuals.panel_fill = egui::Color32::from_rgb(249, 250, 252);
    style.text_styles.insert(
        egui::TextStyle::Heading,
        egui::FontId::new(22.0, egui::FontFamily::Proportional),
    );
    style.text_styles.insert(
        egui::TextStyle::Body,
        egui::FontId::new(16.0, egui::FontFamily::Proportional),
    );
    style.text_styles.insert(
        egui::TextStyle::Small,
        egui::FontId::new(13.0, egui::FontFamily::Proportional),
    );
    ctx.set_style(style);
}

