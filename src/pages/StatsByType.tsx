import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RaceMode } from '../db/db';
import { Trophy, Star, Timer, Target } from 'lucide-react';

import { useLocation } from '../context/LocationContext';

interface StatsByTypeProps {
    type: RaceMode;
    title: string;
}

export const StatsByType = ({ type, title }: StatsByTypeProps) => {
    const navigate = useNavigate();
    const { location } = useLocation();
    const competitors = useLiveQuery(() => db.competitors.toArray());
    const events = useLiveQuery(() => db.events.where('location').equals(location).toArray(), [location]);
    const allRaces = useLiveQuery(() => db.races.toArray());
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    if (!competitors || !events || !allRaces) return null;

    // Filter events by type
    const typeEvents = events.filter(e => e.type === type || (!e.type && type === 'sprint'));
    const availableYears = Array.from(new Set(typeEvents.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

    const filteredEvents = selectedYear === 'all'
        ? typeEvents
        : typeEvents.filter(e => new Date(e.date).getFullYear() === selectedYear);

    // Calculate Global Standings based on filteredEvents
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

        // For non-relay, we sort by time to determine rank if not set
        if (event.type !== 'relay') {
            eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
        }

        const rankings = eventRaces.map((race, idx) => {
            let rank = idx + 1;
            // Use explicit rank from DB if available (Critical for Relay where multiple people have rank 1)
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
                // If using explicit rank, map rank 1 to index 0
                points = scale[rank - 1] || 0;
            }

            return { competitorId: race.competitorId, rank, points };
        });

        eventRankings.set(event.id!, rankings);
    });

    // Aggregate
    const competitorStats = competitors.map(c => {
        let totalPoints = 0;
        let wins = 0;
        let podiums = 0;
        let racesCount = 0;

        eventRankings.forEach(rankings => {
            const perf = rankings.find(r => r.competitorId === c.id);
            if (perf) {
                totalPoints += perf.points;
                racesCount++;
                if (perf.rank === 1) wins++;
                if (perf.rank <= 3) podiums++;
            }
        });

        return { ...c, totalPoints, wins, podiums, racesCount };
    }).filter(c => c.totalPoints > 0 || c.racesCount > 0);

    // Sort by points
    competitorStats.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.podiums !== a.podiums) return b.podiums - a.podiums;
        return a.name.localeCompare(b.name);
    });

    // Filter races for best times/shooters
    const filteredEventIds = filteredEvents.map(e => e.id);
    const currentPeriodRaces = allRaces.filter(r => filteredEventIds.includes(r.eventId));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                    {title} - {selectedYear === 'all' ? 'Général' : selectedYear}
                </h1>

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
                    <p className="text-slate-500">Aucun événement {title.toLowerCase()} pour cette période</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Best Times & Shooters - HIDE FOR RELAY */}
                    {type !== 'relay' && (
                        <div className="lg:col-span-1 space-y-6">
                            {/* Best Times */}
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-emerald-500" />
                                    Meilleurs Temps
                                </h2>
                                <div className="space-y-3">
                                    {currentPeriodRaces
                                        .filter(r => r.totalTime)
                                        .sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0))
                                        .slice(0, 5)
                                        .map((race, idx) => {
                                            const competitor = competitors.find(c => c.id === race.competitorId);
                                            return (
                                                <div key={race.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/competitors/${competitor?.id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-slate-400/20 text-slate-400' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-slate-400'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className="font-medium">{competitor?.name}</span>
                                                    </div>
                                                    <span className="font-mono text-emerald-400 font-bold">
                                                        {new Date(race.totalTime || 0).toISOString().slice(14, 21)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    {currentPeriodRaces.filter(r => r.totalTime).length === 0 && (
                                        <p className="text-center text-slate-500 text-sm py-4">Aucun temps enregistré</p>
                                    )}
                                </div>
                            </div>

                            {/* Best Shooters */}
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Meilleurs Tireurs
                                </h2>
                                <div className="space-y-3">
                                    {competitors
                                        .map(c => {
                                            const competitorRaces = currentPeriodRaces.filter(r => r.competitorId === c.id && r.totalTime);
                                            if (competitorRaces.length === 0) return null;

                                            const totalShots = competitorRaces.length * 10;
                                            const totalErrors = competitorRaces.reduce((sum, r) => sum + (r.shooting1?.errors || 0) + (r.shooting2?.errors || 0), 0);
                                            const accuracy = ((totalShots - totalErrors) / totalShots) * 100;

                                            return { ...c, accuracy, totalShots, totalErrors };
                                        })
                                        .filter((c): c is NonNullable<typeof c> => c !== null && c.accuracy !== undefined)
                                        .sort((a, b) => b.accuracy - a.accuracy)
                                        .slice(0, 5)
                                        .map((c, idx) => (
                                            <div key={c.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/competitors/${c.id}`)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-slate-400/20 text-slate-400' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-medium">{c.name}</span>
                                                </div>
                                                <span className="font-bold text-blue-400">
                                                    {c.accuracy.toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    {competitors.filter(c => currentPeriodRaces.filter(r => r.competitorId === c.id && r.totalTime).length > 0).length === 0 && (
                                        <p className="text-center text-slate-500 text-sm py-4">Aucune donnée de tir</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Column - Rankings */}
                    <div className={type === 'relay' ? "lg:col-span-3" : "lg:col-span-2"}>
                        <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-yellow-500">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Classement Général
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
                    </div>
                </div>
            )}
        </div>
    );
};
