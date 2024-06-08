import { getContract } from "thirdweb";
import {
    SOURCE_CHAIN,
    INTEGRATION_CHAIN,
    SOURCE_MESSAGING_CONTRACT,
    // SOURCE_CHAIN_RPC,
    // SOURCE_CHAIN_ID,
    // INTEGRATION_CHAIN_RPC,
    // INTEGRATION_CHAIN_ID,
    INTEGRATION_MESSAGING_CONTRACT,
    INTEGRATION_USDC_TOKEN_CONTRACT,
    SOURCE_USDC_TOKEN_CONTRACT,
    VIA_ABI,
    USDC_ABI,
    FIAT_TOKEN_ABI,
    SOURCE_USDC_TOKEN_NAME,
    INTEGRATION_USDC_TOKEN_NAME,
    SOURCE_CHAIN_NAME,
    INTEGRATION_CHAIN_NAME,
    INTEGRATION_BRAND_NAME,
    twClient,
} from "../const/details";

export const usdcAbi = JSON.parse(USDC_ABI);
export const viaAbi = JSON.parse(VIA_ABI);
export const fiatTokenAbi = JSON.parse(FIAT_TOKEN_ABI);

export const usdcSource = getContract({
    // the client you have created via `createThirdwebClient()`
    client: twClient,
    // the chain the contract is deployed on
    chain: SOURCE_CHAIN,
    // the contract's address
    address: SOURCE_USDC_TOKEN_CONTRACT,
    // OPTIONAL: the contract's abi
    abi: usdcAbi,
});

export const usdcIntegration = getContract({
    // the client you have created via `createThirdwebClient()`
    client: twClient,
    // the chain the contract is deployed on
    chain: INTEGRATION_CHAIN,
    // the contract's address
    address: INTEGRATION_USDC_TOKEN_CONTRACT,
    // OPTIONAL: the contract's abi
    abi: fiatTokenAbi,
});

export const messagingSource = getContract({
    // the client you have created via `createThirdwebClient()`
    client: twClient,
    // the chain the contract is deployed on
    chain: SOURCE_CHAIN,
    // the contract's address
    address: SOURCE_MESSAGING_CONTRACT,
    // OPTIONAL: the contract's abi
    abi: viaAbi,
});

export const messagingIntegration = getContract({
    // the client you have created via `createThirdwebClient()`
    client: twClient,
    // the chain the contract is deployed on
    chain: INTEGRATION_CHAIN,
    // the contract's address
    address: INTEGRATION_MESSAGING_CONTRACT,
    // OPTIONAL: the contract's abi
    abi: viaAbi,
});
