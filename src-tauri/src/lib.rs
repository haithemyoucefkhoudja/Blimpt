mod helper;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WebviewUrl, WebviewWindowBuilder,
};
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }
#[tauri::command]
fn start_setup(window: tauri::Window) {
    helper::start_setup(window);
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build());

            #[cfg(debug_assertions)]
            const IS_DEV: bool = true;

            #[cfg(not(debug_assertions))]
            const IS_DEV: bool = false;
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Quick Tool")
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .center();

            // WebviewWindowBuilder::new(app, "local", WebviewUrl::App("second".into()))
            //     .title("Local Window")
            //     .visible(false)
            //     .maximized(true)
            //     .build()
            //     .unwrap();

            // let command_window =
            //     WebviewWindowBuilder::new(app, "commands", WebviewUrl::App("commands".into()))
            //         .title("Commands Window")
            //         .visible(false)
            //         .transparent(true)
            //         .decorations(false)
            //         .shadow(false);
            // Create menu items
            let open_local_i =
                MenuItem::with_id(app, "open_local", "Quick Tool Window", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Create the menu with the items
            let menu = Menu::with_items(app, &[&open_local_i, &quit_i])?;

            // Build the tray icon
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "open_local" => {
                        println!("open_local menu item was clicked");
                        app.get_webview_window("main").unwrap().show();
                    }
                    "quit" => {
                        println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .show_menu_on_left_click(true)
                .build(app)?;

            // set transparent title bar only when building for macOS
            #[cfg(target_os = "macos")]
            {
                use tauri::TitleBarStyle;
                let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            }
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
                // Check enable state
                println!(
                    "registered for autostart? {}",
                    autostart_manager.is_enabled().unwrap()
                );
                if IS_DEV {
                    let _ = autostart_manager.disable();
                    println!(
                        "registered for autostart? {}",
                        autostart_manager.is_enabled().unwrap()
                    );
                }
                // // Disable autostart
                // let _ = autostart_manager.disable();
            }

            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_global_shortcut::Builder::new().build());

            let _window = win_builder.build().unwrap();

            // let _local_window = local_window.build().unwrap();
            // let _command_window = command_window.build().unwrap();
            // set background color only when building for macOS
            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                let ns_window = _window.ns_window().unwrap() as id;
                unsafe {
                    let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                        nil,
                        50.0 / 255.0,
                        158.0 / 255.0,
                        163.5 / 255.0,
                        1.0,
                    );
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_setup,
            helper::get_searxng_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
