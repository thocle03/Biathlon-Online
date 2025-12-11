import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Competitors } from './pages/Competitors';
import { CompetitorProfile } from './pages/CompetitorProfile';
import { CompetitorRaceAnalysis } from './pages/CompetitorRaceAnalysis';
import { Events } from './pages/Events';
import { SprintEvents } from './pages/SprintEvents';
import { PursuitEvents } from './pages/PursuitEvents';
import { RelayEvents } from './pages/RelayEvents';
import { IndividualEvents } from './pages/IndividualEvents';
import { EventCreate } from './pages/EventCreate';
import { EventDashboard } from './pages/EventDashboard';
import { Race } from './pages/Race';
import { PursuitRace } from './pages/PursuitRace';
import { ManualRaceEntry } from './pages/ManualRaceEntry';
import { Stats } from './pages/Stats';
import { GeneralStats } from './pages/GeneralStats';
import { SprintStats } from './pages/SprintStats';
import { PursuitStats } from './pages/PursuitStats';
import { RelayStats } from './pages/RelayStats';
import { IndividualStats } from './pages/IndividualStats';
import { Settings } from './pages/Settings';

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
          <Route path="competitors/:id/analysis/:raceId" element={<CompetitorRaceAnalysis />} />
          <Route path="events" element={<Events />} />
          <Route path="events/sprint" element={<SprintEvents />} />
          <Route path="events/pursuit" element={<PursuitEvents />} />
          <Route path="events/relay" element={<RelayEvents />} />
          <Route path="events/individual" element={<IndividualEvents />} />
          <Route path="events/new/:type" element={<EventCreate />} />
          <Route path="events/:id" element={<EventDashboard />} />
          <Route path="race/:id" element={<Race />} />
          <Route path="race-mass/:id" element={<PursuitRace />} />
          <Route path="race/manual/:id" element={<ManualRaceEntry />} />
          <Route path="stats" element={<Stats />} />
          <Route path="stats/general" element={<GeneralStats />} />
          <Route path="stats/sprint" element={<SprintStats />} />
          <Route path="stats/pursuit" element={<PursuitStats />} />
          <Route path="stats/relay" element={<RelayStats />} />
          <Route path="stats/individual" element={<IndividualStats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
