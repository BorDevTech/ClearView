"use client";

import {
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  createListCollection,
  For,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
} from "@chakra-ui/react";

// colors pallete #41b883 and #2179b5

export default function Home() {
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
                      <Input placeholder="First Name"></Input>
                    </Stack>
                    <Stack>
                      <Card.Title mt="2">Last Name</Card.Title>
                      <Input placeholder="Last Name"></Input>
                    </Stack>
                  </HStack>

                  <Card.Title mt="2">License Number</Card.Title>
                  <Input placeholder="License Number"></Input>
                </Stack>
              </Stack>
            </Card.Body>
            <Card.Footer justifyContent="flex-end">
              <Button variant="outline">Clear</Button>
              <Button>Search</Button>
            </Card.Footer>
          </Card.Root>
          <Card.Root width="320px">
            <Card.Body gap="2">
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
                  <Checkbox.Label color={"green.500"}>Active</Checkbox.Label>
                </Checkbox.Root>
                <p>Issued by:</p>
                <p>
                  License Expiration Date:
                  {new Date().toLocaleDateString()}
                </p>
                <p>License Number: </p>
                <p> click View official state verification page</p>
              </Stack>
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
