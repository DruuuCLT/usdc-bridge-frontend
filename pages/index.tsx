import Head from "next/head";
import Navbar from "../components/NavBar";
import SwapInput from "../components/SwapInput";
import Timer from "../components/Timer";
import { formatUnits, parseUnits } from "../utils/amounts";
import Connect from "../components/Connect";
import { prepareContractCall } from "thirdweb";
import { Chain } from "thirdweb/chains";
import {
    usdcSource,
    usdcIntegration,
    messagingSource,
    messagingIntegration,
} from "../config/contracts";

import { Button, Flex, Spinner, useToast, ToastId } from "@chakra-ui/react";
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
    SOURCE_USDC_TOKEN_NAME,
    INTEGRATION_USDC_TOKEN_NAME,
    SOURCE_CHAIN_NAME,
    INTEGRATION_CHAIN_NAME,
    INTEGRATION_BRAND_NAME,
    twClient,
    SOURCE_CHAIN_ID,
    INTEGRATION_CHAIN_ID,
} from "../const/details";
import {
    useActiveWalletChain,
    useSwitchActiveWalletChain,
    useActiveAccount,
    useReadContract,
    useSendAndConfirmTransaction,
    useSendTransaction,
    useWaitForReceipt,
    useConnectedWallets,
    useContractEvents,
} from "thirdweb/react";
import { useState, useEffect, useRef, useTransition } from "react";
import { setConstantValue } from "typescript";

const countdownAmount = 20;
const feeAmount = 0.25;

// const sourceProvider = new ThirdwebSDK(SOURCE_CHAIN, {
//     clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
// });
// const integrationProvider = new ThirdwebSDK(INTEGRATION_CHAIN, {
//     clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
// });

interface Props {
    chainSwitchHandler: Function;
    activeChain: Chain;
}

// const contract = getContract({
//     client,
//     chain,
//     address: "0x...",
//   });

