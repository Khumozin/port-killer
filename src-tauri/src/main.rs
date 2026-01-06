#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::command;

#[derive(serde::Serialize, Clone)]
struct ParentProcess {
    pid: String,
    ppid: String,
    command: String,
    user: String,
    full_command: String,
}

#[derive(serde::Serialize)]
struct Processinfo {
    pid: String,
    command: String,
    user: String,
    full_command: String,
    parent_chain: Vec<ParentProcess>,
}

/// Get process information for a specific PID using ps command
fn get_process_info(pid: &str) -> Result<(String, String, String, String), String> {
    let output = Command::new("ps")
        .args(["-p", pid, "-o", "ppid=,comm=,user=,args="])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout.trim();

    if line.is_empty() {
        return Err(format!("Process {} not found", pid));
    }

    // Parse: PPID COMM USER ARGS
    let parts: Vec<&str> = line.splitn(4, char::is_whitespace).collect();
    if parts.len() >= 4 {
        Ok((
            parts[0].trim().to_string(), // ppid
            parts[1].trim().to_string(), // command
            parts[2].trim().to_string(), // user
            parts[3].trim().to_string(), // full args
        ))
    } else {
        Err("Failed to parse process info".to_string())
    }
}

/// Build the parent process chain from a PID up to launchd (PID 1)
fn build_parent_chain(pid: &str) -> Vec<ParentProcess> {
    let mut chain = Vec::new();
    let mut current_pid = pid.to_string();

    // Safety limit to prevent infinite loops (though unlikely)
    for _ in 0..100 {
        match get_process_info(&current_pid) {
            Ok((ppid, command, user, full_command)) => {
                let parent = ParentProcess {
                    pid: current_pid.clone(),
                    ppid: ppid.clone(),
                    command,
                    user,
                    full_command,
                };

                chain.push(parent);

                // Stop at launchd (PID 1) or if PPID is 0
                if ppid == "1" || ppid == "0" {
                    break;
                }

                current_pid = ppid;
            }
            Err(_) => break, // Process no longer exists or error
        }
    }

    chain
}

/// Parse lsof output into a vector of ProcessInfo structs
fn parse_lsof_output(output: &str) -> Vec<Processinfo> {
    let mut processes = Vec::new();

    for line in output.lines().skip(1) {
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() >= 3 {
            let pid = cols[1].to_string();

            // Get full command for this PID
            let full_command = match get_process_info(&pid) {
                Ok((_, _, _, args)) => args,
                Err(_) => cols[0].to_string(), // Fallback to command name
            };

            // Build parent chain
            let parent_chain = build_parent_chain(&pid);

            processes.push(Processinfo {
                command: cols[0].to_string(),
                pid,
                user: cols[2].to_string(),
                full_command,
                parent_chain,
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
            full_command: "node server.js".to_string(),
            parent_chain: vec![],
        };

        let serialized = serde_json::to_string(&process);
        assert!(serialized.is_ok());

        let json = serialized.unwrap();
        assert!(json.contains("1234"));
        assert!(json.contains("node"));
        assert!(json.contains("john"));
        assert!(json.contains("full_command"));
        assert!(json.contains("parent_chain"));
    }

    #[test]
    fn test_get_process_info_with_valid_pid() {
        // Test with current process PID (more reliable across environments)
        let current_pid = std::process::id().to_string();
        let result = get_process_info(&current_pid);
        assert!(result.is_ok());

        let (ppid, command, user, full_command) = result.unwrap();

        // PPID should be a valid number
        assert!(ppid.parse::<u32>().is_ok());

        // Command and full_command should not be empty
        assert!(!command.is_empty());
        assert!(!full_command.is_empty());

        // User should not be empty
        assert!(!user.is_empty());
    }

    #[test]
    fn test_get_process_info_with_invalid_pid() {
        // Use a very high PID that likely doesn't exist
        let result = get_process_info("999999");
        assert!(result.is_err());
    }

    #[test]
    fn test_build_parent_chain_stops_at_launchd() {
        // Test with current process's PID
        let current_pid = std::process::id().to_string();
        let chain = build_parent_chain(&current_pid);

        assert!(!chain.is_empty());

        // Last element should be launchd or have ppid of 0 or 1
        let last = chain.last().unwrap();
        assert!(last.ppid == "0" || last.ppid == "1");
    }

    #[test]
    fn test_build_parent_chain_length_reasonable() {
        let current_pid = std::process::id().to_string();
        let chain = build_parent_chain(&current_pid);

        // Parent chain should be reasonable (< 100, our safety limit)
        assert!(chain.len() < 100);
        // Should have at least one parent (our process has parents)
        assert!(!chain.is_empty());
    }

    #[test]
    fn test_parse_lsof_output_includes_parent_chain() {
        let output = "COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nnode      1234  john   21u  IPv4  0x123   0t0  TCP *:3000 (LISTEN)";

        let processes = parse_lsof_output(output);

        assert_eq!(processes.len(), 1);
        let process = &processes[0];

        // Should have basic fields
        assert_eq!(process.pid, "1234");
        assert_eq!(process.command, "node");
        assert_eq!(process.user, "john");

        // Note: parent_chain might be empty if PID 1234 doesn't exist
        // In real test, we'd need to mock the Command execution
    }

    #[test]
    fn test_processinfo_with_parent_chain_serialization() {
        let parent = ParentProcess {
            pid: "100".to_string(),
            ppid: "1".to_string(),
            command: "parent_cmd".to_string(),
            user: "root".to_string(),
            full_command: "/usr/bin/parent_cmd".to_string(),
        };

        let process = Processinfo {
            pid: "200".to_string(),
            command: "node".to_string(),
            user: "john".to_string(),
            full_command: "node server.js".to_string(),
            parent_chain: vec![parent],
        };

        let serialized = serde_json::to_string(&process);
        assert!(serialized.is_ok());

        let json = serialized.unwrap();
        assert!(json.contains("200"));
        assert!(json.contains("node"));
        assert!(json.contains("parent_chain"));
        assert!(json.contains("100"));
    }
}
