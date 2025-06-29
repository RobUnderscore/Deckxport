import { Routes, Route } from 'react-router-dom'
import { DeckImporter } from '@/components/DeckImporter'

function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Deckxport</h1>
          <p className="text-xl text-muted-foreground">
            Import your Moxfield deck and view all cards
          </p>
        </div>
        
        <DeckImporter />
      </div>
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