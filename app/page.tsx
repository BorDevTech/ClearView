"use client";

import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  Stack,
  Text, Grid
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import StateSelector, { ListedStates } from "./components/StateSelector";
import { ProjectHeader } from "./components/Project/Header";
import type { VetResult } from "./types/vet-result";
import { Search, Shield } from "lucide-react";
import Refinement from "./components/Project/Refinement";
import { dynamicVerify } from "./api/verify/searchLogic";
import { VetResultCard } from "./components/VetResultCard";
// colors pallete #41b883 and #2179b5

export default function Home() {
  const [result, setResult] = useState<VetResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedState, setSelectedState] = useState<string>("No_Selection");
  useEffect(() => {
    console.log("Server State (updated):", selectedState);
  }, [selectedState]);
  const resultsPerPage = 12; // Adjust as needed

  const handleSearch = async () => {
    console.log("selectedState value:", selectedState, typeof selectedState);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const results = await dynamicVerify(selectedState, {
        firstName,
        lastName,
        licenseNumber,
      });
      setResult(results);
      setCurrentPage(1);
      setError(
        results.length === 0 ? "No valid license found or parse error" : null
      );
    } catch (err: unknown) {
      let message = "Verification function not found for this state.";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
      console.log("Search completed", {
        firstName,
        lastName,
        licenseNumber,
        selectedState,
        result,
      });
    }
  };
  const label = ListedStates.items.find(
    (item: { value: string; label: string }) => item.value === selectedState)?.label || selectedState;

  // Gradient top bar and wider layout



  const [debugInfo, setDebugInfo] = useState<{ ok: boolean; preview: string | null } | null>(null);

  const handleTest = async () => {
    try {
      const res = await fetch("/api/test");
      const data = await res.json();
      setDebugInfo(data);
    } catch (err) {
      console.error("Failed to fetch debug info", err);
    }
  };



  return (
    <Stack minH="100vh">
      <ProjectHeader
        title={"ClearView - VetID"}
        icon={Shield}
        slogan={"One Portal. Every Vet. Instant Results."}
      />
      {/* Main Content */}
      <Stack direction={["column", "row"] as ["column", "row"]} gap={2} align="flex-start">
        {/* Search Card */}

        <Stack>
          <Card.Root
            // width="350px"
            width={'md'}>
            <Card.Body gap="2" >
              <Card.Title mt="2">
                <HStack gap={3}>
                  <Icon as={Search} />
                  <Heading size={"xl"} fontWeight={"bold"} m={0} p={0}>
                    Select Region Board
                  </Heading>
                </HStack>
              </Card.Title>
              <Card.Description>
                Choose a region to access their veterinary licensing board and
                refine your search below
              </Card.Description>
              {/* DO NOT TOUCH UNDERLYING COMPONENT */}
              <StateSelector
                selectedState={selectedState}
                setSelectedState={setSelectedState}
              />
              <Refinement
                vetNameInput={{
                  firstName,
                  setFirstName,
                  lastName,
                  setLastName,
                }}
                vetLicenseInput={{ licenseNumber, setLicenseNumber }}
              />
            </Card.Body>
            <Card.Footer justifyContent="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFirstName("");
                  setLastName("");
                  setLicenseNumber("");
                  setResult(null);
                  setError(null);
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
              <Button onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Card.Footer>
          </Card.Root>
        </Stack>
        {/* Results Card */}
        <Stack flex={1}>
          <Card.Root width="100%">
            <Card.Body gap={0} p={3}>
              <Stack justifyContent={"center"} alignItems={"center"}>
                {!selectedState || selectedState === "No_Selection" ? (
                  <>
                    <Card.Title>Select a Region to Begin</Card.Title>
                    <Card.Description>
                      Choose a region from the dropdown to access their official
                      veterinary licensing board.
                    </Card.Description>
                  </>

                ) : (
                  <>
                    <Card.Title>Selected Region: {label}</Card.Title>
                    <Card.Title>Results</Card.Title>
                    <Card.Description>
                      Enter veterinarian information into the form and press Search.
                    </Card.Description>
                  </>
                )}



              </Stack>

              <Box>
                {error && <Box color="red.500">{error}</Box>}
                {Array.isArray(result) && result.length > 0 && (
                  <>
                    <Grid
                      gridTemplateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                        xl: "repeat(4, 1fr)",
                      }}
                      gridTemplateRows={{
                        base: "1fr",
                        md: "repeat(1, 1fr)",
                        lg: "repeat(2, 1fr)",
                        xl: "repeat(3, 1fr)",
                      }}
                      gap={1}
                      mt={4}>
                      {
                        result
                          .slice(
                            (currentPage - 1) * resultsPerPage,
                            currentPage * resultsPerPage
                          )
                          .map((item, idx) => (
                            <VetResultCard item={item} key={idx} />
                          ))}
                    </Grid>
                    {/* Pagination Controls */}
                    <HStack justifyContent="center" mt={4}>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Text>
                        Page {currentPage} of {Math.ceil((result?.length ?? 0) / resultsPerPage)}
                      </Text>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) =>
                            p <
                              Math.ceil((result?.length ?? 0) / resultsPerPage)
                              ? p + 1
                              : p
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil((result?.length ?? 0) / resultsPerPage)
                        }
                      >
                        Next
                      </Button>
                    </HStack>

                  </>
                )} </Box>
              <Box>
                {debugInfo && (
                  <Text color={debugInfo.ok ? "green.500" : "red.500"}>
                    Server sees token: {debugInfo.preview || "MISSING"}
                  </Text>
                )}
                <Button onClick={handleTest}>Test Log</Button>
              </Box></Card.Body>
          </Card.Root>
        </Stack>
      </Stack>
    </Stack>
  );
}
