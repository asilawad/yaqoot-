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

type ScopedMutation = {
  scope: 'treatments' | 'investigations' | 'vitals' | 'notes';
  action: 'upsert' | 'delete' | 'deleteByPatient';
};

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex(current => current.id === item.id);
  if (index === -1) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
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

  const applyScopedMutation = (
    mutation: ScopedMutation,
    result: unknown,
    args: unknown[],
  ) => {
    if (mutation.action === 'upsert') {
      if (mutation.scope === 'treatments') {
        setTreatments(current => upsertById(current, result as Treatment));
      } else if (mutation.scope === 'investigations') {
        setInvestigations(current => upsertById(current, result as Investigation));
      } else if (mutation.scope === 'vitals') {
        setVitals(current => upsertById(current, result as VitalSigns));
      } else {
        setNotes(current => upsertById(current, result as QuickNote));
      }
      return;
    }

    const id = args[0] as string;
    if (mutation.scope === 'treatments') {
      setTreatments(current => current.filter(item => item.id !== id));
    } else if (mutation.scope === 'investigations') {
      setInvestigations(current => current.filter(item => item.id !== id));
    } else if (mutation.scope === 'vitals') {
      if (mutation.action === 'deleteByPatient') {
        setVitals(current => current.filter(item => item.patientId !== id));
      } else {
        setVitals(current => current.filter(item => item.id !== id));
      }
    } else {
      setNotes(current => current.filter(item => item.id !== id));
    }
  };

  const wrap = <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    mutation?: ScopedMutation,
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        const res = await fn(...args);
        if (mutation && visits.length >= 2000) {
          applyScopedMutation(mutation, res, args);
        } else {
          try {
            await refreshData();
          } catch (cause) {
            // The mutation has already committed; report stale UI separately and
            // do not make callers retry a write that succeeded.
            setError(`${t('data.refreshError')} ${cause instanceof Error ? cause.message : String(cause)}`);
          }
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
    createTreatment: wrap(repo.createTreatment, { scope: 'treatments', action: 'upsert' }),
    updateTreatment: wrap(repo.updateTreatment, { scope: 'treatments', action: 'upsert' }),
    deleteTreatment: wrap(repo.deleteTreatment, { scope: 'treatments', action: 'delete' }),
    createInvestigation: wrap(repo.createInvestigation, { scope: 'investigations', action: 'upsert' }),
    updateInvestigation: wrap(repo.updateInvestigation, { scope: 'investigations', action: 'upsert' }),
    deleteInvestigation: wrap(repo.deleteInvestigation, { scope: 'investigations', action: 'delete' }),
    createVitalSigns: wrap(repo.createVitalSigns, { scope: 'vitals', action: 'upsert' }),
    clearVitalSignsByPatient: wrap(repo.clearVitalSignsByPatient, { scope: 'vitals', action: 'deleteByPatient' }),
    createQuickNote: wrap(repo.createQuickNote, { scope: 'notes', action: 'upsert' }),
    deleteQuickNote: wrap(repo.deleteQuickNote, { scope: 'notes', action: 'delete' }),
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
