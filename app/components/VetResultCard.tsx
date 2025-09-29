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
    <>
      
      <Card.Root
        w="360px"
        h="180px"
        borderRadius="lg"
        borderWidth="1px"
        shadow="md"
        bg="blue.200" // <-- Darker blue background
        overflow="hidden"
      >
        <Card.Header py={2} px={4}>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" fontWeight="bold" color="blue.900" textTransform="uppercase" _selection={{ bg: "green.400", color: "white" }}>
              State of Alaska
            </Text>
            <Text fontSize="xs" color="blue.700" textTransform="uppercase"_selection={{ bg: "green.400", color: "white" }}>
              Board of Veterinary Examiners
            </Text>
          </VStack>
        </Card.Header>


        <Card.Body as={HStack} gap={4} alignItems="start" px={4} py={3}>
          {/* Photo placeholder */}
          <VStack gap={2} minW="50px">
            <Avatar.Root size="xl" border="1px solid" borderColor="blue.200" bg="#2179b5">
              <Avatar.Icon as={UserRound} color="green.400" />
            </Avatar.Root>
            <Badge colorPalette={item.status === "Active" ? "green" : "red"}>{item.status}</Badge>
          </VStack>

          {/* License info */}
          <VStack align="start" gap={1} flex="1">
            <Text fontSize="md" fontWeight="semibold" textWrap={'pretty'} color="blue.700"_selection={{ bg: "green.400", color: "white" }}>
              {item.name.toUpperCase()}
            </Text>
            {item.licenseNumber && <Text fontSize="sm" color="gray.700"_selection={{ bg: "green.400", color: "white" }}>License #: {item.licenseNumber}</Text>}
            {item.expiration && <Text fontSize="sm" color="gray.700"_selection={{ bg: "green.400", color: "white" }}>Expires: {item.expiration}</Text>}
          </VStack>
        </Card.Body>

    {/* Remove Card.Footer with Primary Source */}
    {/* <Card.Footer justifyContent="flex-end" bg="blue.50" py={1} px={3}>
      <Text fontSize="xs" color="gray.600">
        Primary Source: Alaska CBPL
      </Text>
    </Card.Footer> */}

      </Card.Root >
    </>
  );
}
