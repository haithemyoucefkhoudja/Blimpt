#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::time::Duration;
use std::{env, thread};
use tauri::{Emitter, Manager};
use tauri::Window;

const DETACHED_PROCESS: u32 = 0x00000008;
const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn start_setup(window: Window) {
    thread::spawn(move || {
        if !is_docker_installed() {
            window.emit("docker-check", false).unwrap();
            // Update store with dockerInstalled = false
            return;
        }
        // Do not auto-install Docker; proceed to run SearXNG.
        run_searxng(&window).unwrap_or_else(|e| {
            window.emit("error", e.to_string()).unwrap();
        });
    });
}

fn is_docker_installed() -> bool {
    let is_installed = Command::new("docker")
        .creation_flags(CREATE_NO_WINDOW)
        .arg("--version")
        .output()
        .is_ok();

    is_installed
}
// fn install_docker(window: &Window) -> Result<(), Box<dyn std::error::Error>> {
//     window
//         .emit("docker-install", "Starting Docker installation...")
//         .unwrap();

//     #[cfg(target_os = "windows")]
//     {
//         let docker_installer_url =
//             "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe";
//         let installer_path = "docker_installer.exe";
//         if !Path::new(installer_path).exists() {
//             window
//                 .emit("docker-install", "Downloading Docker installer...")
//                 .unwrap();
//             download_file(docker_installer_url, installer_path)?;
//         }
//         window
//             .emit("docker-install", "Running Docker installer...")
//             .unwrap();
//         let status = Command::new("cmd")
//             .arg("/C")
//             .arg(installer_path)
//             .spawn()?
//             .wait()?;
//         if !status.success() {
//             return Err("Docker installation failed".into());
//         }
//     }

//     window
//         .emit("docker-install", "Docker installation completed.")
//         .unwrap();
//     Ok(())
// }
#[cfg(target_os = "windows")]
fn clean_path(path: &str) -> &str {
    path.trim_start_matches(r"\\?\")
}

#[cfg(not(target_os = "windows"))]
fn clean_path(path: &str) -> &str {
    path
}
fn get_searxng_port() -> String {
    let output = Command::new("docker")
        .args(&["ps", "--filter", "name=searxng", "--format", "{{.Ports}}"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .expect("Failed to execute docker ps command");

    let stdout = String::from_utf8_lossy(&output.stdout);
    for mapping in stdout.trim().split(',') {
        let mapping = mapping.trim();
        // The mapping is expected to be like "0.0.0.0:8081->8080/tcp"
        // We look for the mapping that directs to container port 8080
        if mapping.contains("->8080") {
            // Split mapping by "->" and then extract host port from the first part.
            let parts: Vec<&str> = mapping.split("->").collect();
            if let Some(host_part) = parts.get(0) {
                if let Some(colon_idx) = host_part.rfind(':') {
                    let port = &host_part[colon_idx + 1..];
                    if !port.is_empty() {
                        return port.to_string();
                    }
                }
            }
        }
    }
    String::new()
}
fn run_searxng(window: &Window) -> Result<(), Box<dyn std::error::Error>> {
    
    if let Some(docker_path) = find_docker_path() {
        window
            .emit("searxng-run", "Starting Docker Desktop...")
            .unwrap();
        Command::new("cmd")
            .creation_flags(DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW)
            .args(&["/C", "start", "", "/B", &docker_path])
            .spawn()?;
    } else {
        return Err("Docker Desktop installation not found".into());
    }

    window
        .emit("docker-run", "Waiting for Docker Engine to start...")
        .unwrap();
    let mut docker_ready = false;
    for _ in 0..59 {
        let status = Command::new("docker")
            .arg("info")
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .unwrap_or_else(|_| std::process::exit(1));

        if status.success() {
            docker_ready = true;
            break;
        }
        thread::sleep(Duration::from_secs(1));
    }

    if !docker_ready {
        return Err("Docker Engine failed to start".into());
    }
    window
        .emit("searxng-check", "Checking for SearXNG image...")
        .unwrap();
    let image_exists = Command::new("docker")
        .arg("image")
        .arg("inspect")
        .arg("searxng/searxng")
        .creation_flags(CREATE_NO_WINDOW)
        .status()?
        .success();

    if !image_exists {
        window
            .emit("searxng-check", "Pulling SearXNG image...")
            .unwrap();
        let status = Command::new("docker")
            .arg("pull")
            .arg("searxng/searxng")
            .creation_flags(CREATE_NO_WINDOW)
            .status()?;

        if !status.success() {
            return Err("Failed to pull image".into());
        }
    }

    window
        .emit("searxng-run", "Starting SearXNG container...")
        .unwrap();
    // let current_dir = env::current_dir()
    //     .map_err(|e| e.to_string())?
    //     .to_string_lossy()
    //     .into_owned();
    let binding = window.path().resource_dir().unwrap();
    let mut path = binding.to_str().unwrap().to_string(); // Convert to mutable String
    path = clean_path(&path).to_string(); // Now you can reassign
    println!("{}", path);  // This will show the "normal" path
    let candidate_ports = [8080, 8081, 8082, 8083, 8084, 8085];
    let mut success = false;
    for port in candidate_ports.iter() {
        // Check if the candidate port is available
        let addr = format!("127.0.0.1:{}", port);
        match std::net::TcpListener::bind(&addr) {
            Ok(listener) => {
                // Port is free, close the listener and try running the container.
                drop(listener);
                let mapping = format!("{}:8080", port);
                let status = Command::new("docker")
                    .args(&["run", "--rm", "-d"])
                    .args(&["--name", "searxng"])
                    .args(&["-p", &mapping])
                    .args(&["-v", &format!("{}/searxng:/etc/searxng", path)])
                    .args(&["-e", &format!("BASE_URL=http://localhost:{}/", port)])
                    .args(&["-e", "INSTANCE_NAME=my-instance"])
                    .arg("searxng/searxng")
                    .creation_flags(CREATE_NO_WINDOW)
                    .status()
                    .map_err(|e| e.to_string())?;
                if status.success() {
                    window.emit("searxng-done", format!("{}", port)).unwrap();
                    success = true;
                    break;
                }
            }
            Err(_) => {
                // Port already in use, try next candidate.
                continue;
            }
        }
    }

    if !success {
        window
            .emit(
                "error",
                "Failed to run container on available ports".to_string(),
            )
            .unwrap();
        return Err("Failed to run container on available ports".into());
    }
    Ok(())
}

fn find_docker_path() -> Option<String> {
    let output = Command::new("powershell")
        .arg("-Command")
        .arg("(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Docker Desktop').InstallLocation")
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;

    let path = std::str::from_utf8(&output.stdout).ok()?.trim().to_string();

    if path.is_empty() {
        None
    } else {
        Some(format!("{}\\Docker Desktop.exe", path))
    }
}

#[tauri::command]
pub fn get_searxng_state() -> String {
    // Utilize your internal check
    return get_searxng_port();
}
