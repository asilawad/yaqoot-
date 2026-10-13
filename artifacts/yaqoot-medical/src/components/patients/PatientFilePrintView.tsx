import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import logoSrc from "@assets/yaqoot logo 1.png";
import { Patient, Visit, Investigation, Treatment, QuickNote, VitalSigns } from "@/lib/db/types";
import { formatDate, formatDateTime } from "@/lib/date";
import { getServiceLabel, getSubServices } from "@/lib/services";
import { getNeighborhoodLabel, getRegionLabel } from "@/lib/i18n/locationLabels";

export type PrintSection = "patient" | "visit" | "vitals" | "tests" | "treatments" | "notes" | "payments";
export type PrintLayout = "detailed" | "compact" | "byType";

export interface PrintOptions {
  sections: Record<PrintSection, boolean>;
  layout: PrintLayout;
  header: boolean;
  signature: boolean;
  paper: "A4" | "A5";
  orientation: "portrait" | "landscape";
}

interface Props {
  patient: Patient;
  visits: Visit[]; // already filtered
  investigations: Investigation[];
  treatments: Treatment[];
  notes: QuickNote[];
  vitals: VitalSigns[];
  options: PrintOptions;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  onDone: () => void;
}

const PRINT_ROOT_ID = "patient-file-print-root";
const PRINT_STYLE_ID = "patient-file-print-style";
const PRINT_CLASS = "patient-file-printing";

const DASH = "-";
const ltr = (s: string) => (s ? `\u2066${s}\u2069` : s);
const cssStr = (s: string) => `"${s.replace(/[\r\n]+/g, " ").replace(/[\\"]/g, "\\$&")}"`;

export function fmtNum(v: number | undefined | null): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}

export function subServiceLabel(main: string | undefined, sub: string | undefined, t: Props["t"]): string {
  if (!sub || !sub.trim()) return "";
  const norm = sub.trim().toLowerCase();
  const def = getSubServices(main ?? "").find(s =>
    s.value.toLowerCase() === norm || (s.aliases ?? []).some(a => a.toLowerCase() === norm));
  return def ? t(def.labelKey) : sub;
}

const VITAL_COLS: { key: string; label: string; get: (v: VitalSigns) => string }[] = [
  { key: "bp", label: "vitals.bp", get: v => (fmtNum(v.bpSystolic) || fmtNum(v.bpDiastolic)) ? `${fmtNum(v.bpSystolic) || DASH}/${fmtNum(v.bpDiastolic) || DASH}` : "" },
  { key: "hr", label: "vitals.hr", get: v => fmtNum(v.heartRate) },
  { key: "temp", label: "vitals.temp", get: v => fmtNum(v.temperature) },
  { key: "spo2", label: "vitals.spo2", get: v => fmtNum(v.oxygenSat) },
  { key: "rr", label: "vitals.rr", get: v => fmtNum(v.respiratoryRate) },
  { key: "glucose", label: "vitals.glucose", get: v => fmtNum(v.bloodGlucose) },
  { key: "weight", label: "vitals.weight", get: v => fmtNum(v.currentWeight) },
];

