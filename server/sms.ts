import { formatBookSms } from '../src/shared/lib/sms.ts'

const apiKey =
  process.env.SMSPILOT_API_KEY ??
  'XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ'

export async function sendSms(phone: string, text: string): Promise<void> {
  const url = new URL('https://smspilot.ru/api.php')
  url.searchParams.set('send', text)
  url.searchParams.set('to', phone)
  url.searchParams.set('apikey', apiKey)
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  const body = await response.text()

  console.info('[SMSPilot]', {
    to: phone,
    text,
    status: response.status,
    body,
  })
}

export function buildBookSms(authorNames: string[]): string {
  return formatBookSms(authorNames)
}
