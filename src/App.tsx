import { Routes, Route } from 'react-router-dom';
import DeckAggregateImport from '@/pages/DeckAggregateImport';
import { DeckEvaluationDemo } from '@/pages/DeckEvaluationDemo';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DeckAggregateImport />} />
      <Route path="/evaluate" element={<DeckEvaluationDemo />} />
      <Route path="/evaluate/:deckId" element={<DeckEvaluationDemo />} />
    </Routes>
  );
}

export default App;