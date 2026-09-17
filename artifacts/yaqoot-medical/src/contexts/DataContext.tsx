import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as repo from '../lib/db/repository';
import { Patient, Visit, Treatment, Investigation, VitalSigns, QuickNote, VitalThreshold } from '../lib/db/types';
import { useTranslation } from '../lib/i18n/useTranslation';

interface DataContextType {
  patients: Patient[];
  visits: Visit[];
  treatments: Treatment[];
  investigations: Investigation[];
  vitals: VitalSigns[];
  notes: QuickNote[];
  vitalSettings: VitalThreshold[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  storageMode: 'sqlite' | 'legacy' | 'uninitialized';
  storageWarning: string | null;
  // Repos functions bound to refresh
  createPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  createVisit: (data: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Visit>;
  updateVisit: (id: string, data: Partial<Visit>) => Promise<Visit>;
  createTreatment: (data: Omit<Treatment, 'id' | 'createdAt'>) => Promise<Treatment>;
  updateTreatment: (id: string, data: Partial<Treatment>) => Promise<Treatment>;
  deleteTreatment: (id: string) => Promise<void>;
  createInvestigation: (data: Omit<Investigation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Investigation>;
  updateInvestigation: (id: string, data: Partial<Investigation>) => Promise<Investigation>;
  deleteInvestigation: (id: string) => Promise<void>;
  createVitalSigns: (data: Omit<VitalSigns, 'id' | 'createdAt'>) => Promise<VitalSigns>;
  clearVitalSignsByPatient: (patientId: string) => Promise<void>;
  createQuickNote: (data: Omit<QuickNote, 'id' | 'createdAt'>) => Promise<QuickNote>;
  deleteQuickNote: (id: string) => Promise<void>;
  saveVitalSettings: (settings: VitalThreshold[]) => Promise<void>;
  importData: (json: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [vitalSettings, setVitalSettings] = useState<VitalThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'sqlite' | 'legacy' | 'uninitialized'>('uninitialized');
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [nextPatients, nextVisits, nextSettings] = await Promise.all([
        repo.getPatients(), repo.getAllVisits(), repo.getVitalSettings(),
      ]);
      setPatients(nextPatients);
      setVisits(nextVisits);
      setVitalSettings(nextSettings);
      setError(null);
    } catch (cause) {
      const message = `${t('data.refreshError')} ${cause instanceof Error ? cause.message : String(cause)}`;
      setError(message);
      throw cause;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await repo.initializeRepository();
        if (cancelled) return;
        setStorageMode(result.mode);
        setStorageWarning(result.warning ? t('storage.legacyFallback') : null);
        if (import.meta.env.DEV) await repo.seedInitialData();
        await refreshData();
      } catch (cause) {
        if (!cancelled) setError(`${t('data.loadError')} ${cause instanceof Error ? cause.message : String(cause)}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const wrap = <T extends unknown[], R>(fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      try {
        const res = await fn(...args);
        try {
          await refreshData();
        } catch (cause) {
          // The mutation has already committed; report stale UI separately and
          // do not make callers retry a write that succeeded.
          setError(`${t('data.refreshError')} ${cause instanceof Error ? cause.message : String(cause)}`);
        }
        return res;
      } catch (cause) {
        setError(`${t('data.saveError')} ${cause instanceof Error ? cause.message : String(cause)}`);
        throw cause;
      }
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
    isLoading, error, storageMode, storageWarning,
    createPatient: wrap(repo.createPatient),
    updatePatient: wrap(repo.updatePatient),
    deletePatient: wrap(repo.deletePatient),
    createVisit: wrap(repo.createVisit),
    updateVisit: wrap(repo.updateVisit),
    createTreatment: wrap(repo.createTreatment),
    updateTreatment: wrap(repo.updateTreatment),
    deleteTreatment: wrap(repo.deleteTreatment),
    createInvestigation: wrap(repo.createInvestigation),
    updateInvestigation: wrap(repo.updateInvestigation),
    deleteInvestigation: wrap(repo.deleteInvestigation),
    createVitalSigns: wrap(repo.createVitalSigns),
    clearVitalSignsByPatient: wrap(repo.clearVitalSignsByPatient),
    createQuickNote: wrap(repo.createQuickNote),
    deleteQuickNote: wrap(repo.deleteQuickNote),
    saveVitalSettings: wrap(repo.saveVitalSettings),
    importData: wrap(repo.importData),
  };

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center', fontFamily: "'Cairo', sans-serif" }}>{t('data.loading')}</div>;
  return (
    <DataContext.Provider value={contextValue}>
      {storageWarning && (
        <div style={{ padding: "8px 16px", background: "#FFF8E1", color: "#795548", textAlign: "center", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>
          {storageWarning}
        </div>
      )}
      {error && (
        <div style={{ padding: "8px 16px", background: "#FEE2E2", color: "#991B1B", textAlign: "center", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>
          {error}
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
