use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

const APP_TITLE: &str = "Ruang Bacaan Admin";

// Argumen WebView2: izinkan suara diputar otomatis dan jangan perlambat jendela yang
// tersembunyi di tray. HARUS sama persis dengan `additionalBrowserArgs` di tauri.conf.json,
// karena di Windows semua jendela dalam satu aplikasi wajib memakai argumen yang sama.
const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows";

// Ukuran popup pesanan baru (logical pixel) dan jaraknya dari tepi layar
const ALERT_W: f64 = 380.0;
const ALERT_H: f64 = 184.0;
const ALERT_MARGIN: f64 = 14.0;

// Ukuran gambar ikon tray dan overlay taskbar yang digambar oleh antarmuka
const TRAY_SIZE: u32 = 64;
const OVERLAY_SIZE: u32 = 32;

/// Tampilkan jendela utama dan bawa ke depan.
fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Letakkan popup di pojok kanan bawah area kerja layar (di atas taskbar).
fn place_alert(app: &AppHandle) {
    let Some(alert) = app.get_webview_window("alert") else { return };
    let monitor = app
        .get_webview_window("main")
        .and_then(|w| w.current_monitor().ok().flatten())
        .or_else(|| alert.primary_monitor().ok().flatten());
    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let area = monitor.work_area();
        let w = (ALERT_W * scale) as i32;
        let h = (ALERT_H * scale) as i32;
        let m = (ALERT_MARGIN * scale) as i32;
        let x = area.position.x + area.size.width as i32 - w - m;
        let y = area.position.y + area.size.height as i32 - h - m;
        let _ = alert.set_position(PhysicalPosition::new(x, y));
    }
}

/// Munculkan popup pesanan baru di pojok kanan bawah.
/// Popup tetap tampil (selalu di atas) sampai admin menekan salah satu tombolnya
/// atau pesanannya diproses.
#[tauri::command]
fn show_alert(app: AppHandle) {
    place_alert(&app);
    if let Some(alert) = app.get_webview_window("alert") {
        let _ = alert.show();
        let _ = alert.set_always_on_top(true);
    }
}

#[tauri::command]
fn hide_alert(app: AppHandle) {
    if let Some(alert) = app.get_webview_window("alert") {
        let _ = alert.hide();
    }
}

/// Dari popup: tutup popup lalu buka jendela utama.
#[tauri::command]
fn open_main(app: AppHandle) {
    hide_alert(app.clone());
    show_main(&app);
}

/// Perbarui jumlah pesanan menunggu: judul jendela, tooltip tray,
/// ikon tray berangka, dan angka di ikon taskbar.
/// `tray_rgba` (64x64) dan `overlay_rgba` (32x32) digambar oleh antarmuka;
/// kosongkan keduanya saat tidak ada pesanan untuk kembali ke ikon normal.
#[tauri::command]
fn update_pending(app: AppHandle, count: u32, tray_rgba: Vec<u8>, overlay_rgba: Vec<u8>) {
    let tooltip = if count == 0 {
        APP_TITLE.to_string()
    } else {
        format!("{APP_TITLE} ({count} pesanan menunggu)")
    };
    let title = if count == 0 {
        APP_TITLE.to_string()
    } else {
        format!("({count}) {APP_TITLE}")
    };

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(tooltip.as_str()));
        let valid_tray = count > 0 && tray_rgba.len() == (TRAY_SIZE * TRAY_SIZE * 4) as usize;
        let icon = if valid_tray {
            Some(Image::new_owned(tray_rgba, TRAY_SIZE, TRAY_SIZE))
        } else {
            app.default_window_icon().cloned()
        };
        let _ = tray.set_icon(icon);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(&title);

        // Angka kecil di ikon taskbar (khusus Windows)
        #[cfg(windows)]
        {
            let valid_overlay =
                count > 0 && overlay_rgba.len() == (OVERLAY_SIZE * OVERLAY_SIZE * 4) as usize;
            let overlay = if valid_overlay {
                Some(Image::new_owned(overlay_rgba, OVERLAY_SIZE, OVERLAY_SIZE))
            } else {
                None
            };
            let _ = window.set_overlay_icon(overlay);
        }
    }
    #[cfg(not(windows))]
    let _ = (overlay_rgba, OVERLAY_SIZE);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Hanya satu jendela: membuka aplikasi lagi akan memunculkan jendela yang sudah ada
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![
            update_pending,
            show_alert,
            hide_alert,
            open_main
        ])
        .setup(|app| {
            // Ikon tray beserta menunya
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

            // Popup pesanan baru: tanpa bingkai, selalu di atas, tidak muncul di taskbar,
            // dan tidak merebut fokus dari aplikasi yang sedang dipakai.
            WebviewWindowBuilder::new(app, "alert", WebviewUrl::App("index.html".into()))
                .title("Pesanan baru")
                .inner_size(ALERT_W, ALERT_H)
                .resizable(false)
                .maximizable(false)
                .minimizable(false)
                .decorations(false)
                .shadow(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .focused(false)
                .focusable(false)
                .visible(false)
                .additional_browser_args(BROWSER_ARGS)
                .build()?;

            // Saat dijalankan otomatis bersama Windows, mulai tersembunyi di tray
            let start_hidden = std::env::args().any(|arg| arg == "--minimized");
            if !start_hidden {
                show_main(app.handle());
            }
            Ok(())
        })
        // Tombol X jendela utama menyembunyikannya ke tray agar pemantauan pesanan tetap berjalan
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ruang Bacaan Admin");
}
