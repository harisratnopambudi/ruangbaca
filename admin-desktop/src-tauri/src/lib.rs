use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, WindowEvent,
};

const APP_TITLE: &str = "Ruang Bacaan Admin";

/// Tampilkan jendela utama dan bawa ke depan.
fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Dipanggil dari antarmuka setiap kali jumlah pesanan menunggu berubah:
/// memperbarui judul jendela dan tooltip ikon tray.
#[tauri::command]
fn set_pending(app: AppHandle, count: u32) {
    let label = if count == 0 {
        APP_TITLE.to_string()
    } else {
        format!("{APP_TITLE} ({count} pesanan menunggu)")
    };
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(label.as_str()));
    }
    if let Some(window) = app.get_webview_window("main") {
        let title = if count == 0 {
            APP_TITLE.to_string()
        } else {
            format!("({count}) {APP_TITLE}")
        };
        let _ = window.set_title(&title);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Hanya satu jendela: membuka aplikasi lagi akan memunculkan jendela yang sudah ada
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![set_pending])
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Buka Ruang Bacaan Admin", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Keluar", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;

            let mut tray = TrayIconBuilder::with_id("main")
                .tooltip(APP_TITLE)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            // Saat dijalankan otomatis bersama Windows, mulai tersembunyi di tray
            let start_hidden = std::env::args().any(|arg| arg == "--minimized");
            if !start_hidden {
                show_main(app.handle());
            }
            Ok(())
        })
        // Tombol X menyembunyikan jendela ke tray agar notifikasi pesanan tetap berjalan
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ruang Bacaan Admin");
}
