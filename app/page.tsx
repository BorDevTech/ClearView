"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  createListCollection,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";

import { HiOutlineX } from "react-icons/hi";
import { useState } from "react";
import { stat } from "fs";
import { VscCircleFilled } from "react-icons/vsc";

// colors pallete #41b883 and #2179b5

// Define the structure of the state definition
interface StateDefinition {
  active: boolean | null; // Use null for "No Selection"
  initials: string;
  value: string;
}

// Update the result type to match the actual DBPR fields
interface VetResult {
  name: string;
  licenseNumber: string;
  status: string;
  expiration: string;
  licenseType: string;
}

const ListedStates = createListCollection<StateDefinition>({
  items: [
    { active: null, initials: "No_Selection", value: "Select a State" },
    { active: false, initials: "AL", value: "Alabama" },
    { active: false, initials: "AK", value: "Alaska" },
    { active: false, initials: "AB", value: "Alberta" },
    { active: false, initials: "AZ", value: "Arizona" },
    { active: false, initials: "AR", value: "Arkansas" },
    { active: false, initials: "BC", value: "British Columbia" },
    { active: false, initials: "CA", value: "California" },
    { active: false, initials: "CO", value: "Colorado" },
    { active: false, initials: "CT", value: "Connecticut" },
    { active: false, initials: "DE", value: "Delaware" },
    { active: false, initials: "DC", value: "District of Columbia" },
    { active: true, initials: "FL", value: "Florida" },
    { active: false, initials: "GA", value: "Georgia" },
    { active: false, initials: "HI", value: "Hawaii" },
    { active: false, initials: "ID", value: "Idaho" },
    { active: false, initials: "IL", value: "Illinois" },
    { active: false, initials: "IN", value: "Indiana" },
    { active: false, initials: "IA", value: "Iowa" },
    { active: false, initials: "KS", value: "Kansa" },
    { active: false, initials: "KY", value: "Kentucky" },
    { active: false, initials: "LA", value: "Louisiana" },
    { active: false, initials: "ME", value: "Maine" },
    { active: false, initials: "MB", value: "Manitoba" },
    { active: false, initials: "MD", value: "Maryland" },
    { active: false, initials: "MA", value: "Massachusetts" },
    { active: false, initials: "MI", value: "Michigan" },
    { active: false, initials: "MN", value: "Minnesota" },
    { active: false, initials: "MS", value: "Mississippi" },
    { active: false, initials: "MO", value: "Missouri" },
    { active: false, initials: "MT", value: "Montana" },
    { active: false, initials: "NE", value: "Nebraska" },
    { active: false, initials: "NV", value: "Nevada" },
    { active: false, initials: "NB", value: "New Brunswick" },
    { active: false, initials: "NH", value: "New Hampshire" },
    { active: false, initials: "NJ", value: "New Jersey" },
    { active: false, initials: "NM", value: "New Mexico" },
    { active: false, initials: "NY", value: "New York" },
    { active: false, initials: "NL", value: "Newfoundland & Labrador" },
    { active: false, initials: "NC", value: "North Carolina" },
    { active: false, initials: "ND", value: "North Dakota" },
    { active: false, initials: "NS", value: "Nova Scotia" },
    { active: false, initials: "OH", value: "Ohio" },
    { active: false, initials: "OK", value: "Oklahoma" },
    { active: false, initials: "ON", value: "Ontario" },
    { active: false, initials: "OR", value: "Oregon" },
    { active: false, initials: "PA", value: "Pennsylvania" },
    { active: false, initials: "PE", value: "Prince Edward Island" },
    { active: false, initials: "PR", value: "Puerto Rico" },
    { active: false, initials: "QC", value: "Quebec" },
    { active: false, initials: "RI", value: "Rhode Island" },
    { active: false, initials: "SK", value: "Saskatchewan" },
    { active: false, initials: "SC", value: "South Carolina" },
    { active: false, initials: "SD", value: "South Dakota" },
    { active: false, initials: "TN", value: "Tennessee" },
    { active: false, initials: "TX", value: "Texas" },
    { active: false, initials: "UT", value: "Utah" },
    { active: false, initials: "VT", value: "Vermont" },
    { active: false, initials: "VA", value: "Virginia" },
    { active: false, initials: "WA", value: "Washington" },
    { active: false, initials: "WV", value: "West Virginia" },
    { active: false, initials: "WI", value: "Wisconsin" },
    { active: false, initials: "WY", value: "Wyoming" },
  ],
});

