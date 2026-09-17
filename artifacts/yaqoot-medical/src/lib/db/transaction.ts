import { invoke } from '@tauri-apps/api/core';

export type SqlStatement = {
  sql: string;
  values: unknown[];
};

export function executeSqlTransaction(statements: SqlStatement[]): Promise<void> {
  return invoke<void>('execute_sql_transaction', { statements });
}