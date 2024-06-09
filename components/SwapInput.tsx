import { Button, HStack, Input } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
    type: "usdc" | "usdcpol";
    tokenSymbol?: string;
    tokenBalance: string;
    current: string;
    setValue: (value: number) => void;
    max?: number;
    value: number;
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
    const [inputValue, setInputValue] = useState<string>(value.toString());

    useEffect(() => {
        let calcAmount = value;
        if (current !== type) {
            calcAmount -= 0.25;
            if (calcAmount <= 0) calcAmount = 0;
        }
        setInputValue(calcAmount.toString());
    }, [value, current]);

    function manageValue(val: string): void {
        const asNum = Number(val);

        if (current === type) setValue(asNum);
        setInputValue(val);
    }

    function manageFocus(): void {
        if (value == 0 || Number.isNaN(value)) setInputValue("");
    }

    return (
        <HStack w="full" bgColor="gray.700" rounded="2xl" px="5">
            <div style={{ position: "relative", flex: "0 0 25px" }}>
                <Image
                    src={`/images/${network}.png`}
                    alt={`${network}`}
                    width={12}
                    height={12}
                    style={{
                        height: "12px",
                        position: "absolute",
                        top: -5,
                        left: -5,
                    }}
                />
                <Image
                    src="/images/usdc-logo.png"
                    width={25}
                    height={25}
                    alt="USDC Logo"
                    style={{ height: "25px", width: "25px" }}
                />
            </div>

            <Input
                type="number"
                placeholder="0.0"
                fontSize="3xl"
                // value={current !== type ? value - 0.25 : value}
                value={inputValue}
                onChange={(e) => manageValue(e.target.value)}
                onFocus={(e) => manageFocus()}
                outline="none"
                py="10"
                isDisabled={current !== type}
                border="none"
                fontFamily="monospace"
                style={{ width: "300px" }}
                _focus={{ boxShadow: "none" }}
            />
            {current === type && (
                <Button onClick={() => manageValue(max?.toString() || "0")}>
                    Max
                </Button>
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
