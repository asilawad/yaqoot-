import { getDatabase } from './database';
import { executeSqlTransaction, SqlStatement } from './transaction';

export const MIGRATION_FLAG = 'yaqoot_sqlite_migration_done';
export const LEGACY_KEYS = [
  'yaqoot_patients', 'yaqoot_visits', 'yaqoot_treatments',
  'yaqoot_investigations', 'yaqoot_vitals', 'yaqoot_notes', 'yaqoot_settings',
] as const;

const TABLES = [
  'patients', 'visits', 'treatments', 'investigations', 'vitals', 'notes', 'settings',
] as const;

type Table = typeof TABLES[number];
type RecordRow = Record<string, unknown>;
type MigrationResult = { migrated: boolean; counts: Record<string, number> };

const columns: Record<Table, readonly string[]> = {
  patients: [
    'id', 'name', 'nationalId', 'age', 'mobile', 'altMobile', 'region',
    'neighborhood', 'applicantName', 'allergies', 'chronicDiseases',
    'serviceType', 'createdAt', 'updatedAt',
  ],
  visits: ['id', 'patientId', 'visitDate', 'doctor', 'paymentStatus', 'chiefComplaint',
    'mainService', 'subService', 'diagnosis', 'createdAt', 'updatedAt'],
  treatments: ['id', 'visitId', 'patientId', 'medicineName', 'createdAt'],
  investigations: ['id', 'visitId', 'patientId', 'testName', 'result', 'resultDate',
    'notes', 'createdAt', 'updatedAt'],
  vitals: ['id', 'visitId', 'patientId', 'bpSystolic', 'bpDiastolic', 'heartRate',
    'temperature', 'oxygenSat', 'respiratoryRate', 'bloodGlucose', 'currentWeight',
    'createdAt'],
  notes: ['id', 'patientId', 'text', 'createdAt'],
  settings: ['id', 'name', 'unit', 'minNormal', 'maxNormal', 'highLabel', 'lowLabel',
    'minDiastolic', 'maxDiastolic'],
};

function readLegacy(key: string): RecordRow[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) ||
      value.some(row => row === null || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error(`Legacy data key "${key}" must be an array of records`);
  }
  return value as RecordRow[];
}

function nullable(value: unknown): unknown {
  return value === undefined ? null : value;
}

function legacyValue(table: Table, column: string, row: RecordRow): unknown {
  if (table === 'patients' && (column === 'allergies' || column === 'chronicDiseases')) {
    const value = row[column];
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`Legacy ${table}.${column} must be an array`);
    }
    return JSON.stringify(value ?? []);
  }
  return nullable(row[column]);
}

function canonicalValue(table: Table, column: string, value: unknown): unknown {
  if (table === 'patients' &&
      (column === 'allergies' || column === 'chronicDiseases') &&
      Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return nullable(value);
}

function canonicalRow(table: Table, row: RecordRow): RecordRow {
  const result: RecordRow = {};
  for (const column of columns[table]) {
    result[column] = canonicalValue(table, column, row[column]);
  }
  return result;
}

function canonicalLegacyRow(table: Table, row: RecordRow): RecordRow {
  const result: RecordRow = {};
  for (const column of columns[table]) result[column] = legacyValue(table, column, row);
  return result;
}

function canonicalRows(table: Table, rows: RecordRow[]): RecordRow[] {
  return rows
    .map(row => canonicalRow(table, row))
    .sort((left, right) => {
      const a = JSON.stringify(left);
      const b = JSON.stringify(right);
      return a < b ? -1 : a > b ? 1 : 0;
    });
}

function canonicalLegacyRows(table: Table, rows: RecordRow[]): RecordRow[] {
  return rows
    .map(row => canonicalLegacyRow(table, row))
    .sort((left, right) => {
      const a = JSON.stringify(left);
      const b = JSON.stringify(right);
      return a < b ? -1 : a > b ? 1 : 0;
    });
}

function sameRows(left: RecordRow[], right: RecordRow[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function readSnapshots(
  db: Awaited<ReturnType<typeof getDatabase>>,
): Promise<Record<Table, RecordRow[]>> {
  const entries = await Promise.all(TABLES.map(async table => [
    table,
    canonicalRows(table, await db.select<RecordRow[]>(
      `SELECT ${columns[table].join(',')} FROM ${table}`,
    )),
  ] as const));
  return Object.fromEntries(entries) as Record<Table, RecordRow[]>;
}

function statementsFor(table: Table, rows: RecordRow[]): SqlStatement[] {
  const names = columns[table];
  return rows.map(row => ({
    sql: `INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`,
    values: names.map(column => nullable(row[column])),
  }));
}

export async function migrateLegacyDataIfNeeded(
  suppliedDb?: Awaited<ReturnType<typeof getDatabase>>,
): Promise<MigrationResult> {
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    return { migrated: false, counts: {} };
  }

  const db = suppliedDb ?? await getDatabase();
  const data = LEGACY_KEYS.map(readLegacy);
  if (data[0].length === 0) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return { migrated: false, counts: {} };
  }

  const legacySnapshots = Object.fromEntries(
    TABLES.map((table, index) => [table, canonicalLegacyRows(table, data[index])]),
  ) as Record<Table, RecordRow[]>;
  const existing = await readSnapshots(db);
  const hasRows = TABLES.some(table => existing[table].length > 0);
  if (hasRows) {
    if (!TABLES.every(table => sameRows(existing[table], legacySnapshots[table]))) {
      throw new Error('Migration conflict: SQLite data does not match legacy data');
    }
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return {
      migrated: false,
      counts: Object.fromEntries(TABLES.map(table => [table, existing[table].length])),
    };
  }

  const statements = TABLES.flatMap(table => statementsFor(table, legacySnapshots[table]));
  await executeSqlTransaction(statements);

  const afterCommit = await readSnapshots(db);
  if (!TABLES.every(table => sameRows(afterCommit[table], legacySnapshots[table]))) {
    throw new Error('Migration verification failed: SQLite data does not match legacy data');
  }
  localStorage.setItem(MIGRATION_FLAG, 'true');
  return {
    migrated: true,
    counts: Object.fromEntries(TABLES.map(table => [table, afterCommit[table].length])),
  };
}