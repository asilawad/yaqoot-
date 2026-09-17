import Database from '@tauri-apps/plugin-sql';

type SqlDatabase = Awaited<ReturnType<typeof Database.load>>;

let connection: SqlDatabase | undefined;
let initialization: Promise<SqlDatabase> | undefined;

export function getDatabase(): Promise<SqlDatabase> {
  if (connection) return Promise.resolve(connection);
  if (initialization) return initialization;

  initialization = (async () => {
    const loaded = await Database.load('sqlite:yaqoot.db');
    await loaded.execute('PRAGMA foreign_keys = ON');
    const rows = await loaded.select<{ foreign_keys: number }[]>(
      'PRAGMA foreign_keys',
    );
    if (Number(rows[0]?.foreign_keys) !== 1) {
      throw new Error('SQLite foreign_keys pragma is not enabled');
    }
    connection = loaded;
    return loaded;
  })().catch((error) => {
    initialization = undefined;
    connection = undefined;
    throw error;
  });

  return initialization;
}

export function resetDatabaseConnection(): void {
  connection = undefined;
  initialization = undefined;
}