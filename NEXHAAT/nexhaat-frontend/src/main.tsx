import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppRoutes } from '@/routes/AppRoutes'
import '@/styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              border: '1px solid #d8dfd1',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#246b45',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#a22',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)