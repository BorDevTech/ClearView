import {
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Status,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";

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
          maxW={"7xl"}
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
            <HStack justify={"space-between"}>
              <Tag.Root rounded={"full"}>
                <Status.Root>
                  <Status.Indicator colorPalette={"red"} />
                  Offline
                </Status.Root>
              </Tag.Root>
              <Tag.Root rounded={"full"}>
                <Status.Root>
                  <Status.Indicator colorPalette={"yellow"} />
                  Checking
                </Status.Root>
              </Tag.Root>
              <Tag.Root rounded={"full"}>
                <Status.Root>
                  <Status.Indicator colorPalette={"green"} />
                  Online
                </Status.Root>
              </Tag.Root>
            </HStack>
          </HStack>
        </Container>
      </HStack>
    </>
  );
}