function buildCss(o: PrintOptions, footerLabel: string, rtl: boolean): string {
  return `
@media screen { #${PRINT_ROOT_ID} { display: none !important; } }
@media print {
  @page { size: ${o.paper} ${o.orientation}; margin: 12mm 12mm 16mm;
    @bottom-center { content: ${cssStr(footerLabel)} counter(page) " / " counter(pages); direction: ${rtl ? "rtl" : "ltr"}; font-family: 'Cairo', sans-serif; font-size: 9pt; color: #000; } }
  html.${PRINT_CLASS}, body.${PRINT_CLASS} {
    width: auto !important; min-width: 0 !important; height: auto !important; min-height: 0 !important;
    overflow: visible !important; background: #fff !important;
  }
  body.${PRINT_CLASS} > *:not(#${PRINT_ROOT_ID}) { display: none !important; }
  #${PRINT_ROOT_ID} { display: block !important; position: static !important; color: #000; background: #fff;
    font-family: 'Cairo', sans-serif; font-size: 11pt; line-height: 1.45; }
  #${PRINT_ROOT_ID} * { box-shadow: none !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #${PRINT_ROOT_ID} .pf-header { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
  #${PRINT_ROOT_ID} .pf-header img { width: 54px; height: 54px; object-fit: contain; }
  #${PRINT_ROOT_ID} .pf-clinic { font-size: 14pt; font-weight: 800; }
  #${PRINT_ROOT_ID} .pf-doc { font-size: 12pt; font-weight: 700; }
  #${PRINT_ROOT_ID} .pf-date { margin-inline-start: auto; font-size: 10pt; }
  #${PRINT_ROOT_ID} h2 { font-size: 12pt; font-weight: 800; margin: 12px 0 6px; }
  #${PRINT_ROOT_ID} h3 { font-size: 11pt; font-weight: 700; margin: 8px 0 4px; }
  #${PRINT_ROOT_ID} h2, #${PRINT_ROOT_ID} h3 { break-after: avoid; page-break-after: avoid; }
  #${PRINT_ROOT_ID} .pf-pt { font-size: 11pt; font-weight: 700; }
  #${PRINT_ROOT_ID} .pf-hint { font-size: 9.5pt; font-style: italic; margin: 0 0 4px; }
  #${PRINT_ROOT_ID} .pf-card { border: 1px solid #000; padding: 8px 10px; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
  #${PRINT_ROOT_ID} .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; }
  #${PRINT_ROOT_ID} table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  #${PRINT_ROOT_ID} thead { display: table-header-group; }
  #${PRINT_ROOT_ID} tr { page-break-inside: avoid; break-inside: avoid; }
  #${PRINT_ROOT_ID} th, #${PRINT_ROOT_ID} td { border: 1px solid #000; padding: 3px 5px; text-align: start; vertical-align: top; font-size: 10.5pt; overflow-wrap: anywhere; }
  #${PRINT_ROOT_ID} th { font-weight: 700; background: #eee; }
  #${PRINT_ROOT_ID} .pf-sign { display: flex; justify-content: space-between; gap: 40px; margin-top: 36px; page-break-inside: avoid; break-inside: avoid; }
  #${PRINT_ROOT_ID} .pf-sign div { flex: 1; border-top: 1px solid #000; padding-top: 4px; text-align: center; }
}`;
}

