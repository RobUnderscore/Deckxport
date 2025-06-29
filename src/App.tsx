import { Routes, Route } from 'react-router-dom';
import DeckTableWithImport from '@/pages/DeckTableWithImport';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DeckTableWithImport />} />
    </Routes>
  );
}

export default App;