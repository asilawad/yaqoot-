import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, ArrowRight, Pencil, Plus, Trash2, AlertTriangle, ShieldAlert,
  Heart, Activity, Thermometer, Wind, Droplets, Droplet, Scale,
  User, Phone, MapPin, UserCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import AddPatientModal from "@/components/patients/AddPatientModal";
import * as repo from "@/lib/db/repository";

/* ─── Vital status badge ─── */
function VitalStatusBadge({
  value, vitalId, vitalSettings, t,
}: {
  value: number | undefined;
  vitalId: string;
  vitalSettings: any[];
  t: (k: string) => string;
}) {
  if (value === undefined) return null;
  const cfg = vitalSettings.find((s: any) => s.id === vitalId);
  if (!cfg) return null;

  let status = "normal";
  if (value > cfg.maxNormal) status = "high";
  if (value < cfg.minNormal) status = "low";

  const palette: Record<string, { bg: string; text: string; label: string }> = {
    normal: { bg: "#E8F5E9", text: "#2e7d32",  label: t("vitals.normal") },
    high:   { bg: "#FFEBEE", text: "#c62828",  label: t(cfg.highLabel) },
    low:    { bg: "#EFF6FF", text: "#1e40af",  label: t(cfg.lowLabel) },
  };
  const c = palette[status];
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      display: "inline-block", marginTop: 6,
    }}>
      {c.label}
    </span>
  );
}

