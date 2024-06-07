import { Box, Flex, Text } from "@chakra-ui/react";
import React from "react";
import { Chain } from "thirdweb/chains";
import Connect from "./Connect";

export default function Navbar({ activeChain }: { activeChain: Chain }) {
    return (
        <Box w="full" borderBottomWidth="1px" borderColor="gray.100">
            <Flex
                maxW="6xl"
                w="full"
                mx="auto"
                justifyContent="space-between"
                alignItems="center"
                py="5"
                px={{ base: "5", xl: "0" }}
            >
                <img
                    src="/images/logo-white.png"
                    alt="Logo"
                    style={{ height: "45px" }}
                />

                <Connect activeChain={activeChain} />
            </Flex>
        </Box>
    );
}
