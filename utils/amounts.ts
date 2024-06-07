import { toUnits } from "thirdweb";
import { toTokens } from "thirdweb/utils";

export function formatUnits(amount: bigint, units: number = 6): string {
    if (!amount) return "0.00";

    // toTokens(1000000000000000000n, 18);
    // '1'

    return parseFloat(toTokens(amount, units)).toFixed(2);
}

// @note from string to bigint
export function parseUnits(amount: string, units: number = 6): bigint {
    return toUnits(amount, units);
}
