import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { installBrowserMock } from '@/mock/install'
import '@/app/styles/global.css'

if (import.meta.env.VITE_USE_MOCK === 'true') {
  installBrowserMock()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
