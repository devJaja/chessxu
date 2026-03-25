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

