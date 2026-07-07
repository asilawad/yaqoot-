import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Plus, Trash2, Pencil, AlertTriangle, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import * as repo from "@/lib/db/repository";
import { Treatment, Investigation, VitalSigns } from "@/lib/db/types";

const MAIN_SERVICES = ["Internal Medicine", "Surgical Consultations", "Physical Therapy & Rehab", "OB/GYN Clinic", "Clinical Nutrition", "Nephrology Consultations", "Nursing Services", "Other"];

const SUB_SERVICES: Record<string, string[]> = {
  "Internal Medicine": ["Cardiology", "Gastroenterology", "Pulmonology", "Endocrinology", "Nephrology", "Rheumatology", "Hematology", "Infectious Diseases", "Oncology", "Immunology", "Geriatrics", "Neurology"],
  "Surgical Consultations": ["General Surgery", "Neurosurgery", "Urology", "Pediatric Surgery"],
  "Nursing Services": ["Vital Signs Monitoring", "Medication Administration", "IV Therapy & Cannulation", "Wound Care", "Catheterization & Fluid Output", "Airway & Oxygen Therapy", "Patient Hygiene & Bed Sore Prevention", "Post-Operative Care", "Feeding Tube Care", "ECG Monitoring", "Emergency Response & CPR", "Patient & Family Education", "Nebulization"],
  "OB/GYN Clinic": ["Antenatal/Prenatal Care", "High-Risk Pregnancy Management", "Recurrent Miscarriage Investigation", "Infertility & Delayed Conception", "PCOS Care", "Menstrual Disorders", "Contraception Counseling", "Gynecological Infections", "Menopause Management", "Cancer Screening/Pap Smear", "3D/4D Ultrasound"],
};

const INVESTIGATIONS_LIST = ["CBC", "FBS", "HbA1c", "Lipid Profile", "KFT", "LFT", "Thyroid Profile", "Electrolytes", "Vit D3/B12", "Iron/Ferritin", "Uric Acid", "Urine Analysis", "Stool Analysis", "CRP/ESR", "Coagulation Profile", "Other"];

