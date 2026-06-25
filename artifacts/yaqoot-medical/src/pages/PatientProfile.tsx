import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import AddPatientModal from "@/components/patients/AddPatientModal";
import * as repo from "@/lib/db/repository";
import { Visit, Investigation, Treatment, QuickNote, VitalSigns } from "@/lib/db/types";

function VitalStatusBadge({ value, vitalId, vitalSettings, t }: {
  value: number | undefined;
  vitalId: string;
  vitalSettings: any[];
  t: (k: string) => string;
}) {
  if (value === undefined) return <span style={{ color: "#717182", fontSize: 12 }}>—</span>;
  const cfg = vitalSettings.find((s: any) => s.id === vitalId);
  if (!cfg) return <span style={{ fontSize: 12 }}>{value}</span>;
  let status = "normal";
  if (value > cfg.maxNormal) status = "high";
  if (value < cfg.minNormal) status = "low";
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    normal: { bg: "#E8F5E9", text: "#2e7d32", label: t("vitals.normal") },
    high: { bg: "#FFEBEE", text: "#c62828", label: t(cfg.highLabel) },
    low: { bg: "#EFF6FF", text: "#1e40af", label: t(cfg.lowLabel) },
  };
  const c = colors[status];
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

export default function PatientProfile() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { patients, visits, vitalSettings, refreshData } = useData();
  const { toast } = useToast();
  const { createQuickNote, deleteQuickNote, clearVitalSignsByPatient } = useData();

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "investigations" | "treatments" | "notes">("history");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showClearVitalsConfirm, setShowClearVitalsConfirm] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const patient = patients.find(p => p.id === params.id);
  if (!patient) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#717182" }}>Patient not found</p>
        <button onClick={() => setLocation("/")} style={{ marginTop: 16, color: "#50C878", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>← Back</button>
      </div>
    );
  }

  const patientVisits = repo.getVisitsByPatient(patient.id);
  const patientInvestigations = repo.getInvestigationsByPatient(patient.id);
  const patientTreatments = repo.getTreatmentsByPatient(patient.id);
  const patientNotes = repo.getQuickNotes(patient.id);
  const patientVitals = repo.getVitalSignsByPatient(patient.id);
  const latestVitals = patientVitals[0];

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #F1F1F1",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    padding: 24,
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#717182", fontWeight: 600, marginBottom: 4, display: "block" };
  const valueStyle: React.CSSProperties = { fontSize: 14, color: "#171717", fontWeight: 500 };

  const tabs = [
    { id: "history" as const, label: t("profile.tab.history") },
    { id: "investigations" as const, label: t("profile.tab.investigations") },
    { id: "treatments" as const, label: t("profile.tab.treatments") },
    { id: "notes" as const, label: t("profile.tab.notes") },
  ];

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    createQuickNote({ patientId: patient.id, text: noteText.trim() });
    setNoteText("");
    refreshData();
    toast({ title: "Note added" });
  };

  const handleDeleteNote = (id: string) => {
    deleteQuickNote(id);
    refreshData();
    setDeleteNoteId(null);
  };

  const handleClearVitals = () => {
    clearVitalSignsByPatient(patient.id);
    refreshData();
    setShowClearVitalsConfirm(false);
    toast({ title: "Vitals cleared" });
  };

  const vitalsConfig = [
    { id: "bp", label: t("vitals.bp"), unit: "mmHg", systolic: latestVitals?.bpSystolic, diastolic: latestVitals?.bpDiastolic },
    { id: "hr", label: t("vitals.hr"), unit: "bpm", value: latestVitals?.heartRate },
    { id: "temp", label: t("vitals.temp"), unit: "°C", value: latestVitals?.temperature },
    { id: "spo2", label: t("vitals.spo2"), unit: "%", value: latestVitals?.oxygenSat },
    { id: "rr", label: t("vitals.rr"), unit: "/min", value: latestVitals?.respiratoryRate },
    { id: "glucose", label: t("vitals.glucose"), unit: "mg/dL", value: latestVitals?.bloodGlucose },
    { id: "weight", label: t("vitals.weight"), unit: "kg", value: latestVitals?.currentWeight },
  ];

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {/* Back */}
      <button
        onClick={() => setLocation("/")}
        data-testid="btn-back-profile"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 14, cursor: "pointer", marginBottom: 20, fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <Arrow size={16} />
        {t("profile.back")}
      </button>

      {/* Patient Info Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexDirection: isRTL ? "row-reverse" : "row" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", margin: 0 }}>{t("profile.info")}</h2>
          <button
            onClick={() => setShowAddPatientModal(true)}
            data-testid="btn-edit-patient"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", border: "1px solid #F1F1F1", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#717182", fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
          >
            <Pencil size={14} strokeWidth={1.5} />
            {t("common.edit")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div>
            <span style={labelStyle}>{t("table.name")}</span>
            <span style={valueStyle}>{patient.name}</span>
          </div>
          <div>
            <span style={labelStyle}>{t("table.nationalId")}</span>
            <span style={valueStyle}>{patient.nationalId}</span>
          </div>
          <div>
            <span style={labelStyle}>{t("addPatient.age")}</span>
            <span className="pill-green">{patient.age}</span>
          </div>
          <div>
            <span style={labelStyle}>{t("table.mobile")}</span>
            <span style={valueStyle}>{patient.mobile}</span>
          </div>
          {patient.altMobile && (
            <div>
              <span style={labelStyle}>{t("addPatient.altMobile")}</span>
              <span style={valueStyle}>{patient.altMobile}</span>
            </div>
          )}
          <div>
            <span style={labelStyle}>{t("table.location")}</span>
            <span style={valueStyle}>{patient.region} - {patient.neighborhood}</span>
          </div>
          <div>
            <span style={labelStyle}>{t("addPatient.applicantName")}</span>
            <span style={valueStyle}>{patient.applicantName}</span>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>{t("addPatient.chronicDiseases")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {patient.chronicDiseases.length > 0 ? patient.chronicDiseases.map(d => (
                <span key={d} className="pill-green">{d}</span>
              )) : <span style={{ fontSize: 13, color: "#717182" }}>—</span>}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>{t("addPatient.allergies")}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {patient.allergies.length > 0 ? patient.allergies.map(a => (
                <span key={a} style={{ background: "#FFF3E0", color: "#f59e0b", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{a}</span>
              )) : <span style={{ fontSize: 13, color: "#717182" }}>—</span>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F1F1", display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end" }}>
          <button
            onClick={() => setLocation(`/patients/${patient.id}/visits/new`)}
            data-testid="btn-add-visit"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
          >
            <Plus size={16} />
            {t("profile.addVisit")}
          </button>
        </div>
      </div>

      {/* Vital Signs Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexDirection: isRTL ? "row-reverse" : "row" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", margin: 0 }}>{t("profile.vitals")}</h2>
          <button
            onClick={() => setShowClearVitalsConfirm(true)}
            data-testid="btn-clear-vitals"
            style={{ background: "none", border: "1px solid #F1F1F1", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#ef4444", fontFamily: "'Cairo', sans-serif" }}
          >
            {t("profile.clearVitals")}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {/* BP */}
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, textAlign: isRTL ? "right" : "left" }}>
            <div style={{ fontSize: 11, color: "#717182", fontWeight: 600, marginBottom: 6 }}>{t("vitals.bp")}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 4 }}>
              {latestVitals?.bpSystolic ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}` : "—"} <span style={{ fontSize: 11, color: "#717182" }}>mmHg</span>
            </div>
            {latestVitals?.bpSystolic && <VitalStatusBadge value={latestVitals.bpSystolic} vitalId="bp" vitalSettings={vitalSettings} t={t} />}
          </div>
          {vitalsConfig.slice(1).map(({ id, label, unit, value }) => (
            <div key={id} style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, textAlign: isRTL ? "right" : "left" }}>
              <div style={{ fontSize: 11, color: "#717182", fontWeight: 600, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 4 }}>
                {value !== undefined ? value : "—"} <span style={{ fontSize: 11, color: "#717182" }}>{unit}</span>
              </div>
              <VitalStatusBadge value={value} vitalId={id} vitalSettings={vitalSettings} t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Visit Timeline */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 16, textAlign: isRTL ? "right" : "left" }}>{t("profile.visitTimeline")}</h2>
        {patientVisits.length === 0 ? (
          <p style={{ color: "#717182", fontSize: 14, textAlign: isRTL ? "right" : "left" }}>No visits yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patientVisits.map(v => (
              <button
                key={v.id}
                onClick={() => setLocation(`/visits/${v.id}`)}
                data-testid={`card-visit-${v.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#F9FAFB",
                  borderRadius: 10,
                  border: "1px solid #F1F1F1",
                  cursor: "pointer",
                  textAlign: isRTL ? "right" : "left",
                  fontFamily: "'Cairo', sans-serif",
                  transition: "all 0.15s ease",
                  flexDirection: isRTL ? "row-reverse" : "row",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#50C878"; (e.currentTarget as HTMLButtonElement).style.background = "#E8F5E9"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#F1F1F1"; (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#171717" }}>{new Date(v.visitDate).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, color: "#717182" }}>{v.mainService || "—"}{v.doctor ? ` · ${v.doctor}` : ""}</div>
                </div>
                <span className={v.paymentStatus === "paid" ? "pill-green" : "pill-red"}>
                  {t(`visit.${v.paymentStatus}`)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patient Records Tabs */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 16, textAlign: isRTL ? "right" : "left" }}>{t("profile.records")}</h2>
        {/* Tab Nav */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #F1F1F1", marginBottom: 20, flexDirection: isRTL ? "row-reverse" : "row" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #50C878" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "#50C878" : "#717182",
                fontFamily: "'Cairo', sans-serif",
                transition: "all 0.15s ease",
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Visit History */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patientVisits.length === 0 ? <p style={{ color: "#717182", fontSize: 14 }}>No records</p> : patientVisits.map(v => (
              <div key={v.id} style={{ padding: "14px 16px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F1F1F1", textAlign: isRTL ? "right" : "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isRTL ? "row-reverse" : "row", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#171717" }}>{new Date(v.visitDate).toLocaleDateString()}</div>
                  <button onClick={() => setLocation(`/visits/${v.id}`)} style={{ background: "none", border: "none", color: "#50C878", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.edit")} →</button>
                </div>
                {v.chiefComplaint && <div style={{ fontSize: 13, color: "#717182" }}>{t("visit.complaint")}: {v.chiefComplaint}</div>}
                {v.diagnosis && <div style={{ fontSize: 13, color: "#171717", marginTop: 4, fontWeight: 500 }}>{t("visit.diagnosis")}: {v.diagnosis}</div>}
                {v.doctor && <div style={{ fontSize: 12, color: "#717182", marginTop: 2 }}>{t("visit.doctor")}: {v.doctor}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Investigations */}
        {activeTab === "investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patientInvestigations.length === 0 ? <p style={{ color: "#717182", fontSize: 14 }}>No investigations</p> : patientInvestigations.map(inv => (
              <div key={inv.id} style={{ padding: "12px 16px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F1F1F1", textAlign: isRTL ? "right" : "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#171717" }}>{inv.testName}</div>
                {inv.result && <div style={{ fontSize: 13, color: "#717182", marginTop: 2 }}>Result: {inv.result}</div>}
                {inv.notes && <div style={{ fontSize: 12, color: "#717182", marginTop: 2 }}>{inv.notes}</div>}
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Treatments */}
        {activeTab === "treatments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patientTreatments.length === 0 ? <p style={{ color: "#717182", fontSize: 14 }}>No treatments</p> : patientTreatments.map(tr => (
              <div key={tr.id} style={{ padding: "12px 16px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F1F1F1", display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: isRTL ? "row-reverse" : "row" }}>
                <div style={{ textAlign: isRTL ? "right" : "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#171717" }}>{tr.medicineName}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{new Date(tr.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Notes */}
        {activeTab === "notes" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <input
                style={{ flex: 1, background: "#F3F3F5", border: "1px solid #F1F1F1", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none", direction: isRTL ? "rtl" : "ltr" }}
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddNote(); }}
              />
              <button
                onClick={handleAddNote}
                data-testid="btn-add-note"
                style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patientNotes.length === 0 ? <p style={{ color: "#717182", fontSize: 14 }}>No notes</p> : patientNotes.map(n => (
                <div key={n.id} style={{ padding: "12px 16px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F1F1F1", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexDirection: isRTL ? "row-reverse" : "row" }}>
                  <div style={{ textAlign: isRTL ? "right" : "left" }}>
                    <div style={{ fontSize: 13, color: "#171717" }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => setDeleteNoteId(n.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      {showAddPatientModal && (
        <AddPatientModal
          editPatient={patient}
          onClose={() => setShowAddPatientModal(false)}
          onSaved={() => { setShowAddPatientModal(false); refreshData(); }}
        />
      )}

      {/* Delete Note Confirm */}
      {deleteNoteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%", textAlign: "center" }}>
            <AlertTriangle size={28} color="#ef4444" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#171717", marginBottom: 12 }}>Delete Note?</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteNoteId(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={() => handleDeleteNote(deleteNoteId)} data-testid="btn-confirm-delete-note" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Vitals Confirm */}
      {showClearVitalsConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 440, width: "90%", textAlign: "center" }}>
            <AlertTriangle size={28} color="#ef4444" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t("profile.clearVitalsConfirm")}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowClearVitalsConfirm(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={handleClearVitals} data-testid="btn-confirm-clear-vitals" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.yes")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
