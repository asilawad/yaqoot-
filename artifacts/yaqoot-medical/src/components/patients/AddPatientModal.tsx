import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/lib/db/types";

const REGIONS: Record<string, string[]> = {
  "Gaza City": ["Al-Rimal", "An-Nasr", "Sheikh Radwan", "Al-Maqousi", "Al-Mukhabarat", "Sheikh Ajlin", "Al-Jalaa", "As-Saftawi", "Tal Al-Hawa", "Sabra", "Ad-Daraj", "Az-Zaitoun", "Shuja'iyya", "At-Tuffah"],
  "North Gaza": ["Jabalia", "Beit Lahia", "Beit Hanoun"],
  "Middle Area": ["Deir Al-Balah", "Nuseirat", "Al-Bureij", "Al-Maghazi"],
  "Khan Yunis": ["City Center", "Camp", "Al-Qarara", "Bani Suheila"],
  "Rafah": ["City Center", "Tel Al-Sultan", "Shaboura"],
  "Other": [],
};

const ALLERGIES = ["Dust/Mites", "Pollen", "Pet Dander", "Peanuts/Nuts", "Milk/Dairy", "Eggs", "Wheat/Gluten", "Soy", "Insect Stings", "Penicillin/Antibiotics", "NSAIDs", "Latex", "Cosmetics Chemicals"];
const CHRONIC = ["Hypertension", "Coronary Artery Disease", "Heart Failure", "Type 2 Diabetes", "Asthma", "COPD", "Osteoarthritis", "Rheumatoid Arthritis", "Chronic Kidney Disease"];
const SERVICES = ["Internal Medicine", "Surgery", "Clinical Nutrition", "Nursing Care", "Nephrology", "Physical Therapy", "OB/GYN Clinic"];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editPatient?: Patient;
}

