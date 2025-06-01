import { Box, Card, HStack, Text } from "@chakra-ui/react";

interface VetResult {
  name: string;
  licenseNumber: string;
  status: string;
  expiration: string;
  licenseType: string;
  address?: string;
}

interface VetResultCardProps {
  item: VetResult;
  onNameClick: (licenseNumber: string) => void;
}

export function VetResultCard({ item, onNameClick }: VetResultCardProps) {
  return (
    <Box
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
          onClick={e => {
            e.preventDefault();
            onNameClick(item.licenseNumber);
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
  );
}