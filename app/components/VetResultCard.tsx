import { Stack, Card, HStack, Avatar, Text, VStack, Badge } from "@chakra-ui/react";
import { UserRound } from "lucide-react";

// interface VetResult {
//   name: string;
//   licenseNumber: string;
//   status: string;
//   expiration: string;
//   licenseType: string;
//   address?: string;
// }

interface VetResultCardProps {
  item: {
    name: string;
    status?: string;
    licenseNumber?: string;
    expiration?: string;
    state?: string;
  };
}

export function VetResultCard({ item }: VetResultCardProps) {
  return (

    <Card.Root
      w="360px"
      h="180px"
      borderRadius="lg"
      borderWidth="1px"
      shadow="md"
      colorPalette="yellow"
      // _dark={{ color: "white", bgGradient: "to-r", gradientFrom: "gray.700", gradientTo: "black" }}
      // bgImage="radial-gradient(#000000ff, #3f87a6, #ebf8ff, #f69d3c)"
      // bgGradient="linear(to-b, blue.50, gray.50)"
      overflow="hidden"
    >
      <Card.Header py={2} px={4}>
        <VStack align="start" gap={0}>
          <Text fontSize="sm" fontWeight="bold" color="blue.900" textTransform="uppercase">
            State of Alaska
          </Text>
          <Text fontSize="xs" color="blue.700" textTransform="uppercase">
            Board of Veterinary Examiners
          </Text>
        </VStack>
      </Card.Header>


      <Card.Body as={HStack} gap={4} alignItems="start" px={4} py={3}>
        {/* Photo placeholder */}
        <VStack gap={2} minW="50px">
          <Avatar.Root size="xl" border="1px solid" borderColor="blue.200" ><Avatar.Icon as={UserRound} /></Avatar.Root>
          <Badge colorPalette={item.status === "Active" ? "green" : "red"}>{item.status}</Badge>
        </VStack>

        {/* License info */}
        <VStack align="start" gap={1} flex="1">
          <Text fontSize="md" fontWeight="semibold" textWrap={'pretty'}>{item.name.toUpperCase()}</Text>
          {item.licenseNumber && <Text fontSize="sm" color="gray.700">License #: {item.licenseNumber}</Text>}
          {item.expiration && <Text fontSize="sm" color="gray.700">Expires: {item.expiration}</Text>}
        </VStack>
      </Card.Body>

      <Card.Footer justifyContent="flex-end" bg="blue.50" py={1} px={3}>
        <Text fontSize="xs" color="gray.600">
          Primary Source: Alaska CBPL
        </Text>
      </Card.Footer>
    </Card.Root >

  );
}
