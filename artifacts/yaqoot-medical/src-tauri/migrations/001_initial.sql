CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  nationalId TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  mobile TEXT NOT NULL,
  altMobile TEXT,
  region TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  applicantName TEXT NOT NULL,
  allergies TEXT NOT NULL,
  chronicDiseases TEXT NOT NULL,
  serviceType TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY NOT NULL,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visitDate TEXT NOT NULL,
  doctor TEXT,
  paymentStatus TEXT NOT NULL CHECK (paymentStatus IN ('paid', 'unpaid')),
  chiefComplaint TEXT,
  mainService TEXT,
  subService TEXT,
  diagnosis TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY NOT NULL,
  visitId TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medicineName TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY NOT NULL,
  visitId TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  testName TEXT NOT NULL,
  result TEXT,
  resultDate TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY NOT NULL,
  visitId TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  bpSystolic REAL,
  bpDiastolic REAL,
  heartRate REAL,
  temperature REAL,
  oxygenSat REAL,
  respiratoryRate REAL,
  bloodGlucose REAL,
  currentWeight REAL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  minNormal REAL NOT NULL,
  maxNormal REAL NOT NULL,
  highLabel TEXT NOT NULL,
  lowLabel TEXT NOT NULL,
  minDiastolic REAL,
  maxDiastolic REAL
);

CREATE INDEX IF NOT EXISTS idx_visits_patientId ON visits(patientId);
CREATE INDEX IF NOT EXISTS idx_treatments_visitId ON treatments(visitId);
CREATE INDEX IF NOT EXISTS idx_treatments_patientId ON treatments(patientId);
CREATE INDEX IF NOT EXISTS idx_investigations_visitId ON investigations(visitId);
CREATE INDEX IF NOT EXISTS idx_investigations_patientId ON investigations(patientId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vitals_visitId ON vitals(visitId);
CREATE INDEX IF NOT EXISTS idx_vitals_patientId ON vitals(patientId);
CREATE INDEX IF NOT EXISTS idx_notes_patientId ON notes(patientId);