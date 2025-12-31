import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Trophy, Star, Crown } from 'lucide-react';

import { useLocation } from '../context/LocationContext';

export const GeneralStats = () => {
    const navigate = useNavigate();
    const { location } = useLocation();
    const competitors = useLiveQuery(() => db.competitors.toArray());
    const events = useLiveQuery(() => db.events.where('location').equals(location).toArray(), [location]);
    const allRaces = useLiveQuery(() => db.races.toArray());
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    if (!competitors || !events || !allRaces) return null;

    // Get all years
    const availableYears = Array.from(new Set(events.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

    const filteredEvents = selectedYear === 'all'
        ? events
        : events.filter(e => new Date(e.date).getFullYear() === selectedYear);

    // Calculate Global Standings based on filteredEvents (ALL TYPES)
    const eventRankings = new Map<number, { competitorId: number; rank: number; points: number }[]>();

    // Points system config
    const POINTS_SYSTEM = {
        0: [5, 3, 1], // Level 0 - Only top 3
        1: [10, 6, 4, 2, 1], // Level 1
        2: [20, 12, 8, 4, 2], // Level 2
        3: [50, 30, 20, 10, 5], // Level 3
        4: [100, 60, 40, 20, 10, 8, 6, 4], // Level 4 - Top 8
        5: [200, 120, 80, 40, 20, 16, 12, 8, 6, 4] // Level 5 - Top 10
    };

    filteredEvents.forEach(event => {
        const eventRaces = allRaces.filter(r => r.eventId === event.id && r.totalTime);
        eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));

        const rankings = eventRaces.map((race, idx) => {
            let rank = idx + 1;
            // Use explicit rank from DB if available (Critical for Relay)
            if (race.rank) {
                rank = race.rank;
            }

            let points = 0;
            // Relay specific point logic
            if (event.level >= 10) {
                if (event.level === 10) points = (rank === 1) ? 10 : 4;
                else if (event.level === 11) points = (rank === 1) ? 5 : 2;
                else if (event.level === 12) points = (rank === 1) ? 3 : 1;
            } else {
                // Standard logic
                const scale = POINTS_SYSTEM[event.level as keyof typeof POINTS_SYSTEM] || [];
                points = scale[rank - 1] || 0;
            }

            return { competitorId: race.competitorId, rank, points };
        });

        eventRankings.set(event.id!, rankings);
    });

    // Aggregate
    const getWinPriority = (level: number) => {
        if (level === 5) return 6;
        if (level === 4) return 5;
        if (level === 3) return 4;
        if (level === 2) return 3;
        if (level === 1 || level === 10) return 2;
        if (level === 0 || level === 11) return 1;
        if (level === 12) return 0;
        return -1;
    };

    const eventMap = new Map(filteredEvents.map(e => [e.id, e]));

    const competitorStats = competitors.map(c => {
        let totalPoints = 0;
        let wins = 0;
        let podiums = 0;
        let racesCount = 0;
        const winsByPriority = [0, 0, 0, 0, 0, 0, 0];

        eventRankings.forEach((rankings, eventId) => {
            const event = eventMap.get(eventId);
            if (!event) return;

            const perf = rankings.find(r => r.competitorId === c.id);
            if (perf) {
                totalPoints += perf.points;
                racesCount++;
                if (perf.rank === 1) {
                    wins++;
                    const level = event.level ?? 0;
                    const p = getWinPriority(level);
                    if (p >= 0 && p < 7) winsByPriority[p]++;
                }
                if (perf.rank <= 3) podiums++;
            }
        });

        return { ...c, totalPoints, wins, podiums, racesCount, winsByPriority };
    }).filter(c => c.totalPoints > 0 || c.racesCount > 0);

    // Sort by points
    competitorStats.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

        for (let i = 6; i >= 0; i--) {
            if (b.winsByPriority[i] !== a.winsByPriority[i]) {
                return b.winsByPriority[i] - a.winsByPriority[i];
            }
        }

        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.podiums !== a.podiums) return b.podiums - a.podiums;
        return a.name.localeCompare(b.name);
    });

    // Top 3
    const top3 = competitorStats.slice(0, 3);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500 flex items-center gap-3">
                        <Crown className="w-10 h-10 text-yellow-500" />
                        Classement Général
                    </h1>
                    <p className="text-slate-400 mt-2">Toutes spécialités confondues</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
                    <button
                        onClick={() => setSelectedYear('all')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedYear === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Global
                    </button>
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedYear === year ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {competitorStats.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center">
                    <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucune statistique</h3>
                    <p className="text-slate-500">Aucun événement pour cette période</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {top3.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 2nd Place */}
                            {top3[1] && (
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-slate-400 hover:scale-105 transition-transform cursor-pointer order-1 md:order-1" onClick={() => navigate(`/competitors/${top3[1].id}`)}>
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-slate-400/20 flex items-center justify-center mb-4">
                                            <span className="text-4xl font-black text-slate-400">2</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{top3[1].name}</h3>
                                        <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-300 to-slate-500 mb-4">
                                            {top3[1].totalPoints}
                                        </div>
                                        <div className="flex justify-center gap-4 text-sm">
                                            <div>
                                                <div className="text-slate-400">Victoires</div>
                                                <div className="text-xl font-bold text-emerald-400">{top3[1].wins}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Podiums</div>
                                                <div className="text-xl font-bold text-blue-400">{top3[1].podiums}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {top3[0] && (
                                <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-yellow-500 hover:scale-105 transition-transform cursor-pointer order-0 md:order-2 relative overflow-hidden" onClick={() => navigate(`/competitors/${top3[0].id}`)}>
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full -mr-20 -mt-20" />
                                    <div className="text-center relative">
                                        <Crown className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                                        <div className="w-24 h-24 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 ring-4 ring-yellow-500/30">
                                            <span className="text-5xl font-black text-yellow-500">1</span>
                                        </div>
                                        <h3 className="text-3xl font-bold mb-2">{top3[0].name}</h3>
                                        <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500 mb-4">
                                            {top3[0].totalPoints}
                                        </div>
                                        <div className="flex justify-center gap-6 text-sm">
                                            <div>
                                                <div className="text-slate-400">Victoires</div>
                                                <div className="text-2xl font-bold text-emerald-400">{top3[0].wins}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Podiums</div>
                                                <div className="text-2xl font-bold text-blue-400">{top3[0].podiums}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {top3[2] && (
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-amber-700 hover:scale-105 transition-transform cursor-pointer order-2 md:order-3" onClick={() => navigate(`/competitors/${top3[2].id}`)}>
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-700/20 flex items-center justify-center mb-4">
                                            <span className="text-4xl font-black text-amber-700">3</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{top3[2].name}</h3>
                                        <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800 mb-4">
                                            {top3[2].totalPoints}
                                        </div>
                                        <div className="flex justify-center gap-4 text-sm">
                                            <div>
                                                <div className="text-slate-400">Victoires</div>
                                                <div className="text-xl font-bold text-emerald-400">{top3[2].wins}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Podiums</div>
                                                <div className="text-xl font-bold text-blue-400">{top3[2].podiums}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Rankings Table */}
                    <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Star className="w-6 h-6 text-blue-500" />
                            Classement Complet
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-white/10">
                                    <tr className="text-left text-slate-400 text-sm">
                                        <th className="pb-3 font-medium">Rang</th>
                                        <th className="pb-3 font-medium">Concurrent</th>
                                        <th className="pb-3 font-medium text-center">Courses</th>
                                        <th className="pb-3 font-medium text-center">Victoires</th>
                                        <th className="pb-3 font-medium text-center">Podiums</th>
                                        <th className="pb-3 font-medium text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {competitorStats.map((c, idx) => (
                                        <tr key={c.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/competitors/${c.id}`)}>
                                            <td className="py-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 text-lg' : idx === 1 ? 'bg-slate-400/20 text-slate-400' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="font-semibold text-lg">{c.name}</div>
                                            </td>
                                            <td className="py-4 text-center text-slate-300">{c.racesCount}</td>
                                            <td className="py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                                    {c.wins}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                                                    {c.podiums}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                                                    {c.totalPoints}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