export default function PatientFilePrintView(props: Props) {
  const { patient, visits, investigations, treatments, notes, vitals, options, t, isRTL, onDone } = props;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Mount portal + style; clean up on unmount.
  useEffect(() => {
    const el = document.createElement("div");
    el.id = PRINT_ROOT_ID;
    document.body.appendChild(el);
    const style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    style.textContent = buildCss(options, `${patient.name} · ${patient.nationalId} · `, isRTL);
    const prevTitle = document.title;
    document.title = `${t("printFile.docTitle")} - ${patient.name} - ${formatDateTime(new Date().toISOString()).slice(0, 10)}`;
    document.head.appendChild(style); // appended last so it wins over existing CSS
    document.body.classList.add(PRINT_CLASS);
    document.documentElement.classList.add(PRINT_CLASS);
    setContainer(el);
    return () => {
      el.remove();
      style.remove();
      document.body.classList.remove(PRINT_CLASS);
      document.documentElement.classList.remove(PRINT_CLASS);
      document.title = prevTitle;
    };
    // options are snapshotted for this print job
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once rendered: wait for fonts/logo, print once, cleanup on afterprint.
  useEffect(() => {
    if (!container) return;
    let cancelled = false;
    let printed = false;
    const handleAfter = () => { if (!cancelled) onDoneRef.current(); };
    window.addEventListener("afterprint", handleAfter);
    (async () => {
      try { await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready; } catch { /* ignore */ }
      const img = logoRef.current;
      if (img && !img.complete) {
        await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); });
      }
      await new Promise<void>(res => requestAnimationFrame(() => requestAnimationFrame(() => res())));
      if (cancelled || printed) return;
      printed = true;
      window.print();
    })();
    return () => { cancelled = true; window.removeEventListener("afterprint", handleAfter); };
  }, [container]);

  if (!container) return null;

  const s = options.sections;
  const asc = [...visits].sort((a, b) => (a.visitDate || "").localeCompare(b.visitDate || "") || a.createdAt.localeCompare(b.createdAt));
  const visitIds = new Set(asc.map(v => v.id));
  const visitDate = new Map(asc.map(v => [v.id, ltr(formatDate(v.visitDate))]));
  const visitOrder = new Map(asc.map((v, i) => [v.id, i]));
  const byOrder = <T extends { visitId: string; createdAt: string }>(arr: T[]) =>
    arr.filter(x => visitIds.has(x.visitId))
      .sort((a, b) => (visitOrder.get(a.visitId)! - visitOrder.get(b.visitId)!) || a.createdAt.localeCompare(b.createdAt));
  const invs = byOrder(investigations);
  const trts = byOrder(treatments);
  const vits = byOrder(vitals);
  const notesAsc = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const payLabel = (v: Visit) => v.paymentStatus === "paid" ? t("visit.paid") : t("visit.unpaid");
  const val = (x: string | undefined) => (x && x.trim()) ? x : DASH;
  const listSep = isRTL ? "، " : ", ";
  const emptyRow = (cols: number) => <tr><td colSpan={cols} style={{ textAlign: "center" }}>{DASH}</td></tr>;

  const patientBlock = s.patient && (
    <section>
      <h2>{t("printFile.section.patient")}</h2>
      <div className="pf-card pf-grid">
        <div><strong>{t("addPatient.name")}:</strong> {patient.name}</div>
        <div><strong>{t("table.nationalId")}:</strong> <bdi>{patient.nationalId}</bdi></div>
        <div><strong>{t("addPatient.age")}:</strong> {patient.age ? `${fmtNum(patient.age)} ${t("profile.years")}` : DASH}</div>
        <div><strong>{t("table.mobile")}:</strong> <bdi>{val(patient.mobile)}{patient.altMobile ? ` / ${patient.altMobile}` : ""}</bdi></div>
        <div><strong>{t("table.location")}:</strong> {getRegionLabel(patient.region, t)} / {getNeighborhoodLabel(patient.neighborhood, t)}</div>
        <div><strong>{t("addPatient.applicantName")}:</strong> {val(patient.applicantName)}</div>
        <div><strong>{t("addPatient.chronicDiseases")}:</strong> {patient.chronicDiseases.length ? patient.chronicDiseases.join(listSep) : DASH}</div>
        <div><strong>{t("addPatient.allergies")}:</strong> {patient.allergies.length ? patient.allergies.join(listSep) : DASH}</div>
      </div>
    </section>
  );

  const notesBlock = s.notes && (
    <section>
      <h2>{t("printFile.section.notesPatient")}</h2>
      <p className="pf-hint">{t("printFile.notesHint")}</p>
      {notesAsc.length === 0 ? <p>{DASH}</p> : (
        <table>
          <thead><tr><th style={{ width: "22%" }}>{t("printFile.col.date")}</th><th>{t("printFile.col.note")}</th></tr></thead>
          <tbody>{notesAsc.map(n => <tr key={n.id}><td>{ltr(formatDateTime(n.createdAt))}</td><td style={{ whiteSpace: "pre-wrap" }}>{n.text}</td></tr>)}</tbody>
        </table>
      )}
    </section>
  );

  const visitInfoFields = (v: Visit) => ([
    [t("visit.doctor"), val(v.doctor)],
    [t("visit.mainService"), val(getServiceLabel(v.mainService, t))],
    [t("visit.subService"), val(subServiceLabel(v.mainService, v.subService, t))],
    [t("visit.complaint"), val(v.chiefComplaint)],
    [t("visit.diagnosis"), val(v.diagnosis)],
  ] as const);

  const vitalText = (v: VitalSigns) =>
    VITAL_COLS.map(c => { const x = c.get(v); return x ? `${t(c.label)}: ${x}` : ""; }).filter(Boolean).join(" | ");
  const testText = (i: Investigation) =>
    [i.testName, i.result ? `${t("printFile.col.result")}: ${i.result}` : "", i.resultDate ? ltr(formatDate(i.resultDate)) : "", i.notes ? `${t("printFile.col.notes")}: ${i.notes}` : ""].filter(Boolean).join(" - ");

  const hasVisitContent = s.visit || s.vitals || s.tests || s.treatments || s.payments;
  let body: ReactNode;
  if (options.layout !== "byType" && !hasVisitContent) {
    body = null;
  } else if (options.layout === "detailed") {
    body = (
      <>
        {asc.map(v => {
          const vv = vits.filter(x => x.visitId === v.id);
          const ii = invs.filter(x => x.visitId === v.id);
          const tt = trts.filter(x => x.visitId === v.id);
          return (
            <div className="pf-card" key={v.id}>
              <h2 style={{ marginTop: 0 }}>{t("visit.date")}: {ltr(formatDate(v.visitDate))}</h2>
              {s.visit && (<><h3>{t("printFile.section.visit")}</h3>
                <div className="pf-grid">{visitInfoFields(v).map(([k, x]) => <div key={k}><strong>{k}:</strong> {x}</div>)}</div></>)}
              {s.vitals && (<><h3>{t("printFile.section.vitals")}</h3>
                {vv.length ? vv.map(x => <div key={x.id}>{vitalText(x) || DASH}</div>) : <div>{DASH}</div>}</>)}
              {s.tests && (<><h3>{t("printFile.section.tests")}</h3>
                {ii.length ? ii.map(x => <div key={x.id}>{testText(x)}</div>) : <div>{DASH}</div>}</>)}
              {s.treatments && (<><h3>{t("printFile.section.treatments")}</h3>
                {tt.length ? tt.map(x => <div key={x.id}>{x.medicineName}</div>) : <div>{DASH}</div>}</>)}
              {s.payments && (<><h3>{t("printFile.section.payments")}</h3><div>{t("visit.paymentStatus")}: {payLabel(v)}</div></>)}
            </div>
          );
        })}
      </>
    );
  } else if (options.layout === "compact") {
    body = (
      <table>
        <thead><tr>
          <th>{t("printFile.col.date")}</th>
          {s.visit && <th>{t("printFile.section.visit")}</th>}
          {s.vitals && <th>{t("printFile.section.vitals")}</th>}
          {s.tests && <th>{t("printFile.section.tests")}</th>}
          {s.treatments && <th>{t("printFile.section.treatments")}</th>}
          {s.payments && <th>{t("printFile.section.payments")}</th>}
        </tr></thead>
        <tbody>{asc.map(v => (
          <tr key={v.id}>
            <td style={{ whiteSpace: "nowrap" }}>{ltr(formatDate(v.visitDate))}</td>
            {s.visit && <td>{visitInfoFields(v).filter(([, x]) => x !== DASH).map(([k, x]) => `${k}: ${x}`).join("; ") || DASH}</td>}
            {s.vitals && <td>{vits.filter(x => x.visitId === v.id).map(vitalText).filter(Boolean).join(" / ") || DASH}</td>}
            {s.tests && <td>{invs.filter(x => x.visitId === v.id).map(testText).join("; ") || DASH}</td>}
            {s.treatments && <td>{trts.filter(x => x.visitId === v.id).map(x => x.medicineName).join(listSep) || DASH}</td>}
            {s.payments && <td>{payLabel(v)}</td>}
          </tr>
        ))}</tbody>
      </table>
    );
  } else {
    body = (
      <>
        {s.visit && (<section><h2>{t("printFile.section.visit")}</h2><table>
          <thead><tr><th>{t("printFile.col.date")}</th><th>{t("visit.doctor")}</th><th>{t("visit.mainService")}</th><th>{t("visit.subService")}</th><th>{t("visit.complaint")}</th><th>{t("visit.diagnosis")}</th></tr></thead>
          <tbody>{asc.length === 0 ? emptyRow(6) : asc.map(v => <tr key={v.id}><td>{ltr(formatDate(v.visitDate))}</td>{visitInfoFields(v).map(([k, x]) => <td key={k}>{x}</td>)}</tr>)}</tbody>
        </table></section>)}
        {s.vitals && (<section><h2>{t("printFile.section.vitals")}</h2><table>
          <thead><tr><th>{t("printFile.col.date")}</th>{VITAL_COLS.map(c => <th key={c.key}>{t(c.label)}</th>)}</tr></thead>
          <tbody>{vits.length === 0 ? emptyRow(VITAL_COLS.length + 1) : vits.map(x => <tr key={x.id}><td>{visitDate.get(x.visitId)}</td>{VITAL_COLS.map(c => <td key={c.key}>{c.get(x) || DASH}</td>)}</tr>)}</tbody>
        </table></section>)}
        {s.tests && (<section><h2>{t("printFile.section.tests")}</h2><table>
          <thead><tr><th>{t("printFile.col.date")}</th><th>{t("printFile.col.test")}</th><th>{t("printFile.col.result")}</th><th>{t("printFile.col.resultDate")}</th><th>{t("printFile.col.notes")}</th></tr></thead>
          <tbody>{invs.length === 0 ? emptyRow(5) : invs.map(x => <tr key={x.id}><td>{visitDate.get(x.visitId)}</td><td>{x.testName}</td><td>{val(x.result)}</td><td>{ltr(formatDate(x.resultDate)) || DASH}</td><td>{val(x.notes)}</td></tr>)}</tbody>
        </table></section>)}
        {s.treatments && (<section><h2>{t("printFile.section.treatments")}</h2><table>
          <thead><tr><th style={{ width: "22%" }}>{t("printFile.col.date")}</th><th>{t("printFile.col.medicine")}</th></tr></thead>
          <tbody>{trts.length === 0 ? emptyRow(2) : trts.map(x => <tr key={x.id}><td>{visitDate.get(x.visitId)}</td><td>{x.medicineName}</td></tr>)}</tbody>
        </table></section>)}
        {s.payments && (<section><h2>{t("printFile.section.payments")}</h2><table>
          <thead><tr><th style={{ width: "22%" }}>{t("printFile.col.date")}</th><th>{t("visit.paymentStatus")}</th></tr></thead>
          <tbody>{asc.map(v => <tr key={v.id}><td>{ltr(formatDate(v.visitDate))}</td><td>{payLabel(v)}</td></tr>)}</tbody>
        </table></section>)}
      </>
    );
  }

  const idLine = <div className="pf-pt">{patient.name} — {t("table.nationalId")}: <bdi>{patient.nationalId}</bdi></div>;

  return createPortal(
    <div dir={isRTL ? "rtl" : "ltr"} lang={isRTL ? "ar" : "en"}>
      {options.header ? (
        <div className="pf-header">
          <img ref={logoRef} src={logoSrc} alt="" />
          <div>
            <div className="pf-clinic">{t("sidebar.clinicName")}</div>
            <div className="pf-doc">{t("printFile.docTitle")}</div>
            {idLine}
          </div>
          <div className="pf-date">{t("printFile.printedOn")}: {ltr(formatDateTime(new Date().toISOString()))}</div>
        </div>
      ) : (
        <>
          <div className="pf-doc" style={{ marginBottom: 8 }}>{t("printFile.docTitle")} - {ltr(formatDateTime(new Date().toISOString()))}</div>
          {idLine}
        </>
      )}
      {patientBlock}
      {body}
      {notesBlock}
      {options.signature && (
        <div className="pf-sign"><div>{t("printFile.signature")}</div><div>{t("printFile.stamp")}</div></div>
      )}
    </div>,
    container,
  );
}
