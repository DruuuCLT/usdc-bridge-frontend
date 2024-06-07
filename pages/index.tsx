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
} from "thirdweb/react";
import { useState, useEffect, useRef, useTransition } from "react";
import { setConstantValue } from "typescript";

const countdownAmount = 20;

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

    const [usdcValue, setUsdcValue] = useState<string>("0");

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
        if (onSource()) {
            tooBig =
                Number(usdcValue) - 0.25 > Number(formatUnits(usdcBalance));
        } else {
            tooBig =
                Number(usdcValue) - 0.25 > Number(formatUnits(usdcPolBalance));
        }
        return Number(usdcValue) <= 0.25 || tooBig;
    };

    const { mutate: sendTransaction, isPending } = useSendTransaction();

    const { mutate: sendAndConfirmApprove, data: transactionReceiptApprove } =
        useSendAndConfirmTransaction();

    const { mutate: sendAndConfirmBridge, data: transactionReceiptBridge } =
        useSendAndConfirmTransaction();

    if (transactionReceiptApprove)
        console.log("transactionReceipt", transactionReceiptApprove);

    // later
    // sendAndConfirmTx(tx);

    const walletsConnected = useConnectedWallets();
    console.log("walletsConnected", walletsConnected);
    console.log();

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
        await switchChain(chain);
    }

    useEffect(() => {
        if (!receiptApprove || approvePendingTxHash == "0x") {
            console.error("No receipt and no tx hash !");
            return;
        }

        const pickContractBridge = onSource()
            ? messagingSource
            : messagingIntegration;

        const bridging = prepareContractCall({
            contract: pickContractBridge,
            method: "function bridge(address to, uint256 amount) external returns (uint256 txId)",
            params: [walletAddr, parseUnits(usdcValue)],
        });

        sendAndConfirmBridge(bridging);
    }, [receiptApprove]);

    useEffect(() => {
        if (!receiptBridge || approvePendingTxHash == "0x") {
            console.error("No receipt and no tx hash !");
            return;
        }

        toastRef.current = toast({
            status: "success",
            title: "Bridge in progress",
            description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
        });
        setIsCounting(true);

        // @todo stop the toast() timer and close the toast
        // @todo update the balances AND allowances somehow

        alert("Bridged and validated!");
    }, [receiptBridge]);

    useEffect(() => {
        if (walletAddr) setDefaultChain(SOURCE_CHAIN);
    }, [walletAddr]);

    useEffect(() => {
        if (!transactionReceiptApprove) return;

        console.log("we are now approving !");

        console.log("approving data", transactionReceiptApprove);

        // @note So that we can wait for the receipt!
        setApprovePendingTxHash(transactionReceiptApprove.transactionHash);
    }, [transactionReceiptApprove]);

    //                 toast({
    //                     status: "error",
    //                     title: "Error",
    //                     description:
    //                         "There was an error approving USDC. Please try again.",
    //                 });

    //             toastRef.current = toast({
    //                 status: "success",
    //                 title: "Bridge in progress",
    //                 description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
    //             });
    //             setIsCounting(true);

    useEffect(() => {
        if (!transactionReceiptBridge) return;

        console.log("Almost completed bridging !");

        // @note So that we can wait for the receipt!
        setBridgePendingTxHash(transactionReceiptBridge.transactionHash);

        // alert("Amazing!");
    }, [transactionReceiptBridge]);

    const executeBridge = async () => {
        // const bridging = prepareContractCall({
        //     contract: pickContractBridge,
        //     method: "function mint(address to)",
        //     params: ["0x..."],
        // });

        // sendTransaction(transaction);

        // return false;

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

            setStatus("Approving");
            startTransition(() => {
                const pickContractApprove = onSource()
                    ? usdcSource
                    : usdcIntegration;

                const pickContractBridge = onSource()
                    ? messagingSource
                    : messagingIntegration;

                const pickContractBridgeAddr = onSource()
                    ? SOURCE_MESSAGING_CONTRACT
                    : INTEGRATION_MESSAGING_CONTRACT;

                console.log("We are before the approve!");
                console.log(usdcValue);
                console.log(parseUnits(usdcValue));

                // @note Sync!
                const approving = prepareContractCall({
                    contract: pickContractApprove,
                    method: "function approve(address _spender, uint256 _value) public returns (bool success)",
                    params: [pickContractBridgeAddr, parseUnits(usdcValue)],
                });
                console.log("We are past the approve!", approving);

                const ab = sendAndConfirmApprove(approving);
                console.log("Send confirm approve", ab);
            });
        } catch (e) {
            console.error(e);

            toast({
                status: "error",
                title: "Error",
                description:
                    "There was an error approving USDC. Please try again.",
            });
        }

        setLoading(false);
    };

    //     const { mutate: sendTransaction, isPending } = useSendTransaction();

    // function balanceOf(address _owner) public view returns (uint256 balance)
    // function transfer(address _to, uint256 _value) public returns (bool success)
    // function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
    // function approve(address _spender, uint256 _value) public returns (bool success)
    // function allowance(address _owner, address _spender) public view returns (uint256 remaining)

    // function bridge(address to, uint256 amount) external returns (uint256 txId)

    const {
        data: usdcSourceBalanceAmt,
        isLoading: usdcSourceBalanceIsLoading,
    } = useReadContract({
        contract: usdcSource,
        method: "function balanceOf(address _owner) public view returns (uint256 balance)",
        params: [walletAddr],
    });

    const {
        data: usdcIntegrationBalanceAmt,
        isLoading: usdcIntegrationBalanceIsLoading,
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
                        max={formatUnits(usdcBalance)}
                        value={String(
                            onSource()
                                ? usdcValue
                                : Math.max(0, Number(usdcValue) - 0.25).toFixed(
                                      2
                                  )
                        )}
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
                    </h1>

                    <h1>Active chain {props.activeChain?.id}</h1>

                    <SwapInput
                        current={currentFrom}
                        type="usdcpol"
                        max={formatUnits(usdcPolBalance)}
                        value={String(
                            onSource()
                                ? usdcValue
                                : Math.max(0, Number(usdcValue) - 0.25).toFixed(
                                      2
                                  )
                        )}
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
                            " Bridge USDC"
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

// export default function Home(props: Props) {
//     const toast = useToast();
//     const toastRef = useRef<ToastId | null>(null);
//     const address = useAddress();

//     const isMismatched = useNetworkMismatch();

//     import { useActiveWalletChain } from "thirdweb/react";

// const chainId = useActiveWalletChain();

//     const theChain = useChain();

//     console.log("theChain", theChain);

//     const switchChain = useSwitchChain();

//     const currentChainId = useChainId();
//     console.log(currentChainId);

//     const wal = useWallet();
//     const walConf = useWalletConfig();
//     const connStatus = useConnectionStatus();
//     const walConn = useConnectedWallet();
//     const signer = useSigner();

//     console.log("wal", wal);
//     console.log("walConf", walConf);
//     console.log("connStatus", connStatus);
//     console.log("walConn", walConn);
//     console.log("signer", signer);

//     useEffect(() => {
//         console.log("We changed the ID !", currentChainId);
//     }, [currentChainId]);

//     const [usdcBalance, setUsdcBalance] = useState<BigNumber>(
//         BigNumber.from(0)
//     );
//     const [usdcPolBalance, setUsdcPolBalance] = useState<BigNumber>(
//         BigNumber.from(0)
//     );
//     const [usdcAllowance, setUsdcAllowance] = useState<BigNumber>(
//         BigNumber.from(0)
//     );
//     const [usdcPolAllowance, setUsdcPolAllowance] = useState<BigNumber>(
//         BigNumber.from(0)
//     );

//     const countdown = useRef(countdownAmount);

//     const [status, setStatus] = useState("Bridging");

//     const [usdcValue, setUsdcValue] = useState<string>("0");

//     const [isCounting, setIsCounting] = useState<boolean>(false);

//     const [destinationContract, setDestinationContract] =
//         useState<SmartContract | null>(null);

//     const sourceMessagingContract = useRef<SmartContract | null>(null);
//     const integrationMessagingContract = useRef<SmartContract | null>(null);
//     const tokenSourceContract = useRef<SmartContract | null>(null);
//     const tokenIntegrationContract = useRef<SmartContract | null>(null);

//     const [currentFrom, setCurrentFrom] = useState<string>("usdc");
//     const [loading, setLoading] = useState<boolean>(false);

//     const isBridging = useRef<boolean>(false);

//     function onSource() {
//         return currentFrom === "usdc";
//     }

//     async function setAllContracts() {
//         sourceMessagingContract.current = await sourceProvider.getContract(
//             SOURCE_MESSAGING_CONTRACT,
//             viaAbi
//         );
//         integrationMessagingContract.current =
//             await integrationProvider.getContract(
//                 INTEGRATION_MESSAGING_CONTRACT,
//                 viaAbi
//             );

//         tokenSourceContract.current = await sourceProvider.getContract(
//             SOURCE_USDC_TOKEN_CONTRACT
//         );
//         tokenIntegrationContract.current =
//             await integrationProvider.getContract(
//                 INTEGRATION_USDC_TOKEN_CONTRACT
//             );
//     }

//     useEffect(() => {
//         async function getBalances() {
//             const sBal = await sourceProvider.getContract(
//                 SOURCE_USDC_TOKEN_CONTRACT
//             );
//             const iBal = await integrationProvider.getContract(
//                 INTEGRATION_USDC_TOKEN_CONTRACT
//             );

//             const sB = await sBal.call("balanceOf", [address]);
//             const iB = await iBal.call("balanceOf", [address]);

//             const sA = await sBal.call("allowance", [
//                 address,
//                 SOURCE_MESSAGING_CONTRACT,
//             ]);
//             const iA = await iBal.call("allowance", [
//                 address,
//                 INTEGRATION_MESSAGING_CONTRACT,
//             ]);

//             setUsdcBalance(sB);
//             setUsdcPolBalance(iB);
//             setUsdcAllowance(sA);
//             setUsdcPolAllowance(iA);
//         }

//         console.log("Loaded page", address);

//         if (address) {
//             getBalances();
//             setAllContracts();
//         }
//     }, [address]);

//     // MV3
//     // emit Success(_txId, _sourceChainId, _sender, _recipient, 0);
//     // emit ErrorLog(_txId, string.concat("MessageV3: recipient: ", _reason));
//     // emit ErrorLog(_txId, "MessageV3: uncallable: fatal failure");
//     // emit SendProcessed(_txId, _sourceChainId, _sender, _recipient);

//     // Bridge
//     // emit FiatTokenReceived(to, amount);

//     // const {
//     //     data,
//     //     isLoading,
//     //     error: eventListenerError,
//     // } = useContractEvents(destinationContract, "FiatTokenReceived", {
//     //     // queryFilter: {
//     //     //     filters: {
//     //     //         to: address, // e.g. Only events where tokenId = 123
//     //     //         amount: 123, // e.g. Only events where tokenId = 123
//     //     //     },
//     //     //     fromBlock: 0, // Events starting from this block
//     //     //     toBlock: 100, // Events up to this block
//     //     //     order: "asc", // Order of events ("asc" or "desc")
//     //     // },
//     //     subscribe: true, // Subscribe to new events
//     // });

//     const {
//         data,
//         isLoading,
//         error: eventListenerError,
//     } = useContractEvents(destinationContract);

//     console.log("Data from useContractEvents", data);

//     useEffect(() => {
//         if (!isCounting) return;
//         if (isCounting) countdown.current = countdownAmount;

//         // if (countdown.current <= 0) return;

//         const interval = setInterval(() => {
//             countdown.current -= 1;

//             if (!toastRef.current) return;

//             toast.update(toastRef.current, {
//                 status: "success",
//                 title: "Bridge in progress",
//                 description: `Waiting for ${countdown.current}`,
//                 duration: null,
//             });

//             if (countdown.current === 0) {
//                 clearInterval(interval);
//                 // toast.close(toastRef.current);

//                 setIsCounting(false);

//                 toast.update(toastRef.current, {
//                     status: "success",
//                     title: "Bridge completed",
//                     description: `Funds should have reached their destination`,
//                     duration: 5000,
//                 });

//                 setLoading(false);
//             }
//         }, 1000);

//         return () => {
//             console.log("Removing interval", interval);
//             clearInterval(interval);
//         };
//     }, [isCounting]);

//     useEffect(() => {
//         // @note To then listen on this
//         async function setDest() {
//             const contractAddr = onSource()
//                 ? INTEGRATION_MESSAGING_CONTRACT
//                 : SOURCE_MESSAGING_CONTRACT;
//             const chainProvider = onSource()
//                 ? integrationProvider
//                 : sourceProvider;

//             const dest = await chainProvider.getContract(contractAddr);

//             setDestinationContract(dest);
//         }

//         setDest();
//     }, [currentFrom]);

//     const inputInvalid = () => {
//         let tooBig = true;
//         if (onSource()) {
//             tooBig =
//                 Number(usdcValue) - 0.25 > Number(formatUnits(usdcBalance));
//         } else {
//             tooBig =
//                 Number(usdcValue) - 0.25 > Number(formatUnits(usdcPolBalance));
//         }
//         return Number(usdcValue) <= 0.25 || tooBig;
//     };

//     // // Approve Polygon
//     // const { contract: usdcContract } = useContract(
//     //     SOURCE_USDC_TOKEN_CONTRACT,
//     //     usdcAbi
//     // );
//     // const { mutateAsync: approveUsdcSpending } = useContractWrite(
//     //     usdcContract,
//     //     "approve"
//     // );

//     // // Bridge Polygon
//     // const { contract: viaPolygonContract } = useContract(
//     //     SOURCE_MESSAGING_CONTRACT,
//     //     viaAbi
//     // );
//     // const { mutateAsync: bridgeUSDCToUSDCPOL } = useContractWrite(
//     //     viaPolygonContract,
//     //     "bridge"
//     // );

//     // // Approve Integration chain
//     // const { contract: usdcPolContract } = useContract(
//     //     INTEGRATION_USDC_TOKEN_CONTRACT,
//     //     usdcAbi
//     // );
//     // const { mutateAsync: approveUsdcPolSpending } = useContractWrite(
//     //     usdcPolContract,
//     //     "approve"
//     // );

//     // // const { mutateAsync: approveUsdcPolSpending, isLoading: approve, error } = useContractWrite(
//     // //     usdcPolContract,
//     // //     "approve",
//     // //   );

//     // // Bridge Integration chain
//     // const { contract: viaVitruveoContract } = useContract(
//     //     INTEGRATION_MESSAGING_CONTRACT,
//     //     viaAbi
//     // );
//     // const { mutateAsync: bridgeUSDCPOLToUSDC } = useContractWrite(
//     //     viaVitruveoContract,
//     //     "bridge"
//     // );

//     // const wallet = new AbstractWalletImplementation();
//     // const sdk = await ThirdwebSDK.fromWallet(wallet, "mainnet");

//     const executeBridge = async () => {
//         setLoading(true);
//         // try {

//         if (!signer) {
//             console.log("No signer available!");
//             return;
//         }

//         const pickedChain = onSource() ? SOURCE_CHAIN : INTEGRATION_CHAIN;

//         const chainId = await ethers.provider.request({
//             method: "eth_chainId",
//         });

//         provider // Or window.ethereum if you don't support EIP-6963.
//             .on("chainChanged", handleChainChanged);

//         const walletSigner = ThirdwebSDK.fromSigner(signer, pickedChain, {
//             clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
//         });

//         // @note To BigNumber
//         const amount = ethers.utils.parseUnits(usdcValue, 6);

//         console.log("isMismatched?", isMismatched);

//         if (isMismatched) {
//             setStatus("Switching");
//             await switchChain(SOURCE_CHAIN_ID);
//         }

//         // @note If on origin/source chain
//         const chainAllowance = onSource() ? usdcAllowance : usdcPolAllowance;

//         const messagingContractAddr = onSource()
//             ? SOURCE_MESSAGING_CONTRACT
//             : INTEGRATION_MESSAGING_CONTRACT;

//         const messagingContract = onSource()
//             ? sourceMessagingContract.current
//             : integrationMessagingContract.current;

//         if (chainAllowance < amount) {
//             setStatus("Approving");
//             // const tokenToApprove = onSource()
//             //     ? tokenSourceContract.current
//             //     : tokenIntegrationContract.current;

//             const tokenToApprove = onSource()
//                 ? SOURCE_USDC_TOKEN_CONTRACT
//                 : INTEGRATION_USDC_TOKEN_CONTRACT;

//             const tokenContractWithSigner = await walletSigner.getContract(
//                 tokenToApprove,
//                 usdcAbi
//             );

//             if (!tokenToApprove) {
//                 console.log(
//                     "No token to approve!",
//                     chainAllowance,
//                     tokenToApprove,
//                     onSource()
//                 );
//                 setLoading(false);
//                 return;
//             }

//             try {
//                 await tokenContractWithSigner.call("approve", [
//                     messagingContractAddr,
//                     amount,
//                 ]);
//             } catch (e) {
//                 const errorReason = (e as TransactionError)?.reason;

//                 console.log("Execution reverted with reason:", e);
//                 toast({
//                     status: "error",
//                     title: "Error",
//                     description:
//                         "There was an error approving USDC. Please try again.",
//                 });

//                 setLoading(false);
//                 return;
//             }
//         }

//         if (!messagingContract) {
//             setLoading(false);
//             return;
//         }

//         try {
//             await messagingContract.call("bridge", [address, amount]);

//             toastRef.current = toast({
//                 status: "success",
//                 title: "Bridge in progress",
//                 description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
//             });
//             setIsCounting(true);
//         } catch (e) {
//             const errorReason = (e as TransactionError)?.reason;

//             console.log("Execution reverted with reason:", e);
//             toast({
//                 status: "error",
//                 title: "Error",
//                 description:
//                     "There was an error sending USDC. Please try again.",
//             });

//             setLoading(false);
//             return;
//         }

//         // if (onSource()) {
//         //     if (isMismatched) {
//         //         setStatus("Switching");
//         //         await switchChain(SOURCE_CHAIN_ID);
//         //     }

//         //     if (usdcAllowance < amount) {
//         //         setStatus("Approving");
//         //         await approveUsdcSpending({
//         //             args: [SOURCE_MESSAGING_CONTRACT, amount],
//         //         });
//         //     }

//         //     setStatus("Bridging");
//         //     await bridgeUSDCToUSDCPOL({ args: [address, amount] });

//         //     toastRef.current = toast({
//         //         status: "success",
//         //         title: "Bridge in progress",
//         //         description: `You have successfully bridged your ${SOURCE_USDC_TOKEN_NAME} from ${SOURCE_CHAIN_NAME} to ${INTEGRATION_USDC_TOKEN_NAME} on ${INTEGRATION_CHAIN_NAME}. Funds will arrive in 2-3 mins.`,
//         //     });
//         // } else {
//         //     if (isMismatched) {
//         //         setStatus("Switching");
//         //         await switchChain(INTEGRATION_CHAIN_ID);
//         //     }

//         //     if (usdcPolAllowance < amount) {
//         //         setStatus("Approving");
//         //         await approveUsdcPolSpending({
//         //             args: [INTEGRATION_MESSAGING_CONTRACT, amount],
//         //         });
//         //     }

//         //     setStatus("Bridging");
//         //     await bridgeUSDCPOLToUSDC({ args: [address, amount] });

//         //     toast({
//         //         status: "success",
//         //         title: "Bridge in progress",
//         //         description: `You have successfully bridged your ${INTEGRATION_USDC_TOKEN_NAME} from ${INTEGRATION_CHAIN_NAME} to ${SOURCE_USDC_TOKEN_NAME} on ${SOURCE_CHAIN_NAME}. Funds will arrive in 2-3 mins.`,
//         //     });
//         // }
//         //     setIsCounting(true);

//         //     // setLoading(false);
//         // } catch (err) {
//         //     console.error(err);
//         //     toast({
//         //         status: "error",
//         //         title: "Error",
//         //         description: "There was an error. Please try again.",
//         //     });
//         //     setLoading(false);
//         // }
//     };

//     // const allContract = useContract(
//     //     onSource()
//     //         ? SOURCE_USDC_TOKEN_CONTRACT
//     //         : INTEGRATION_USDC_TOKEN_CONTRACT
//     // );

//     // useEffect(() => {
//     //     console.log(">> Contract is fetching!", allContract.isFetching);
//     // }, [allContract.isFetching]);
//     // useEffect(() => {
//     //     console.log(">> Contract is loading!", allContract.isLoading);
//     // }, [allContract.isLoading]);
//     // useEffect(() => {
//     //     console.log(">> Contract is success!", allContract.isSuccess);
//     // }, [allContract.isSuccess]);
//     // useEffect(() => {
//     //     console.log(">> Contract is fetched 100%!", allContract.isFetched);
//     // }, [allContract.isFetched]);
//     // useEffect(() => {
//     //     console.log(">> Contract is re-fetching!", allContract.isRefetching);
//     // }, [allContract.isRefetching]);

//     // console.log("allContract", allContract);
//     // // const { mutateAsync, isLoading: isLoadingUSDC, error } = useContractWrite(
//     // const { mutateAsync: approveToken } = useContractWrite(
//     //     allContract.contract,
//     //     "approve"
//     // );

//     // // mutateAsync({ args: ["My Name"] })

//     // console.log("allContract", allContract);
//     // console.log("allWrites", allWrites);

//     // allWrites.isIdle
//     // allWrites.isLoading
//     // allWrites.isSuccess
//     // allWrites.mutateAsync
//     // allWrites.context
//     // allWrites.data
//     // allWrites.error

//     const executeBridgeWithHooks = async () => {
//         setLoading(true);
//         isBridging.current = true;

//         // @note To BigNumber
//         const amount = ethers.utils.parseUnits(usdcValue, 6);

//         console.log("isMismatched?", isMismatched);

//         try {
//             if (isMismatched) {
//                 setStatus("Switching");
//                 // @todo edit this based on where they want to go, source is default obv
//                 await switchChain(SOURCE_CHAIN_ID);

//                 // @note Here hooks will start updating data and preparing the write !
//             }

//             setStatus("Approving");
//             await approveToken({ args: [SOURCE_MESSAGING_CONTRACT, amount] });
//         } catch (e) {
//             console.error(e);

//             setLoading(false);
//         }

//         return;

//         // @note If on origin/source chain
//         const chainAllowance = onSource() ? usdcAllowance : usdcPolAllowance;

//         const messagingContractAddr = onSource()
//             ? SOURCE_MESSAGING_CONTRACT
//             : INTEGRATION_MESSAGING_CONTRACT;

//         const messagingContract = onSource()
//             ? sourceMessagingContract.current
//             : integrationMessagingContract.current;

//         if (chainAllowance < amount) {
//             setStatus("Approving");
//             const tokenToApprove = onSource()
//                 ? tokenSourceContract.current
//                 : tokenIntegrationContract.current;

//             if (!tokenToApprove) {
//                 console.log(
//                     "No token to approve!",
//                     chainAllowance,
//                     tokenToApprove,
//                     onSource()
//                 );
//                 setLoading(false);
//                 return;
//             }

//             try {
//                 await tokenToApprove.call("approve", [
//                     messagingContractAddr,
//                     amount,
//                 ]);
//             } catch (e) {
//                 const errorReason = (e as TransactionError)?.reason;

//                 console.log("Execution reverted with reason:", e);
//                 toast({
//                     status: "error",
//                     title: "Error",
//                     description:
//                         "There was an error approving USDC. Please try again.",
//                 });

//                 setLoading(false);
//                 return;
//             }
//         }

//         if (!messagingContract) {
//             setLoading(false);
//             return;
//         }

//         try {
//             await messagingContract.call("bridge", [address, amount]);

//             toastRef.current = toast({
//                 status: "success",
//                 title: "Bridge in progress",
//                 description: `You are sending USDC cross-chain. Funds will arrive in 2-3 mins.`,
//             });
//             setIsCounting(true);
//         } catch (e) {
//             const errorReason = (e as TransactionError)?.reason;

//             console.log("Execution reverted with reason:", e);
//             toast({
//                 status: "error",
//                 title: "Error",
//                 description:
//                     "There was an error sending USDC. Please try again.",
//             });

//             setLoading(false);
//             return;
//         }
//     };

//     return (
//         <>
//             <Head>
//                 <title>{`${INTEGRATION_BRAND_NAME} USDC Bridge`}</title>
//                 <meta
//                     name="viewport"
//                     content="width=device-width, initial-scale=1"
//                 />
//                 <link rel="icon" href="/favicon.ico" />
//             </Head>

//             <Navbar />

//             <Flex
//                 direction="column"
//                 gap="5"
//                 mt="10"
//                 p="5"
//                 mx="auto"
//                 maxW={{ base: "sm", md: "xl" }}
//                 w="full"
//                 rounded="2xl"
//                 borderWidth="1px"
//                 borderColor="gray.600"
//             >
//                 <h2
//                     style={{
//                         fontSize: "24px",
//                         fontWeight: 600,
//                         margin: "auto",
//                         marginBottom: "20px",
//                     }}
//                 >
//                     {INTEGRATION_BRAND_NAME} USDC Bridge
//                 </h2>
//                 <p style={{ marginBottom: 10 }}>
//                     {`The ${INTEGRATION_BRAND_NAME}
//                      USDC Bridge is a fast and easy way to bridge
//                     ${SOURCE_USDC_TOKEN_NAME} ${SOURCE_CHAIN_NAME} to/from ${INTEGRATION_USDC_TOKEN_NAME} on
//                     ${INTEGRATION_CHAIN_NAME}.`}
//                 </p>
//                 <Flex
//                     direction={onSource() ? "column" : "column-reverse"}
//                     gap="3"
//                 >
//                     <SwapInput
//                         current={currentFrom}
//                         type="usdc"
//                         max={formatUnits(usdcBalance)}
//                         value={String(
//                             onSource()
//                                 ? usdcValue
//                                 : Math.max(0, Number(usdcValue) - 0.25).toFixed(
//                                       2
//                                   )
//                         )}
//                         setValue={setUsdcValue}
//                         tokenSymbol={SOURCE_USDC_TOKEN_NAME}
//                         tokenBalance={formatUnits(usdcBalance)}
//                         network="polygon"
//                     />

//                     <Button
//                         onClick={async () => {
//                             // await switchChain(
//                             //     onSource()
//                             //         ? INTEGRATION_CHAIN_ID
//                             //         : SOURCE_CHAIN_ID
//                             // );

//                             onSource()
//                                 ? setCurrentFrom("usdcpol")
//                                 : setCurrentFrom("usdc");

//                             props.chainSwitchHandler(SOURCE_CHAIN);
//                         }}
//                         maxW="5"
//                         mx="auto"
//                     >
//                         ↓
//                     </Button>

//                     <h1>{currentFrom}</h1>

//                     <SwapInput
//                         current={currentFrom}
//                         type="usdcpol"
//                         max={formatUnits(usdcPolBalance)}
//                         value={String(
//                             onSource()
//                                 ? usdcValue
//                                 : Math.max(0, Number(usdcValue) - 0.25).toFixed(
//                                       2
//                                   )
//                         )}
//                         setValue={setUsdcValue}
//                         tokenSymbol={INTEGRATION_USDC_TOKEN_NAME}
//                         tokenBalance={formatUnits(usdcPolBalance)}
//                         network={INTEGRATION_BRAND_NAME.toLowerCase()}
//                     />
//                 </Flex>

//                 {address ? (
//                     <Button
//                         onClick={executeBridge}
//                         py="7"
//                         fontSize="2xl"
//                         colorScheme="purple"
//                         rounded="xl"
//                         isDisabled={loading || inputInvalid()}
//                         style={{
//                             fontWeight: 400,
//                             background:
//                                 "linear-gradient(106.4deg, rgb(255, 104, 192) 11.1%, rgb(104, 84, 249) 81.3%)",
//                             color: "#ffffff",
//                         }}
//                     >
//                         {/* <img src='/images/usdc-logo.png' style={{width: '30px', marginRight: '10px'}} /> */}
//                         {loading ? (
//                             <>
//                                 <Spinner me="8px" /> {status}
//                             </>
//                         ) : (
//                             " Bridge USDC"
//                         )}
//                     </Button>
//                 ) : (
//                     <Connect />
//                 )}
//                 <p>
//                     <sup>*</sup> Each bridge transfer takes 2-3 mins and costs
//                     US$0.25 plus gas.
//                 </p>
//             </Flex>
//         </>
//     );
// }
