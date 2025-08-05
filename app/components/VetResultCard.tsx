import { Stack, Card, HStack,   Avatar } from "@chakra-ui/react";
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
    status: string;
    licenseNumber?: string;
    expiration: string;
  };
}

export function VetResultCard({ item }: VetResultCardProps) {
  return (
    <Stack
      mb={4}
      borderWidth={1}
      borderRadius="md"
      p={2}
      bg={
        item.status === "Active"
          ? "green.50"
          : item.status === "Null and Void"
          ? "red.50"
          : "gray.50"
      }
      h="200px"
      w="300px"
      overflow="hidden"
      color="black"
    >
      <HStack>
        <Avatar.Root borderRadius={4}>
          <Avatar.Fallback />
          <Avatar.Image as={UserRound} />
        </Avatar.Root>
        <Stack>
          <Card.Title mt="2">{item.name}</Card.Title>
          <p>Status: {item.status}</p>
          <p>License #: {item.licenseNumber}</p>
          <p>Expires: {item.expiration}</p>
        </Stack>
      </HStack>
    </Stack>
  );
}
