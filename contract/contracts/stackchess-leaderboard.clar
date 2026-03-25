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

