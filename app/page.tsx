"use client";

import {
  Box,
  Button,
  Card,
  Center,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import StateSelector from "./components/StateSelector";
import { ProjectHeader } from "./components/Project/Header";
import type { VetResult } from "./types/vet-result";
import { Search, Shield } from "lucide-react";
import Refinement from "./components/Project/Refinement";
import { dynamicVerify } from "./api/verify/searchLogic";
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
  const resultsPerPage = 5; // Adjust as needed

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
    } catch (err: any) {
      setError(
        err.message || " Verification function not found for this state. "
      );
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

  // Gradient top bar and wider layout
  return (
    <Box minH="100vh">
      <ProjectHeader
        title={"ClearView - VetID"}
        icon={Shield}
        slogan={"One Portal. Every Vet. Instant Results."}
      />
      {/* Main Content */}
      <Box maxW="1200px" mx="auto" pt={8} px={4}>
        <Stack direction={["column", "row"] as any} gap={8} align="flex-start">
          {/* Search Card */}
          <Card.Root width="350px" minW="320px">
            <Card.Body gap="2">
              <Card.Title mt="2">
                <HStack gap={3}>
                  <Icon as={Search} />{" "}
                  <Heading size={"xl"} fontWeight={"bold"} m={0} p={0}>
                    Select State Board
                  </Heading>
                </HStack>
              </Card.Title>
              <Card.Description>
                Choose a state to access their veterinary licensing board and
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
          {/* Results Card */}
          <Box flex="1">
            <Card.Root width="100%">
              <Card.Body gap="2">
                <Center>
                  <Card.Title>Results</Card.Title>
                </Center>
                {error && <Box color="red.500">{error}</Box>}
                {Array.isArray(result) && result.length > 0 && (
                  <>
                    <Box
                      display="grid"
                      gridTemplateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                        xl: "repeat(4, 1fr)",
                      }}
                      gap={6}
                      mt={4}
                    >
                      {result
                        .slice(
                          (currentPage - 1) * resultsPerPage,
                          currentPage * resultsPerPage
                        )
                        .map((item, idx) => (
                          <Box
                            key={idx}
                            borderWidth={1}
                            borderRadius="md"
                            p={4}
                            bg={
                              item.status === "Active"
                                ? "green.50"
                                : item.status === "Null and Void"
                                ? "red.50"
                                : "gray.50"
                            }
                            color="black"
                            minH="180px"
                            boxShadow="sm"
                          >
                            <Card.Title mt="2">{item.name}</Card.Title>
                            <p>Status: {item.status}</p>
                            <p>License #: {item.licenseNumber}</p>
                            <p>Expires: {item.expiration}</p>
                          </Box>
                        ))}
                    </Box>
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
                        Page {currentPage} of{" "}
                        {Math.ceil((result?.length ?? 0) / resultsPerPage)}
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
                )}
              </Card.Body>
            </Card.Root>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
