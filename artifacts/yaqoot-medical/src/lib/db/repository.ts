import { Patient, Visit, Treatment, Investigation, VitalSigns, QuickNote, VitalThreshold } from './types';
import { defaultVitalSettings } from './vitalDefaults';

// Keys
const KEYS = {
  PATIENTS: 'yaqoot_patients',
  VISITS: 'yaqoot_visits',
  TREATMENTS: 'yaqoot_treatments',
  INVESTIGATIONS: 'yaqoot_investigations',
  VITALS: 'yaqoot_vitals',
  NOTES: 'yaqoot_notes',
  SETTINGS: 'yaqoot_settings'
};

// Generic Helpers
const getList = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveList = <T>(key: string, list: T[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

// Patients
export const getPatients = (): Patient[] => {
  return getList<Patient>(KEYS.PATIENTS).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
export const getPatientById = (id: string): Patient | undefined => getPatients().find(p => p.id === id);
export const createPatient = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Patient => {
  const patients = getPatients();
  if (patients.some(p => p.nationalId === data.nationalId)) {
    throw new Error('Patient with this National ID already exists');
  }
  const newPatient: Patient = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  patients.push(newPatient);
  saveList(KEYS.PATIENTS, patients);
  return newPatient;
};
export const updatePatient = (id: string, data: Partial<Patient>): Patient => {
  const patients = getPatients();
  const index = patients.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Patient not found');
  
  if (data.nationalId && data.nationalId !== patients[index].nationalId) {
     if (patients.some(p => p.nationalId === data.nationalId)) {
       throw new Error('Patient with this National ID already exists');
     }
  }

  patients[index] = { ...patients[index], ...data, updatedAt: new Date().toISOString() };
  saveList(KEYS.PATIENTS, patients);
  return patients[index];
};
export const deletePatient = (id: string): void => {
  saveList(KEYS.PATIENTS, getPatients().filter(p => p.id !== id));
  saveList(KEYS.VISITS, getList<Visit>(KEYS.VISITS).filter(v => v.patientId !== id));
  saveList(KEYS.TREATMENTS, getList<Treatment>(KEYS.TREATMENTS).filter(t => t.patientId !== id));
  saveList(KEYS.INVESTIGATIONS, getList<Investigation>(KEYS.INVESTIGATIONS).filter(i => i.patientId !== id));
  saveList(KEYS.VITALS, getList<VitalSigns>(KEYS.VITALS).filter(v => v.patientId !== id));
  saveList(KEYS.NOTES, getList<QuickNote>(KEYS.NOTES).filter(n => n.patientId !== id));
};

// Visits
export const getVisitsByPatient = (patientId: string): Visit[] => getList<Visit>(KEYS.VISITS).filter(v => v.patientId === patientId).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
export const getVisitById = (id: string): Visit | undefined => getList<Visit>(KEYS.VISITS).find(v => v.id === id);
export const getAllVisits = (): Visit[] => getList<Visit>(KEYS.VISITS);
export const createVisit = (data: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>): Visit => {
  const visits = getList<Visit>(KEYS.VISITS);
  const newVisit: Visit = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  visits.push(newVisit);
  saveList(KEYS.VISITS, visits);
  return newVisit;
};
export const updateVisit = (id: string, data: Partial<Visit>): Visit => {
  const visits = getList<Visit>(KEYS.VISITS);
  const index = visits.findIndex(v => v.id === id);
  if (index === -1) throw new Error('Visit not found');
  visits[index] = { ...visits[index], ...data, updatedAt: new Date().toISOString() };
  saveList(KEYS.VISITS, visits);
  return visits[index];
};

// Treatments
export const getTreatmentsByVisit = (visitId: string): Treatment[] => getList<Treatment>(KEYS.TREATMENTS).filter(t => t.visitId === visitId);
export const getTreatmentsByPatient = (patientId: string): Treatment[] => getList<Treatment>(KEYS.TREATMENTS).filter(t => t.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const createTreatment = (data: Omit<Treatment, 'id' | 'createdAt'>): Treatment => {
  const treatments = getList<Treatment>(KEYS.TREATMENTS);
  const newTreatment: Treatment = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  treatments.push(newTreatment);
  saveList(KEYS.TREATMENTS, treatments);
  return newTreatment;
};
export const updateTreatment = (id: string, data: Partial<Treatment>): Treatment => {
  const treatments = getList<Treatment>(KEYS.TREATMENTS);
  const index = treatments.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Treatment not found');
  treatments[index] = { ...treatments[index], ...data };
  saveList(KEYS.TREATMENTS, treatments);
  return treatments[index];
};
export const deleteTreatment = (id: string): void => {
  const treatments = getList<Treatment>(KEYS.TREATMENTS).filter(t => t.id !== id);
  saveList(KEYS.TREATMENTS, treatments);
};

// Investigations
export const getInvestigationsByVisit = (visitId: string): Investigation[] => getList<Investigation>(KEYS.INVESTIGATIONS).filter(i => i.visitId === visitId);
export const getInvestigationsByPatient = (patientId: string): Investigation[] => getList<Investigation>(KEYS.INVESTIGATIONS).filter(i => i.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const createInvestigation = (data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>): Investigation => {
  const invs = getList<Investigation>(KEYS.INVESTIGATIONS);
  const newInv: Investigation = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  invs.push(newInv);
  saveList(KEYS.INVESTIGATIONS, invs);
  return newInv;
};
export const updateInvestigation = (id: string, data: Partial<Investigation>): Investigation => {
  const invs = getList<Investigation>(KEYS.INVESTIGATIONS);
  const index = invs.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Investigation not found');
  invs[index] = { ...invs[index], ...data, updatedAt: new Date().toISOString() };
  saveList(KEYS.INVESTIGATIONS, invs);
  return invs[index];
};
export const deleteInvestigation = (id: string): void => {
  const invs = getList<Investigation>(KEYS.INVESTIGATIONS).filter(i => i.id !== id);
  saveList(KEYS.INVESTIGATIONS, invs);
};

// Vital Signs
export const getVitalSignsByVisit = (visitId: string): VitalSigns | undefined => getList<VitalSigns>(KEYS.VITALS).find(v => v.visitId === visitId);
export const getVitalSignsByPatient = (patientId: string): VitalSigns[] => getList<VitalSigns>(KEYS.VITALS).filter(v => v.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const createVitalSigns = (data: Omit<VitalSigns, 'id' | 'createdAt'>): VitalSigns => {
  const vitals = getList<VitalSigns>(KEYS.VITALS);
  const existingIndex = vitals.findIndex(v => v.visitId === data.visitId);
  
  if (existingIndex !== -1) {
    vitals[existingIndex] = { ...vitals[existingIndex], ...data };
    saveList(KEYS.VITALS, vitals);
    return vitals[existingIndex];
  }
  
  const newVitals: VitalSigns = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  vitals.push(newVitals);
  saveList(KEYS.VITALS, vitals);
  return newVitals;
};
export const clearVitalSignsByPatient = (patientId: string): void => {
  const vitals = getList<VitalSigns>(KEYS.VITALS).filter(v => v.patientId !== patientId);
  saveList(KEYS.VITALS, vitals);
};

// Quick Notes
export const getQuickNotes = (patientId: string): QuickNote[] => getList<QuickNote>(KEYS.NOTES).filter(n => n.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const createQuickNote = (data: Omit<QuickNote, 'id' | 'createdAt'>): QuickNote => {
  const notes = getList<QuickNote>(KEYS.NOTES);
  const newNote: QuickNote = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  notes.push(newNote);
  saveList(KEYS.NOTES, notes);
  return newNote;
};
export const deleteQuickNote = (id: string): void => {
  const notes = getList<QuickNote>(KEYS.NOTES).filter(n => n.id !== id);
  saveList(KEYS.NOTES, notes);
};

// Vital Settings
export const getVitalSettings = (): VitalThreshold[] => {
  const data = localStorage.getItem(KEYS.SETTINGS);
  if (!data) return defaultVitalSettings;
  return JSON.parse(data);
};
export const saveVitalSettings = (settings: VitalThreshold[]): void => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const exportData = () => {
  return JSON.stringify({
    patients: getList(KEYS.PATIENTS),
    visits: getList(KEYS.VISITS),
    treatments: getList(KEYS.TREATMENTS),
    investigations: getList(KEYS.INVESTIGATIONS),
    vitals: getList(KEYS.VITALS),
    notes: getList(KEYS.NOTES),
    settings: getList(KEYS.SETTINGS)
  });
};

export const importData = (jsonData: string) => {
  const data = JSON.parse(jsonData);
  if (data.patients) saveList(KEYS.PATIENTS, data.patients);
  if (data.visits) saveList(KEYS.VISITS, data.visits);
  if (data.treatments) saveList(KEYS.TREATMENTS, data.treatments);
  if (data.investigations) saveList(KEYS.INVESTIGATIONS, data.investigations);
  if (data.vitals) saveList(KEYS.VITALS, data.vitals);
  if (data.notes) saveList(KEYS.NOTES, data.notes);
  if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
};

// Seeding
export const seedInitialData = () => {
  if (getPatients().length === 0) {
    const p1 = createPatient({
      name: 'Ahmed Mahmoud',
      nationalId: '123456789',
      age: 45,
      mobile: '0599123456',
      region: 'Gaza City',
      neighborhood: 'Al-Rimal',
      applicantName: 'Ahmed Mahmoud',
      allergies: ['Dust/Mites'],
      chronicDiseases: ['Hypertension'],
      serviceType: 'Internal Medicine'
    });
    const v1 = createVisit({
      patientId: p1.id,
      visitDate: new Date().toISOString(),
      doctor: 'Dr. Salem',
      paymentStatus: 'paid',
      chiefComplaint: 'Headache and dizziness',
      mainService: 'Internal Medicine',
      diagnosis: 'Essential Hypertension'
    });
    createVitalSigns({
      visitId: v1.id,
      patientId: p1.id,
      bpSystolic: 150,
      bpDiastolic: 95,
      heartRate: 85
    });
    
    createPatient({
      name: 'Sara Khalid',
      nationalId: '987654321',
      age: 28,
      mobile: '0599654321',
      region: 'Khan Yunis',
      neighborhood: 'City Center',
      applicantName: 'Sara Khalid',
      allergies: [],
      chronicDiseases: [],
      serviceType: 'OB/GYN Clinic'
    });
  }
};