export default function (props: Props) {
    const toast = useToast();
    const toastRef = useRef<ToastId | null>(null);
    const countdown = useRef<number>(countdownAmount);

    const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
    const [usdcPolBalance, setUsdcPolBalance] = useState<bigint>(BigInt(0));
    const [usdcAllowance, setUsdcAllowance] = useState<bigint>(BigInt(0));
    const [usdcPolAllowance, setUsdcPolAllowance] = useState<bigint>(BigInt(0));

    const [usdcValue, setUsdcValue] = useState<number>(0);

    const [walletAddr, setWalletAddr] = useState<string>("");

    const [status, setStatus] = useState("Bridging");

    const [loading, setLoading] = useState<boolean>(false);

    const [currentFrom, setCurrentFrom] = useState<string>("usdc");
    const [isCounting, setIsCounting] = useState<boolean>(false);

    const [approvePendingTxHash, setApprovePendingTxHash] =
        useState<`0x${string}`>("0x");
    const [bridgePendingTxHash, setBridgePendingTxHash] =
        useState<`0x${string}`>("0x");

    const [isPendingTransition, startTransition] = useTransition();

    const switchChain = useSwitchActiveWalletChain();

    const chainData = useActiveWalletChain();
    console.log("chainData", chainData);

    const activeAccount = useActiveAccount();
    console.log(activeAccount);

    function onSource() {
        return currentFrom === "usdc";
    }

    const inputInvalid = () => {
        let tooBig = true;

        if (usdcValue == 0) return true;
        if (usdcValue <= feeAmount) return false;

        tooBig = onSource()
            ? usdcValue > Number(formatUnits(usdcBalance))
            : usdcValue > Number(formatUnits(usdcPolBalance));
        return tooBig;
    };

    const {
        mutateAsync: sendAndConfirmApprove,
        data: transactionReceiptApprove,
    } = useSendAndConfirmTransaction();

    const {
        mutateAsync: sendAndConfirmBridge,
        data: transactionReceiptBridge,
    } = useSendAndConfirmTransaction();

    // @todo cancel timer if they reach early !
    // import { useContractEvents } from "thirdweb/react";
    // import { tokensClaimedEvent } from "thirdweb/extensions/erc721";

    // const account = useActiveAccount();
    // const contractEvents = useContractEvents({
    //     contract
    //     events: [tokensClaimedEvent({ claimer: account?.address })],
    // });

    const walletsConnected = useConnectedWallets();
    console.log("walletsConnected", walletsConnected);

    useEffect(() => {
        if (!isCounting) return;
        if (isCounting) countdown.current = countdownAmount;

        // if (countdown.current <= 0) return;

        const interval = setInterval(() => {
            countdown.current -= 1;

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

                setIsCounting(false);

                toast.update(toastRef.current, {
                    status: "success",
                    title: "Bridge completed",
                    description: `Funds should have reached their destination`,
                    duration: 5000,
                });

                setLoading(false);
                // @todo update the balances AND allowances somehow
            }
        }, 1000);

        return () => {
            console.log("Removing interval", interval);
            clearInterval(interval);
        };
    }, [isCounting]);

    useEffect(() => {
        if (!walletsConnected.length) return;

        console.log("chain from other source", walletsConnected[0].getChain());
    }, [walletsConnected]);

    const { data: receiptApprove, isLoading: isLoadingReceiptApprove } =
        useWaitForReceipt({
            client: twClient,
            chain: props.activeChain,
            transactionHash: approvePendingTxHash,
        });

    const { data: receiptBridge, isLoading: isLoadingReceiptBridge } =
        useWaitForReceipt({
            client: twClient,
            chain: props.activeChain,
            transactionHash: bridgePendingTxHash,
        });

    async function setDefaultChain(chain: Chain) {
        try {
            // @note returns nothing if successfull, throws if not
            await switchChain(chain);
        } catch (e) {
            toast({
                status: "error",
                title: "Error",
                description:
                    "User rejected the chain switch. Please try again.",
            });
        }
    }

    async function sendApproveTx() {
        setLoading(true);
        setStatus("Approving");

        const pickContractBridgeAddr = onSource()
            ? SOURCE_MESSAGING_CONTRACT
            : INTEGRATION_MESSAGING_CONTRACT;

        const pickContractApprove = onSource() ? usdcSource : usdcIntegration;

        const approving = prepareContractCall({
            contract: pickContractApprove,
            method: "function approve(address spender, uint256 value) returns (bool)",
            params: [pickContractBridgeAddr, parseUnits(usdcValue.toString())],
        });
        console.log("We are past the approve!", approving);

        try {
            const result = await sendAndConfirmApprove(approving);
            console.log("Result of approve sending", result);
            return result;
        } catch (e) {
            console.error(e);
            toast({
                status: "error",
                title: "Error",
                description: "Error while approving USDC. Please try again.",
            });

            setLoading(false);
        }
    }

    async function sendBridgeTx() {
        setLoading(true);
        setStatus("Sending");

        const pickContractBridge = onSource()
            ? messagingSource
            : messagingIntegration;

        const bridging = prepareContractCall({
            contract: pickContractBridge,
            method: "function bridge(address to, uint256 amount) external returns (uint256 txId)",
            params: [walletAddr, parseUnits(usdcValue.toString())],
        });

        try {
            const result = await sendAndConfirmBridge(bridging);
            console.log("Result of bridge sending", result);
            return result;
        } catch (e) {
            console.error(e);
            toast({
                status: "error",
                title: "Error",
                description: "Error while sending USDC. Please try again.",
            });

            setLoading(false);
        }
    }

    useEffect(() => {
        if (!receiptApprove || approvePendingTxHash == "0x") {
            console.error("No receipt and no tx hash !");
            return;
        }

        console.log("We approved and waited for receipt", receiptApprove);

        sendBridgeTx();
    }, [receiptApprove]);

    useEffect(() => {
        if (!receiptBridge || approvePendingTxHash == "0x") {
            console.error("No receipt and no tx hash !");
            return;
        }

        console.log("Final everything log receipt", receiptBridge);

        toastRef.current = toast({
            status: "success",
            title: "Bridge in progress",
            description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
        });
        setIsCounting(true);

        // @todo stop the toast() timer and close the toast
    }, [receiptBridge]);

    useEffect(() => {
        if (walletAddr && props.activeChain) setDefaultChain(props.activeChain);
    }, [walletAddr, props.activeChain]);

    useEffect(() => {
        if (!transactionReceiptApprove) return;

        console.log("Almost completed approving !", transactionReceiptApprove);

        // @note So that we can wait for the receipt!
        setApprovePendingTxHash(transactionReceiptApprove.transactionHash);
    }, [transactionReceiptApprove]);

    useEffect(() => {
        if (!transactionReceiptBridge) return;

        console.log("Almost completed bridging !", transactionReceiptBridge);

        // @note So that we can wait for the receipt!
        setBridgePendingTxHash(transactionReceiptBridge.transactionHash);
    }, [transactionReceiptBridge]);

    const executeBridge = async () => {
        if (!chainData?.id || !walletAddr) {
            console.error("No wallet or no chain id !");
            return;
        }

        const pickSwitchTo = onSource() ? SOURCE_CHAIN : INTEGRATION_CHAIN;
        setLoading(true);

        try {
            if (chainData.id != pickSwitchTo.id) {
                setStatus("Switching chains");
                await switchChain(pickSwitchTo);
            }

            // @note If not allowed enough, approve, otherwise bridge
            const allowanceToCheck = onSource()
                ? usdcAllowance
                : usdcPolAllowance;
            if (allowanceToCheck < parseUnits(usdcValue.toString())) {
                await sendApproveTx();
            } else await sendBridgeTx();
        } catch (e) {
            console.error(e);
            toast({
                status: "error",
                title: "Error",
                description:
                    "There was an error switching chains. Please try again.",
            });

            setLoading(false);
        }
    };

    // function balanceOf(address _owner) public view returns (uint256 balance)
    // function transfer(address _to, uint256 _value) public returns (bool success)
    // function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
    // function approve(address _spender, uint256 _value) public returns (bool success)
    // function allowance(address _owner, address _spender) public view returns (uint256 remaining)

    // function bridge(address to, uint256 amount) external returns (uint256 txId)

    const {
        data: usdcSourceBalanceAmt,
        isLoading: usdcSourceBalanceIsLoading,
        refetch: usdcSourceBalanceRefetch, // @note async
    } = useReadContract({
        contract: usdcSource,
        method: "function balanceOf(address _owner) public view returns (uint256 balance)",
        params: [walletAddr],
    });

    const {
        data: usdcIntegrationBalanceAmt,
        isLoading: usdcIntegrationBalanceIsLoading,
        refetch: usdcIntegrationBalanceRefetch, // @note async
    } = useReadContract({
        contract: usdcIntegration,
        method: "function balanceOf(address _owner) public view returns (uint256 balance)",
        params: [walletAddr],
    });

    const {
        data: usdcSourceAllowanceAmt,
        isLoading: usdcSourceAllowanceIsLoading,
    } = useReadContract({
        contract: usdcSource,
        method: "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
        params: [walletAddr, SOURCE_MESSAGING_CONTRACT],
    });

    const {
        data: usdcIntegrationAllowanceAmt,
        isLoading: usdcIntegrationAllowanceIsLoading,
    } = useReadContract({
        contract: usdcIntegration,
        method: "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
        params: [walletAddr, INTEGRATION_MESSAGING_CONTRACT],
    });

    useEffect(() => {
        // @note NOT connected
        if (!activeAccount || !activeAccount.address) return;

        setWalletAddr(activeAccount.address);
    }, [activeAccount]);

    useEffect(() => {
        if (usdcSourceBalanceAmt) setUsdcBalance(usdcSourceBalanceAmt);

        if (usdcIntegrationBalanceAmt)
            setUsdcPolBalance(usdcIntegrationBalanceAmt);

        if (usdcSourceAllowanceAmt) setUsdcAllowance(usdcSourceAllowanceAmt);

        if (usdcIntegrationAllowanceAmt)
            setUsdcPolAllowance(usdcIntegrationAllowanceAmt);
    }, [
        usdcSourceBalanceAmt,
        usdcIntegrationBalanceAmt,
        usdcSourceAllowanceAmt,
        usdcIntegrationAllowanceAmt,
    ]);

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

            <Navbar activeChain={props.activeChain} />

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
                    direction={onSource() ? "column" : "column-reverse"}
                    gap="3"
                >
                    <SwapInput
                        current={currentFrom}
                        type="usdc"
                        max={Number(formatUnits(usdcBalance))}
                        value={usdcValue}
                        setValue={setUsdcValue}
                        tokenSymbol={SOURCE_USDC_TOKEN_NAME}
                        tokenBalance={formatUnits(usdcBalance)}
                        network="polygon"
                    />

                    <Button
                        onClick={async () => {
                            const switchTo = onSource()
                                ? setCurrentFrom("usdcpol")
                                : setCurrentFrom("usdc");

                            const switchToChain = onSource()
                                ? INTEGRATION_CHAIN
                                : SOURCE_CHAIN;

                            console.log("We want to switch to ", switchToChain);
                            await setDefaultChain(switchToChain);

                            props.chainSwitchHandler(switchToChain);
                        }}
                        maxW="5"
                        mx="auto"
                    >
                        ↓
                    </Button>

                    <h1>
                        {currentFrom} {formatUnits(usdcAllowance)}{" "}
                        {formatUnits(usdcPolAllowance)}
                        UsdcValue {usdcValue}
                    </h1>

                    <h1>Active chain {props.activeChain?.id}</h1>

                    <SwapInput
                        current={currentFrom}
                        type="usdcpol"
                        max={Number(formatUnits(usdcPolBalance))}
                        value={usdcValue}
                        setValue={setUsdcValue}
                        tokenSymbol={INTEGRATION_USDC_TOKEN_NAME}
                        tokenBalance={formatUnits(usdcPolBalance)}
                        network={INTEGRATION_BRAND_NAME.toLowerCase()}
                    />
                </Flex>

                {activeAccount ? (
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
                            "Transfer USDC"
                        )}
                    </Button>
                ) : (
                    <Connect activeChain={props.activeChain} />
                )}

                <Connect activeChain={props.activeChain} />

                <p>
                    <sup>*</sup> Each bridge transfer takes 2-3 mins and costs
                    US$0.25 plus gas.
                </p>
            </Flex>
        </>
    );
}
