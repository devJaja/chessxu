;; Chessxu Token (CHESS)
;; SIP-010 Compliant Fungible Token

(impl-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token chessxu-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

;; Token Information
(define-read-only (get-name)
    (ok "Chessxu Token")
)

(define-read-only (get-symbol)
    (ok "CHESS")
)

(define-read-only (get-decimals)
    (ok u6)
)

(define-read-only (get-balance (account principal))
    (ok (ft-get-balance chessxu-token account))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply chessxu-token))
)

(define-read-only (get-token-uri)
    (ok none)
)

;; Transfer the token
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? chessxu-token amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;; Minting function for initial distribution (Owner only)
(define-public (mint (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ft-mint? chessxu-token amount recipient)
    )
)
