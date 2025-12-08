import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Competitors } from './pages/Competitors';
import { CompetitorProfile } from './pages/CompetitorProfile';
import { Events } from './pages/Events';
import { EventCreate } from './pages/EventCreate';
import { EventDashboard } from './pages/EventDashboard';
import { Race } from './pages/Race';
import { ManualRaceEntry } from './pages/ManualRaceEntry';
import { Stats } from './pages/Stats';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="competitors" element={<Competitors />} />
          <Route path="competitors/:id" element={<CompetitorProfile />} />
          <Route path="events" element={<Events />} />
          <Route path="events/new" element={<EventCreate />} />
          <Route path="events/:id" element={<EventDashboard />} />
          <Route path="race/:id" element={<Race />} />
          <Route path="race/manual/:id" element={<ManualRaceEntry />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<div>Settings (WIP)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
