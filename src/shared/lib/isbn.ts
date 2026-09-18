function isbn10Valid(normalized: string): boolean {
  let sum = 0

  for (let index = 0; index < 9; index += 1) {
    sum += (10 - index) * Number(normalized[index])
  }

  const check = normalized[9] === 'X' ? 10 : Number(normalized[9])
  return (sum + check) % 11 === 0
}

function isbn13Valid(normalized: string): boolean {
  let sum = 0

  for (let index = 0; index < 13; index += 1) {
    sum += Number(normalized[index]) * (index % 2 === 0 ? 1 : 3)
  }

  return sum % 10 === 0
}

export function isValidIsbn(value: string): boolean {
  const normalized = value.replace(/[-\s]/g, '').toUpperCase()

  if (/^\d{9}[\dX]$/.test(normalized)) {
    return isbn10Valid(normalized)
  }

  if (/^\d{13}$/.test(normalized)) {
    return isbn13Valid(normalized)
  }

  return false
}
