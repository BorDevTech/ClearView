import { Card, Input } from "@chakra-ui/react";

export function LicenseNumberInput({
  licenseNumber,
  setLicenseNumber,
}: {
  licenseNumber: string;
  setLicenseNumber: (value: string) => void;
}) {
  return (
    <>
      <Card.Title mt="2">License Number</Card.Title>{" "}
      <Input
        placeholder="License Number"
        value={licenseNumber}
        onChange={(e) => {
          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
          setLicenseNumber(val);
        }}
      />
    </>
  );
}
