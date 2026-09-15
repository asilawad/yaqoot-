type Translate = (key: string) => string;

const REGION_LABEL_KEYS: Record<string, string> = {
  "Gaza City": "addPatient.region.gazaCity",
  "North Gaza": "addPatient.region.northGaza",
  "Middle Area": "addPatient.region.middleArea",
  "Khan Yunis": "addPatient.region.khanYunis",
  Rafah: "addPatient.region.rafah",
};

const NEIGHBORHOOD_LABEL_KEYS: Record<string, string> = {
  "Al-Rimal": "addPatient.neighborhood.alRimal",
  "An-Nasr": "addPatient.neighborhood.anNasr",
  "Sheikh Radwan": "addPatient.neighborhood.sheikhRadwan",
  "Al-Maqousi": "addPatient.neighborhood.alMaqousi",
  "Al-Mukhabarat": "addPatient.neighborhood.alMukhabarat",
  "Sheikh Ajlin": "addPatient.neighborhood.sheikhAjlin",
  "Al-Jalaa": "addPatient.neighborhood.alJalaa",
  "As-Saftawi": "addPatient.neighborhood.asSaftawi",
  "Tal Al-Hawa": "addPatient.neighborhood.talAlHawa",
  Sabra: "addPatient.neighborhood.sabra",
  "Ad-Daraj": "addPatient.neighborhood.adDaraj",
  "Az-Zaitoun": "addPatient.neighborhood.azZaitoun",
  "Shuja'iyya": "addPatient.neighborhood.shujaiyya",
  "At-Tuffah": "addPatient.neighborhood.atTuffah",
  "Al-Shati": "addPatient.neighborhood.alShati",
  Jabalia: "addPatient.neighborhood.jabalia",
  "Beit Lahia": "addPatient.neighborhood.beitLahia",
  "Beit Hanoun": "addPatient.neighborhood.beitHanoun",
  "Deir Al-Balah": "addPatient.neighborhood.deirAlBalah",
  Nuseirat: "addPatient.neighborhood.nuseirat",
  "Al-Bureij": "addPatient.neighborhood.alBureij",
  "Al-Maghazi": "addPatient.neighborhood.alMaghazi",
  "City Center": "addPatient.neighborhood.cityCenter",
  Camp: "addPatient.neighborhood.camp",
  "Al-Qarara": "addPatient.neighborhood.alQarara",
  "Bani Suheila": "addPatient.neighborhood.baniSuheila",
  "Tel Al-Sultan": "addPatient.neighborhood.telAlSultan",
  Shaboura: "addPatient.neighborhood.shaboura",
};

const getLocationLabel = (
  value: string,
  keys: Record<string, string>,
  t: Translate,
) => {
  const key = keys[value];
  return key ? t(key) : value;
};

export const getRegionLabel = (region: string, t: Translate) =>
  getLocationLabel(region, REGION_LABEL_KEYS, t);

export const getNeighborhoodLabel = (neighborhood: string, t: Translate) =>
  getLocationLabel(neighborhood, NEIGHBORHOOD_LABEL_KEYS, t);

export const getLocationSearchText = (
  region: string,
  neighborhood: string,
  t: Translate,
) => [
  region,
  getRegionLabel(region, t),
  neighborhood,
  getNeighborhoodLabel(neighborhood, t),
].join(" ");