import { useState, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState('dark')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  // Toggle theme function (you can use this later if you want to add a theme toggle)
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('chat-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
      <div className="App app-fade-in" data-theme={theme}>
        {/* You can add a theme toggle button here if needed */}
        {/*
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      */}

        <ChatInterface />
      </div>
  )
}