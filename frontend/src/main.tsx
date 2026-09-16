import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="QueryBox encountered an unexpected error">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

