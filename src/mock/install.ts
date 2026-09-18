import { handleMockRequest } from '@/mock/engine'

export function installBrowserMock(): void {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    const mocked = await handleMockRequest(request)
    return mocked ?? nativeFetch(request)
  }
}
