export function formatBookSms(authorNames: string[]): string {
  const unique = [...new Set(authorNames.filter(Boolean))]

  if (unique.length === 0) {
    return 'В каталоге появилась новая книга'
  }

  if (unique.length === 1) {
    return `Новая книга автора ${unique[0]}`
  }

  return `Новая книга авторов ${unique.join(', ')}`
}
