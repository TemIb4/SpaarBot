import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Импортируем провайдеры (убедись, что эти файлы существуют!)
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

// Простой компонент для отлова ошибок (Error Boundary)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(_error: any, _errorInfo: any) {
    // Error is already logged in getDerivedStateFromError
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#000', color: 'red', minHeight: '100vh' }}>
          <h1>Critical Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* Важно: basename="/app" указывает роутеру, что мы находимся в папке /app */}
      <BrowserRouter basename="/app">
        <LanguageProvider>
          <ThemeProvider>
             <App />
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)