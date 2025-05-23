"use client";

import {
  Box,
  Button,
  Card,
  Center,
  Container,
  createListCollection,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

// colors pallete #41b883 and #2179b5

// Update the result type to match the actual DBPR fields
interface VetResult {
  name: string;
  licenseNumber: string;
  status: string;
  expiration: string;
  licenseType: string;
  address?: string;
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

export default function Home() {
  const [result, setResult] = useState<VetResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6; // Show up to 6 results per page to fill the grid

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Query string parameters (always present)
      const queryParams = new URLSearchParams({
        mode: licenseNumber && licenseNumber.trim() !== "" ? "2" : "2", // Always '2' per screenshot
        search:
          licenseNumber && licenseNumber.trim() !== "" ? "LicNbr" : "Name",
        SID: "",
        brd: "",
        typ: "N",
      });

      // Form data: include all fields, even if empty
      const formData = new URLSearchParams();
      formData.append("hSID", "");
      formData.append(
        "hSearchType",
        licenseNumber && licenseNumber.trim() !== "" ? "LicNbr" : "Name"
      );
      formData.append("hLastName", "");
      formData.append("hFirstName", "");
      formData.append("hMiddleName", "");
      formData.append("hOrgName", "");
      formData.append("hSearchOpt", "");
      formData.append("hSearchOpt2", "");
      formData.append("hSearchAltName", "");
      formData.append("hSearchPartName", "");
      formData.append("hSearchFuzzy", "");
      formData.append("hDivision", "ALL");
      formData.append("hBoard", "210");
      formData.append("LicenseType", "2601");
      formData.append("hSpecQual", "");
      formData.append("hAddrType", "");
      formData.append("hCity", "");
      formData.append("hCounty", "");
      formData.append("hState", "");
      formData.append("hLicNbr", "");
      formData.append("hAction", "");
      formData.append("hCurPage", "");
      formData.append("hTotalPages", "");
      formData.append("hTotalRecords", "");
      formData.append("hPageAction", "");
      formData.append("hDDChange", "");
      formData.append("hBoardType", "");
      // Remove hLicenseType if present
      // formData.append("hLicTyp", "");
      formData.append("hSearchHistoric", "");
      formData.append("hRecsPerPage", "10000");
      // Actual search fields (user input)
      formData.append("FirstName", firstName);
      formData.append("MiddleName", "");
      formData.append("LastName", lastName);
      formData.append("OrgName", "");
      formData.append("Board", "26");
      formData.append("City", "");
      formData.append("County", "");
      formData.append("State", "");
      formData.append("RecsPerPage", "10000");
      formData.append("LicNbr", licenseNumber);
      formData.append("Search1", "Search");

      const res = await fetch(`/api/VerifyVet?${queryParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const html = await res.text();
      // Debug: Log the first 1000 chars and number of <tr> rows
      if (process.env.NODE_ENV !== "production") {
        console.log("HTML preview:", html.slice(0, 1000));
      }
      // Find all table rows
      const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      if (process.env.NODE_ENV !== "production") {
        console.log("Found rows:", rows.length);
        console.log("First 3 rows:", rows.slice(0, 3));
      }
      const results: VetResult[] = [];
      for (let i = 0; i < rows.length; i++) {
        // Extract all <td> cells for this row
        const tdMatches = [...rows[i].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        if (tdMatches.length < 5) continue;
        // License Type (1st <td>)
        const licenseType = tdMatches[0][1].replace(/<[^>]+>/g, "").trim();
        if (licenseType.toLowerCase() !== "veterinarian") continue;
        // Name (2nd <td>, inside <a>)
        const nameTd = tdMatches[1][1];
        const nameMatch = nameTd.match(/<a[^>]*>([^<]+)<\/a>/i);
        const name = nameMatch
          ? nameMatch[1].trim()
          : nameTd.replace(/<[^>]+>/g, "").trim();
        // License Number (4th <td>, before <br/>)
        const licenseNumTd = tdMatches[3][1];
        const licenseNumber = licenseNumTd
          .split(/<br\s*\/?/i)[0]
          .replace(/<[^>]+>/g, "")
          .trim();
        // Status/Expiration (5th <td>)
        const statusExpTd = tdMatches[4][1];
        const statusExp = statusExpTd
          .replace(/<[^>]+>/g, "")
          .replace(/<br\s*\/?>(\s*)?/gi, ", ")
          .trim();
        if (!name || !/Current,\s*Active/i.test(statusExp)) continue;
        // Extract expiration date (after 'Current, Active')
        const expMatch = statusExp.match(/Current,\s*Active,?\s*([0-9\/]+)/i);
        const expiration = expMatch ? expMatch[1].trim() : "";
        // Address: look at next <tr> (if exists and has <td colspan)
        let address = "";
        if (i + 1 < rows.length) {
          const nextRow = rows[i + 1];
          if (/colspan=['\"]?6['\"]?/i.test(nextRow)) {
            // Try to extract address from the next row
            const addrMatch = nextRow.match(
              /<b>Main Address\*:<\/b>.*?<td[^>]*>([\s\S]*?)<\/td>/i
            );
            if (addrMatch) {
              address = addrMatch[1]
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim();
            } else {
              // Fallback: just get the first <td> after colspan
              const fallbackAddr = nextRow.match(
                /<td[^>]*colspan=['\"]?6['\"]?[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i
              );
              if (fallbackAddr) {
                address = fallbackAddr[1]
                  .replace(/<[^>]+>/g, "")
                  .replace(/\s+/g, " ")
                  .trim();
              }
            }
          }
        }
        results.push({
          name,
          licenseNumber,
          status: "Active",
          expiration,
          licenseType,
          address,
        });
      }
      // If no results, show a debug message
      if (results.length === 0 && process.env.NODE_ENV !== "production") {
        console.log("No veterinarian rows matched. Check table structure.");
      }
      setResult(results);
      setCurrentPage(1); // Reset to first page on new search
      setError(
        results.length === 0 ? "No valid license found or parse error" : null
      );
    } catch (err: unknown) {
      setError((err as Error).message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Add a clearForm function to reset all fields
  const clearForm = () => {
    setFirstName("");
    setLastName("");
    setLicenseNumber("");
    setResult(null);
    setError(null);
    setCurrentPage(1);
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
              <Button variant="outline" onClick={clearForm}>
                Clear
              </Button>
              <Button onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Card.Footer>
          </Card.Root>
          <Card.Root width="100%">
            <Card.Body gap="2">
              {error && <Box color="red.500">{error}</Box>}
              {Array.isArray(result) && result.length > 0 && (
                <>
                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      base: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                      xl: "repeat(4, 1fr)",
                    }}
                    gap={4}
                  >
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
                          h="200px"
                          overflow="hidden"
                          color="black"
                        >
                          <Card.Title mt="2">
                            <a
                              href="#"
                              style={{
                                color: "#2179b5",
                                textDecoration: "underline",
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                // Create and submit a hidden form to DBPR with all required fields
                                const form = document.createElement("form");
                                form.method = "POST";
                                form.action =
                                  "https://www.myfloridalicense.com/wl11.asp?mode=2&search=LicNbr&SID=&brd=&typ=N";
                                form.target = "_blank";
                                const addField = (
                                  name: string,
                                  value: string
                                ) => {
                                  const input = document.createElement("input");
                                  input.type = "hidden";
                                  input.name = name;
                                  input.value = value;
                                  form.appendChild(input);
                                };
                                addField("hSID", "");
                                addField("hSearchType", "LicNbr");
                                addField("hLastName", "");
                                addField("hFirstName", "");
                                addField("hMiddleName", "");
                                addField("hOrgName", "");
                                addField("hSearchOpt", "Organization");
                                addField("hSearchOpt2", "Alt");
                                addField("hSearchAltName", "");
                                addField("hSearchPartName", "");
                                addField("hSearchFuzzy", "");
                                addField("hDivision", "ALL");
                                addField("hBoard", "26");
                                addField("LicenseType", "2601");
                                addField("hSpecQual", "");
                                addField("hAddrType", "");
                                addField("hCity", "");
                                addField("hCounty", "");
                                addField("hState", "");
                                addField("hLicNbr", item.licenseNumber);
                                addField("hAction", "");
                                addField("hCurPage", "");
                                addField("hTotalPages", "");
                                addField("hTotalRecords", "");
                                addField("hPageAction", "");
                                addField("hDDChange", "");
                                addField("hBoardType", "");
                                addField("hSearchHistoric", "");
                                addField("hRecsPerPage", "10000");
                                // Add user fields as empty (not needed for LicNbr search)
                                addField("FirstName", "");
                                addField("MiddleName", "");
                                addField("LastName", "");
                                addField("OrgName", "");
                                addField("Board", "26");
                                addField("City", "");
                                addField("County", "");
                                addField("State", "");
                                addField("RecsPerPage", "10000");
                                addField("LicNbr", item.licenseNumber);
                                addField("Search1", "Search");
                                document.body.appendChild(form);
                                form.submit();
                                document.body.removeChild(form);
                              }}
                            >
                              {item.name}
                            </a>
                          </Card.Title>
                          <p>License Type: {item.licenseType}</p>
                          <p>Status: {item.status}</p>
                          <p>License #: {item.licenseNumber}</p>
                          <p>Expires: {item.expiration}</p>
                        </Box>
                      ))}
                  </Box>
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
