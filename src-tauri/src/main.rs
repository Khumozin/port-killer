#![cfg_attr(
    all(not(debug_assertions), target_os = "macos"),
    windows_subsystem = "macos"
)]

use std::process::Command;
use tauri::{command, Manager};

#[derive(serde::Serialize)]
struct Processinfo {
    pid: String,
    command: String,
    user: String,
}

#[command]
fn list_processes(port: u16) -> Result<Vec<Processinfo>, String> {
    let output = Command::new("lsof")
        .args(["-n", "-P", "-i", &format!("tcp:{}", port), "-sTCP:LISTEN"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut processes = Vec::new();

    for line in stdout.lines().skip(1) {
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() >= 3 {
            processes.push(Processinfo {
                command: cols[0].to_string(),
                pid: cols[1].to_string(),
                user: cols[2].to_string(),
            });
        }
    }

    Ok(processes)
}

#[command]
fn kill_pids(pids: Vec<String>) -> Result<String, String> {
    if pids.is_empty() {
        return Ok("No processes to kill".into());
    }

    Command::new("kill")
        .arg("-9")
        .args(&pids)
        .status()
        .map_err(|e| e.to_string())?;

    Ok(format!("Killed {}", pids.join(", ")))
}

#[command]
fn scan_common_ports() -> Vec<u16> {
    vec![4200, 4201, 3000, 3001, 5173, 5000]
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_processes,
            kill_pids,
            scan_common_ports
        ])
        .run(tauri::generate_context!())
        .expect("Error while running app");
}
