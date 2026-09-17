use serde::Deserialize;
use serde_json::Value;
use sqlx::sqlite::SqlitePoolOptions;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Deserialize)]
struct SqlStatement {
    sql: String,
    values: Vec<Value>,
}

#[tauri::command]
async fn execute_sql_transaction(
    app: tauri::AppHandle,
    statements: Vec<SqlStatement>,
) -> Result<(), String> {
    let path: PathBuf = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("yaqoot.db");
    let url = format!("sqlite:{}", path.to_string_lossy());
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .map_err(|error| error.to_string())?;
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&pool)
        .await
        .map_err(|error| error.to_string())?;
    let mut transaction = pool.begin().await.map_err(|error| error.to_string())?;
    for statement in statements {
        let mut query = sqlx::query(&statement.sql);
        for value in statement.values {
            query = match value {
                Value::Null => query.bind(Option::<String>::None),
                Value::String(value) => query.bind(value),
                Value::Bool(value) => query.bind(value),
                Value::Number(value) => {
                    if let Some(value) = value.as_i64() {
                        query.bind(value)
                    } else if let Some(value) = value.as_u64() {
                        let value = i64::try_from(value)
                            .map_err(|_| "Unsigned integer is too large for SQLite".to_string())?;
                        query.bind(value)
                    } else if let Some(value) = value.as_f64() {
                        query.bind(value)
                    } else {
                        return Err("Unsupported JSON number".to_string());
                    }
                }
                Value::Array(_) | Value::Object(_) => {
                    return Err("SQL values must be JSON primitives".to_string());
                }
            };
        }
        query
            .execute(&mut *transaction)
            .await
            .map_err(|error| error.to_string())?;
    }
    transaction
        .commit()
        .await
        .map_err(|error| error.to_string())?;
    pool.close().await;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "initial_schema",
        sql: include_str!("../migrations/001_initial.sql"),
        kind: tauri_plugin_sql::MigrationKind::Up,
    }];

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_sql_transaction])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:yaqoot.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Yaqoot Medical Clinic");
}
