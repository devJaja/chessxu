import { DEFAULT_ELO, ELO_K_FACTOR } from '../blockchainConstants';

/**
 * Mirrors the on-chain ELO calculation for client-side preview.
 * Uses the same integer approximation as the Clarity contract.
 */

export function expectedScore(eloA, eloB) {
  return (eloA * 1000) / (eloA + eloB);
}

export function winDelta(winnerElo, loserElo) {
  const expected = expectedScore(winnerElo, loserElo);
  return Math.floor((ELO_K_FACTOR * (1000 - expected)) / 1000);
}

export function lossDelta(winnerElo, loserElo) {
  const expected = expectedScore(loserElo, winnerElo);
  return Math.floor((ELO_K_FACTOR * expected) / 1000);
}

/**
 * Returns projected ELOs after a win/loss result.
 * @param {number} winnerElo
 * @param {number} loserElo
 * @returns {{ newWinnerElo: number, newLoserElo: number }}
 */
export function projectEloAfterWin(winnerElo = DEFAULT_ELO, loserElo = DEFAULT_ELO) {
  return {
    newWinnerElo: winnerElo + winDelta(winnerElo, loserElo),
    newLoserElo: Math.max(0, loserElo - lossDelta(winnerElo, loserElo)),
  };
}

/**
 * Returns win probability as a percentage (0–100).
 */
export function winProbabilityPercent(eloA, eloB) {
  return Math.round(expectedScore(eloA, eloB) / 10);
}
