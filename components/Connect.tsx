import { ConnectButton } from "thirdweb/react";
import { Chain as ChainI } from "thirdweb/chains";
import React from "react";
import {
    INTEGRATION_CHAIN,
    SOURCE_CHAIN,
    twClient,
    LOGO_URL,
} from "../const/details";
import wallets from "../config/wallets";

export default function Connect({ activeChain }: { activeChain: ChainI }) {
    return (
        <ConnectButton
            client={twClient}
            wallets={wallets}
            chain={activeChain}
            chains={[SOURCE_CHAIN, INTEGRATION_CHAIN]}
            autoConnect={true}
            theme={"dark"}
            connectButton={{ label: "Connect" }}
            switchButton={{
                className: "Switch to supported chain",
                // label?: string;
                // style?: React.CSSProperties;
            }}
            connectModal={{
                size: "wide",
                title: "Choose one",
                titleIcon: LOGO_URL,
                welcomeScreen: {
                    title: "Welcome!",
                    subtitle: "Connect now to get started",
                    img: {
                        src: LOGO_URL,
                        width: 150,
                        height: 150,
                    },
                },
                showThirdwebBranding: false,
            }}
        />
    );
}
