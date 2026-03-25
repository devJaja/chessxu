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

