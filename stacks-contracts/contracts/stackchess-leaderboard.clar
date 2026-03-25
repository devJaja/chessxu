;; stackchess-leaderboard.clar
;; On-chain leaderboard for the Stackchess game
;; Tracks wins, losses, draws, and ELO ratings for each player

;; Contract owner (deployer)
(define-constant contract-owner tx-sender)

;; Authorized caller - the main stackchess game contract
(define-constant stackchess-contract .stackchess)

;; Error codes
(define-constant err-not-authorized     (err u100))
(define-constant err-player-not-found   (err u101))
(define-constant err-invalid-result     (err u102))
(define-constant err-same-player        (err u103))

;; ===========================
;; Data Maps
;; ===========================

;; Per-player statistics
(define-map player-stats
    { player: principal }
    {
        wins:         uint,
        losses:       uint,
        draws:        uint,
        total-games:  uint,
        elo:          uint,    ;; ELO rating (starts at 1200)
        streak:       uint,    ;; current win streak
        best-streak:  uint     ;; all-time best win streak
    }
)

;; ===========================
;; Global Data Variables
;; ===========================

(define-data-var total-games-played uint u0)
(define-data-var total-decisive-games uint u0)  ;; wins + losses (not draws)
(define-data-var total-players-registered uint u0)
(define-data-var default-elo uint u1200)        ;; starting ELO for new players

;; ===========================
;; ELO Rating Engine
;; ===========================

;; K-factor controls how much ELO shifts per game
;; Higher K = bigger swings. K=32 is standard for new players.
(define-constant elo-k-factor u32)
(define-constant elo-scale    u400)   ;; standard ELO scale divisor

;; Compute expected score for player-a given ratings a and b
;; Expected = 1 / (1 + 10^((b-a)/400))
;; On-chain integer approximation: we use (a*1000) / (a + b) pattern
(define-private (expected-score-times-1000 (elo-a uint) (elo-b uint))
    ;; Returns a value in [0..1000] representing the win probability * 1000
    ;; Simplified: expected = elo-a / (elo-a + elo-b) scaled to "out of 2400"
    (/ (* elo-a u1000) (+ elo-a elo-b))
)

;; Returns the ELO delta for a winner given both ratings
;; delta = K * (1 - expected)  (for winner)
(define-private (elo-win-delta (winner-elo uint) (loser-elo uint))
    (let ((expected (expected-score-times-1000 winner-elo loser-elo)))
        ;; delta = K * (1000 - expected) / 1000
        (/ (* elo-k-factor (- u1000 expected)) u1000)
    )
)

;; Returns the ELO delta that the loser loses
(define-private (elo-loss-delta (winner-elo uint) (loser-elo uint))
    (let ((expected (expected-score-times-1000 loser-elo winner-elo)))
        ;; delta = K * expected / 1000
        (/ (* elo-k-factor expected) u1000)
    )
)

;; ===========================
;; Private Helpers
;; ===========================

;; Initializes a new player entry with default stats if they don't exist yet
(define-private (ensure-player-exists (player principal))
    (match (map-get? player-stats { player: player })
        existing-stats true  ;; already exists, no-op
        ;; New player - register with defaults
        (begin
            (map-set player-stats { player: player }
                {
                    wins:         u0,
                    losses:       u0,
                    draws:        u0,
                    total-games:  u0,
                    elo:          (var-get default-elo),
                    streak:       u0,
                    best-streak:  u0
                }
            )
            (var-set total-players-registered (+ (var-get total-players-registered) u1))
            true
        )
    )
)

;; ===========================
;; Public Match Recording
;; ===========================

