import {
  Investigation,
  Patient,
  QuickNote,
  Treatment,
  Visit,
  VitalSigns,
  VitalThreshold,
} from './types';
import { defaultVitalSettings } from './vitalDefaults';
import { getDatabase } from './database';
import { migrateLegacyDataIfNeeded } from './migrateFromLocalStorage';
import { executeSqlTransaction, SqlStatement } from './transaction';

type Legacy = typeof import('./repository.legacy');
type Database = Awaited<ReturnType<typeof getDatabase>>;

let legacy: Legacy | undefined;
let db: Database | undefined;
let initialization: Promise<RepositoryMode> | undefined;

export type RepositoryMode = { mode: 'sqlite' | 'legacy'; warning?: string };

function isTauri(): boolean {
  return typeof window !== 'undefined' &&
    Boolean((window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}

export function initializeRepository(): Promise<RepositoryMode> {
  if (initialization) return initialization;
  initialization = (async () => {
    if (!isTauri()) {
      legacy = await import('./repository.legacy');
      return {
        mode: 'legacy',
        warning: 'SQLite is unavailable in the browser; using legacy local storage. / SQLite غير متاح في المتصفح؛ يتم استخدام التخزين المحلي القديم.',
      };
    }
    try {
      db = await getDatabase();
      await migrateLegacyDataIfNeeded(db);
      return { mode: 'sqlite' };
    } catch (error) {
      db = undefined;
      legacy = await import('./repository.legacy');
      return {
        mode: 'legacy',
        warning: `SQLite initialization failed; using legacy local storage. / فشل تشغيل SQLite؛ يتم استخدام التخزين المحلي القديم. ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  })();
  return initialization;
}

export function getRepositoryMode(): 'sqlite' | 'legacy' | 'uninitialized' {
  if (db) return 'sqlite';
  if (legacy) return 'legacy';
  return 'uninitialized';
}

async function ready(): Promise<{ database?: Database; legacy?: Legacy }> {
  if (!db && !legacy) await initializeRepository();
  return { database: db, legacy };
}

function newId(): string {
  return crypto.randomUUID();
}

function timestamp(): string {
  return new Date().toISOString();
}

function serializeArray(value: string[] | undefined): string {
  return JSON.stringify(value ?? []);
}

function parseArray(value: unknown): string[] {
  if (typeof value === 'string') return JSON.parse(value) as string[];
  return (value ?? []) as string[];
}

interface PatientRow extends Omit<Patient, 'allergies' | 'chronicDiseases'> {
  allergies: unknown;
  chronicDiseases: unknown;
  deletedAt?: string | null;
}

function patientFromRow(row: PatientRow): Patient {
  const { deletedAt: _deletedAt, ...patient } = row;
  return {
    ...patient,
    allergies: parseArray(row.allergies),
    chronicDiseases: parseArray(row.chronicDiseases),
  };
}

async function selectRows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return db!.select<T[]>(sql, values);
}

async function execute(sql: string, values: unknown[] = []): Promise<void> {
  await db!.execute(sql, values);
}

const patientColumns = [
  'id', 'name', 'nationalId', 'age', 'mobile', 'altMobile', 'region',
  'neighborhood', 'applicantName', 'allergies', 'chronicDiseases',
  'serviceType', 'createdAt', 'updatedAt',
] as const;
const visitColumns = [
  'id', 'patientId', 'visitDate', 'doctor', 'paymentStatus', 'chiefComplaint',
  'mainService', 'subService', 'diagnosis', 'createdAt', 'updatedAt',
] as const;
const treatmentColumns = ['id', 'visitId', 'patientId', 'medicineName', 'createdAt'] as const;
const investigationColumns = [
  'id', 'visitId', 'patientId', 'testName', 'result', 'resultDate', 'notes',
  'createdAt', 'updatedAt',
] as const;
const vitalColumns = [
  'id', 'visitId', 'patientId', 'bpSystolic', 'bpDiastolic', 'heartRate',
  'temperature', 'oxygenSat', 'respiratoryRate', 'bloodGlucose',
  'currentWeight', 'createdAt',
] as const;
const noteColumns = ['id', 'patientId', 'text', 'createdAt'] as const;
const settingColumns = [
  'id', 'name', 'unit', 'minNormal', 'maxNormal', 'highLabel', 'lowLabel',
  'minDiastolic', 'maxDiastolic',
] as const;

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(',');
}

export async function getPatients(): Promise<Patient[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getPatients();
  const rows = await selectRows<PatientRow>(
    'SELECT * FROM patients WHERE deletedAt IS NULL ORDER BY datetime(createdAt) DESC',
  );
  return rows.map(patientFromRow);
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const state = await ready();
  if (state.legacy) return state.legacy.getPatientById(id);
  const rows = await selectRows<PatientRow>(
    'SELECT * FROM patients WHERE id=? AND deletedAt IS NULL', [id],
  );
  return rows[0] ? patientFromRow(rows[0]) : undefined;
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient> {
  const state = await ready();
  if (state.legacy) return state.legacy.createPatient(data);
  const patient: Patient = {
    ...data, id: newId(), createdAt: timestamp(), updatedAt: timestamp(),
  };
  try {
    await execute(
      `INSERT INTO patients (${patientColumns.join(',')}) VALUES (${placeholders(patientColumns.length)})`,
      [
        patient.id, patient.name, patient.nationalId, patient.age, patient.mobile,
        patient.altMobile ?? null, patient.region, patient.neighborhood,
        patient.applicantName, serializeArray(patient.allergies),
        serializeArray(patient.chronicDiseases), patient.serviceType ?? null,
        patient.createdAt, patient.updatedAt,
      ],
    );
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) {
      throw new Error('Patient with this National ID already exists');
    }
    throw error;
  }
  return patient;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
  const state = await ready();
  if (state.legacy) return state.legacy.updatePatient(id, data);
  const old = await getPatientById(id);
  if (!old) throw new Error('Patient not found');
  if (data.nationalId && data.nationalId !== old.nationalId) {
    const duplicate = await selectRows<{ id: string }>(
      'SELECT id FROM patients WHERE nationalId=? AND id<>? AND deletedAt IS NULL',
      [data.nationalId, id],
    );
    if (duplicate.length) throw new Error('Patient with this National ID already exists');
  }
  const patient: Patient = { ...old, ...data, updatedAt: timestamp() };
  await execute(
    `UPDATE patients SET name=?,nationalId=?,age=?,mobile=?,altMobile=?,region=?,
      neighborhood=?,applicantName=?,allergies=?,chronicDiseases=?,serviceType=?,
      createdAt=?,updatedAt=? WHERE id=?`,
    [
      patient.name, patient.nationalId, patient.age, patient.mobile,
      patient.altMobile ?? null, patient.region, patient.neighborhood,
      patient.applicantName, serializeArray(patient.allergies),
      serializeArray(patient.chronicDiseases), patient.serviceType ?? null,
      patient.createdAt, patient.updatedAt, id,
    ],
  );
  return patient;
}

export async function deletePatient(id: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.deletePatient(id);
  await executeSqlTransaction([{ sql: 'DELETE FROM patients WHERE id=?', values: [id] }]);
}

export async function getVisitsByPatient(patientId: string): Promise<Visit[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getVisitsByPatient(patientId);
  return selectRows<Visit>(
    'SELECT * FROM visits WHERE patientId=? ORDER BY datetime(visitDate) DESC',
    [patientId],
  );
}

export async function getVisitById(id: string): Promise<Visit | undefined> {
  const state = await ready();
  if (state.legacy) return state.legacy.getVisitById(id);
  return (await selectRows<Visit>('SELECT * FROM visits WHERE id=?', [id]))[0];
}

export async function getAllVisits(): Promise<Visit[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getAllVisits();
  return selectRows<Visit>('SELECT * FROM visits');
}

export async function createVisit(
  data: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Visit> {
  const state = await ready();
  if (state.legacy) return state.legacy.createVisit(data);
  const visit: Visit = { ...data, id: newId(), createdAt: timestamp(), updatedAt: timestamp() };
  await execute(
    `INSERT INTO visits (${visitColumns.join(',')}) VALUES (${placeholders(visitColumns.length)})`,
    visitColumns.map(column => visit[column] ?? null),
  );
  return visit;
}

export async function updateVisit(id: string, data: Partial<Visit>): Promise<Visit> {
  const state = await ready();
  if (state.legacy) return state.legacy.updateVisit(id, data);
  const old = await getVisitById(id);
  if (!old) throw new Error('Visit not found');
  const visit: Visit = { ...old, ...data, updatedAt: timestamp() };
  await execute(
    `UPDATE visits SET patientId=?,visitDate=?,doctor=?,paymentStatus=?,chiefComplaint=?,
      mainService=?,subService=?,diagnosis=?,createdAt=?,updatedAt=? WHERE id=?`,
    [
      visit.patientId, visit.visitDate, visit.doctor ?? null, visit.paymentStatus,
      visit.chiefComplaint ?? null, visit.mainService ?? null, visit.subService ?? null,
      visit.diagnosis ?? null, visit.createdAt, visit.updatedAt, id,
    ],
  );
  return visit;
}

export async function getTreatmentsByVisit(visitId: string): Promise<Treatment[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getTreatmentsByVisit(visitId);
  return selectRows<Treatment>('SELECT * FROM treatments WHERE visitId=?', [visitId]);
}

export async function getTreatmentsByPatient(patientId: string): Promise<Treatment[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getTreatmentsByPatient(patientId);
  return selectRows<Treatment>(
    'SELECT * FROM treatments WHERE patientId=? ORDER BY datetime(createdAt) DESC',
    [patientId],
  );
}

export async function createTreatment(
  data: Omit<Treatment, 'id' | 'createdAt'>,
): Promise<Treatment> {
  const state = await ready();
  if (state.legacy) return state.legacy.createTreatment(data);
  const treatment: Treatment = { ...data, id: newId(), createdAt: timestamp() };
  await execute(
    `INSERT INTO treatments (${treatmentColumns.join(',')}) VALUES (${placeholders(treatmentColumns.length)})`,
    treatmentColumns.map(column => treatment[column]),
  );
  return treatment;
}

export async function updateTreatment(id: string, data: Partial<Treatment>): Promise<Treatment> {
  const state = await ready();
  if (state.legacy) return state.legacy.updateTreatment(id, data);
  const rows = await selectRows<Treatment>('SELECT * FROM treatments WHERE id=?', [id]);
  if (!rows[0]) throw new Error('Treatment not found');
  const treatment = { ...rows[0], ...data };
  await execute(
    'UPDATE treatments SET visitId=?,patientId=?,medicineName=?,createdAt=? WHERE id=?',
    [treatment.visitId, treatment.patientId, treatment.medicineName, treatment.createdAt, id],
  );
  return treatment;
}

export async function deleteTreatment(id: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.deleteTreatment(id);
  await execute('DELETE FROM treatments WHERE id=?', [id]);
}

export async function getInvestigationsByVisit(visitId: string): Promise<Investigation[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getInvestigationsByVisit(visitId);
  return selectRows<Investigation>('SELECT * FROM investigations WHERE visitId=?', [visitId]);
}

export async function getInvestigationsByPatient(patientId: string): Promise<Investigation[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getInvestigationsByPatient(patientId);
  return selectRows<Investigation>(
    'SELECT * FROM investigations WHERE patientId=? ORDER BY datetime(createdAt) DESC',
    [patientId],
  );
}

export async function createInvestigation(
  data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Investigation> {
  const state = await ready();
  if (state.legacy) return state.legacy.createInvestigation(data);
  const investigation: Investigation = {
    ...data, id: newId(), createdAt: timestamp(), updatedAt: timestamp(),
  };
  await execute(
    `INSERT INTO investigations (${investigationColumns.join(',')}) VALUES (${placeholders(investigationColumns.length)})`,
    investigationColumns.map(column => investigation[column] ?? null),
  );
  return investigation;
}

export async function updateInvestigation(
  id: string,
  data: Partial<Investigation>,
): Promise<Investigation> {
  const state = await ready();
  if (state.legacy) return state.legacy.updateInvestigation(id, data);
  const rows = await selectRows<Investigation>(
    'SELECT * FROM investigations WHERE id=?', [id],
  );
  if (!rows[0]) throw new Error('Investigation not found');
  const investigation: Investigation = { ...rows[0], ...data, updatedAt: timestamp() };
  await execute(
    `UPDATE investigations SET visitId=?,patientId=?,testName=?,result=?,resultDate=?,
      notes=?,createdAt=?,updatedAt=? WHERE id=?`,
    [
      investigation.visitId, investigation.patientId, investigation.testName,
      investigation.result ?? null, investigation.resultDate ?? null,
      investigation.notes ?? null, investigation.createdAt, investigation.updatedAt, id,
    ],
  );
  return investigation;
}

export async function deleteInvestigation(id: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.deleteInvestigation(id);
  await execute('DELETE FROM investigations WHERE id=?', [id]);
}

export async function getVitalSignsByVisit(visitId: string): Promise<VitalSigns | undefined> {
  const state = await ready();
  if (state.legacy) return state.legacy.getVitalSignsByVisit(visitId);
  return (await selectRows<VitalSigns>('SELECT * FROM vitals WHERE visitId=?', [visitId]))[0];
}

export async function getVitalSignsByPatient(patientId: string): Promise<VitalSigns[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getVitalSignsByPatient(patientId);
  return selectRows<VitalSigns>(
    'SELECT * FROM vitals WHERE patientId=? ORDER BY datetime(createdAt) DESC',
    [patientId],
  );
}

export async function createVitalSigns(
  data: Omit<VitalSigns, 'id' | 'createdAt'>,
): Promise<VitalSigns> {
  const state = await ready();
  if (state.legacy) return state.legacy.createVitalSigns(data);
  const old = await getVitalSignsByVisit(data.visitId);
  if (old) {
    const vital = { ...old, ...data };
    await execute(
      `UPDATE vitals SET patientId=?,bpSystolic=?,bpDiastolic=?,heartRate=?,temperature=?,
        oxygenSat=?,respiratoryRate=?,bloodGlucose=?,currentWeight=? WHERE visitId=?`,
      [
        vital.patientId, vital.bpSystolic ?? null, vital.bpDiastolic ?? null,
        vital.heartRate ?? null, vital.temperature ?? null, vital.oxygenSat ?? null,
        vital.respiratoryRate ?? null, vital.bloodGlucose ?? null,
        vital.currentWeight ?? null, data.visitId,
      ],
    );
    return vital;
  }
  const vital: VitalSigns = { ...data, id: newId(), createdAt: timestamp() };
  await execute(
    `INSERT INTO vitals (${vitalColumns.join(',')}) VALUES (${placeholders(vitalColumns.length)})`,
    vitalColumns.map(column => vital[column] ?? null),
  );
  return vital;
}

export async function clearVitalSignsByPatient(patientId: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.clearVitalSignsByPatient(patientId);
  await execute('DELETE FROM vitals WHERE patientId=?', [patientId]);
}

export async function getQuickNotes(patientId: string): Promise<QuickNote[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getQuickNotes(patientId);
  return selectRows<QuickNote>(
    'SELECT * FROM notes WHERE patientId=? ORDER BY datetime(createdAt) DESC',
    [patientId],
  );
}

export async function createQuickNote(
  data: Omit<QuickNote, 'id' | 'createdAt'>,
): Promise<QuickNote> {
  const state = await ready();
  if (state.legacy) return state.legacy.createQuickNote(data);
  const note: QuickNote = { ...data, id: newId(), createdAt: timestamp() };
  await execute(
    `INSERT INTO notes (${noteColumns.join(',')}) VALUES (${placeholders(noteColumns.length)})`,
    noteColumns.map(column => note[column]),
  );
  return note;
}

export async function deleteQuickNote(id: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.deleteQuickNote(id);
  await execute('DELETE FROM notes WHERE id=?', [id]);
}

export async function getVitalSettings(): Promise<VitalThreshold[]> {
  const state = await ready();
  if (state.legacy) return state.legacy.getVitalSettings();
  const settings = await selectRows<VitalThreshold>('SELECT * FROM settings ORDER BY rowid');
  return settings.length ? settings : defaultVitalSettings;
}

export async function saveVitalSettings(settings: VitalThreshold[]): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.saveVitalSettings(settings);
  const statements: SqlStatement[] = [{ sql: 'DELETE FROM settings', values: [] }];
  for (const setting of settings) {
    statements.push({
      sql: `INSERT INTO settings (${settingColumns.join(',')}) VALUES (${placeholders(settingColumns.length)})`,
      values: settingColumns.map(column => setting[column] ?? null),
    });
  }
  await executeSqlTransaction(statements);
}

export async function exportData(): Promise<string> {
  const state = await ready();
  if (state.legacy) return state.legacy.exportData();
  const [patientRows, visits, treatments, investigations, vitals, notes, settings] =
    await Promise.all([
      selectRows<PatientRow>('SELECT * FROM patients ORDER BY rowid'),
      selectRows<Visit>('SELECT * FROM visits ORDER BY rowid'),
      selectRows<Treatment>('SELECT * FROM treatments ORDER BY rowid'),
      selectRows<Investigation>('SELECT * FROM investigations ORDER BY rowid'),
      selectRows<VitalSigns>('SELECT * FROM vitals ORDER BY rowid'),
      selectRows<QuickNote>('SELECT * FROM notes ORDER BY rowid'),
      selectRows<VitalThreshold>('SELECT * FROM settings ORDER BY rowid'),
    ]);
  return JSON.stringify({
    patients: patientRows.map(patientFromRow),
    visits,
    treatments,
    investigations,
    vitals,
    notes,
    settings,
  });
}

type ImportData = {
  patients?: unknown;
  visits?: unknown;
  treatments?: unknown;
  investigations?: unknown;
  vitals?: unknown;
  notes?: unknown;
  settings?: unknown;
};

function importRows(value: unknown, key: string): Record<string, unknown>[] {
  if (value === undefined) throw new Error(`Import data key "${key}" is required`);
  if (!Array.isArray(value)) throw new Error(`Import data key "${key}" must be an array`);
  return value as Record<string, unknown>[];
}

function importedStatements(
  table: string,
  columns: readonly string[],
  rows: Record<string, unknown>[],
): SqlStatement[] {
  const statements: SqlStatement[] = [];
  for (const row of rows) {
    const values = columns.map(column =>
      column === 'allergies' || column === 'chronicDiseases'
        ? serializeArray(row[column] as string[] | undefined)
        : row[column] ?? null,
    );
    statements.push({
      sql: `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders(columns.length)})`,
      values,
    });
  }
  return statements;
}

export async function importData(jsonData: string): Promise<void> {
  const state = await ready();
  if (state.legacy) return state.legacy.importData(jsonData);

  const data = JSON.parse(jsonData) as ImportData;
  const rows = {
    patients: importRows(data.patients, 'patients'),
    visits: importRows(data.visits, 'visits'),
    treatments: importRows(data.treatments, 'treatments'),
    investigations: importRows(data.investigations, 'investigations'),
    vitals: importRows(data.vitals, 'vitals'),
    notes: importRows(data.notes, 'notes'),
    settings: importRows(data.settings, 'settings'),
  };

  const statements: SqlStatement[] = [];
  for (const table of ['treatments', 'investigations', 'vitals', 'notes', 'visits', 'patients', 'settings']) {
    statements.push({ sql: `DELETE FROM ${table}`, values: [] });
  }
  statements.push(...importedStatements('patients', patientColumns, rows.patients));
  statements.push(...importedStatements('visits', visitColumns, rows.visits));
  statements.push(...importedStatements('treatments', treatmentColumns, rows.treatments));
  statements.push(...importedStatements('investigations', investigationColumns, rows.investigations));
  statements.push(...importedStatements('vitals', vitalColumns, rows.vitals));
  statements.push(...importedStatements('notes', noteColumns, rows.notes));
  statements.push(...importedStatements('settings', settingColumns, rows.settings));
  await executeSqlTransaction(statements);
}

export async function seedInitialData(): Promise<void> {
  const state = await ready();
  if (state.legacy) {
    await state.legacy.seedInitialData();
    return;
  }
  if ((await getPatients()).length) return;
  const now = timestamp();
  const patientId = newId();
  const visitId = newId();
  const secondPatientId = newId();
  const statements: SqlStatement[] = [{
    sql: `INSERT INTO patients (${patientColumns.join(',')}) VALUES (${placeholders(patientColumns.length)})`,
    values: [
      patientId, 'Ahmed Mahmoud', '123456789', 45, '0599123456', null, 'Gaza City',
      'Al-Rimal', 'Ahmed Mahmoud', serializeArray(['Dust/Mites']),
      serializeArray(['Hypertension']), 'Internal Medicine', now, now,
    ],
  }, {
    sql: `INSERT INTO visits (${visitColumns.join(',')}) VALUES (${placeholders(visitColumns.length)})`,
    values: [
      visitId, patientId, now, 'Dr. Salem', 'paid', 'Headache and dizziness',
      'Internal Medicine', null, 'Essential Hypertension', now, now,
    ],
  }, {
    sql: `INSERT INTO vitals (${vitalColumns.join(',')}) VALUES (${placeholders(vitalColumns.length)})`,
    values: [newId(), visitId, patientId, 150, 95, 85, null, null, null, null, null, now],
  }, {
    sql: `INSERT INTO patients (${patientColumns.join(',')}) VALUES (${placeholders(patientColumns.length)})`,
    values: [
      secondPatientId, 'Sara Khalid', '987654321', 28, '0599654321', null, 'Khan Yunis',
      'City Center', 'Sara Khalid', serializeArray([]), serializeArray([]),
      'OB/GYN Clinic', now, now,
    ],
  }];
  await executeSqlTransaction(statements);
}