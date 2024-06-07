import { defineChain, createThirdwebClient } from "thirdweb";
import { Chain, polygonAmoy } from "thirdweb/chains";

const AutonityPiccadillySumidaTestnet = defineChain(65100002);

export const twClient = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
});

export { VIA_ABI, USDC_ABI } from "./abis";

export const SOURCE_CHAIN: Chain = polygonAmoy;
// export const SOURCE_CHAIN_RPC: string = PolygonAmoyTestnet.rpc[0];
export const SOURCE_CHAIN_ID: number = polygonAmoy.id;
export const SOURCE_CHAIN_NAME: string = "Polygon Amoy";
export const SOURCE_USDC_TOKEN_CONTRACT: string =
    "0xD464CC7367a7A39eb4b1E6643CDa262B0B0CfdA8";
export const SOURCE_USDC_TOKEN_NAME: string = "mUSDC";

export const INTEGRATION_CHAIN: Chain = AutonityPiccadillySumidaTestnet;
// export const INTEGRATION_CHAIN_RPC: string =
//     AutonityPiccadillySumidaTestnet.rpc[0];
export const INTEGRATION_CHAIN_ID: number = AutonityPiccadillySumidaTestnet.id;
export const INTEGRATION_CHAIN_NAME: string = "Autonity Piccadilly";
export const INTEGRATION_USDC_TOKEN_CONTRACT: string =
    "0x3a60C03a86eEAe30501ce1af04a6C04Cf0188700";
export const INTEGRATION_USDC_TOKEN_NAME: string = "USDC.pol";

export const INTEGRATION_BRAND_NAME: string = "Autonity";

export const SOURCE_MESSAGING_CONTRACT: string =
    "0x3CB85BcCAe78803e7d098417Dd3a262a611378cf";
export const INTEGRATION_MESSAGING_CONTRACT: string =
    "0xB0f652534837203b5FBE126c4E7DB128DB9F9736";
