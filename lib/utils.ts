import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yy')
  } catch {
    return dateStr
  }
}

export function getSubscriptionEndDate(plan: 'monthly' | 'yearly'): Date {
  const now = new Date()
  if (plan === 'monthly') {
    return new Date(now.setMonth(now.getMonth() + 1))
  }
  return new Date(now.setFullYear(now.getFullYear() + 1))
}

export function isSubscriptionActive(endDate: string): boolean {
  return new Date(endDate) > new Date()
}

export function getStablefordLabel(score: number): string {
  if (score <= 0) return 'No score'
  if (score <= 15) return 'Beginner'
  if (score <= 25) return 'Casual'
  if (score <= 35) return 'Intermediate'
  return 'Advanced'
}
