const stateLogicMap: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AB: "alberta",
  AZ: "arizona",
  AR: "arkansas",
  BC: "britishcolumbia",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  DC: "districtofcolumbia",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MB: "manitoba",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NB: "newbrunswick",
  NH: "newhampshire",
  NJ: "newjersey",
  NM: "newmexico",
  NY: "newyork",
  NL: "newfoundlandlabrador",
  NC: "northcarolina",
  ND: "northdakota",
  NS: "novascotia",
  OH: "ohio",
  OK: "oklahoma",
  ON: "ontario",
  OR: "oregon",
  PA: "pennsylvania",
  PE: "princeedwardisland",
  PR: "puertorico",
  QC: "quebec",
  RI: "rhodeisland",
  SK: "saskatchewan",
  SC: "southcarolina",
  SD: "southdakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "westvirginia",
  WI: "wisconsin",
  WY: "wyoming",
  XX: "test",
  // ...add the rest
};

export async function dynamicVerify(
  selectedState: string,
  params: Record<string, unknown>
) {
  const stateKey = selectedState.toUpperCase();
  console.log("dynamicVerify called with stateKey:", stateKey);
  const folder = stateLogicMap[stateKey];
  console.log("Folder for state:", folder);
  if (!folder) throw new Error("Selected state is not supported yet.");

  // Dynamically import the logic file and get the verify function
  const logicModule = await import(`./${folder}/logic`);
  console.log("Logic module imported:", logicModule);
  const verifyVet = logicModule.verify;
  console.log("Verification function found:", verifyVet);

  if (typeof verifyVet !== "function") {
    throw new Error("Verification function not found for this state.");
  }

  return verifyVet(params);
}
