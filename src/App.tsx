import { Routes, Route } from 'react-router-dom';
import DeckAggregateImport from '@/pages/DeckAggregateImport';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DeckAggregateImport />} />
    </Routes>
  );
}

export default App;