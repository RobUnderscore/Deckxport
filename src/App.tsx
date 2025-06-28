import { Routes, Route } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Deckxport</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Your ultimate MTG deck management tool
      </p>
      <Button size="lg">Get Started</Button>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App