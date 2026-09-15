import logoSrc from "@assets/yaqoot logo 1.png";
import { Patient, Treatment } from "@/lib/db/types";

interface PrescriptionVisit {
  visitDate?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  doctor?: string;
}

interface PrescriptionPrintViewProps {
  patient?: Patient;
  visit: PrescriptionVisit;
  treatments: Treatment[];
}

const formatPrescriptionDate = (value?: string) => {
  const date = (value || "").slice(0, 10);
  const parts = date.split("-");
  return parts.length === 3 && parts.every(Boolean)
    ? `${parts[0]} / ${parts[1]} / ${parts[2]}`
    : "";
};

export default function PrescriptionPrintView({
  patient,
  visit,
  treatments,
}: PrescriptionPrintViewProps) {
  const diagnosis = visit.diagnosis || visit.chiefComplaint || "";
  const doctor = visit.doctor || "Dr. Salem";

  return (
    <div id="prescription-print-area" className="prescription-print-area">
      <article className="prescription-print-sheet" dir="rtl">
        <header className="prescription-print-header">
          <img
            className="prescription-print-logo"
            src={logoSrc}
            alt=""
            aria-hidden="true"
          />
          <div className="prescription-print-brand">
            <div className="prescription-print-clinic-name">عيادة ياقوت الطبية</div>
            <div className="prescription-print-subtitle">رعاية طبية متكاملة، وحياة أفضل</div>
          </div>
        </header>

        <img
          className="prescription-print-watermark"
          src={logoSrc}
          alt=""
          aria-hidden="true"
        />

        <section className="prescription-print-meta" aria-label="بيانات الوصفة">
          <div className="prescription-print-field prescription-print-field-date">
            <span className="prescription-print-label">التاريخ :</span>
            <span>{formatPrescriptionDate(visit.visitDate)}</span>
          </div>
          <div className="prescription-print-field prescription-print-field-patient">
            <span className="prescription-print-label">اسم المريض :</span>
            <span>{patient?.name || ""}</span>
          </div>
          <div className="prescription-print-field prescription-print-field-age">
            <span className="prescription-print-label">العمر :</span>
            <span>{patient?.age ? `${patient.age}` : ""}</span>
          </div>
          <div className="prescription-print-field prescription-print-field-diagnosis">
            <span className="prescription-print-label">التشخيص :</span>
            <span>{diagnosis}</span>
          </div>
        </section>

        <section className="prescription-print-body" aria-label="الأدوية الموصوفة">
          <div className="prescription-print-rx">Rx</div>
          <div className="prescription-print-medications">
            {treatments.map((treatment, index) => (
              <div className="prescription-print-medication" key={treatment.id}>
                <span className="prescription-print-medication-number">{index + 1}.</span>
                <span>{treatment.medicineName}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="prescription-print-doctor">
          <span>اسم الطبيب :</span>
          <span>{doctor}</span>
        </div>

        <footer className="prescription-print-footer">
          العنوان : مسجد الفاروق شرقاً&nbsp;&nbsp; | &nbsp;&nbsp;الواتس : 0569488398&nbsp;&nbsp; | &nbsp;&nbsp;الجوال : 0593488398
        </footer>
      </article>
    </div>
  );
}