import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import LanguageContextProvider from './context/LanguageContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <LanguageContextProvider>
    <App />
  </LanguageContextProvider>
  </BrowserRouter>,
)