const inputStyle: React.CSSProperties = {
  background: "#F3F3F5",
  border: "1px solid #F1F1F1",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "'Cairo', sans-serif",
  width: "100%",
  color: "#171717",
  outline: "none",
  boxSizing: "border-box" as const,
};

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F1F1F1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#171717", margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function VisitPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string; visitId?: string }>();
  const { patients, createVisit, updateVisit, createTreatment, deleteTreatment, createInvestigation, deleteInvestigation, createVitalSigns, refreshData, vitalSettings } = useData();
  const { toast } = useToast();
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const isNew = !params.visitId;
  const existingVisit = params.visitId ? repo.getVisitById(params.visitId) : undefined;
  const patientId = existingVisit?.patientId || params.id || "";
  const patient = patients.find(p => p.id === patientId);

  const [visitId, setVisitId] = useState<string | null>(existingVisit?.id || null);
  const [form, setForm] = useState({
    visitDate: existingVisit?.visitDate ? existingVisit.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    doctor: existingVisit?.doctor || "",
    paymentStatus: existingVisit?.paymentStatus || "unpaid" as "paid" | "unpaid",
    chiefComplaint: existingVisit?.chiefComplaint || "",
    mainService: existingVisit?.mainService || "",
    subService: existingVisit?.subService || "",
    diagnosis: existingVisit?.diagnosis || "",
  });

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [vitals, setVitals] = useState<VitalSigns | undefined>(undefined);

  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);
  const [treatmentName, setTreatmentName] = useState("");
  const [deleteTreatmentId, setDeleteTreatmentId] = useState<string | null>(null);

  const [showInvModal, setShowInvModal] = useState(false);
  const [editInvestigation, setEditInvestigation] = useState<Investigation | null>(null);
  const [invForm, setInvForm] = useState({ testName: "", result: "", notes: "" });
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bpSystolic: "", bpDiastolic: "", heartRate: "", temperature: "",
    oxygenSat: "", respiratoryRate: "", bloodGlucose: "", currentWeight: "",
  });

  useEffect(() => {
    if (visitId) {
      setTreatments(repo.getTreatmentsByVisit(visitId));
      setInvestigations(repo.getInvestigationsByVisit(visitId));
      const v = repo.getVitalSignsByVisit(visitId);
      setVitals(v);
      if (v) {
        setVitalsForm({
          bpSystolic: v.bpSystolic?.toString() || "",
          bpDiastolic: v.bpDiastolic?.toString() || "",
          heartRate: v.heartRate?.toString() || "",
          temperature: v.temperature?.toString() || "",
          oxygenSat: v.oxygenSat?.toString() || "",
          respiratoryRate: v.respiratoryRate?.toString() || "",
          bloodGlucose: v.bloodGlucose?.toString() || "",
          currentWeight: v.currentWeight?.toString() || "",
        });
      }
    }
  }, [visitId]);

  const ensureVisit = (): string => {
    if (visitId) return visitId;
    const v = createVisit({ patientId, ...form, visitDate: new Date(form.visitDate).toISOString() });
    setVisitId(v.id);
    return v.id;
  };

  const handleSave = () => {
    if (visitId) {
      updateVisit(visitId, { ...form, visitDate: new Date(form.visitDate).toISOString() });
    } else {
      const v = createVisit({ patientId, ...form, visitDate: new Date(form.visitDate).toISOString() });
      setVisitId(v.id);
    }
    refreshData();
    toast({ title: t("visit.success") });
    setLocation(`/patients/${patientId}`);
  };

  // Treatments
  const handleOpenTreatment = (tr?: Treatment) => {
    setEditTreatment(tr || null);
    setTreatmentName(tr?.medicineName || "");
    setShowTreatmentModal(true);
  };

  const handleSaveTreatment = () => {
    if (!treatmentName.trim()) return;
    const vid = ensureVisit();
    if (editTreatment) {
      repo.updateTreatment(editTreatment.id, { medicineName: treatmentName });
    } else {
      repo.createTreatment({ visitId: vid, patientId, medicineName: treatmentName });
    }
    setTreatments(repo.getTreatmentsByVisit(vid));
    setShowTreatmentModal(false);
    refreshData();
  };

  const handleDeleteTreatment = (id: string) => {
    repo.deleteTreatment(id);
    if (visitId) setTreatments(repo.getTreatmentsByVisit(visitId));
    setDeleteTreatmentId(null);
    refreshData();
  };

  // Investigations
  const handleOpenInv = (inv?: Investigation) => {
    setEditInvestigation(inv || null);
    setInvForm({ testName: inv?.testName || "", result: inv?.result || "", notes: inv?.notes || "" });
    setShowInvModal(true);
  };

  const handleSaveInv = () => {
    if (!invForm.testName) return;
    const vid = ensureVisit();
    if (editInvestigation) {
      repo.updateInvestigation(editInvestigation.id, invForm);
    } else {
      repo.createInvestigation({ visitId: vid, patientId, ...invForm });
    }
    setInvestigations(repo.getInvestigationsByVisit(vid));
    setShowInvModal(false);
    refreshData();
  };

  const handleDeleteInv = (id: string) => {
    repo.deleteInvestigation(id);
    if (visitId) setInvestigations(repo.getInvestigationsByVisit(visitId));
    setDeleteInvId(null);
    refreshData();
  };

  // Vitals
  const handleSaveVitals = () => {
    const vid = ensureVisit();
    const data = {
      visitId: vid, patientId,
      bpSystolic: vitalsForm.bpSystolic ? parseFloat(vitalsForm.bpSystolic) : undefined,
      bpDiastolic: vitalsForm.bpDiastolic ? parseFloat(vitalsForm.bpDiastolic) : undefined,
      heartRate: vitalsForm.heartRate ? parseFloat(vitalsForm.heartRate) : undefined,
      temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : undefined,
      oxygenSat: vitalsForm.oxygenSat ? parseFloat(vitalsForm.oxygenSat) : undefined,
      respiratoryRate: vitalsForm.respiratoryRate ? parseFloat(vitalsForm.respiratoryRate) : undefined,
      bloodGlucose: vitalsForm.bloodGlucose ? parseFloat(vitalsForm.bloodGlucose) : undefined,
      currentWeight: vitalsForm.currentWeight ? parseFloat(vitalsForm.currentWeight) : undefined,
    };
    const v = repo.createVitalSigns(data);
    setVitals(v);
    setShowVitalsModal(false);
    refreshData();
  };

  const getVitalStatus = (value: number | undefined, vitalId: string) => {
    if (value === undefined) return null;
    const cfg = vitalSettings.find((s: any) => s.id === vitalId);
    if (!cfg) return null;
    if (value > cfg.maxNormal) return { bg: "#FFEBEE", text: "#c62828", label: t(cfg.highLabel) };
    if (value < cfg.minNormal) return { bg: "#EFF6FF", text: "#1e40af", label: t(cfg.lowLabel) };
    return { bg: "#E8F5E9", text: "#2e7d32", label: t("vitals.normal") };
  };

  const subServices = SUB_SERVICES[form.mainService] || [];

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr", maxWidth: 900 }}>
      {/* Back */}
      <button
        onClick={() => setLocation(patientId ? `/patients/${patientId}` : "/")}
        data-testid="btn-back-visit"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 14, cursor: "pointer", marginBottom: 20, fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <Arrow size={16} />
        {t("common.back")}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexDirection: isRTL ? "row-reverse" : "row" }}>
        <div style={{ textAlign: isRTL ? "right" : "left" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#171717", margin: 0 }}>
            {isNew ? t("visit.newTitle") : t("visit.title")}
          </h1>
          {patient && <p style={{ fontSize: 13, color: "#717182", marginTop: 4 }}>{patient.name}</p>}
        </div>
        <button
          onClick={handleSave}
          data-testid="btn-save-visit"
          style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
        >
          {t("common.save")}
        </button>
      </div>

      {/* Basic Info */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F1F1F1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#171717", margin: "0 0 16px" }}>{t("profile.info")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.date")}</label>
            <input type="date" style={inputStyle} value={form.visitDate} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.doctor")}</label>
            <input style={inputStyle} value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.paymentStatus")}</label>
            <select
              style={{ ...inputStyle, color: form.paymentStatus === "paid" ? "#2e7d32" : "#c62828" }}
              value={form.paymentStatus}
              onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as "paid" | "unpaid" }))}
            >
              <option value="unpaid">{t("visit.unpaid")}</option>
              <option value="paid">{t("visit.paid")}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.complaint")}</label>
            <input style={inputStyle} value={form.chiefComplaint} onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.mainService")}</label>
            <select style={inputStyle} value={form.mainService} onChange={e => setForm(f => ({ ...f, mainService: e.target.value, subService: "" }))}>
              <option value="">—</option>
              {MAIN_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.subService")}</label>
            <select style={inputStyle} value={form.subService} onChange={e => setForm(f => ({ ...f, subService: e.target.value }))}>
              <option value="">—</option>
              {subServices.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("visit.diagnosis")}</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Treatments */}
      <SectionCard
        title={t("visit.treatments")}
        action={
          <button
            onClick={() => handleOpenTreatment()}
            data-testid="btn-add-treatment"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            <Plus size={14} />
            {t("visit.addTreatment")}
          </button>
        }
      >
        {treatments.length === 0 ? (
          <p style={{ color: "#717182", fontSize: 13 }}>No treatments added</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {treatments.map(tr => (
              <div key={tr.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F1F1F1", flexDirection: isRTL ? "row-reverse" : "row" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#171717" }}>{tr.medicineName}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleOpenTreatment(tr)} style={{ background: "none", border: "none", cursor: "pointer", color: "#717182" }}><Pencil size={14} strokeWidth={1.5} /></button>
                  <button onClick={() => setDeleteTreatmentId(tr.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} strokeWidth={1.5} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Investigations */}
      <SectionCard
        title={t("visit.investigations")}
        action={
          <button
            onClick={() => handleOpenInv()}
            data-testid="btn-add-investigation"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            <Plus size={14} />
            {t("visit.addInvestigation")}
          </button>
        }
      >
        {investigations.length === 0 ? (
          <p style={{ color: "#717182", fontSize: 13 }}>No investigations added</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {investigations.map(inv => (
              <div key={inv.id} style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F1F1F1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isRTL ? "row-reverse" : "row" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#171717" }}>{inv.testName}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleOpenInv(inv)} style={{ background: "none", border: "none", cursor: "pointer", color: "#717182" }}><Pencil size={14} strokeWidth={1.5} /></button>
                    <button onClick={() => setDeleteInvId(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} strokeWidth={1.5} /></button>
                  </div>
                </div>
                {inv.result && <div style={{ fontSize: 12, color: "#717182", marginTop: 4, textAlign: isRTL ? "right" : "left" }}>Result: {inv.result}</div>}
                {inv.notes && <div style={{ fontSize: 12, color: "#aaa", marginTop: 2, textAlign: isRTL ? "right" : "left" }}>{inv.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Vital Signs */}
      <SectionCard
        title={t("visit.vitals")}
        action={
          <button
            onClick={() => setShowVitalsModal(true)}
            data-testid="btn-add-vitals"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            <Plus size={14} />
            {t("visit.addVitals")}
          </button>
        }
      >
        {!vitals ? (
          <p style={{ color: "#717182", fontSize: 13 }}>No vitals recorded</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { id: "bp", label: t("vitals.bp"), display: vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : null, value: vitals.bpSystolic },
              { id: "hr", label: t("vitals.hr"), display: vitals.heartRate ? `${vitals.heartRate} bpm` : null, value: vitals.heartRate },
              { id: "temp", label: t("vitals.temp"), display: vitals.temperature ? `${vitals.temperature} °C` : null, value: vitals.temperature },
              { id: "spo2", label: t("vitals.spo2"), display: vitals.oxygenSat ? `${vitals.oxygenSat} %` : null, value: vitals.oxygenSat },
              { id: "rr", label: t("vitals.rr"), display: vitals.respiratoryRate ? `${vitals.respiratoryRate} /min` : null, value: vitals.respiratoryRate },
              { id: "glucose", label: t("vitals.glucose"), display: vitals.bloodGlucose ? `${vitals.bloodGlucose} mg/dL` : null, value: vitals.bloodGlucose },
              { id: "weight", label: t("vitals.weight"), display: vitals.currentWeight ? `${vitals.currentWeight} kg` : null, value: vitals.currentWeight },
            ].filter(v => v.display).map(({ id, label, display, value }) => {
              const status = getVitalStatus(value, id);
              return (
                <div key={id} style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, textAlign: isRTL ? "right" : "left" }}>
                  <div style={{ fontSize: 11, color: "#717182", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#171717", marginBottom: 4 }}>{display}</div>
                  {status && <span style={{ background: status.bg, color: status.text, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>{status.label}</span>}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Treatment Modal */}
      {showTreatmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{editTreatment ? t("common.edit") : t("visit.addTreatment")}</h3>
              <button onClick={() => setShowTreatmentModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <input
              style={inputStyle}
              placeholder="Medicine name..."
              value={treatmentName}
              onChange={e => setTreatmentName(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setShowTreatmentModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={handleSaveTreatment} data-testid="btn-save-treatment" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Modal */}
      {showInvModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{editInvestigation ? t("common.edit") : t("visit.addInvestigation")}</h3>
              <button onClick={() => setShowInvModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#717182", display: "block", marginBottom: 4 }}>Test Name</label>
                <select style={inputStyle} value={invForm.testName} onChange={e => setInvForm(f => ({ ...f, testName: e.target.value }))}>
                  <option value="">Select test...</option>
                  {INVESTIGATIONS_LIST.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#717182", display: "block", marginBottom: 4 }}>Result</label>
                <input style={inputStyle} value={invForm.result} onChange={e => setInvForm(f => ({ ...f, result: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#717182", display: "block", marginBottom: 4 }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 64 }} value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setShowInvModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={handleSaveInv} data-testid="btn-save-investigation" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 560, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t("visit.addVitals")}</h3>
              <button onClick={() => setShowVitalsModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "bpSystolic", label: `${t("vitals.bp")} Systolic (mmHg)` },
                { key: "bpDiastolic", label: `${t("vitals.bp")} Diastolic (mmHg)` },
                { key: "heartRate", label: `${t("vitals.hr")} (bpm)` },
                { key: "temperature", label: `${t("vitals.temp")} (°C)` },
                { key: "oxygenSat", label: `${t("vitals.spo2")} (%)` },
                { key: "respiratoryRate", label: `${t("vitals.rr")} (/min)` },
                { key: "bloodGlucose", label: `${t("vitals.glucose")} (mg/dL)` },
                { key: "currentWeight", label: `${t("vitals.weight")} (kg)` },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#717182", display: "block", marginBottom: 4 }}>{label}</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={(vitalsForm as any)[key]}
                    onChange={e => setVitalsForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowVitalsModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={handleSaveVitals} data-testid="btn-save-vitals-visit" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
      {(deleteTreatmentId || deleteInvId) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 360, width: "90%", textAlign: "center" }}>
            <AlertTriangle size={28} color="#ef4444" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Confirm Delete?</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => { setDeleteTreatmentId(null); setDeleteInvId(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button
                onClick={() => { if (deleteTreatmentId) handleDeleteTreatment(deleteTreatmentId); if (deleteInvId) handleDeleteInv(deleteInvId); }}
                data-testid="btn-confirm-delete"
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
