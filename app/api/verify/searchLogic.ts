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
  KS: "kansa",
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
  NB: "newBrunswick",
  NH: "newHampshire",
  NJ: "newJersey",
  NM: "newMexico",
  NY: "newYork",
  NL: "newfoundlandLabrador",
  NC: "northCarolina",
  ND: "northDakota",
  NS: "novaScotia",
  OH: "ohio",
  OK: "oklahoma",
  ON: "ontario",
  OR: "oregon",
  PA: "pennsylvania",
  PE: "princeEdwardIsland",
  PR: "puertoRico",
  QC: "quebec",
  RI: "rhodeIsland",
  SK: "saskatchewan",
  SC: "southCarolina",
  SD: "southDakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "westVirginia",
  WI: "wisconsin",
  WY: "wyoming",
  XX: "test",
  // ...add the rest
};

export async function dynamicVerify(
  selectedState: string,
  params: Record<string, any>
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
