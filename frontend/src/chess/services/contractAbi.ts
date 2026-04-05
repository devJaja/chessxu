export const CHESSXU_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyJoined",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidWager",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPlayer",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotWaiting",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotYourTurn",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "wager",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      }
    ],
    "name": "createGame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGame",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "playerW",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "playerB",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "wager",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isNative",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "boardState",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "turn",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct Chessxu.Game",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastGameId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "resign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "moveStr",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "newBoardState",
        "type": "string"
      }
    ],
    "name": "submitMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
