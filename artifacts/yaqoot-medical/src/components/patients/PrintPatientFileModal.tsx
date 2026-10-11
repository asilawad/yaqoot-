import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Patient, Visit, Investigation, Treatment, QuickNote, VitalSigns } from "@/lib/db/types";
import { formatDate } from "@/lib/date";
import { SERVICES, getServiceLabel, matchesServiceFilter } from "@/lib/services";
import PatientFilePrintView, { PrintLayout, PrintOptions, PrintSection } from "./PatientFilePrintView";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  visits: Visit[];
  investigations: Investigation[];
  treatments: Treatment[];
  notes: QuickNote[];
  vitals: VitalSigns[];
}

type Scope = "all" | "range" | "last" | "manual";
type Preset = "full" | "treatments" | "tests" | "vitals" | "last3";

const SECTION_KEYS: PrintSection[] = ["patient", "visit", "vitals", "tests", "treatments", "notes", "payments"];
const DEFAULT_SECTIONS: Record<PrintSection, boolean> = {
  patient: true, visit: true, vitals: false, tests: false, treatments: false, notes: false, payments: false,
};
const only = (keys: PrintSection[]) =>
  Object.fromEntries(SECTION_KEYS.map(k => [k, keys.includes(k)])) as Record<PrintSection, boolean>;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const GREEN = "#50C878";
const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#717182", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8, display: "block" };
const inputStyle: CSSProperties = { border: "1px solid #E5E7EB", borderRadius: 10, padding: "7px 10px", fontSize: 14, fontFamily: "'Cairo', sans-serif", background: "#F9FAFB", color: "#171717" };
const rowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#171717", cursor: "pointer" };
const linkBtn: CSSProperties = { background: "none", border: "none", color: GREEN, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "'Cairo', sans-serif" };

