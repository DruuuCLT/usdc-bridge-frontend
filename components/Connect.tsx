import { ConnectButton } from "thirdweb/react";
import { Chain as ChainI } from "thirdweb/chains";
import React from "react";
import { INTEGRATION_CHAIN, SOURCE_CHAIN, twClient } from "../const/details";
import wallets from "../config/wallets";

export default function Connect({ activeChain }: { activeChain: ChainI }) {
    return (
        <ConnectButton
            client={twClient}
            wallets={wallets}
            chain={activeChain}
            chains={[SOURCE_CHAIN, INTEGRATION_CHAIN]}
            // autoConnect={true}
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
                titleIcon: "https://www.demo.com/icon.png",
                welcomeScreen: {
                    title: "Welcome!",
                    subtitle: "Connect now to get started",
                    img: {
                        src: "https://www.demo.com/icon.png",
                        width: 150,
                        height: 150,
                    },
                },
                showThirdwebBranding: false,
            }}
        />
    );
}