;; Record a win/loss result. Can only be called by the stackchess game contract.
(define-public (record-win (winner principal) (loser principal))
    (let (
        (winner-inited (ensure-player-exists winner))
        (loser-inited (ensure-player-exists loser))
        (w-stats (unwrap! (map-get? player-stats { player: winner }) err-player-not-found))
        (l-stats (unwrap! (map-get? player-stats { player: loser }) err-player-not-found))
        (w-elo (get elo w-stats))
        (l-elo (get elo l-stats))
        (w-streak (+ (get streak w-stats) u1))
        (w-best-streak (if (> w-streak (get best-streak w-stats)) w-streak (get best-streak w-stats)))
    )
        ;; Enforce authorization (only the game contract can report results)
        (asserts! (is-eq contract-caller stackchess-contract) err-not-authorized)
        (asserts! (not (is-eq winner loser)) err-same-player)

        ;; Update winner
        (map-set player-stats { player: winner }
            (merge w-stats {
                wins: (+ (get wins w-stats) u1),
                total-games: (+ (get total-games w-stats) u1),
                elo: (+ w-elo (elo-win-delta w-elo l-elo)),
                streak: w-streak,
                best-streak: w-best-streak
            })
        )

        ;; Update loser
        (map-set player-stats { player: loser }
            (merge l-stats {
                losses: (+ (get losses l-stats) u1),
                total-games: (+ (get total-games l-stats) u1),
                elo: (- l-elo (elo-loss-delta w-elo l-elo)),
                streak: u0
            })
        )

        ;; Update global stats
        (var-set total-games-played (+ (var-get total-games-played) u1))
        (var-set total-decisive-games (+ (var-get total-decisive-games) u1))

        (ok true)
    )
)

;; Record a draw result. No ELO change, just bumps total games and draw counters.
(define-public (record-draw (player-a principal) (player-b principal))
    (let (
        (a-inited (ensure-player-exists player-a))
        (b-inited (ensure-player-exists player-b))
        (a-stats (unwrap! (map-get? player-stats { player: player-a }) err-player-not-found))
        (b-stats (unwrap! (map-get? player-stats { player: player-b }) err-player-not-found))
    )
        ;; Enforce authorization
        (asserts! (is-eq contract-caller stackchess-contract) err-not-authorized)
        (asserts! (not (is-eq player-a player-b)) err-same-player)

        ;; Update Player A
        (map-set player-stats { player: player-a }
            (merge a-stats {
                draws: (+ (get draws a-stats) u1),
                total-games: (+ (get total-games a-stats) u1),
                streak: u0  ;; Draw resets win streak
            })
        )

        ;; Update Player B
        (map-set player-stats { player: player-b }
            (merge b-stats {
                draws: (+ (get draws b-stats) u1),
                total-games: (+ (get total-games b-stats) u1),
                streak: u0
            })
        )

        ;; Update global stats
        (var-set total-games-played (+ (var-get total-games-played) u1))

        (ok true)
    )
)

;; ===========================
;; Read-Only Queries
;; ===========================

;; Get full stats for a specific player
(define-read-only (get-player-stats (player principal))
    (map-get? player-stats { player: player })
)

;; Get only the ELO rating for a specific player (defaults to 1200 if not found)
(define-read-only (get-player-elo (player principal))
    (match (map-get? player-stats { player: player })
        stats (get elo stats)
        (var-get default-elo)
    )
)

;; Get global platform statistics
(define-read-only (get-global-stats)
    {
        total-games: (var-get total-games-played),
        total-decisive: (var-get total-decisive-games),
        total-players: (var-get total-players-registered)
    }
)

;; Get expected win probability (returns 0-1000 where 1000 = 100% win chance)
;; Useful for frontend UI to show "Expected Score" or "Risk/Reward"
(define-read-only (get-expected-score (player-a principal) (player-b principal))
    (let (
        (elo-a (get-player-elo player-a))
        (elo-b (get-player-elo player-b))
    )
        (expected-score-times-1000 elo-a elo-b)
    )
)

;; ===========================
;; Admin Functions
;; ===========================

;; Allows the contract owner to pre-seed or correct a player's ELO
(define-public (admin-set-elo (player principal) (new-elo uint))
    (let (
        (inited (ensure-player-exists player))
        (stats (unwrap! (map-get? player-stats { player: player }) err-player-not-found))
    )
        (asserts! (is-eq contract-caller contract-owner) err-not-authorized)
        
        (map-set player-stats { player: player }
            (merge stats { elo: new-elo })
        )
        (ok true)
    )
)
