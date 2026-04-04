// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Chessxu {
    address public owner;

    uint256 public nextGameId = 1;

    struct Game {
        address playerW;
        address playerB;
        uint256 wager;
        bool isNative;
        string boardState;
        string turn; // "w" or "b"
        uint8 status; // 0 = Waiting, 1 = Ongoing, 2 = White Wins, 3 = Black Wins, 4 = Draw, 5 = Cancelled
    }

    mapping(uint256 => Game) public games;

    // Optional Token (for token wagers)
    IERC20 public stackchessToken;

    // Errors
    error NotOwner();
    error GameNotFound();
    error NotWaiting();
    error AlreadyJoined();
    error InvalidWager();
    error NotPlayer();
    error NotYourTurn();
    error GameNotActive();
    error InvalidStatus();
    error TransferFailed();

    constructor(address _tokenAddress) {
        owner = msg.sender;
        if (_tokenAddress != address(0)) {
            stackchessToken = IERC20(_tokenAddress);
        }
    }

    function createGame(uint256 wager, bool isNative) external payable returns (uint256) {
        uint256 gameId = nextGameId;

        if (isNative) {
            if (wager > 0) {
                if (msg.value != wager) revert InvalidWager();
            }
        } else {
            if (msg.value > 0) revert InvalidWager();
            if (wager > 0) {
                bool success = stackchessToken.transferFrom(msg.sender, address(this), wager);
                if (!success) revert TransferFailed();
            }
        }

        games[gameId] = Game({
            playerW: msg.sender,
            playerB: address(0),
            wager: wager,
            isNative: isNative,
            boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
            turn: "w",
            status: 0
        });

        nextGameId = gameId + 1;
        return gameId;
    }

    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 0) revert NotWaiting();
        if (msg.sender == game.playerW) revert AlreadyJoined();

        if (game.isNative) {
            if (game.wager > 0) {
                if (msg.value != game.wager) revert InvalidWager();
            }
        } else {
            if (msg.value > 0) revert InvalidWager();
            if (game.wager > 0) {
                bool success = stackchessToken.transferFrom(msg.sender, address(this), game.wager);
                if (!success) revert TransferFailed();
            }
        }

        game.playerB = msg.sender;
        game.status = 1;
    }

    function submitMove(uint256 gameId, string calldata /* moveStr */, string calldata newBoardState) external {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 1) revert GameNotActive();

        if (keccak256(abi.encodePacked(game.turn)) == keccak256(abi.encodePacked("w"))) {
            if (msg.sender != game.playerW) revert NotYourTurn();
            game.turn = "b";
        } else {
            if (msg.sender != game.playerB) revert NotYourTurn();
            game.turn = "w";
        }

        game.boardState = newBoardState;
    }

    function stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function resign(uint256 gameId) external {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 1) revert GameNotActive();
        if (msg.sender != game.playerW && msg.sender != game.playerB) revert NotPlayer();

        uint256 prize = game.wager * 2;

        if (msg.sender == game.playerW) {
            // P1 resigned, P2 wins
            game.status = 3;
            if (prize > 0) {
                if (game.isNative) {
                    payable(game.playerB).transfer(prize);
                } else {
                    bool success = stackchessToken.transfer(game.playerB, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else {
            // P2 resigned, P1 wins
            game.status = 2;
            if (prize > 0) {
                if (game.isNative) {
                    payable(game.playerW).transfer(prize);
                } else {
                    bool success = stackchessToken.transfer(game.playerW, prize);
                    if (!success) revert TransferFailed();
                }
            }
        }
    }

    function resolveGame(uint256 gameId, uint8 newStatus) external {
        if (msg.sender != owner) revert NotOwner();
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 0 && game.status != 1) revert GameNotActive();
        if (newStatus < 2 || newStatus > 5) revert InvalidStatus();

        uint256 prize = game.wager * 2;
        uint256 wager = game.wager;

        if (newStatus == 2) {
            // White wins
            if (game.isNative) {
                if (prize > 0) payable(game.playerW).transfer(prize);
            } else {
                if (prize > 0) {
                    bool success = stackchessToken.transfer(game.playerW, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else if (newStatus == 3) {
            // Black wins
            if (game.playerB != address(0) && prize > 0) {
                if (game.isNative) {
                    payable(game.playerB).transfer(prize);
                } else {
                    bool success = stackchessToken.transfer(game.playerB, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else {
            // Draw or Cancel - Refund wagers
            if (game.isNative) {
                if (wager > 0) {
                    payable(game.playerW).transfer(wager);
                    if (game.playerB != address(0)) {
                        payable(game.playerB).transfer(wager);
                    }
                }
            } else {
                if (wager > 0) {
                    bool curSuccess = stackchessToken.transfer(game.playerW, wager);
                    if (!curSuccess) revert TransferFailed();

                    if (game.playerB != address(0)) {
                        bool successB = stackchessToken.transfer(game.playerB, wager);
                        if (!successB) revert TransferFailed();
                    }
                }
            }
        }

        game.status = newStatus;
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getLastGameId() external view returns (uint256) {
        return nextGameId - 1;
    }
}
