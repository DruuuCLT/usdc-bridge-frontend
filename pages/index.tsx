import Head from "next/head";
import Navbar from "../components/NavBar";
import SwapInput from "../components/SwapInput";
import Timer from "../components/Timer";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

import { Button, Flex, Spinner, useToast, ToastId } from "@chakra-ui/react";
import {
    SOURCE_CHAIN,
    INTEGRATION_CHAIN,
    SOURCE_MESSAGING_CONTRACT,
    INTEGRATION_MESSAGING_CONTRACT,
    INTEGRATION_USDC_TOKEN_CONTRACT,
    SOURCE_USDC_TOKEN_CONTRACT,
    VIA_ABI,
    USDC_ABI,
    SOURCE_USDC_TOKEN_NAME,
    INTEGRATION_USDC_TOKEN_NAME,
    SOURCE_CHAIN_NAME,
    INTEGRATION_CHAIN_NAME,
    INTEGRATION_BRAND_NAME,
} from "../const/details";
import {
    ConnectWallet,
    useAddress,
    useChainId,
    useContract,
    useContractWrite,
    useNetworkMismatch,
    useSwitchChain,
} from "@thirdweb-dev/react";
import { useState, useEffect, useRef } from "react";
import { _0xhashTestnet } from "@thirdweb-dev/chains";
import { count } from "console";

interface Props {
    chainSwitchHandler: Function;
}

