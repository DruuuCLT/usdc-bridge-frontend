import { Button, HStack, Input } from "@chakra-ui/react";
import React from "react";

type Props = {
    type: "usdc" | "usdcpol";
    tokenSymbol?: string;
    tokenBalance: string;
    current: string;
    setValue: (value: string) => void;
    max?: string;
    value: string;
    network: string;
};

export default function SwapInput({
    type,
    tokenSymbol,
    tokenBalance,
    setValue,
    value,
    current,
    max,
    network,
}: Props) {
    return (
        <HStack w="full" bgColor="gray.700" rounded="2xl" px="5">
            <div style={{ position: "relative", flex: "0 0 25px" }}>
                <img
                    src={`/images/${network}.png`}
                    alt={`${network}`}
                    style={{
                        height: "12px",
                        position: "absolute",
                        top: -5,
                        left: -5,
                    }}
                />
                <img
                    src="/images/usdc-logo.png"
                    style={{ height: "25px", width: "25px" }}
                />
            </div>

            <Input
                type="number"
                placeholder="0.0"
                fontSize="3xl"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={(e) => {
                    console.log("value focus", Number(value));
                    console.log("value focus", Number(value) == 0);
                    if (Number(value) == 0) setValue("");
                }}
                outline="none"
                py="10"
                isDisabled={current !== type}
                border="none"
                fontFamily="monospace"
                style={{ width: "300px" }}
                _focus={{ boxShadow: "none" }}
            />
            {current === type && (
                <Button onClick={() => setValue(max || "0")}>Max</Button>
            )}
            <div
                style={{
                    marginLeft: "20px",
                    width: current === type ? "250px" : "200px",
                }}
            >
                <p>{tokenSymbol} Balance:</p>
                <p>{tokenBalance}</p>
            </div>
        </HStack>
    );
}
