import { VetResult } from "@/app/types/vet-result";

const regionEntryMap: Record<string, (keyof VetResult)[]> = {
  AL: ["firstName", "lastName", "licenseNumber", "status"],
  AK: ["name", "licenseNumber", "status"],
  AB: ["firstName", "lastName", "licenseNumber", "status"],
  AZ: ["firstName", "lastName", "licenseNumber", "status"],
  AR: ["firstName", "lastName", "licenseNumber", "status"],
  BC: ["name", "status"],// BC needs update
  CA: ["status"],//CA needs update
  CO: ["firstName", "lastName", "licenseNumber", "name", "status"],
  CT: ["firstName", "lastName", "licenseNumber", "name", "status"],
  DE: ["status"],//DE needs update
  DC: ["status"],//DC needs update
  FL: ["status"],//FL needs update
  GA: ["status"],//GA needs update
  HI: ["status"],//HI needs update
  ID: ["status"],//ID needs update
  IL: ["status"],//IL needs update
  IN: ["status"],//IN needs update
  IA: ["status"],//IA needs update
  KS: ["status"],//KS needs update
  KY: ["status"],//KY needs update
  LA: ["status"],//LA needs update
  ME: ["status"],//ME needs update
  MB: ["status"],//MB needs update
  MD: ["status"],//MD needs update
  MA: ["status"],//MA needs update
  MI: ["status"],//MI needs update
  MN: ["status"],//MN needs update
  MS: ["status"],//MS needs update
  MO: ["firstName", "lastName", "licenseNumber", "name", "status"],
  MT: ["status"],//MT needs update
  NE: ["status"],//NE needs update
  NV: ["status"],//NV needs update
  NB: ["status"],//NB needs update
  NH: ["status"],//NH needs update
  NJ: ["status"],//NJ needs update
  NM: ["name", "licenseNumber", "status"],
  NY: ["status"],//NY needs update
  NL: ["status"],//NL needs update
  NC: ["status"],//NC needs update
  ND: ["status"],//ND needs update
  NS: ["status"],//NS needs update
  OH: ["status"],//OH needs update
  OK: ["status"],//OK needs update
  ON: ["status"],//ON needs update
  OR: ["status"],//OR needs update
  PA: ["status"],//PA needs update
  PE: ["status"],//PE needs update
  PR: ["status"],//PR needs update
  QC: ["status"],//QC needs update
  RI: ["status"],//RI needs update
  SK: ["status"],//SK needs update
  SC: ["status"],//SC needs update
  SD: ["status"],//SD needs update
  TN: ["status"],//TN needs update
  TX: ["status"],//TX needs update
  UT: ["status"],//UT needs update
  VT: ["status"],//VT needs update
  VA: ["status"],//VA needs update
  WA: ["status"],//WA needs update
  WV: ["status"],//WV needs update
  WI: ["status"],//WI needs update
  WY: ["status"],//WY needs update
  XX: ["status"]
  // ...add the rest
};
const RegionSources: Record<string, string> = {
  AL: "https://www.albvetmed.org/veterinarian-search/",
  AK: "https://www.commerce.alaska.gov/cbp/main/search/ProfessionalLicenseSearch",
}