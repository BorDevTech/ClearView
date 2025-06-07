import { HStack, Stack, Card, Input } from "@chakra-ui/react";

export function VetNameInput({
  firstName,
  setFirstName,
  lastName,
  setLastName,
}: {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
}) {
  return (
    <HStack>
      <Stack>
        <Card.Title mt="2">First Name</Card.Title>
        <Input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </Stack>
      <Stack>
        <Card.Title mt="2">Last Name</Card.Title>
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </Stack>
    </HStack>
  );
}
