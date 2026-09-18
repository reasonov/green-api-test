export type ErrorItem = {
  field?: string
  message: string
}

export class HttpError extends Error {
  readonly status: number
  readonly errors: ErrorItem[]

  constructor(status: number, errors: ErrorItem[]) {
    super(errors[0]?.message ?? 'Ошибка запроса')
    this.name = 'HttpError'
    this.status = status
    this.errors = errors
  }
}

export function toFieldMap(error: HttpError): Record<string, string> {
  const map: Record<string, string> = {}

  for (const item of error.errors) {
    if (item.field && !(item.field in map)) {
      map[item.field] = item.message
    }
  }

  return map
}

type SetError = (
  name: string,
  error: { type: string; message: string },
) => void

export function applyApiErrors(error: unknown, setError: SetError): void {
  if (!(error instanceof HttpError)) {
    setError('root', {
      type: 'server',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    })
    return
  }

  const fields = toFieldMap(error)

  for (const [field, message] of Object.entries(fields)) {
    setError(field, { type: 'server', message })
  }

  if (Object.keys(fields).length === 0) {
    setError('root', { type: 'server', message: error.message })
  }
}

export function parseErrorBody(payload: unknown): ErrorItem[] {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('errors' in payload) ||
    !Array.isArray(payload.errors)
  ) {
    return [{ message: 'Ошибка запроса' }]
  }

  const items: ErrorItem[] = []

  for (const item of payload.errors) {
    if (!item || typeof item !== 'object' || !('message' in item)) {
      continue
    }

    const message = item.message
    if (typeof message !== 'string') {
      continue
    }

    const field =
      'field' in item && typeof item.field === 'string' ? item.field : undefined

    items.push({ field, message })
  }

  return items.length > 0 ? items : [{ message: 'Ошибка запроса' }]
}
