import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trophy, Medal, Timer } from 'lucide-react';
import { db } from '../db/db';
import { Modal } from '../components/ui/Modal';
import { CompetitorForm } from '../components/competitors/CompetitorForm';

export const Competitors = () => {
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const allRaces = useLiveQuery(() => db.races.toArray());

    const competitorsData = useLiveQuery(
        () => db.competitors
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .reverse()
            .toArray(),
        [searchQuery]
    );

    // Compute dynamic stats
    const competitors = competitorsData?.map(c => {
        const cRaces = allRaces?.filter(r => r.competitorId === c.id && r.totalTime) || [];
        const totalRaces = cRaces.length;

        // Calculate podiums and best position requires knowing the rank within each event
        // This is a bit heavy but accurate. simpler approach: check if we stored rank in race? 
        // In db.ts Race has 'rank'. We need to ensure rank is populated when race finishes or event finishes.
        // Assuming 'rank' in Race might not be reliable if not strictly maintained.
        // Let's recalculate ranks for events belonging to this competitor's races.

        let podiums = 0;
        let bestPosition = 999;

        cRaces.forEach(race => {
            // Find all races for this event to determine rank
            const eventRaces = allRaces?.filter(r => r.eventId === race.eventId && r.totalTime) || [];
            eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
            const rank = eventRaces.findIndex(r => r.id === race.id) + 1;

            if (rank > 0) {
                if (rank <= 3) podiums++;
                if (rank < bestPosition) bestPosition = rank;
            }
        });

        return {
            ...c,
            totalRaces,
            podiums,
            bestPosition: bestPosition === 999 ? undefined : bestPosition
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Concurrents
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Gérez la liste de vos athlètes
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter un concurrent
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher un concurrent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitors?.map(competitor => (
                    <div
                        key={competitor.id}
                        onClick={() => navigate(`/competitors/${competitor.id}`)}
                        className="group glass-panel p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {competitor.name}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    ID: #{competitor.id}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                <Trophy className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                                    <Medal className="w-3 h-3" /> Courses
                                </p>
                                <p className="font-semibold text-slate-200">{competitor.totalRaces}</p>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                                    <Trophy className="w-3 h-3" /> Podiums
                                </p>
                                <p className="font-semibold text-yellow-500">{competitor.podiums}</p>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                                    <Timer className="w-3 h-3" /> Best
                                </p>
                                <p className="font-semibold text-emerald-400">
                                    {competitor.bestPosition ? `#${competitor.bestPosition}` : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {competitors?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-white/5">
                        <p>Aucun concurrent trouvé.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Ajouter un concurrent"
            >
                <CompetitorForm
                    onSuccess={() => setIsAddModalOpen(false)}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
};
