// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function getRarityLabel(rarity: string): string {
  return rarity.charAt(0) + rarity.slice(1).toLowerCase()
}

export function getPokemonTypeColor(type: string): string {
  const colors: Record<string, string> = {
    FIRE: '#FF6B35',
    WATER: '#4B9EFF',
    GRASS: '#4CAF50',
    ELECTRIC: '#FFD700',
    PSYCHIC: '#FF69B4',
    ICE: '#87CEEB',
    FIGHTING: '#D2691E',
    POISON: '#9B59B6',
    GROUND: '#D4A017',
    FLYING: '#87CEEB',
    BUG: '#8BC34A',
    ROCK: '#9E9E9E',
    GHOST: '#673AB7',
    DRAGON: '#3F51B5',
    DARK: '#424242',
    STEEL: '#90A4AE',
    FAIRY: '#F48FB1',
    NORMAL: '#BDBDBD',
  }
  return colors[type] ?? '#BDBDBD'
}

export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    STARTER: 'Starter',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    ELITE: 'Elite',
    LEGENDARY: 'Legendary',
  }
  return labels[tier] ?? tier
}
