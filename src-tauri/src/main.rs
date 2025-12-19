#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::command;

#[derive(serde::Serialize)]
struct Processinfo {
    pid: String,
    command: String,
    user: String,
}

/// Parse lsof output into a vector of ProcessInfo structs
fn parse_lsof_output(output: &str) -> Vec<Processinfo> {
    let mut processes = Vec::new();

    for line in output.lines().skip(1) {
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() >= 3 {
            processes.push(Processinfo {
                command: cols[0].to_string(),
                pid: cols[1].to_string(),
                user: cols[2].to_string(),
            });
        }
    }

    processes
}

#[command]
fn list_processes(port: u16) -> Result<Vec<Processinfo>, String> {
    let output = Command::new("lsof")
        .args(["-n", "-P", "-i", &format!("tcp:{}", port), "-sTCP:LISTEN"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(parse_lsof_output(&stdout))
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_common_ports_returns_expected_ports() {
        let ports = scan_common_ports();
        assert_eq!(ports, vec![4200, 4201, 3000, 3001, 5173, 5000]);
    }

    #[test]
    fn test_scan_common_ports_length() {
        let ports = scan_common_ports();
        assert_eq!(ports.len(), 6);
    }

    #[test]
    fn test_parse_lsof_output_with_valid_data() {
        let output = "COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nnode      1234  john   21u  IPv4  0x123   0t0  TCP *:3000 (LISTEN)\nPython    5678  jane   3u   IPv6  0x456   0t0  TCP *:4200 (LISTEN)";

        let processes = parse_lsof_output(output);

        assert_eq!(processes.len(), 2);
        assert_eq!(processes[0].command, "node");
        assert_eq!(processes[0].pid, "1234");
        assert_eq!(processes[0].user, "john");
        assert_eq!(processes[1].command, "Python");
        assert_eq!(processes[1].pid, "5678");
        assert_eq!(processes[1].user, "jane");
    }

    #[test]
    fn test_parse_lsof_output_with_empty_string() {
        let output = "";
        let processes = parse_lsof_output(output);
        assert_eq!(processes.len(), 0);
    }

    #[test]
    fn test_parse_lsof_output_with_only_header() {
        let output = "COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME";
        let processes = parse_lsof_output(output);
        assert_eq!(processes.len(), 0);
    }

    #[test]
    fn test_parse_lsof_output_with_malformed_line() {
        let output = "COMMAND   PID   USER\nnode      1234\ninvalid";
        let processes = parse_lsof_output(output);
        // Lines with less than 3 columns should be skipped
        assert_eq!(processes.len(), 0);
    }

    #[test]
    fn test_parse_lsof_output_with_whitespace_variations() {
        let output =
            "COMMAND   PID   USER\nnode      1234  john   extra data here\npython    5678  jane";
        let processes = parse_lsof_output(output);
        assert_eq!(processes.len(), 2);
        assert_eq!(processes[0].command, "node");
        assert_eq!(processes[0].pid, "1234");
        assert_eq!(processes[0].user, "john");
    }

    #[test]
    fn test_kill_pids_with_empty_vector() {
        let result = kill_pids(vec![]);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No processes to kill");
    }

    #[test]
    fn test_processinfo_serialization() {
        let process = Processinfo {
            pid: "1234".to_string(),
            command: "node".to_string(),
            user: "john".to_string(),
        };

        let serialized = serde_json::to_string(&process);
        assert!(serialized.is_ok());

        let json = serialized.unwrap();
        assert!(json.contains("1234"));
        assert!(json.contains("node"));
        assert!(json.contains("john"));
    }
}
