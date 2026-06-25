export interface Patient {
  id: string; // UUID
  name: string;
  nationalId: string; // unique
  age: number;
  mobile: string;
  altMobile?: string;
  region: string;
  neighborhood: string;
  applicantName: string;
  allergies: string[]; // e.g. ["Dust/Mites", "Other: custom text"]
  chronicDiseases: string[]; // e.g. ["Hypertension", "Other: custom text"]
  serviceType?: string;
  createdAt: string; // ISO string
  updatedAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  visitDate: string; // ISO date string
  doctor?: string;
  paymentStatus: 'paid' | 'unpaid';
  chiefComplaint?: string;
  mainService?: string;
  subService?: string;
  diagnosis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  visitId: string;
  patientId: string;
  medicineName: string;
  createdAt: string;
}

export interface Investigation {
  id: string;
  visitId: string;
  patientId: string;
  testName: string;
  result?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  id: string;
  visitId: string;
  patientId: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSat?: number;
  respiratoryRate?: number;
  bloodGlucose?: number;
  currentWeight?: number;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  patientId: string;
  text: string;
  createdAt: string;
}

export interface VitalThreshold {
  id: string;
  name: string; // localization key
  unit: string;
  minNormal: number;
  maxNormal: number;
  highLabel: string; // localization key
  lowLabel: string;  // localization key
  minDiastolic?: number;
  maxDiastolic?: number;
}
