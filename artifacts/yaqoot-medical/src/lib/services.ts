export type SubServiceDef = {
  value: string;
  labelKey: string;
  aliases?: string[];
  legacyMainTerms?: string[];
};

export type ServiceDef = {
  value: string;
  labelKey: string;
  terms: string[];
  subServices: SubServiceDef[];
};

export const SERVICES: ServiceDef[] = [
  {
    value: "Internal Medicine",
    labelKey: "service.internal",
    terms: ["internal medicine", "استشارات الباطنة", "الباطنة", "nephrology", "الكلى"],
    subServices: [
      { value: "General", labelKey: "subservice.general" },
      { value: "Pulmonology / Chest", labelKey: "subservice.pulmonology", aliases: ["Pulmonology"] },
      { value: "Nephrology", labelKey: "subservice.nephrology", legacyMainTerms: ["nephrology", "الكلى"] },
      { value: "Endocrinology", labelKey: "subservice.endocrinology" },
      { value: "Rheumatology", labelKey: "subservice.rheumatology" },
      { value: "Neurology", labelKey: "subservice.neurology" },
      { value: "Hematology & Oncology", labelKey: "subservice.hematologyOncology", aliases: ["Hematology", "Oncology"] },
    ],
  },
  {
    value: "Surgical Consultations",
    labelKey: "service.surgery",
    terms: ["surgery", "surgical", "الجراحة"],
    subServices: [
      { value: "General", labelKey: "subservice.general", aliases: ["General Surgery"] },
      { value: "Urology", labelKey: "subservice.urology" },
      { value: "Neurology", labelKey: "subservice.neurology", aliases: ["Neurosurgery"] },
      { value: "Orthopedics", labelKey: "subservice.orthopedics" },
    ],
  },
  {
    value: "Physical Therapy & Rehab",
    labelKey: "service.pt",
    terms: ["physical therapy", "العلاج الطبيعي"],
    subServices: [],
  },
  {
    value: "OB/GYN Clinic",
    labelKey: "service.obgyn",
    terms: ["ob/gyn", "النساء"],
    subServices: [
      { value: "Antenatal/Prenatal Care", labelKey: "subservice.obgyn.antenatal" },
      { value: "High-Risk Pregnancy Management", labelKey: "subservice.obgyn.highRisk" },
      { value: "Recurrent Miscarriage Investigation", labelKey: "subservice.obgyn.recurrentMiscarriage" },
      { value: "Infertility & Delayed Conception", labelKey: "subservice.obgyn.infertility" },
      { value: "PCOS Care", labelKey: "subservice.obgyn.pcos" },
      { value: "Menstrual Disorders", labelKey: "subservice.obgyn.menstrual" },
      { value: "Contraception Counseling", labelKey: "subservice.obgyn.contraception" },
      { value: "Gynecological Infections", labelKey: "subservice.obgyn.gynInfections" },
      { value: "Menopause Management", labelKey: "subservice.obgyn.menopause" },
      { value: "Cancer Screening/Pap Smear", labelKey: "subservice.obgyn.cancerScreening" },
      { value: "3D/4D Ultrasound", labelKey: "subservice.obgyn.ultrasound3d4d" },
    ],
  },
  {
    value: "Clinical Nutrition",
    labelKey: "service.nutrition",
    terms: ["clinical nutrition", "التغذية"],
    subServices: [],
  },
  {
    value: "Nursing Services",
    labelKey: "service.nursing",
    terms: ["nursing", "التمريض"],
    subServices: [
      { value: "Vital Signs Monitoring", labelKey: "subservice.nursing.vitalSigns" },
      { value: "Medication Administration", labelKey: "subservice.nursing.medication" },
      { value: "IV Therapy & Cannulation", labelKey: "subservice.nursing.ivTherapy" },
      { value: "Wound Care", labelKey: "subservice.nursing.woundCare" },
      { value: "Catheterization & Fluid Output", labelKey: "subservice.nursing.catheterization" },
      { value: "Airway & Oxygen Therapy", labelKey: "subservice.nursing.airwayOxygen" },
      { value: "Patient Hygiene & Bed Sore Prevention", labelKey: "subservice.nursing.hygieneBedSore" },
      { value: "Post-Operative Care", labelKey: "subservice.nursing.postOp" },
      { value: "Feeding Tube Care", labelKey: "subservice.nursing.feedingTube" },
      { value: "ECG Monitoring", labelKey: "subservice.nursing.ecg" },
      { value: "Emergency Response & CPR", labelKey: "subservice.nursing.emergencyCpr" },
      { value: "Patient & Family Education", labelKey: "subservice.nursing.education" },
      { value: "Nebulization", labelKey: "subservice.nursing.nebulization" },
    ],
  },
  {
    value: "Other",
    labelKey: "service.other",
    terms: ["other"],
    subServices: [],
  },
];

export function getSubServices(serviceValue: string): SubServiceDef[] {
  return SERVICES.find((service) => service.value === serviceValue)?.subServices ?? [];
}

export function getServiceLabel(
  stored: string | undefined,
  t: (key: string) => string,
): string {
  if (!stored || !stored.trim()) return "";

  const normalized = stored.trim().toLowerCase();
  const exactService = SERVICES.find((service) => service.value.toLowerCase() === normalized);
  if (exactService) return t(exactService.labelKey);

  if (normalized.includes("nephrology") || normalized.includes("الكلى")) {
    return t("service.nephrology");
  }

  const matchingService = SERVICES.find((service) =>
    service.terms.some((term) => normalized.includes(term)),
  );
  return matchingService ? t(matchingService.labelKey) : stored;
}

export function matchesServiceFilter(
  mainService: string | undefined,
  subService: string | undefined,
  serviceValue: string,
  subValue: string,
): boolean {
  if (!serviceValue) return true;

  const service = SERVICES.find((item) => item.value === serviceValue);
  const normalizedMain = (mainService ?? "").toLowerCase();
  const mainMatches = service
    ? service.terms.some((term) => normalizedMain.includes(term))
    : normalizedMain.includes(serviceValue.toLowerCase());

  if (!mainMatches || !subValue) return mainMatches;

  const normalizedSubValue = subValue.trim().toLowerCase();
  const normalizedStoredSub = (subService ?? "").trim().toLowerCase();
  const subDefinition = service?.subServices.find(
    (sub) => sub.value.toLowerCase() === normalizedSubValue,
  );

  if (!subDefinition) return normalizedStoredSub === normalizedSubValue;

  return (
    normalizedStoredSub === normalizedSubValue ||
    (subDefinition.aliases ?? []).some((alias) => alias.trim().toLowerCase() === normalizedStoredSub) ||
    (subDefinition.legacyMainTerms ?? []).some((term) => normalizedMain.includes(term))
  );
}