function Group({ title, children, extra }: { title: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <fieldset style={{ border: "1px solid #F1F1F1", borderRadius: 12, padding: "14px 16px", margin: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <legend style={{ ...labelStyle, float: "none", padding: 0 }}>{title}</legend>
        {extra}
      </div>
      {children}
    </fieldset>
  );
}

export default function PrintPatientFileModal({ open, onClose, patient, visits, investigations, treatments, notes, vitals }: Props) {
  const { t, isRTL } = useTranslation();
  const [scope, setScope] = useState<Scope>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lastN, setLastN] = useState("5");
  const [manual, setManual] = useState<Set<string>>(() => new Set(visits.map(v => v.id)));
  const [service, setService] = useState("");
  const [sections, setSections] = useState<Record<PrintSection, boolean>>(DEFAULT_SECTIONS);
  const [layout, setLayout] = useState<PrintLayout>("detailed");
  const [header, setHeader] = useState(true);
  const [signature, setSignature] = useState(false);
  const [paper, setPaper] = useState<"A4" | "A5">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [printJob, setPrintJob] = useState<{ options: PrintOptions; visits: Visit[] } | null>(null);

  const sortedDesc = useMemo(
    () => [...visits].sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || "") || b.createdAt.localeCompare(a.createdAt)),
    [visits],
  );

  const nNum = Number(lastN);
  const nValid = lastN.trim() !== "" && Number.isInteger(nNum) && nNum >= 1;
  const rangeValid = DATE_RE.test(from) && DATE_RE.test(to) && from <= to;

  let scopeError = "";
  if (scope === "range" && !rangeValid) scopeError = t("printFile.error.range");
  if (scope === "last" && !nValid) scopeError = t("printFile.error.lastN");

  const selectedVisits = useMemo(() => {
    let list: Visit[] = sortedDesc;
    if (scope === "range") list = rangeValid ? list.filter(v => { const d = formatDate(v.visitDate); return d >= from && d <= to; }) : [];
    else if (scope === "last") list = nValid ? list.slice(0, nNum) : [];
    else if (scope === "manual") list = list.filter(v => manual.has(v.id));
    if (service) list = list.filter(v => matchesServiceFilter(v.mainService, v.subService, service, ""));
    return list;
  }, [sortedDesc, scope, rangeValid, from, to, nValid, nNum, manual, service]);

  const anySection = SECTION_KEYS.some(k => sections[k]);
  const canPrint = !scopeError && selectedVisits.length > 0 && anySection && !printJob;

  const applyPreset = (p: Preset) => {
    setActivePreset(p);
    setService("");
    if (p === "last3") { setScope("last"); setLastN("3"); } else setScope("all");
    if (p === "full") { setSections(only(SECTION_KEYS)); setLayout("detailed"); }
    if (p === "treatments") { setSections(only(["treatments"])); setLayout("byType"); }
    if (p === "tests") { setSections(only(["tests"])); setLayout("byType"); }
    if (p === "vitals") { setSections(only(["vitals"])); setLayout("byType"); }
    if (p === "last3") { setSections(only(["patient", "visit", "treatments"])); setLayout("compact"); }
  };

  const handlePrint = () => {
    if (!canPrint) return;
    setPrintJob({ options: { sections: { ...sections }, layout, header, signature, paper, orientation }, visits: selectedVisits });
  };

  const sectionLabel: Record<PrintSection, string> = {
    patient: t("printFile.section.patient"),
    visit: t("printFile.section.visitInfo"),
    vitals: t("printFile.section.vitals"),
    tests: t("printFile.section.tests"),
    treatments: t("printFile.section.treatments"),
    notes: t("printFile.section.notesPatient"),
    payments: t("printFile.section.payments"),
  };

  const presets: Preset[] = ["full", "treatments", "tests", "vitals", "last3"];
  const radio = (name: string, checked: boolean, onChange: () => void, label: string, testId: string) => (
    <label style={rowStyle}>
      <input type="radio" name={name} checked={checked} onChange={onChange} data-testid={testId} style={{ accentColor: GREEN }} />
      {label}
    </label>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
        <DialogContent
          dir={isRTL ? "rtl" : "ltr"}
          className="max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-2xl border-[#F1F1F1] bg-white p-0 gap-0"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          data-testid="modal-print-patient-file"
        >
          <div style={{ padding: "24px 28px 12px", borderBottom: "1px solid #F1F1F1" }}>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 800, color: "#171717" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "#E8F5E9", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Printer size={18} color={GREEN} />
              </span>
              {t("printFile.title")}
            </DialogTitle>
            <DialogDescription style={{ fontSize: 13, color: "#717182", marginTop: 6, textAlign: "start" }}>
              {patient.name} - {t("profile.idLabel")}: {patient.nationalId}
            </DialogDescription>
          </div>

          <div style={{ padding: "18px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Presets */}
            <div>
              <span style={labelStyle}>{t("printFile.presets")}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {presets.map(p => (
                  <button key={p} type="button" onClick={() => applyPreset(p)} data-testid={`button-preset-${p}`}
                    style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                      border: `1px solid ${activePreset === p ? GREEN : "#E5E7EB"}`, background: activePreset === p ? "#E8F5E9" : "#F9FAFB", color: activePreset === p ? "#2E8B57" : "#717182" }}>
                    {t(`printFile.preset.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <Group title={t("printFile.scope")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {radio("pf-scope", scope === "all", () => setScope("all"), t("printFile.scope.all"), "radio-scope-all")}
                {radio("pf-scope", scope === "range", () => setScope("range"), t("printFile.scope.range"), "radio-scope-range")}
                {scope === "range" && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingInlineStart: 24 }}>
                    <label style={{ fontSize: 13, color: "#717182" }}>{t("printFile.from")}{" "}
                      <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} data-testid="input-range-from" /></label>
                    <label style={{ fontSize: 13, color: "#717182" }}>{t("printFile.to")}{" "}
                      <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} data-testid="input-range-to" /></label>
                  </div>
                )}
                {radio("pf-scope", scope === "last", () => setScope("last"), t("printFile.scope.last"), "radio-scope-last")}
                {scope === "last" && (
                  <div style={{ paddingInlineStart: 24 }}>
                    <input type="number" min={1} step={1} aria-label={t("printFile.scope.last")} value={lastN} onChange={e => setLastN(e.target.value)} style={{ ...inputStyle, width: 90 }} data-testid="input-last-n" />
                  </div>
                )}
                {radio("pf-scope", scope === "manual", () => setScope("manual"), t("printFile.scope.manual"), "radio-scope-manual")}
                {scope === "manual" && (
                  <div style={{ paddingInlineStart: 24 }}>
                    <div style={{ display: "flex", gap: 14, marginBottom: 6 }}>
                      <button type="button" style={linkBtn} onClick={() => setManual(new Set(visits.map(v => v.id)))} data-testid="button-manual-select-all">{t("printFile.selectAll")}</button>
                      <button type="button" style={linkBtn} onClick={() => setManual(new Set())} data-testid="button-manual-clear">{t("printFile.clear")}</button>
                    </div>
                    <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #F1F1F1", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {sortedDesc.length === 0 && <span style={{ fontSize: 13, color: "#717182" }}>{t("printFile.noVisits")}</span>}
                      {sortedDesc.map(v => (
                        <label key={v.id} style={rowStyle}>
                          <input type="checkbox" checked={manual.has(v.id)} style={{ accentColor: GREEN }} data-testid={`checkbox-visit-${v.id}`}
                            onChange={() => setManual(prev => { const n = new Set(prev); if (n.has(v.id)) n.delete(v.id); else n.add(v.id); return n; })} />
                          <span>{formatDate(v.visitDate)}</span>
                          <span style={{ color: "#717182" }}>{getServiceLabel(v.mainService, t)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <label style={{ ...rowStyle, cursor: "default", marginTop: 4 }}>
                  <span style={{ color: "#717182", fontSize: 13 }}>{t("printFile.serviceFilter")}</span>
                  <select value={service} onChange={e => setService(e.target.value)} style={inputStyle} data-testid="select-service-filter">
                    <option value="">{t("patients.allServices")}</option>
                    {SERVICES.map(sv => <option key={sv.value} value={sv.value}>{t(sv.labelKey)}</option>)}
                  </select>
                </label>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedVisits.length ? "#2E8B57" : "#B91C1C" }} data-testid="text-visits-selected" aria-live="polite">
                  {t("printFile.visitsSelected", { count: selectedVisits.length })}
                </div>
                {scopeError && <div role="alert" style={{ fontSize: 12, color: "#B91C1C" }} data-testid="text-scope-error">{scopeError}</div>}
                {!scopeError && selectedVisits.length === 0 && <div style={{ fontSize: 12, color: "#B91C1C" }}>{t("printFile.zeroHint")}</div>}
              </div>
            </Group>

            {/* Content */}
            <Group title={t("printFile.content")} extra={
              <div style={{ display: "flex", gap: 14 }}>
                <button type="button" style={linkBtn} onClick={() => setSections(only(SECTION_KEYS))} data-testid="button-content-select-all">{t("printFile.selectAll")}</button>
                <button type="button" style={linkBtn} onClick={() => setSections(only([]))} data-testid="button-content-clear">{t("printFile.clearAll")}</button>
              </div>
            }>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {SECTION_KEYS.map(k => (
                  <label key={k} style={rowStyle}>
                    <input type="checkbox" checked={sections[k]} style={{ accentColor: GREEN }} data-testid={`checkbox-section-${k}`}
                      onChange={() => setSections(prev => ({ ...prev, [k]: !prev[k] }))} />
                    {sectionLabel[k]}
                  </label>
                ))}
              </div>
              {sections.notes && <p style={{ fontSize: 12, color: "#717182", margin: "8px 0 0" }}>{t("printFile.notesHint")}</p>}
              {!anySection && <div role="alert" style={{ fontSize: 12, color: "#B91C1C", marginTop: 6 }}>{t("printFile.noContentHint")}</div>}
            </Group>

            {/* Layout */}
            <Group title={t("printFile.layout")}>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {radio("pf-layout", layout === "detailed", () => setLayout("detailed"), t("printFile.layout.detailed"), "radio-layout-detailed")}
                {radio("pf-layout", layout === "compact", () => setLayout("compact"), t("printFile.layout.compact"), "radio-layout-compact")}
                {radio("pf-layout", layout === "byType", () => setLayout("byType"), t("printFile.layout.byType"), "radio-layout-bytype")}
              </div>
            </Group>

            {/* Paper */}
            <Group title={t("printFile.paper")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={rowStyle}><input type="checkbox" checked={header} onChange={e => setHeader(e.target.checked)} style={{ accentColor: GREEN }} data-testid="checkbox-header" />{t("printFile.includeHeader")}</label>
                <label style={rowStyle}><input type="checkbox" checked={signature} onChange={e => setSignature(e.target.checked)} style={{ accentColor: GREEN }} data-testid="checkbox-signature" />{t("printFile.includeSignature")}</label>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label style={{ ...rowStyle, cursor: "default" }}><span style={{ color: "#717182", fontSize: 13 }}>{t("printFile.paperSize")}</span>
                    <select value={paper} onChange={e => setPaper(e.target.value as "A4" | "A5")} style={inputStyle} data-testid="select-paper-size">
                      <option value="A4">A4</option><option value="A5">A5</option>
                    </select></label>
                  <label style={{ ...rowStyle, cursor: "default" }}><span style={{ color: "#717182", fontSize: 13 }}>{t("printFile.orientation")}</span>
                    <select value={orientation} onChange={e => setOrientation(e.target.value as "portrait" | "landscape")} style={inputStyle} data-testid="select-orientation">
                      <option value="portrait">{t("printFile.portrait")}</option><option value="landscape">{t("printFile.landscape")}</option>
                    </select></label>
                </div>
              </div>
            </Group>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 28px 22px", borderTop: "1px solid #F1F1F1" }}>
            <button type="button" onClick={onClose} data-testid="button-print-cancel"
              style={{ background: "#F9FAFB", border: "1px solid #F1F1F1", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, color: "#717182", fontFamily: "'Cairo', sans-serif" }}>
              {t("common.cancel")}
            </button>
            <button type="button" onClick={handlePrint} disabled={!canPrint} data-testid="button-print-confirm"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 10, border: "none", background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, cursor: canPrint ? "pointer" : "not-allowed", opacity: canPrint ? 1 : 0.5, fontFamily: "'Cairo', sans-serif" }}>
              <Printer size={16} />
              {t("printFile.print")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {printJob && (
        <PatientFilePrintView
          patient={patient}
          visits={printJob.visits}
          investigations={investigations}
          treatments={treatments}
          notes={notes}
          vitals={vitals}
          options={printJob.options}
          t={t}
          isRTL={isRTL}
          onDone={() => setPrintJob(null)}
        />
      )}
    </>
  );
}