/* ─── Vital card ─── */
function VitalCard({
  icon: Icon, iconColor, iconBg, label, displayValue, unit, badge,
}: {
  icon: React.ElementType; iconColor: string; iconBg: string;
  label: string; displayValue: string; unit: string; badge: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      border: "1px solid #F1F1F1",
      boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} strokeWidth={1.8} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#717182", fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#171717", lineHeight: 1 }}>
          {displayValue}
          {displayValue !== "—" && (
            <span style={{ fontSize: 12, fontWeight: 500, color: "#717182", marginInlineStart: 5 }}>{unit}</span>
          )}
        </div>
        {badge}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function PatientProfile() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { patients, visits, vitalSettings, refreshData } = useData();
  const { toast } = useToast();
  const { createQuickNote, deleteQuickNote, clearVitalSignsByPatient, deletePatient } = useData();

  const [activeTab, setActiveTab] = useState<"history" | "investigations" | "treatments" | "notes">("history");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showClearVitalsConfirm, setShowClearVitalsConfirm] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const patient = patients.find(p => p.id === params.id);
  if (!patient) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "#717182", fontSize: 16 }}>Patient not found</p>
        <button onClick={() => setLocation("/")} style={{ marginTop: 16, color: "#50C878", background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>← Back</button>
      </div>
    );
  }

  const patientVisits       = repo.getVisitsByPatient(patient.id);
  const patientInvestigations = repo.getInvestigationsByPatient(patient.id);
  const patientTreatments   = repo.getTreatmentsByPatient(patient.id);
  const patientNotes        = repo.getQuickNotes(patient.id);
  const latestVitals        = repo.getVitalSignsByPatient(patient.id)[0];

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  /* shared card style */
  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #F1F1F1",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
    padding: 28,
    marginBottom: 24,
  };

  const label: React.CSSProperties = {
    fontSize: 12, color: "#717182", fontWeight: 600,
    marginBottom: 5, display: "block", letterSpacing: "0.2px",
  };
  const value: React.CSSProperties = { fontSize: 15, color: "#171717", fontWeight: 500 };

  const tabs = [
    { id: "history"        as const, label: t("profile.tab.history") },
    { id: "investigations" as const, label: t("profile.tab.investigations") },
    { id: "treatments"     as const, label: t("profile.tab.treatments") },
    { id: "notes"          as const, label: t("profile.tab.notes") },
  ];

  /* vital card definitions */
  const vitalCards = [
    {
      id: "bp", icon: Heart, iconColor: "#e53e3e", iconBg: "#FFF5F5",
      label: t("vitals.bp"),
      display: latestVitals?.bpSystolic
        ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}` : "—",
      unit: "mmHg", badgeValue: latestVitals?.bpSystolic,
    },
    {
      id: "hr", icon: Activity, iconColor: "#e53e3e", iconBg: "#FFF5F5",
      label: t("vitals.hr"),
      display: latestVitals?.heartRate?.toString() ?? "—",
      unit: "bpm", badgeValue: latestVitals?.heartRate,
    },
    {
      id: "temp", icon: Thermometer, iconColor: "#dd6b20", iconBg: "#FFFAF0",
      label: t("vitals.temp"),
      display: latestVitals?.temperature?.toString() ?? "—",
      unit: "°C", badgeValue: latestVitals?.temperature,
    },
    {
      id: "spo2", icon: Droplets, iconColor: "#3182ce", iconBg: "#EBF8FF",
      label: t("vitals.spo2"),
      display: latestVitals?.oxygenSat?.toString() ?? "—",
      unit: "%", badgeValue: latestVitals?.oxygenSat,
    },
    {
      id: "rr", icon: Wind, iconColor: "#6b46c1", iconBg: "#FAF5FF",
      label: t("vitals.rr"),
      display: latestVitals?.respiratoryRate?.toString() ?? "—",
      unit: "/min", badgeValue: latestVitals?.respiratoryRate,
    },
    {
      id: "glucose", icon: Droplet, iconColor: "#d69e2e", iconBg: "#FFFFF0",
      label: t("vitals.glucose"),
      display: latestVitals?.bloodGlucose?.toString() ?? "—",
      unit: "mg/dL", badgeValue: latestVitals?.bloodGlucose,
    },
    {
      id: "weight", icon: Scale, iconColor: "#38a169", iconBg: "#F0FFF4",
      label: t("vitals.weight"),
      display: latestVitals?.currentWeight?.toString() ?? "—",
      unit: "kg", badgeValue: latestVitals?.currentWeight,
    },
  ];

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    createQuickNote({ patientId: patient.id, text: noteText.trim() });
    setNoteText("");
    refreshData();
    toast({ title: "Note added" });
  };

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr", maxWidth: 1024 }}>

      {/* Back */}
      <button
        onClick={() => setLocation("/")}
        data-testid="btn-back-profile"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 15, cursor: "pointer", marginBottom: 24, fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <Arrow size={16} />
        {t("profile.back")}
      </button>

      {/* ── Unified Hero Card ── */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #F1F1F1",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
        padding: "28px 32px",
        marginBottom: 24,
      }}>
        {/* Name row + actions */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexDirection: isRTL ? "row-reverse" : "row",
        }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexDirection: isRTL ? "row-reverse" : "row" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "#E8F5E9",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <User size={28} color="#50C878" strokeWidth={1.6} />
            </div>
            <div style={{ textAlign: isRTL ? "right" : "left" }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#171717", margin: 0, lineHeight: 1.2 }}>
                {patient.name}
              </h1>
              <div style={{ fontSize: 13, color: "#717182", marginTop: 5 }}>
                {t("profile.idLabel")}: <strong style={{ color: "#171717" }}>{patient.nationalId}</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexDirection: isRTL ? "row-reverse" : "row" }}>
            <button
              onClick={() => setShowEditModal(true)}
              data-testid="btn-edit-patient"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", border: "1px solid #F1F1F1", borderRadius: 10, padding: "9px 16px", cursor: "pointer", fontSize: 14, color: "#717182", fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              <Pencil size={15} strokeWidth={1.5} />
              {t("common.edit")}
            </button>
            <button
              onClick={() => setLocation(`/patients/${patient.id}/visits/new`)}
              data-testid="btn-add-visit"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              <Plus size={16} />
              {t("profile.addVisit")}
            </button>
          </div>
        </div>

        {/* 4-column info grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          marginBottom: 24,
        }}>
          {/* Age */}
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <User size={13} color="#717182" strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("addPatient.age")}</span>
            </div>
            <span className="pill-green" style={{ fontSize: 13, padding: "4px 12px" }}>
              {patient.age} {t("profile.years")}
            </span>
          </div>

          {/* Mobile */}
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Phone size={13} color="#717182" strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("table.mobile")}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#171717" }}>{patient.mobile}</div>
            {patient.altMobile && (
              <div style={{ fontSize: 13, color: "#717182", marginTop: 3 }}>{patient.altMobile}</div>
            )}
          </div>

          {/* Region */}
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <MapPin size={13} color="#717182" strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("addPatient.region")}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#171717" }}>{patient.region} / {patient.neighborhood}</div>
          </div>

          {/* Applicant Name */}
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <UserCheck size={13} color="#717182" strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("addPatient.applicantName")}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#171717" }}>{patient.applicantName}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #F1F1F1", marginBottom: 20 }} />

        {/* Chronic Diseases */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
            <Heart size={14} color="#717182" strokeWidth={1.8} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("addPatient.chronicDiseases")}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" }}>
            {patient.chronicDiseases.length > 0
              ? patient.chronicDiseases.map(d => (
                  <span key={d} className="pill-green" style={{ fontSize: 12, padding: "4px 12px" }}>{d}</span>
                ))
              : <span style={{ fontSize: 14, color: "#717182" }}>—</span>}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexDirection: isRTL ? "row-reverse" : "row" }}>
            <AlertTriangle size={14} color="#f59e0b" strokeWidth={1.8} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#717182", letterSpacing: "0.7px", textTransform: "uppercase" }}>{t("addPatient.allergies")}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" }}>
            {patient.allergies.length > 0
              ? patient.allergies.map(a => (
                  <span key={a} style={{ background: "#FFF3E0", color: "#d97706", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{a}</span>
                ))
              : <span style={{ fontSize: 14, color: "#717182" }}>—</span>}
          </div>
        </div>
      </div>

      {/* ── Vital Signs — redesigned cards ── */}
      <div style={{ ...card, paddingBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexDirection: isRTL ? "row-reverse" : "row" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", margin: 0 }}>{t("profile.vitals")}</h2>
          <button
            onClick={() => setShowClearVitalsConfirm(true)}
            data-testid="btn-clear-vitals"
            style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#ef4444", fontFamily: "'Cairo', sans-serif" }}
          >
            {t("profile.clearVitals")}
          </button>
        </div>

        {!latestVitals ? (
          <p style={{ color: "#717182", fontSize: 15, textAlign: isRTL ? "right" : "left" }}>
            No vital signs recorded yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {vitalCards.map(({ id, icon, iconColor, iconBg, label: lbl, display, unit, badgeValue }) => (
              <VitalCard
                key={id}
                icon={icon}
                iconColor={iconColor}
                iconBg={iconBg}
                label={lbl}
                displayValue={display}
                unit={unit}
                badge={
                  <VitalStatusBadge
                    value={badgeValue}
                    vitalId={id}
                    vitalSettings={vitalSettings}
                    t={t}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Visit Timeline ── */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 24, textAlign: isRTL ? "right" : "left" }}>
          {t("profile.visitTimeline")}
        </h2>

        {patientVisits.length === 0 ? (
          <p style={{ color: "#717182", fontSize: 15, textAlign: isRTL ? "right" : "left" }}>No visits yet</p>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Vertical timeline line */}
            <div style={{
              position: "absolute",
              top: 10,
              bottom: 10,
              [isRTL ? "right" : "left"]: 15,
              width: 2,
              background: "#F1F1F1",
              borderRadius: 2,
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {patientVisits.map((v, idx) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 20,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{ flexShrink: 0, position: "relative", zIndex: 1, marginTop: 14 }}>
                    <div style={{
                      width: 32, height: 32,
                      borderRadius: "50%",
                      background: idx === 0 ? "#50C878" : "#fff",
                      border: `2px solid ${idx === 0 ? "#50C878" : "#D1D5DB"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: idx === 0 ? "#fff" : "#D1D5DB",
                      }} />
                    </div>
                  </div>

                  {/* Visit card */}
                  <button
                    onClick={() => setLocation(`/visits/${v.id}`)}
                    data-testid={`card-visit-${v.id}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      background: "#F9FAFB",
                      borderRadius: 12,
                      border: "1px solid #F1F1F1",
                      cursor: "pointer",
                      textAlign: isRTL ? "right" : "left",
                      fontFamily: "'Cairo', sans-serif",
                      transition: "all 0.15s ease",
                      flexDirection: isRTL ? "row-reverse" : "row",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#50C878";
                      el.style.background = "#F0FDF4";
                      el.style.boxShadow = "0 4px 12px rgba(80,200,120,0.12)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#F1F1F1";
                      el.style.background = "#F9FAFB";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ textAlign: isRTL ? "right" : "left" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#171717", marginBottom: 4 }}>
                        {new Date(v.visitDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 13, color: "#717182" }}>
                        {v.mainService || "—"}
                        {v.doctor ? ` · ${v.doctor}` : ""}
                      </div>
                      {v.diagnosis && (
                        <div style={{ fontSize: 13, color: "#50C878", fontWeight: 600, marginTop: 4 }}>
                          {v.diagnosis}
                        </div>
                      )}
                    </div>
                    <span className={v.paymentStatus === "paid" ? "pill-green" : "pill-red"}>
                      {t(`visit.${v.paymentStatus}`)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Records Tabs ── */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 20, textAlign: isRTL ? "right" : "left" }}>
          {t("profile.records")}
        </h2>

        {/* Tab Nav */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #F1F1F1", marginBottom: 24, flexDirection: isRTL ? "row-reverse" : "row" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              style={{
                padding: "10px 18px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #50C878" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
                fontSize: 14,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patientVisits.length === 0 ? (
              <p style={{ color: "#717182", fontSize: 15 }}>No records</p>
            ) : patientVisits.map(v => (
              <div key={v.id} style={{ padding: "18px 20px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #F1F1F1", textAlign: isRTL ? "right" : "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isRTL ? "row-reverse" : "row", marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#171717" }}>{new Date(v.visitDate).toLocaleDateString()}</div>
                  <button onClick={() => setLocation(`/visits/${v.id}`)} style={{ background: "none", border: "none", color: "#50C878", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>{t("common.edit")} →</button>
                </div>
                {v.chiefComplaint && <div style={{ fontSize: 14, color: "#717182", marginBottom: 4 }}>{t("visit.complaint")}: {v.chiefComplaint}</div>}
                {v.diagnosis && <div style={{ fontSize: 14, color: "#171717", fontWeight: 600 }}>{t("visit.diagnosis")}: {v.diagnosis}</div>}
                {v.doctor && <div style={{ fontSize: 13, color: "#717182", marginTop: 4 }}>{t("visit.doctor")}: {v.doctor}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Investigations */}
        {activeTab === "investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patientInvestigations.length === 0 ? (
              <p style={{ color: "#717182", fontSize: 15 }}>No investigations</p>
            ) : patientInvestigations.map(inv => (
              <div key={inv.id} style={{ padding: "16px 20px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #F1F1F1", textAlign: isRTL ? "right" : "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#171717", marginBottom: 4 }}>{inv.testName}</div>
                {inv.result && <div style={{ fontSize: 14, color: "#717182", marginBottom: 2 }}>Result: {inv.result}</div>}
                {inv.notes && <div style={{ fontSize: 13, color: "#aaa" }}>{inv.notes}</div>}
                <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Treatments */}
        {activeTab === "treatments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patientTreatments.length === 0 ? (
              <p style={{ color: "#717182", fontSize: 15 }}>No treatments</p>
            ) : patientTreatments.map(tr => (
              <div key={tr.id} style={{ padding: "16px 20px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #F1F1F1", display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: isRTL ? "row-reverse" : "row" }}>
                <div style={{ textAlign: isRTL ? "right" : "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#171717" }}>{tr.medicineName}</div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>{new Date(tr.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Notes */}
        {activeTab === "notes" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexDirection: isRTL ? "row-reverse" : "row" }}>
              <input
                style={{
                  flex: 1, background: "#F3F3F5", border: "1px solid #F1F1F1",
                  borderRadius: 10, padding: "11px 14px", fontSize: 14,
                  fontFamily: "'Cairo', sans-serif", outline: "none",
                  direction: isRTL ? "rtl" : "ltr",
                }}
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddNote(); }}
              />
              <button
                onClick={handleAddNote}
                data-testid="btn-add-note"
                style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {patientNotes.length === 0 ? (
                <p style={{ color: "#717182", fontSize: 15 }}>No notes</p>
              ) : patientNotes.map(n => (
                <div key={n.id} style={{ padding: "14px 18px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #F1F1F1", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexDirection: isRTL ? "row-reverse" : "row" }}>
                  <div style={{ textAlign: isRTL ? "right" : "left" }}>
                    <div style={{ fontSize: 14, color: "#171717" }}>{n.text}</div>
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 5 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => setDeleteNoteId(n.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Administrative Zone — Delete Patient ── */}
      <div style={{
        borderTop: "1px solid #F1F1F1",
        marginTop: 8,
        paddingTop: 24,
        marginBottom: 32,
        display: "flex",
        justifyContent: isRTL ? "flex-start" : "flex-end",
      }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          data-testid="btn-delete-patient"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "transparent",
            border: "1px solid #fca5a5",
            borderRadius: 10,
            padding: "9px 18px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#dc2626",
            fontFamily: "'Cairo', sans-serif",
            flexDirection: isRTL ? "row-reverse" : "row",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "#FFF5F5";
            el.style.borderColor = "#dc2626";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "transparent";
            el.style.borderColor = "#fca5a5";
          }}
        >
          <Trash2 size={14} strokeWidth={1.6} />
          {t("deletePatient.btn")}
        </button>
      </div>

      {/* ── Delete Patient Confirmation ── */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, direction: isRTL ? "rtl" : "ltr" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 460, width: "90%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFF5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ShieldAlert size={28} color="#dc2626" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#171717", marginBottom: 10 }}>
              {t("deletePatient.modalTitle")}
            </div>
            <div style={{ fontSize: 14, color: "#717182", lineHeight: 1.7, marginBottom: 28 }}>
              {t("deletePatient.modalBody")}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#717182" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  deletePatient(patient.id);
                  toast({ title: t("deletePatient.success") });
                  setLocation("/");
                }}
                data-testid="btn-confirm-delete-patient"
                style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", gap: 8 }}
              >
                <Trash2 size={15} strokeWidth={2} />
                {t("deletePatient.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showEditModal && (
        <AddPatientModal
          editPatient={patient}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); refreshData(); }}
        />
      )}

      {deleteNoteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 36, maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <AlertTriangle size={32} color="#ef4444" style={{ margin: "0 auto 14px" }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#171717", marginBottom: 24 }}>Delete Note?</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteNoteId(null)} style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={() => { deleteQuickNote(deleteNoteId); refreshData(); setDeleteNoteId(null); }} data-testid="btn-confirm-delete-note" style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {showClearVitalsConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 36, maxWidth: 460, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <AlertTriangle size={32} color="#ef4444" style={{ margin: "0 auto 14px" }} />
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{t("profile.clearVitalsConfirm")}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => setShowClearVitalsConfirm(false)} style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button onClick={() => { clearVitalSignsByPatient(patient.id); refreshData(); setShowClearVitalsConfirm(false); toast({ title: "Vitals cleared" }); }} data-testid="btn-confirm-clear-vitals" style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.yes")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
