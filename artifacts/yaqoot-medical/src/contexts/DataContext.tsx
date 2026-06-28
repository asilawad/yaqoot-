import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as repo from '../lib/db/repository';
import { Patient, Visit, Treatment, Investigation, VitalSigns, QuickNote, VitalThreshold } from '../lib/db/types';

interface DataContextType {
  patients: Patient[];
  visits: Visit[];
  treatments: Treatment[];
  investigations: Investigation[];
  vitals: VitalSigns[];
  notes: QuickNote[];
  vitalSettings: VitalThreshold[];
  refreshData: () => void;
  // Repos functions bound to refresh
  createPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => Patient;
  deletePatient: (id: string) => void;
  createVisit: (data: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>) => Visit;
  updateVisit: (id: string, data: Partial<Visit>) => Visit;
  createTreatment: (data: Omit<Treatment, 'id' | 'createdAt'>) => Treatment;
  deleteTreatment: (id: string) => void;
  createInvestigation: (data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>) => Investigation;
  deleteInvestigation: (id: string) => void;
  createVitalSigns: (data: Omit<VitalSigns, 'id' | 'createdAt'>) => VitalSigns;
  clearVitalSignsByPatient: (patientId: string) => void;
  createQuickNote: (data: Omit<QuickNote, 'id' | 'createdAt'>) => QuickNote;
  deleteQuickNote: (id: string) => void;
  saveVitalSettings: (settings: VitalThreshold[]) => void;
  importData: (json: string) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [vitalSettings, setVitalSettings] = useState<VitalThreshold[]>([]);

  const refreshData = () => {
    setPatients(repo.getPatients());
    setVisits(repo.getAllVisits());
    // We could load all or just leave it for specific queries, but for global state we'll just expose refresh.
    // It's better to fetch specific relations when needed.
    setVitalSettings(repo.getVitalSettings());
  };

  useEffect(() => {
    repo.seedInitialData();
    refreshData();
  }, []);

  const wrap = <T extends any[], R>(fn: (...args: T) => R) => {
    return (...args: T): R => {
      const res = fn(...args);
      refreshData();
      return res;
    };
  };

  const contextValue: DataContextType = {
    patients,
    visits,
    treatments,
    investigations,
    vitals,
    notes,
    vitalSettings,
    refreshData,
    createPatient: wrap(repo.createPatient),
    updatePatient: wrap(repo.updatePatient),
    deletePatient: wrap(repo.deletePatient),
    createVisit: wrap(repo.createVisit),
    updateVisit: wrap(repo.updateVisit),
    createTreatment: wrap(repo.createTreatment),
    deleteTreatment: wrap(repo.deleteTreatment),
    createInvestigation: wrap(repo.createInvestigation),
    deleteInvestigation: wrap(repo.deleteInvestigation),
    createVitalSigns: wrap(repo.createVitalSigns),
    clearVitalSignsByPatient: wrap(repo.clearVitalSignsByPatient),
    createQuickNote: wrap(repo.createQuickNote),
    deleteQuickNote: wrap(repo.deleteQuickNote),
    saveVitalSettings: wrap(repo.saveVitalSettings),
    importData: wrap(repo.importData),
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
