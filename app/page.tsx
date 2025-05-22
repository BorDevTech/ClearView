"use client";

import {
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  createListCollection,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";

import { HiOutlineX } from "react-icons/hi";
import { useState } from "react";

// colors pallete #41b883 and #2179b5

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({
        firstName,
        lastName,
        licenseNumber,
      });
      const res = await fetch(`/api/(GET)/VerifyVet?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const text = await res.text();
      setResult(text);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container as={"main"} bg={"#2179b5"} h={"100vh"}>
      <Center alignItems={"center"} justifyContent={"center"}>
        <Stack>
          <Heading alignItems={"center"} justifyContent={"center"}>
            🪪 ClearView - VetID
          </Heading>

          <p> One Portal. Every Vet. Instant Results.</p>
          <Card.Root width="320px">
            <Card.Body gap="2">
              <Card.Title mt="2">State</Card.Title>
              <Select.Root collection={ListedState}>
                <Select.HiddenSelect />
                <Select.Label color={"#41b883"} />

                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder="Select a State"
                      color={"white"}
                    />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>

                <Select.Positioner>
                  <Select.Content color={"#41b883"}>
                    {ListedState.items.map((state) => (
                      <Select.Item item={state} key={state.value}>
                        {state.value}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>

              <Stack>
                <Stack>
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

                  <Card.Title mt="2">License Number</Card.Title>
                  <Input
                    placeholder="License Number"
                    value={licenseNumber}
                    onChange={(e) => {
                      const val = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9.-]/g, "");
                      setLicenseNumber(val);
                    }}
                  />
                </Stack>
              </Stack>
            </Card.Body>
            <Card.Footer justifyContent="flex-end">
              <Button variant="outline">Clear</Button>
              <Button onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Card.Footer>
          </Card.Root>
          <Card.Root width="320px">
            <Card.Body gap="2">
              {error && (
                <>
                  <Box color="red.500">{error}</Box>
                  <Stack align={"start"}>
                    <Card.Title mt="2">License Status</Card.Title>
                    <Checkbox.Root
                      defaultChecked
                      variant={"solid"}
                      colorPalette={"red"}
                      readOnly
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <HiOutlineX />
                      </Checkbox.Control>
                      <Checkbox.Label color={"red.500"}>{error}</Checkbox.Label>
                    </Checkbox.Root>

                    <Stack>
                      Issued by:
                      <Box color={"red.500"}>
                        <HiOutlineX />
                      </Box>
                      <Text color={"red.500"}>{error}</Text>
                    </Stack>
                    <p>
                      License Expiration Date:
                      {new Date().toLocaleDateString()}
                    </p>
                    <Stack>
                      License Number:
                      <Text as="span" color="red.500">
                        {licenseNumber}
                      </Text>
                    </Stack>

                    <p>View official state verification page</p>
                  </Stack>
                </>
              )}
              {result && (
                <>
                  <Stack align={"start"}>
                    <Card.Title mt="2">License Status</Card.Title>
                    <Checkbox.Root
                      defaultChecked
                      variant={"solid"}
                      colorPalette={"green"}
                      readOnly
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label color={"green.500"}>
                        Active
                      </Checkbox.Label>
                    </Checkbox.Root>
                    <p>Issued by:</p>
                    <p>
                      License Expiration Date:
                      {new Date().toLocaleDateString()}
                    </p>
                    <p>
                      License Number:{" "}
                      <Text as="span" color="green.500">
                        {licenseNumber}
                      </Text>
                    </p>
                    <p> click View official state verification page</p>
                  </Stack>
                  <Box
                    mt={4}
                    p={2}
                    bg="white"
                    color="black"
                    borderRadius="md"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <div dangerouslySetInnerHTML={{ __html: result }} />
                  </Box>
                </>
              )}
            </Card.Body>
            <Card.Footer justifyContent="flex-end"></Card.Footer>
          </Card.Root>
        </Stack>
      </Center>
    </Container>
  );
}

const ListedState = createListCollection({
  items: [
    { name: "No_Selection", value: "Select a State" },
    { name: "AL", value: "Alabama" },
    { name: "AK", value: "Alaska" },
    { name: "AB", value: "Alberta" },
    { name: "AZ", value: "Arizona" },
    { name: "AR", value: "Arkansas" },
    { name: "BC", value: "British Columbia" },
    { name: "CA", value: "California" },
    { name: "CO", value: "Colorado" },
    { name: "CT", value: "Connecticut" },
    { name: "DE", value: "Delaware" },
    { name: "DC", value: "District of Columbia" },
    { name: "FL", value: "Florida" },
  ],
});
const frameworks = createListCollection({
  items: [
    { label: "Florida", value: "FL" },
    { label: "Vue.js", value: "vue" },
    { label: "Angular", value: "angular" },
    { label: "Svelte", value: "svelte" },
  ],
});
