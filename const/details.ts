import { defineChain, createThirdwebClient } from "thirdweb";
import { Chain, polygonAmoy } from "thirdweb/chains";

const integrationChain = defineChain({
    id: 65100003,
    rpc: "https://rpc1.piccadilly.autonity.org",
});

export const twClient = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
});

import USDC_A from "./abis/usdc";
import FIAT_TOKEN_A from "./abis/fiat-token-v-2-2";
import VIA_A from "./abis/via";

export { USDC_A as USDC_ABI, FIAT_TOKEN_A as FIAT_TOKEN_ABI, VIA_A as VIA_ABI };

export const SOURCE_CHAIN: Chain = polygonAmoy;
// export const SOURCE_CHAIN_RPC: string = PolygonAmoyTestnet.rpc[0];
export const SOURCE_CHAIN_ID: number = polygonAmoy.id;
export const SOURCE_CHAIN_NAME: string = "Polygon Amoy";
export const SOURCE_USDC_TOKEN_CONTRACT: string =
    "0xD464CC7367a7A39eb4b1E6643CDa262B0B0CfdA8";
export const SOURCE_USDC_TOKEN_NAME: string = "mUSDC";

export const INTEGRATION_CHAIN: Chain = integrationChain;
// export const INTEGRATION_CHAIN_RPC: string =
//     integrationChain.rpc[0];
export const INTEGRATION_CHAIN_ID: number = integrationChain.id;
export const INTEGRATION_CHAIN_NAME: string = "Autonity Piccadilly";
export const INTEGRATION_USDC_TOKEN_CONTRACT: string =
    "0x3a60C03a86eEAe30501ce1af04a6C04Cf0188700";
export const INTEGRATION_USDC_TOKEN_NAME: string = "USDC.pol";

export const INTEGRATION_BRAND_NAME: string = "Autonity";

export const SOURCE_MESSAGING_CONTRACT: string =
    "0xECE482610689d3bc8cf360F29cEf237AB8BE64D4";
export const INTEGRATION_MESSAGING_CONTRACT: string =
    "0xB0f652534837203b5FBE126c4E7DB128DB9F9736";

export const LOGO_URL: string =
    "https://usdc-frontend-autonity.vercel.app/images/logo-white.png";
