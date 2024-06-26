const abi = JSON.stringify([
    {
        inputs: [
            {
                internalType: "contract IFiatToken",
                name: "fiatToken_",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "destinationChainId_",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "isNative_",
                type: "bool",
            },
            {
                internalType: "uint8",
                name: "destinationDecimals_",
                type: "uint8",
            },
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "bridgeAmount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "fee",
                type: "uint256",
            },
        ],
        name: "FiatTokenBridged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "FiatTokenReceived",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "MessageOwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Paused",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "RecoverToken",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "txId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "destinationChainId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint32",
                name: "featureId",
                type: "uint32",
            },
            {
                indexed: false,
                internalType: "bytes",
                name: "featureData",
                type: "bytes",
            },
        ],
        name: "SendMessageWithFeature",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "exsig",
                type: "address",
            },
        ],
        name: "SetExsig",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "maxfee",
                type: "uint256",
            },
        ],
        name: "SetMaxfee",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "maxGas",
                type: "uint256",
            },
        ],
        name: "SetMaxgas",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Unpaused",
        type: "event",
    },
    {
        stateMutability: "payable",
        type: "fallback",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "CHAINS",
        outputs: [
            {
                internalType: "address",
                name: "endpoint",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "endpointExtended",
                type: "bytes",
            },
            {
                internalType: "uint16",
                name: "confirmations",
                type: "uint16",
            },
            {
                internalType: "bool",
                name: "extended",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "DESTINATION_CHAIN_ID",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "DESTINATION_DECIMALS",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        name: "FEATURES",
        outputs: [
            {
                internalType: "address",
                name: "endpoint",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "endpointExtended",
                type: "bytes",
            },
            {
                internalType: "uint16",
                name: "confirmations",
                type: "uint16",
            },
            {
                internalType: "bool",
                name: "extended",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "FEATURE_GATEWAY",
        outputs: [
            {
                internalType: "contract IFeatureGateway",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "FEE_TOKEN",
        outputs: [
            {
                internalType: "contract IERC20cl",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "FIAT_TOKEN",
        outputs: [
            {
                internalType: "contract IFiatToken",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "IS_NATIVE",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "MESSAGE_OWNER",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "MESSAGEv3",
        outputs: [
            {
                internalType: "contract IMessageV3",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "SOURCE_DECIMALS",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "bridge",
        outputs: [
            {
                internalType: "uint256",
                name: "txId",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_messageV3",
                type: "address",
            },
            {
                internalType: "uint256[]",
                name: "_chains",
                type: "uint256[]",
            },
            {
                internalType: "address[]",
                name: "_endpoints",
                type: "address[]",
            },
            {
                internalType: "uint16[]",
                name: "_confirmations",
                type: "uint16[]",
            },
        ],
        name: "configureClient",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_messageV3",
                type: "address",
            },
            {
                internalType: "uint256[]",
                name: "_chains",
                type: "uint256[]",
            },
            {
                internalType: "bytes[]",
                name: "_endpoints",
                type: "bytes[]",
            },
            {
                internalType: "uint16[]",
                name: "_confirmations",
                type: "uint16[]",
            },
        ],
        name: "configureClientExtended",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_featureGateway",
                type: "address",
            },
        ],
        name: "configureFeatureGateway",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_sender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_sourceChainId",
                type: "uint256",
            },
        ],
        name: "isAuthorized",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_sender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_sourceChainId",
                type: "uint256",
            },
        ],
        name: "isSelf",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "sourceChainId_",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "sender_",
                type: "address",
            },
            {
                internalType: "address",
                name: "",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "bytes",
                name: "data_",
                type: "bytes",
            },
        ],
        name: "messageProcess",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "paused",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
            },
        ],
        name: "recoverToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_signer",
                type: "address",
            },
        ],
        name: "setExsig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_maxFee",
                type: "uint256",
            },
        ],
        name: "setMaxfee",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_maxGas",
                type: "uint256",
            },
        ],
        name: "setMaxgas",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_newMessageOwner",
                type: "address",
            },
        ],
        name: "transferMessageOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        stateMutability: "payable",
        type: "receive",
    },
]);

export default abi;
