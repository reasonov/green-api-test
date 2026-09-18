export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return digits
  }

  if (digits.length === 10) {
    return `7${digits}`
  }

  return null
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) !== null
}