export default function AddPatientModal({ onClose, onSaved, editPatient }: Props) {
  const { t, isRTL } = useTranslation();
  const { createPatient, updatePatient } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: editPatient?.name || "",
    nationalId: editPatient?.nationalId || "",
    age: editPatient?.age?.toString() || "",
    mobile: editPatient?.mobile || "",
    altMobile: editPatient?.altMobile || "",
    region: editPatient?.region || "",
    neighborhood: editPatient?.neighborhood || "",
    otherRegion: "",
    otherNeighborhood: "",
    applicantName: editPatient?.applicantName || "",
    sameAsPatient: editPatient ? editPatient.applicantName === editPatient.name : false,
    allergies: editPatient?.allergies?.filter(a => !a.startsWith("Other:")) || [] as string[],
    allergyOther: editPatient?.allergies?.find(a => a.startsWith("Other:"))?.replace("Other: ", "") || "",
    chronicDiseases: editPatient?.chronicDiseases?.filter(c => !c.startsWith("Other:")) || [] as string[],
    chronicOther: editPatient?.chronicDiseases?.find(c => c.startsWith("Other:"))?.replace("Other: ", "") || "",
    serviceType: editPatient?.serviceType || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const neighborhoods = form.region === "Other"
    ? []
    : (REGIONS[form.region] || []);

  const toggleList = (key: "allergies" | "chronicDiseases", val: string) => {
    setForm(f => {
      const list = f[key] as string[];
      return { ...f, [key]: list.includes(val) ? list.filter(x => x !== val) : [...list, val] };
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.nationalId.trim()) e.nationalId = "Required";
    else if (!/^\d+$/.test(form.nationalId)) e.nationalId = "Numbers only";
    if (!form.age.trim()) e.age = "Required";
    if (!form.mobile.trim()) e.mobile = "Required";
    else if (!/^\d+$/.test(form.mobile)) e.mobile = "Numbers only";
    if (!form.region) e.region = "Required";
    if (!form.neighborhood && form.region !== "Other") e.neighborhood = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const allAllergies = [
        ...form.allergies,
        ...(form.allergyOther ? [`Other: ${form.allergyOther}`] : [])
      ];
      const allChronic = [
        ...form.chronicDiseases,
        ...(form.chronicOther ? [`Other: ${form.chronicOther}`] : [])
      ];
      const region = form.region === "Other" ? form.otherRegion : form.region;
      const neighborhood = form.neighborhood === "Other" ? form.otherNeighborhood : form.neighborhood;

      const data = {
        name: form.name.trim(),
        nationalId: form.nationalId.trim(),
        age: parseInt(form.age),
        mobile: form.mobile.trim(),
        altMobile: form.altMobile.trim(),
        region,
        neighborhood,
        applicantName: form.sameAsPatient ? form.name.trim() : form.applicantName.trim(),
        allergies: allAllergies,
        chronicDiseases: allChronic,
        serviceType: form.serviceType,
      };

      if (editPatient) {
        updatePatient(editPatient.id, data);
      } else {
        createPatient(data);
      }
      toast({ title: t("addPatient.success") });
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      if (msg.includes("National ID")) {
        setErrors(e => ({ ...e, nationalId: t("addPatient.errorIdExists") }));
      }
    } finally {
      setLoading(false);
    }
  };

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
    direction: isRTL ? "rtl" : "ltr",
    boxSizing: "border-box",
  };

  const errStyle: React.CSSProperties = { fontSize: 11, color: "#ef4444", marginTop: 3, display: "flex", alignItems: "center", gap: 4 };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <div style={errStyle}><AlertCircle size={11} />{errors[field]}</div> : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 680,
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        direction: isRTL ? "rtl" : "ltr",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F1F1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#171717", margin: 0 }}>
            {editPatient ? t("addPatient.editTitle") : t("addPatient.title")}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#717182" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("table.name")} *</label>
              <input style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "#F1F1F1" }} value={form.name} onChange={e => { set("name", e.target.value); if (form.sameAsPatient) set("applicantName", e.target.value); }} />
              <FieldError field="name" />
            </div>

            {/* National ID */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("table.nationalId")} *</label>
              <input inputMode="numeric" style={{ ...inputStyle, borderColor: errors.nationalId ? "#ef4444" : "#F1F1F1" }} value={form.nationalId} onChange={e => set("nationalId", e.target.value.replace(/\D/g, ""))} />
              <FieldError field="nationalId" />
            </div>

            {/* Age */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("addPatient.age")} *</label>
              <input type="number" min="0" max="150" style={{ ...inputStyle, borderColor: errors.age ? "#ef4444" : "#F1F1F1" }} value={form.age} onChange={e => set("age", e.target.value)} />
              <FieldError field="age" />
            </div>

            {/* Mobile */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("table.mobile")} *</label>
              <input inputMode="numeric" style={{ ...inputStyle, borderColor: errors.mobile ? "#ef4444" : "#F1F1F1" }} value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, ""))} />
              <FieldError field="mobile" />
            </div>

            {/* Alt Mobile */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("addPatient.altMobile")}</label>
              <input inputMode="numeric" style={inputStyle} value={form.altMobile} onChange={e => set("altMobile", e.target.value.replace(/\D/g, ""))} />
            </div>

            {/* Region */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("addPatient.region")} *</label>
              <select
                style={{ ...inputStyle, borderColor: errors.region ? "#ef4444" : "#F1F1F1" }}
                value={form.region}
                onChange={e => { set("region", e.target.value); set("neighborhood", ""); }}
              >
                <option value="">—</option>
                {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <FieldError field="region" />
              {form.region === "Other" && (
                <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Enter region" value={form.otherRegion} onChange={e => set("otherRegion", e.target.value)} />
              )}
            </div>

            {/* Neighborhood */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("addPatient.neighborhood")} *</label>
              {form.region === "Other" ? (
                <input style={inputStyle} placeholder="Enter neighborhood" value={form.otherNeighborhood} onChange={e => set("otherNeighborhood", e.target.value)} />
              ) : (
                <select style={{ ...inputStyle, borderColor: errors.neighborhood ? "#ef4444" : "#F1F1F1" }} value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)}>
                  <option value="">—</option>
                  {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="Other">Other</option>
                </select>
              )}
              {form.neighborhood === "Other" && (
                <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Enter neighborhood" value={form.otherNeighborhood} onChange={e => set("otherNeighborhood", e.target.value)} />
              )}
              <FieldError field="neighborhood" />
            </div>

            {/* Applicant Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("addPatient.applicantName")}</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#717182", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.sameAsPatient} onChange={e => { set("sameAsPatient", e.target.checked); if (e.target.checked) set("applicantName", form.name); }} />
                  {t("addPatient.sameAsPatient")}
                </label>
              </div>
              {!form.sameAsPatient && (
                <input style={inputStyle} value={form.applicantName} onChange={e => set("applicantName", e.target.value)} />
              )}
            </div>

            {/* Service Type */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 6 }}>{t("patients.serviceType")}</label>
              <select style={inputStyle} value={form.serviceType} onChange={e => set("serviceType", e.target.value)}>
                <option value="">—</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Allergies */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 8 }}>{t("addPatient.allergies")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALLERGIES.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleList("allergies", a)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: `1px solid ${form.allergies.includes(a) ? "#50C878" : "#F1F1F1"}`,
                      background: form.allergies.includes(a) ? "#E8F5E9" : "#F9FAFB",
                      color: form.allergies.includes(a) ? "#2e7d32" : "#717182",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'Cairo', sans-serif",
                      fontWeight: form.allergies.includes(a) ? 600 : 400,
                    }}
                  >{a}</button>
                ))}
                <button
                  type="button"
                  onClick={() => { /* toggle other */ }}
                  style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${form.allergyOther ? "#50C878" : "#F1F1F1"}`, background: form.allergyOther ? "#E8F5E9" : "#F9FAFB", color: form.allergyOther ? "#2e7d32" : "#717182", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                >{t("common.other")}</button>
              </div>
              {(form.allergyOther !== "" || false) && (
                <input
                  style={{ ...inputStyle, marginTop: 8, width: "100%" }}
                  placeholder="Other allergy..."
                  value={form.allergyOther}
                  onChange={e => set("allergyOther", e.target.value)}
                />
              )}
              <input
                style={{ ...inputStyle, marginTop: 8, width: "100%" }}
                placeholder="Other allergy (if any)..."
                value={form.allergyOther}
                onChange={e => set("allergyOther", e.target.value)}
              />
            </div>

            {/* Chronic Diseases */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#717182", display: "block", marginBottom: 8 }}>{t("addPatient.chronicDiseases")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CHRONIC.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleList("chronicDiseases", c)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: `1px solid ${form.chronicDiseases.includes(c) ? "#50C878" : "#F1F1F1"}`,
                      background: form.chronicDiseases.includes(c) ? "#E8F5E9" : "#F9FAFB",
                      color: form.chronicDiseases.includes(c) ? "#2e7d32" : "#717182",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'Cairo', sans-serif",
                      fontWeight: form.chronicDiseases.includes(c) ? 600 : 400,
                    }}
                  >{c}</button>
                ))}
              </div>
              <input
                style={{ ...inputStyle, marginTop: 8, width: "100%" }}
                placeholder="Other disease (if any)..."
                value={form.chronicOther}
                onChange={e => set("chronicOther", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F1F1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#717182" }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            data-testid="btn-save-patient"
            style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", opacity: loading ? 0.7 : 1 }}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