export default function Home(props: Props) {
    const toast = useToast();
    const toastRef = useRef<ToastId | null>(null);
    const address = useAddress();
    console.log("address", address);

    const isMismatched = useNetworkMismatch();
    console.log("Mismatch", isMismatched);

    const idConn = useChainId();
    console.log("idConn", idConn);

    const switchChain = useSwitchChain();

    const usdcAbi = JSON.parse(USDC_ABI);
    const viaAbi = JSON.parse(VIA_ABI);

    const [usdcBalance, setUsdcBalance] = useState(0);
    const [usdcPolBalance, setUsdcPolBalance] = useState(0);
    const [usdcAllowance, setUsdcAllowance] = useState(0);
    const [usdcPolAllowance, setUsdcPolAllowance] = useState(0);

    const countdown = useRef(20);

    const [status, setStatus] = useState("Bridging");

    const [usdcValue, setUsdcValue] = useState<string>("0");

    const [isCounting, setIsCounting] = useState<boolean>(false);

    const [currentFrom, setCurrentFrom] = useState<string>("usdc");
    const [loading, setLoading] = useState<boolean>(false);

    const sourceProvider = new ThirdwebSDK(SOURCE_CHAIN);
    const integrationProvider = new ThirdwebSDK(INTEGRATION_CHAIN);

    useEffect(() => {
        if (countdown.current <= 0) return;

        if (!isCounting) return;

        const interval = setInterval(() => {
            countdown.current -= 1;

            console.log(
                "-------------------------- RUNNING!",
                toastRef.current
            );

            if (!toastRef.current) return;

            toast.update(toastRef.current, {
                status: "success",
                title: "Bridge in progress",
                description: `Waiting for ${countdown.current}`,
                duration: null,
            });

            if (countdown.current === 0) {
                clearInterval(interval);
                // toast.close(toastRef.current);

                toast.update(toastRef.current, {
                    status: "success",
                    title: "Bridge completed",
                    description: `Funds should have reached their destination`,
                    duration: 5000,
                });
            }
        }, 1000);

        // const interval = setTimeout(() => {
        //     console.log("RAN !", countdown);

        //     if (toastRef.current) {
        //         toast.update(toastRef.current, {
        //             status: "success",
        //             title: "Bridge in progress",
        //             description: `Waiting for ${countdown}`,
        //             duration: null,
        //         });
        //     }

        //     countdown.current = countdown.current - 1;
        // }, 1000);

        return () => {
            console.log("Removing interval", interval);
            clearInterval(interval);
        };
    }, [isCounting]);

    // function intervalHandler() {
    //     let msg = `You have successfully bridged your ${SOURCE_USDC_TOKEN_NAME} from ${SOURCE_CHAIN_NAME} to ${INTEGRATION_USDC_TOKEN_NAME} on ${INTEGRATION_CHAIN_NAME}. Funds will arrive in 2-3 mins.`;

    //     if (currentFrom === "usdc") {
    //     }

    //     console.log(
    //         "XXXXXXXX Running interval!",
    //         countdownRef.current,
    //         countdown
    //     );

    //     if (countdownRef.current && countdown <= 0)
    //         clearInterval(countdownRef.current);

    //     if (toastRef.current) {
    //         toast.update(toastRef.current, {
    //             status: "success",
    //             title: "Bridge in progress",
    //             description: `Waiting for ${countdown}`,
    //             duration: null,
    //         });
    //     }

    //     setCountdown(countdown - 1);
    // }

    function updateToast() {
        setCountdown(countdown - 1);
    }

    // const interval = setTimeout(() => {
    //     const msg = ``;
    //     if (currentFrom === "usdc") {
    //     }

    //     if (toastRef.current) {
    //         toast.update(toastRef.current, { description: "new text" });
    //     }
    // }, 1000);

    // Need to read from both networks regardless of which is connected so we fall back to SDK
    useEffect(() => {
        // const { data, isLoading, error } = useContractEvents(
        //     contract,
        //     "MyEvent",
        //     {
        //       queryFilter: {
        //         filters: {
        //           tokenId: 123, // e.g. Only events where tokenId = 123
        //         },
        //         fromBlock: 0, // Events starting from this block
        //         toBlock: 100, // Events up to this block
        //         order: "asc", // Order of events ("asc" or "desc")
        //       },
        //       subscribe: true, // Subscribe to new events
        //     },
        //   );

        async function fetchBalances() {
            if (!address) {
                setUsdcBalance(0);
                setUsdcPolBalance(0);
                return;
            }

            try {
                const sourceUSDC = await sourceProvider.getContract(
                    SOURCE_USDC_TOKEN_CONTRACT
                );
                const integrationUSDC = await integrationProvider.getContract(
                    INTEGRATION_USDC_TOKEN_CONTRACT
                );

                setUsdcBalance(await sourceUSDC.call("balanceOf", [address]));
                setUsdcPolBalance(
                    await integrationUSDC.call("balanceOf", [address])
                );

                setUsdcAllowance(
                    await sourceUSDC.call("allowance", [
                        address,
                        SOURCE_MESSAGING_CONTRACT,
                    ])
                );
                setUsdcPolAllowance(
                    await integrationUSDC.call("allowance", [
                        address,
                        INTEGRATION_MESSAGING_CONTRACT,
                    ])
                );
            } catch (e) {}
        }

        const interval = setInterval(
            () => {
                fetchBalances();
            },
            loading ? 5000 : 15000
        );

        fetchBalances();

        return () => clearInterval(interval);
    }, [address, loading]);

    useEffect(() => {
        async function activateChain() {
            if (currentFrom === "usdc") {
                props.chainSwitchHandler(SOURCE_CHAIN);
            } else {
                props.chainSwitchHandler(INTEGRATION_CHAIN);
            }
        }
        activateChain();
    }, [currentFrom]);

    const toDisplay = (value: number) => {
        return (value / 10 ** 6).toFixed(2);
    };

    const inputInvalid = () => {
        let tooBig = true;
        if (currentFrom === "usdc") {
            tooBig = Number(usdcValue) - 0.25 > Number(usdcBalance / 10 ** 6);
        } else {
            tooBig =
                Number(usdcValue) - 0.25 > Number(usdcPolBalance / 10 ** 6);
        }
        return Number(usdcValue) <= 0.25 || tooBig;
    };

    // Approve Polygon
    const { contract: usdcContract } = useContract(
        SOURCE_USDC_TOKEN_CONTRACT,
        usdcAbi
    );
    const { mutateAsync: approveUsdcSpending } = useContractWrite(
        usdcContract,
        "approve"
    );

    // Bridge Polygon
    const { contract: viaPolygonContract } = useContract(
        SOURCE_MESSAGING_CONTRACT,
        viaAbi
    );
    const { mutateAsync: bridgeUSDCToUSDCPOL } = useContractWrite(
        viaPolygonContract,
        "bridge"
    );

    // Approve Integration chain
    const { contract: usdcPolContract } = useContract(
        INTEGRATION_USDC_TOKEN_CONTRACT,
        usdcAbi
    );
    const { mutateAsync: approveUsdcPolSpending } = useContractWrite(
        usdcPolContract,
        "approve"
    );

    // Bridge Integration chain
    const { contract: viaVitruveoContract } = useContract(
        INTEGRATION_MESSAGING_CONTRACT,
        viaAbi
    );
    const { mutateAsync: bridgeUSDCPOLToUSDC } = useContractWrite(
        viaVitruveoContract,
        "bridge"
    );

    const executeBridge = async () => {
        setLoading(true);
        try {
            const amount = Number(usdcValue) * 10 ** 6;

            toastRef.current = toast({
                status: "success",
                title: "Bridge in progress",
                description: `You have successfully bridged your ${SOURCE_USDC_TOKEN_NAME} from ${SOURCE_CHAIN_NAME} to ${INTEGRATION_USDC_TOKEN_NAME} on ${INTEGRATION_CHAIN_NAME}. Funds will arrive in 2-3 mins.`,
            });
            setIsCounting(true);
            return;

            if (currentFrom === "usdc") {
                if (isMismatched) {
                    setStatus("Switching");
                    await switchChain(SOURCE_CHAIN.chainId);
                }

                if (Number(usdcAllowance) < amount) {
                    setStatus("Approving");
                    await approveUsdcSpending({
                        args: [SOURCE_MESSAGING_CONTRACT, amount],
                    });
                }

                setStatus("Bridging");
                await bridgeUSDCToUSDCPOL({ args: [address, amount] });

                toast({
                    status: "success",
                    title: "Bridge in progress",
                    description: `You have successfully bridged your ${SOURCE_USDC_TOKEN_NAME} from ${SOURCE_CHAIN_NAME} to ${INTEGRATION_USDC_TOKEN_NAME} on ${INTEGRATION_CHAIN_NAME}. Funds will arrive in 2-3 mins.`,
                });
            } else {
                if (isMismatched) {
                    setStatus("Switching");
                    await switchChain(INTEGRATION_CHAIN.chainId);
                }

                if (Number(usdcPolAllowance) < amount) {
                    setStatus("Approving");
                    await approveUsdcPolSpending({
                        args: [INTEGRATION_MESSAGING_CONTRACT, amount],
                    });
                }

                setStatus("Bridging");
                await bridgeUSDCPOLToUSDC({ args: [address, amount] });

                toast({
                    status: "success",
                    title: "Bridge in progress",
                    description: `You have successfully bridged your ${INTEGRATION_USDC_TOKEN_NAME} from ${INTEGRATION_CHAIN_NAME} to ${SOURCE_USDC_TOKEN_NAME} on ${SOURCE_CHAIN_NAME}. Funds will arrive in 2-3 mins.`,
                });
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast({
                status: "error",
                title: "Error",
                description: "There was an error. Please try again.",
            });
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{`${INTEGRATION_BRAND_NAME} USDC Bridge`}</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navbar />

            <Flex
                direction="column"
                gap="5"
                mt="10"
                p="5"
                mx="auto"
                maxW={{ base: "sm", md: "xl" }}
                w="full"
                rounded="2xl"
                borderWidth="1px"
                borderColor="gray.600"
            >
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: 600,
                        margin: "auto",
                        marginBottom: "20px",
                    }}
                >
                    {INTEGRATION_BRAND_NAME} USDC Bridge
                </h2>
                <p style={{ marginBottom: 10 }}>
                    {`The ${INTEGRATION_BRAND_NAME}
                     USDC Bridge is a fast and easy way to bridge
                    ${SOURCE_USDC_TOKEN_NAME} ${SOURCE_CHAIN_NAME} to/from ${INTEGRATION_USDC_TOKEN_NAME} on
                    ${INTEGRATION_CHAIN_NAME}.`}
                </p>
                <Flex
                    direction={
                        currentFrom === "usdc" ? "column" : "column-reverse"
                    }
                    gap="3"
                >
                    <SwapInput
                        current={currentFrom}
                        type="usdc"
                        max={toDisplay(usdcBalance)}
                        value={String(
                            currentFrom === "usdc"
                                ? usdcValue
                                : Math.max(0, Number(usdcValue) - 0.25).toFixed(
                                      2
                                  )
                        )}
                        setValue={setUsdcValue}
                        tokenSymbol={SOURCE_USDC_TOKEN_NAME}
                        tokenBalance={toDisplay(usdcBalance)}
                        network="polygon"
                    />

                    <Button
                        onClick={() =>
                            currentFrom === "usdc"
                                ? setCurrentFrom("usdcpol")
                                : setCurrentFrom("usdc")
                        }
                        maxW="5"
                        mx="auto"
                    >
                        ↓
                    </Button>

                    <SwapInput
                        current={currentFrom}
                        type="usdcpol"
                        max={toDisplay(usdcPolBalance)}
                        value={String(
                            currentFrom === "usdcpol"
                                ? usdcValue
                                : Math.max(0, Number(usdcValue) - 0.25).toFixed(
                                      2
                                  )
                        )}
                        setValue={setUsdcValue}
                        tokenSymbol={INTEGRATION_USDC_TOKEN_NAME}
                        tokenBalance={toDisplay(usdcPolBalance)}
                        network={INTEGRATION_BRAND_NAME.toLowerCase()}
                    />
                </Flex>

                {address ? (
                    <Button
                        onClick={executeBridge}
                        py="7"
                        fontSize="2xl"
                        colorScheme="purple"
                        rounded="xl"
                        isDisabled={loading || inputInvalid()}
                        style={{
                            fontWeight: 400,
                            background:
                                "linear-gradient(106.4deg, rgb(255, 104, 192) 11.1%, rgb(104, 84, 249) 81.3%)",
                            color: "#ffffff",
                        }}
                    >
                        {/* <img src='/images/usdc-logo.png' style={{width: '30px', marginRight: '10px'}} /> */}
                        {loading ? (
                            <>
                                <Spinner me="8px" /> {status}
                            </>
                        ) : (
                            " Bridge USDC"
                        )}
                    </Button>
                ) : (
                    <ConnectWallet
                        style={{ padding: "20px 0px", fontSize: "18px" }}
                        theme="dark"
                    />
                )}
                <p>
                    <sup>*</sup> Each bridge transfer takes 2-3 mins and costs
                    US$0.25 plus gas.
                </p>
            </Flex>
            <div
                style={{
                    textAlign: "center",
                    fontSize: "14px",
                    marginTop: "5px",
                }}
            >
                <a
                    href="https://www.circle.com/blog/bridged-usdc-standard"
                    target="_new"
                    style={{ textDecoration: "underline" }}
                >
                    Bridged USDC Standard
                </a>{" "}
                powered by{" "}
                <a href="https://cryptolink.tech/" target="_new">
                    VIA Labs
                </a>
                . &nbsp; &nbsp; Built with 💜 by{" "}
                <a href="https://www.vitruveo.xyz" target="_new">
                    Vitruveo
                </a>
                .
            </div>
        </>
    );
}
