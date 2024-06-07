import React from "react";
import wallets from "@/config/wallets";
import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import { ConnectButton, darkTheme } from "thirdweb/react";

const myChain = defineChain(65100002);

console.log(myChain);

const client = createThirdwebClient({
    clientId: "00867115d0297decaa1029622d16ddf7",
});

export const contract = getContract({
    client,
    chain: defineChain(65100002),
    address: "0x...",
});

export default function ConnectWallet() {
    return (
        <ConnectButton
            client={client}
            wallets={wallets}
            theme={darkTheme({
                colors: {
                    accentText: "#ff3333",
                    accentButtonBg: "#ff3333",
                },
            })}
            connectButton={{ label: "Connect" }}
            connectModal={{
                size: "wide",
                title: "Your wallet",
                titleIcon: "https://www.walleticon.com/icon.png",
                welcomeScreen: {
                    title: "Path to USDC",
                    subtitle: "Connect your wallet",
                    img: {
                        src: "https://www.walleticon.com/slash.png",
                        width: 150,
                        height: 150,
                    },
                },
                showThirdwebBranding: false,
            }}
        />
    );
}
