import { SOURCE_CHAIN, INTEGRATION_CHAIN } from "../const/details";
import { ChakraProvider } from "@chakra-ui/react";
import { ThirdwebProvider } from "thirdweb/react";
import { Chain } from "thirdweb/chains";
import type { AppProps } from "next/app";
import { useState } from "react";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
    const [activeChain, setActiveChain] = useState<Chain>(SOURCE_CHAIN);

    const handleChainSwitch: any = (chain: Chain) => {
        console.log("Switch in active chain for provider", chain);
        setActiveChain(chain);
    };

    return (
        <ThirdwebProvider>
            <ChakraProvider>
                <Component
                    {...pageProps}
                    chainSwitchHandler={handleChainSwitch}
                    activeChain={activeChain}
                />
            </ChakraProvider>
        </ThirdwebProvider>
    );
}
