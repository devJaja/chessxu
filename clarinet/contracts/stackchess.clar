;; Stackchess Smart Contract - Pure State Machine Option
;; Manages game state, STX wagers, and turn-taking for on-chain chess

;; Constants
(define-constant contract-owner tx-sender)

;; Error Codes
(define-constant err-not-owner (err u100))
(define-constant err-game-exists (err u101))
(define-constant err-game-not-found (err u102))
(define-constant err-not-waiting (err u103))
(define-constant err-already-joined (err u104))
(define-constant err-invalid-wager (err u105))
(define-constant err-not-player (err u106))
(define-constant err-not-your-turn (err u107))
(define-constant err-game-not-active (err u108))
(define-constant err-invalid-status (err u109))

;; Game Status Map: 
;; 0 = Waiting, 1 = Ongoing, 2 = White Wins, 3 = Black Wins, 4 = Draw, 5 = Cancelled

;; Data Variables
(define-data-var next-game-id uint u1)

;; Maps
(define-map games
    { game-id: uint }
    {
        player-w: principal,
        player-b: (optional principal),
        wager: uint,
        board-state: (string-ascii 128),
        turn: (string-ascii 1), ;; "w" or "b"
        status: uint
    }
)

;; 
;; Public Functions
;;

;; @desc Create a new game with a wager
;; @param wager: STX amount to lock in (matched by opponent)
(define-public (create-game (wager uint))
    (let
        (
            (game-id (var-get next-game-id))
        )
        (begin
            ;; Escrow wager
            (if (> wager u0)
                (try! (stx-transfer? wager tx-sender (as-contract tx-sender)))
                true
            )
            
            ;; Save game state
            (map-set games
                { game-id: game-id }
                {
                    player-w: tx-sender,
                    player-b: none,
                    wager: wager,
                    board-state: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
                    turn: "w",
                    status: u0
                }
            )
            
            ;; Increment ID
            (var-set next-game-id (+ game-id u1))
            (ok game-id)
        )
    )
)

;; @desc Join an existing waiting game
;; @param game-id: The game to join
(define-public (join-game (game-id uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (wager (get wager game))
        )
        (begin
            (asserts! (is-eq (get status game) u0) err-not-waiting)
            (asserts! (not (is-eq tx-sender (get player-w game))) err-already-joined)
            
            ;; P2 must match the wager
            (if (> wager u0)
                (try! (stx-transfer? wager tx-sender (as-contract tx-sender)))
                true
            )
            
            ;; Update game state
            (ok (map-set games
                { game-id: game-id }
                (merge game { player-b: (some tx-sender), status: u1 })
            ))
        )
    )
)

;; @desc Submit a move to update the board state
(define-public (submit-move (game-id uint) (move-str (string-ascii 10)) (new-board-state (string-ascii 128)))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2 (unwrap! (get player-b game) err-not-waiting))
            (current-turn (get turn game))
        )
        (begin
            (asserts! (is-eq (get status game) u1) err-game-not-active)
            
            ;; Verify the caller is the active player
            (if (is-eq current-turn "w")
                (asserts! (is-eq tx-sender p1) err-not-your-turn)
                (asserts! (is-eq tx-sender p2) err-not-your-turn)
            )
            
            ;; Record the new board and switch turns
            (ok (map-set games
                { game-id: game-id }
                (merge game { 
                    board-state: new-board-state, 
                    turn: (if (is-eq current-turn "w") "b" "w") 
                })
            ))
        )
    )
)

;; @desc Player resigns, other player wins the wager
(define-public (resign (game-id uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2 (unwrap! (get player-b game) err-game-not-active))
            (wager (get wager game))
            (prize (* wager u2))
        )
        (begin
            (asserts! (is-eq (get status game) u1) err-game-not-active)
            (asserts! (or (is-eq tx-sender p1) (is-eq tx-sender p2)) err-not-player)
            
            ;; Distribute prize
            (if (is-eq tx-sender p1)
                (begin ;; P1 resigned, P2 wins
                    (if (> prize u0)
                        (try! (as-contract (stx-transfer? prize tx-sender p2)))
                        true
                    )
                    (map-set games { game-id: game-id } (merge game { status: u3 }))
                )
                (begin ;; P2 resigned, P1 wins
                    (if (> prize u0)
                        (try! (as-contract (stx-transfer? prize tx-sender p1)))
                        true
                    )
                    (map-set games { game-id: game-id } (merge game { status: u2 }))
                )
            )
            
            (ok true)
        )
    )
)

;; @desc Oracle resolution for checkmates, timeouts, or disputes
(define-public (resolve-game (game-id uint) (new-status uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2-opt (get player-b game))
            (wager (get wager game))
            (prize (* wager u2))
        )
        (begin
            (asserts! (is-eq tx-sender contract-owner) err-not-owner)
            (asserts! (or (is-eq (get status game) u1) (is-eq (get status game) u0)) err-game-not-active)
            (asserts! (and (>= new-status u2) (<= new-status u5)) err-invalid-status)
            
            (if (is-eq new-status u2)
                ;; White wins
                (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p1))) true)
                
                (if (is-eq new-status u3)
                    ;; Black wins
                    (match p2-opt p2 (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p2))) true) true)
                    
                    ;; Draw or Cancel - Refund wagers
                    (begin
                        (if (> wager u0) (try! (as-contract (stx-transfer? wager tx-sender p1))) true)
                        (match p2-opt p2 (if (> wager u0) (try! (as-contract (stx-transfer? wager tx-sender p2))) true) true)
                    )
                )
            )
            
            (ok (map-set games { game-id: game-id } (merge game { status: new-status })))
        )
    )
)

;; Read-Only Functions

(define-read-only (get-game (game-id uint))
    (map-get? games { game-id: game-id })
)

(define-read-only (get-last-game-id)
    (- (var-get next-game-id) u1)
)
