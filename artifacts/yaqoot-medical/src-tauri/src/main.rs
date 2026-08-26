// Prevents an extra console/terminal window from appearing behind the app
// on Windows release builds — debug builds still show it for easier
// troubleshooting during development.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    yaqoot_medical_lib::run();
}
