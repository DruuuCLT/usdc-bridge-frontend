import Head from "next/head";
import Navbar from "../components/NavBar";
import SwapInput from "../components/SwapInput";
import { formatUnits, parseUnits } from "../utils/amounts";
import Connect from "../components/Connect";
import { prepareContractCall, getContract } from "thirdweb";
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
    INTEGRATION_MESSAGING_CONTRACT,
    SOURCE_USDC_TOKEN_NAME,
    INTEGRATION_USDC_TOKEN_NAME,
    SOURCE_CHAIN_NAME,
    INTEGRATION_CHAIN_NAME,
    INTEGRATION_BRAND_NAME,
    twClient,
} from "../const/details";
import {
    useActiveWalletChain,
    useSwitchActiveWalletChain,
    useActiveAccount,
    useReadContract,
    useSendAndConfirmTransaction,
    useWaitForReceipt,
    useContractEvents,
    useBlockNumber,
} from "thirdweb/react";

import { useState, useEffect, useRef } from "react";

const countdownAmount = 120;
const feeAmount = 0.25;

interface Props {
    chainSwitchHandler: Function;
    activeChain: Chain;
}

export default function Home(props: Props) {
    const toast = useToast();
    const toastRef = useRef<ToastId | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdown = useRef<number>(countdownAmount);

    const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
    const [usdcPolBalance, setUsdcPolBalance] = useState<bigint>(BigInt(0));
    const [usdcAllowance, setUsdcAllowance] = useState<bigint>(BigInt(0));
    const [usdcPolAllowance, setUsdcPolAllowance] = useState<bigint>(BigInt(0));

    const destinationContract = useRef<string>(messagingIntegration.address);

    // const [destinationContract, setDestinationContract] =
    //     useState<ReturnType<typeof getContract>>(messagingIntegration);

    const [usdcValue, setUsdcValue] = useState<number>(0);

    const [walletAddr, setWalletAddr] = useState<string>("");

    const [status, setStatus] = useState("Sending");

    const [loading, setLoading] = useState<boolean>(false);

    const [currentFrom, setCurrentFrom] = useState<string>("usdc");
    const [isCounting, setIsCounting] = useState<boolean>(false);

    const [approvePendingTxHash, setApprovePendingTxHash] =
        useState<`0x${string}`>("0x");
    const [bridgePendingTxHash, setBridgePendingTxHash] =
        useState<`0x${string}`>("0x");

    const switchChain = useSwitchActiveWalletChain();

    // const blockNumberSource = useBlockNumber({
    //     client: twClient,
    //     chain: SOURCE_CHAIN,
    //     watch: false,
    // });

    const chainData = useActiveWalletChain();

    const activeAccount = useActiveAccount();

    function onSource() {
        return currentFrom === "usdc";
    }

    async function completed() {
        if (!toastRef.current) return;
        if (timerRef.current) clearInterval(timerRef.current);
        // toast.close(toastRef.current);

        setIsCounting(false);

        toast.update(toastRef.current, {
            status: "success",
            title: "Transfer completed",
            description: `Funds should have reached their destination`,
            duration: 5000,
        });

        setLoading(false);

        // @note update the balances AND allowances somehow. They are all async
        // @note They basically all return the entire thing returned by the hook itself
        const { data: sBData } = await usdcSourceBalanceRefetch();
        const { data: iBData } = await usdcIntegrationBalanceRefetch();
        const { data: sAData } = await usdcSourceAllowanceRefetch();
        const { data: iAData } = await usdcIntegrationAllowanceRefetch();

        // @note can be 0
        if (sBData !== undefined) setUsdcBalance(sBData);
        if (iBData !== undefined) setUsdcPolBalance(iBData);
        if (sAData !== undefined) setUsdcAllowance(sAData);
        if (iAData !== undefined) setUsdcPolAllowance(iAData);
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

    const { data: sourceContractEvents } = useContractEvents({
        contract: messagingSource, // desinationContract.current
        blockRange: 0,

        // events: [tokensClaimedEvent({ claimer: account?.address })],
    });

    // FiatTokenReceived

    const { data: integrationContractEvents } = useContractEvents({
        contract: messagingIntegration, // desinationContract.current
        // events: [tokensClaimedEvent({ claimer: account?.address })],
        blockRange: 0,
    });

    useEffect(() => {
        const contractEvents = onSource()
            ? integrationContractEvents
            : sourceContractEvents;
        if (!contractEvents || !isCounting) return;

        let isUs = false;
        // @note Index 0 is the OLDEST as far as block number, last item is the most recent !
        for (const ev of contractEvents) {
            // @note ev.address is the contract address
            if (
                (ev.args as any).to &&
                ev.eventName == "FiatTokenReceived" &&
                ev.address.toLowerCase() ==
                    destinationContract.current.toLowerCase()
            ) {
                isUs = true;
                break;
            }
        }

        // @note IF this wallet and that contract and that log, then KILL timer early !
        if (isUs) completed();
    }, [sourceContractEvents, integrationContractEvents]);

    useEffect(() => {
        if (!isCounting) return;
        if (isCounting) countdown.current = countdownAmount;

        // if (countdown.current <= 0) return;

        timerRef.current = setInterval(() => {
            countdown.current -= 1;

            if (!toastRef.current) return;

            toast.update(toastRef.current, {
                status: "success",
                title: "Transfer in progress",
                description: `Waiting for ${countdown.current}`,
                duration: null,
            });

            if (countdown.current === 0) completed();
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isCounting]);

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
            const destCtr = onSource() ? messagingIntegration : messagingSource;
            // @note returns nothing if successfull, throws if not
            await switchChain(chain);

            destinationContract.current = destCtr.address;
            // setDestinationContract(destCtr);
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

        try {
            const result = await sendAndConfirmApprove(approving);
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
            console.log("No receipt and no tx hash !");
            return;
        }

        sendBridgeTx();
    }, [receiptApprove]);

    useEffect(() => {
        if (!receiptBridge || bridgePendingTxHash == "0x") {
            console.log("No receipt and no tx hash !");
            return;
        }

        toastRef.current = toast({
            status: "success",
            title: "Transfer in progress",
            description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
        });
        setIsCounting(true);
    }, [receiptBridge]);

    useEffect(() => {
        if (walletAddr && props.activeChain) setDefaultChain(props.activeChain);
    }, [walletAddr, props.activeChain]);

    useEffect(() => {
        if (!transactionReceiptApprove) return;

        // @note So that we can wait for the receipt!
        setApprovePendingTxHash(transactionReceiptApprove.transactionHash);
    }, [transactionReceiptApprove]);

    useEffect(() => {
        if (!transactionReceiptBridge) return;

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
                await setDefaultChain(pickSwitchTo);
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
        refetch: usdcSourceAllowanceRefetch, // @note async
    } = useReadContract({
        contract: usdcSource,
        method: "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
        params: [walletAddr, SOURCE_MESSAGING_CONTRACT],
    });

    const {
        data: usdcIntegrationAllowanceAmt,
        isLoading: usdcIntegrationAllowanceIsLoading,
        refetch: usdcIntegrationAllowanceRefetch, // @note async
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
                    {INTEGRATION_BRAND_NAME} USDC
                </h2>
                <p style={{ marginBottom: 10 }}>
                    {`The ${INTEGRATION_BRAND_NAME}
                     USDC service is a fast and easy way to transfer
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

                            await setDefaultChain(switchToChain);

                            props.chainSwitchHandler(switchToChain);
                        }}
                        maxW="5"
                        mx="auto"
                    >
                        ↓
                    </Button>

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
            </Flex>
        </>
    );
}
