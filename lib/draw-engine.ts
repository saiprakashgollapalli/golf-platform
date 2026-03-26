import { DrawEntry, DrawResult, PRIZE_DISTRIBUTION } from './types'

/**
 * Generate 5 random winning numbers between 1-45 (Stableford range)
 */
export function generateRandomNumbers(): number[] {
  const nums: number[] = []
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!nums.includes(n)) nums.push(n)
  }
  return nums.sort((a, b) => a - b)
}

/**
 * Generate algorithmic numbers weighted by frequency across all entries.
 * "least frequent" variant picks numbers users score less often.
 */
export function generateAlgorithmicNumbers(
  entries: DrawEntry[],
  variant: 'most' | 'least' = 'most'
): number[] {
  const freq: Record<number, number> = {}

  for (let i = 1; i <= 45; i++) freq[i] = 0

  for (const entry of entries) {
    for (const n of entry.entry_numbers) {
      if (n >= 1 && n <= 45) freq[n] = (freq[n] || 0) + 1
    }
  }

  const sorted = Object.entries(freq)
    .map(([n, count]) => ({ n: parseInt(n), count }))
    .sort((a, b) =>
      variant === 'most' ? b.count - a.count : a.count - b.count
    )

  const pool = sorted.slice(0, 15).map((x) => x.n)
  const nums: number[] = []
  const shuffled = pool.sort(() => Math.random() - 0.5)

  for (const n of shuffled) {
    if (nums.length < 5) nums.push(n)
  }

  // Fill remaining if pool was too small
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!nums.includes(n)) nums.push(n)
  }

  return nums.sort((a, b) => a - b)
}

/**
 * Calculate how many winning numbers match an entry's numbers
 */
export function countMatches(entryNumbers: number[], winningNumbers: number[]): number {
  return entryNumbers.filter((n) => winningNumbers.includes(n)).length
}

/**
 * Run draw engine — returns full result with winners per tier
 */
export function runDrawEngine(
  entries: DrawEntry[],
  winningNumbers: number[],
  prizePoolTotal: number,
  rolledOverJackpot: number = 0
): DrawResult {
  const jackpot = prizePoolTotal * PRIZE_DISTRIBUTION['5-match'] + rolledOverJackpot
  const pool4 = prizePoolTotal * PRIZE_DISTRIBUTION['4-match']
  const pool3 = prizePoolTotal * PRIZE_DISTRIBUTION['3-match']

  const winners5: DrawEntry[] = []
  const winners4: DrawEntry[] = []
  const winners3: DrawEntry[] = []

  for (const entry of entries) {
    const matches = countMatches(entry.entry_numbers, winningNumbers)
    const updated = { ...entry, match_count: matches, is_winner: matches >= 3 }

    if (matches === 5) winners5.push(updated)
    else if (matches === 4) winners4.push(updated)
    else if (matches === 3) winners3.push(updated)
  }

  return {
    winning_numbers: winningNumbers,
    winners_5match: winners5,
    winners_4match: winners4,
    winners_3match: winners3,
    prize_pool_total: prizePoolTotal,
    jackpot_amount: jackpot,
    pool_4match: pool4,
    pool_3match: pool3,
  }
}

/**
 * Calculate prize per winner in each tier (split equally)
 */
export function calculatePrizePerWinner(poolAmount: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor((poolAmount / winnerCount) * 100) / 100
}

/**
 * Calculate prize pool from subscriber count and plan amounts
 */
export function calculatePrizePool(
  monthlyCount: number,
  yearlyCount: number
): number {
  const monthlyRevenue = monthlyCount * 9.99
  const yearlyMonthlyRevenue = yearlyCount * (99.99 / 12)
  return (monthlyRevenue + yearlyMonthlyRevenue) * 0.6
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
