import {
  Select,
  HStack,
  Icon,
  createListCollection,
  Card,
  Portal,
} from "@chakra-ui/react";
import { Activity } from "lucide-react";
import { useState } from "react";
import { VscCircleFilled } from "react-icons/vsc";

interface StateDefinition {
  active: boolean | null;
  value: string;
  label: string;
}

export const ListedStates = createListCollection<StateDefinition>({
  items: [
    {
      active: null,
      value: "No_Selection",
      label: "Select a State",
    },
    { active: false, value: "AL", label: "Alabama" },
    { active: false, value: "AK", label: "Alaska" },
    { active: false, value: "AB", label: "Alberta" },
    { active: false, value: "AZ", label: "Arizona" },
    { active: true, value: "AR", label: "Arkansas" },
    {
      active: false,
      value: "BC",
      label: "British Columbia",
    },
    { active: false, value: "CA", label: "California" },
    { active: true, value: "CO", label: "Colorado" },
    {
      active: false,
      value: "CT",
      label: "Connecticut",
    },
    { active: false, value: "DE", label: "Delaware" },
    {
      active: false,
      value: "DC",
      label: "District of Columbia",
    },
    { active: true, value: "FL", label: "Florida" },
    { active: false, value: "GA", label: "Georgia" },
    { active: false, value: "HI", label: "Hawaii" },
    { active: false, value: "ID", label: "Idaho" },
    { active: false, value: "IL", label: "Illinois" },
    { active: false, value: "IN", label: "Indiana" },
    { active: false, value: "IA", label: "Iowa" },
    { active: false, value: "KS", label: "Kansa" },
    { active: false, value: "KY", label: "Kentucky" },
    { active: false, value: "LA", label: "Louisiana" },
    { active: false, value: "ME", label: "Maine" },
    { active: false, value: "MB", label: "Manitoba" },
    { active: false, value: "MD", label: "Maryland" },
    {
      active: false,
      value: "MA",
      label: "Massachusetts",
    },
    { active: false, value: "MI", label: "Michigan" },
    { active: false, value: "MN", label: "Minnesota" },
    {
      active: false,
      value: "MS",
      label: "Mississippi",
    },
    { active: true, value: "MO", label: "Missouri" },
    { active: false, value: "MT", label: "Montana" },
    { active: false, value: "NE", label: "Nebraska" },
    { active: false, value: "NV", label: "Nevada" },
    {
      active: false,
      value: "NB",
      label: "New Brunswick",
    },
    {
      active: false,
      value: "NH",
      label: "New Hampshire",
    },
    { active: false, value: "NJ", label: "New Jersey" },
    { active: true, value: "NM", label: "New Mexico" },
    { active: false, value: "NY", label: "New York" },
    {
      active: false,
      value: "NL",
      label: "Newfoundland & Labrador",
    },
    {
      active: false,
      value: "NC",
      label: "North Carolina",
    },
    {
      active: false,
      value: "ND",
      label: "North Dakota",
    },
    {
      active: false,
      value: "NS",
      label: "Nova Scotia",
    },
    { active: false, value: "OH", label: "Ohio" },
    { active: false, value: "OK", label: "Oklahoma" },
    { active: false, value: "ON", label: "Ontario" },
    { active: false, value: "OR", label: "Oregon" },
    {
      active: false,
      value: "PA",
      label: "Pennsylvania",
    },
    {
      active: false,
      value: "PE",
      label: "Prince Edward Island",
    },
    {
      active: false,
      value: "PR",
      label: "Puerto Rico",
    },
    { active: false, value: "QC", label: "Quebec" },
    {
      active: false,
      value: "RI",
      label: "Rhode Island",
    },
    {
      active: false,
      value: "SK",
      label: "Saskatchewan",
    },
    {
      active: false,
      value: "SC",
      label: "South Carolina",
    },
    {
      active: false,
      value: "SD",
      label: "South Dakota",
    },
    { active: false, value: "TN", label: "Tennessee" },
    { active: false, value: "TX", label: "Texas" },
    { active: false, value: "UT", label: "Utah" },
    { active: false, value: "VT", label: "Vermont" },
    { active: false, value: "VA", label: "Virginia" },
    { active: false, value: "WA", label: "Washington" },
    {
      active: false,
      value: "WV",
      label: "West Virginia",
    },
    { active: false, value: "WI", label: "Wisconsin" },
    { active: false, value: "WY", label: "Wyoming" },
    { active: true, value: "XX", label: "Test" },
  ],
});

interface StateSelectorProps {
  setSelectedState: (state: string) => void;
  selectedState: string;
}

export default function StateSelector({
  setSelectedState,
  selectedState,
}: StateSelectorProps) {
  // Find the selected object from value
  //   const selectedObj = ListedStates.items.find(
  //     (s) => s.value === selectedState
  //   );

  return (
    <>
      <Card.Title mt="2">State</Card.Title>
      <Select.Root
        multiple={false}
        collection={ListedStates}
        defaultValue={["No_Selection"]}
        onValueChange={(value) => {
          setSelectedState(value?.items[0]?.value);
        }}
      >
        <Select.HiddenSelect />
        <Select.Label color={"#41b883"} />

        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select a State" color={"white"} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>

        <Portal>
          <Select.Positioner>
            <Select.Content>
              {ListedStates.items.map((state) => (
                <Select.Item item={state} key={state.label}>
                  <HStack>
                    <Icon
                      color={state.active === true ? "green.500" : "red.500"}
                      as={Activity}
                    />
                    {state.label}
                  </HStack>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </>
  );
}
