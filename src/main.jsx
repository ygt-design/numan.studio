import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { GlobalStyle } from './styles.js'
import { LoadingProvider } from './contexts/LoadingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <GlobalStyle />
        <App />
      </LoadingProvider>
    </BrowserRouter>
  </StrictMode>,
)
