// Prevents additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
#[cfg(not(debug_assertions))]
use std::net::TcpListener;
use std::net::TcpStream;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use tauri::{Manager, RunEvent, Url};
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandEvent;

struct BackendProcess(Mutex<Option<CommandChild>>);

#[cfg(debug_assertions)]
fn backend_port() -> u16 {
    8000
}

#[cfg(not(debug_assertions))]
fn backend_port() -> u16 {
    find_free_port()
}

#[cfg(not(debug_assertions))]
fn find_free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .expect("failed to bind a local port")
        .local_addr()
        .expect("failed to read the bound local address")
        .port()
}

#[cfg(debug_assertions)]
fn frontend_url(_port: u16) -> String {
    "http://localhost:1420".to_owned()
}

#[cfg(not(debug_assertions))]
fn frontend_url(port: u16) -> String {
    format!("http://127.0.0.1:{port}")
}

fn backend_ready(port: u16) -> bool {
    let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
    let request = b"GET /api/health HTTP/1.0\r\nHost: localhost\r\nConnection: close\r\n\r\n";
    if stream.write_all(request).is_err() {
        return false;
    }
    let mut response = String::new();
    let _ = stream.read_to_string(&mut response);
    response.starts_with("HTTP/1.0 200") || response.starts_with("HTTP/1.1 200")
}

fn kill_backend(child: CommandChild) {
    let pid = child.pid();
    #[cfg(unix)]
    {
        let _ = std::process::Command::new("pkill")
            .args(["-P", &pid.to_string()])
            .output();
    }
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
    }
    let _ = child.kill();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let port = backend_port();
            let url = frontend_url(port);

            #[cfg(not(debug_assertions))]
            {
                let version = app.package_info().version.to_string();
                let (mut rx, child) = app
                    .shell()
                    .sidecar("rebuilt-server")
                    .expect("failed to create the backend sidecar command")
                    .env("HOST", "127.0.0.1")
                    .env("PORT", port.to_string())
                    .env("REBUILT_VERSION", version)
                    .spawn()
                    .expect("failed to spawn the backend sidecar");

                app.state::<BackendProcess>()
                    .0
                    .lock()
                    .unwrap()
                    .replace(child);

                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line) => {
                                print!("[backend] {}", String::from_utf8_lossy(&line));
                            }
                            CommandEvent::Stderr(line) => {
                                eprint!("[backend] {}", String::from_utf8_lossy(&line));
                            }
                            CommandEvent::Terminated(payload) => {
                                eprintln!("[backend] terminated: {payload:?}");
                            }
                            _ => {}
                        }
                    }
                });
            }

            let window = app
                .get_webview_window("main")
                .expect("main window is missing");
            thread::spawn(move || {
                for _ in 0..300 {
                    if backend_ready(port) {
                        if let Ok(target) = Url::parse(&url) {
                            let _ = window.navigate(target);
                        }
                        return;
                    }
                    thread::sleep(Duration::from_millis(200));
                }
                eprintln!("backend did not become ready in time");
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the tauri application")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = event
                && let Some(child) = app.state::<BackendProcess>().0.lock().unwrap().take()
            {
                kill_backend(child);
            }
        });
}