export default function Home() {
  const [result, setResult] = useState<VetResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5; // Adjust as needed

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
      const res = await fetch(`/api/VerifyVet?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const html = await res.text();
      // Find all table rows
      const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const results: VetResult[] = rows
        .map((row) => {
          // Extract all <td> cells
          const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
          if (tdMatches.length < 5) return null;
          // Name (2nd <td>, inside <a>)
          const nameTd = tdMatches[1][1];
          const nameMatch = nameTd.match(/<a[^>]*>([^<]+)<\/a>/i);
          const name = nameMatch
            ? nameMatch[1].trim()
            : nameTd.replace(/<[^>]+>/g, "").trim();
          // Status/Expiration (5th <td>)
          const statusExp = tdMatches[4][1].replace(/<[^>]+>/g, "").trim();
          let status = "";
          let expiration = "";
          if (/current/i.test(statusExp) && /active/i.test(statusExp)) {
            status = "Current, Active";
            // Try to extract the date after 'Active,'
            const dateMatch = statusExp.match(/Active,\s*([0-9/]+)/i);
            expiration = dateMatch ? dateMatch[1].trim() : "";
          } else {
            // Fallback: split by comma
            const parts = statusExp.split(",");
            status = parts[0] ? parts[0].trim() : "";
            expiration = parts[1] ? parts[1].trim() : "";
          }
          // Only include if name and expiration are present
          if (!name || !expiration) return null;
          return {
            name,
            licenseNumber: "", // You can add logic for license number if needed
            status,
            expiration,
            licenseType: "", // You can add logic for license type if needed
          };
        })
        .filter(Boolean) as VetResult[];
      setResult(results);
      setCurrentPage(1); // Reset to first page on new search
      setError(
        results.length === 0 ? "No valid license found or parse error" : null
      );
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
              <Select.Root collection={ListedStates}>
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
                  <Select.Content>
                    {ListedStates.items.map((state) => (
                      <Select.Item item={state} key={state.value}>
                        <HStack>
                          {state.active === true ? (
                            <Icon color="green.500" as={VscCircleFilled} />
                          ) : state.active === false ? (
                            <Icon color="red.500" as={VscCircleFilled} />
                          ) : null}

                          {state.value}
                          <Select.ItemIndicator />
                        </HStack>
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
              {error && <Box color="red.500">{error}</Box>}
              {Array.isArray(result) && result.length > 0 && (
                <>
                  {result
                    .slice(
                      (currentPage - 1) * resultsPerPage,
                      currentPage * resultsPerPage
                    )
                    .map((item, idx) => (
                      <Box
                        key={idx}
                        mb={4}
                        borderWidth={1}
                        borderRadius="md"
                        p={3}
                        bg={
                          item.status === "Active"
                            ? "green.50"
                            : item.status === "Null and Void"
                            ? "red.50"
                            : "gray.50"
                        }
                        maxH="150px"
                        overflow="hidden"
                        color="black" // Ensure text is readable on light backgrounds
                      >
                        <Card.Title mt="2">{item.name}</Card.Title>
                        <p>License Type: {item.licenseType}</p>
                        <p>Status: {item.status}</p>
                        <p>License #: {item.licenseNumber}</p>
                        <p>Expires: {item.expiration}</p>
                      </Box>
                    ))}
                  {/* Pagination Controls */}
                  <HStack justifyContent="center" mt={2}>
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Text>
                      Page {currentPage} of{" "}
                      {Math.ceil(result.length / resultsPerPage)}
                    </Text>
                    <Button
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          p < Math.ceil(result.length / resultsPerPage)
                            ? p + 1
                            : p
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(result.length / resultsPerPage)
                      }
                    >
                      Next
                    </Button>
                  </HStack>
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
