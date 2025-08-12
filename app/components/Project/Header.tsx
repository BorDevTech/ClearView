import {
  Container,
  Heading,
  HStack,
  Icon,
  Show,
  Status,
  Tag,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { Activity } from "lucide-react";

import { ListedStates } from "@/app/components/StateSelector";

const totalStates = ListedStates.items.length;

const onlineStates = ListedStates.items.filter(
  (state) => state.active === true
).length;
const offlineStates = ListedStates.items.filter(
  (state) => state.active === false
).length;
const checkingStates = ListedStates.items.filter(
  (state) => state.active === null
).length;



export function ProjectHeader({
  icon,
  title,
  slogan,
}: {
  icon: React.ElementType;
  title: string;
  slogan: string;
}) {
  return (
    <>
      {/* Top Gradient Bar */}

      <HStack
        as={"header"}
        color="white"
        boxShadow="md"
        bgGradient={"to-r"}
        gradientFrom={"#41b883"}
        gradientTo={"#2179b5"}
      >
        <Container

          m={"auto"}
          px={{ sm: 6, base: 4, lg: 8 }}
          py={6}
        >
          <HStack justify={"space-between"} alignItems={"center"}>
            <HStack gap={3}>
              <Icon
                bg={"blue.500"}
                borderRadius={3}
                size={"lg"}
                h={12}
                w={12}
                p={2}
                as={icon}
              />
              <VStack alignItems={"start"}>
                <Heading
                  size={"3xl"}
                  fontWeight={"bold"}
                  m={0}
                  p={0}
                  color={"black"}
                >
                  {title || "Project Name"}
                  <Text fontWeight={"medium"} textStyle={"lg"} color="#2179b5">
                    {slogan}
                  </Text>
                </Heading>
              </VStack>

            </HStack>

            <Show when={""}  >
              <HStack justify={"space-between"}>
                <Tag.Root rounded={"full"}>
                  <Status.Root>
                    <Status.Indicator colorPalette={"red"} />
                    <Icon as={Activity} color={"red"} />
                    {offlineStates} Offline
                  </Status.Root>
                </Tag.Root>
                <Tag.Root rounded={"full"}>
                  <Status.Root>
                    <Status.Indicator colorPalette={"yellow"} />

                    <Icon as={Activity} color={"yellow"} />
                    {checkingStates} Checking
                  </Status.Root>
                </Tag.Root>
                <Tag.Root rounded={"full"}>
                  <Status.Root>
                    <Status.Indicator colorPalette={"green"} />
                    <Icon as={Activity} color={"green"} />
                    {onlineStates} Online
                  </Status.Root>
                </Tag.Root>
                <Tag.Root rounded={"full"}>
                  <Status.Root size="lg">
                    <Status.Indicator />
                    {totalStates} Total Lookups
                  </Status.Root>
                </Tag.Root>
              </HStack>
            </Show>
          </HStack>
        </Container >
      </HStack >
    </>
  );
}
