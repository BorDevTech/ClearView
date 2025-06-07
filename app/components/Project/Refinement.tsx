import { Stack } from "@chakra-ui/react";
import { LicenseNumberInput } from "../LicenseNumberInput";
import { VetNameInput } from "../VetNameInput";

export default function Refinement({
  vetLicenseInput: { licenseNumber, setLicenseNumber },
  vetNameInput: { firstName, setFirstName, lastName, setLastName },
}: {
  vetLicenseInput: {
    licenseNumber: string;
    setLicenseNumber: (value: string) => void;
  };
  vetNameInput: {
    firstName: string;
    setFirstName: (value: string) => void;
    lastName: string;
    setLastName: (value: string) => void;
  };
}) {
  return (
    <Stack>
      {/* DO NOT TOUCH UNDERLYING COMPONENT */}
      <VetNameInput
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
      />
      {/* DO NOT TOUCH UNDERLYING COMPONENT */}
      <LicenseNumberInput
        licenseNumber={licenseNumber}
        setLicenseNumber={setLicenseNumber}
      />
    </Stack>
  );
}
