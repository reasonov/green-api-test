import { handleMockRequest } from '@/mock/engine'

let installed = false

export function installBrowserMock(): void {
  if (installed) {
    return
  }
  installed = true
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const mocked = await handleMockRequest(request)
    return mocked ?? nativeFetch(request)
  }
}

if (import.meta.env.VITE_USE_MOCK === 'true') {
  installBrowserMock()
}
