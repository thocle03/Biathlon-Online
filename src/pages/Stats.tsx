import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Trophy, Star, Timer, Target } from 'lucide-react';

export const Stats = () => {
    const navigate = useNavigate();
    const competitors = useLiveQuery(() => db.competitors.toArray());
    const events = useLiveQuery(() => db.events.toArray());
    const allRaces = useLiveQuery(() => db.races.toArray());
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    if (!competitors || !events || !allRaces) return null;

    // Filter logic - Only Sprint events count for statistics
    const sprintEvents = events.filter(e => !e.type || e.type === 'sprint');
    const availableYears = Array.from(new Set(sprintEvents.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

    const filteredEvents = selectedYear === 'all'
        ? sprintEvents
        : sprintEvents.filter(e => new Date(e.date).getFullYear() === selectedYear);

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
        // @ts-ignore
        const eventRaces = allRaces.filter(r => r.eventId === event.id && r.totalTime);
        eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));

        const rankings = eventRaces.map((race, idx) => {
            const rank = idx + 1;
            // Get points based on level and rank (0 if too low rank)
            // @ts-ignore
            const scale = POINTS_SYSTEM[event.level] || [];
            const points = scale[idx] || 0;
            return { competitorId: race.competitorId, rank, points };
        });

        // @ts-ignore
        eventRankings.set(event.id!, rankings);
    });

    // Aggregate
    const competitorStats = competitors.map(c => {
        let totalPoints = 0;
        let wins = 0;
        let podiums = 0;
        let racesCount = 0;

        eventRankings.forEach(rankings => {
            // @ts-ignore
            const perf = rankings.find(r => r.competitorId === c.id);
            if (perf) {
                totalPoints += perf.points;
                racesCount++;
                if (perf.rank === 1) wins++;
                if (perf.rank <= 3) podiums++;
            }
        });

        return { ...c, totalPoints, wins, podiums, racesCount };
    }).filter(c => c.totalPoints > 0 || c.racesCount > 0); // Only show active in this period

    // Sort by points
    competitorStats.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name); // Tie-breaker by name
    });

    // Filter races for best times/shooters based on filteredEvents IDs
    const filteredEventIds = filteredEvents.map(e => e.id);
    const currentPeriodRaces = allRaces.filter(r => filteredEventIds.includes(r.eventId));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                    Classement {selectedYear === 'all' ? 'Général' : selectedYear}
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
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedYear === year ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top 3 Cards - Show placeholders if empty */}
            {competitorStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {competitorStats.slice(0, 3).map((stat, idx) => (
                        <div key={stat.id} className={`glass-panel p-6 rounded-2xl border-t-4 ${idx === 0 ? 'border-yellow-500' : idx === 1 ? 'border-slate-400' : 'border-amber-700'} relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Trophy className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-4xl font-black mb-2 flex items-center gap-3">
                                    <span className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}>#{idx + 1}</span>
                                    <span className="text-xl text-white font-bold truncate">{stat.name}</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{stat.totalPoints} <span className="text-sm font-normal text-slate-400">pts</span></div>
                                <div className="flex gap-4 text-sm text-slate-400 mt-4">
                                    <div className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> {stat.wins} Victoires</div>
                                    <div className="flex items-center gap-1"><Star className="w-3 h-3" /> {stat.racesCount} Courses</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 glass-panel rounded-2xl">
                    <p className="text-slate-400">Aucune donnée disponible pour cette période.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Best Times Overall */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-purple-400" />
                        Meilleurs Temps (Sprint)
                    </h2>
                    <div className="space-y-3">
                        {currentPeriodRaces?.filter(r => r.totalTime && r.mode === 'sprint').length > 0 ? (
                            currentPeriodRaces?.filter(r => r.totalTime && r.mode === 'sprint').sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0)).slice(0, 5).map((race, idx) => {
                                const competitor = competitors?.find(c => c.id === race.competitorId);
                                const event = events?.find(e => e.id === race.eventId);
                                return (
                                    <div key={race.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <div className="flex gap-3">
                                            <span className="font-mono text-slate-500">#{idx + 1}</span>
                                            <div>
                                                <div className="font-medium text-white">{competitor?.name}</div>
                                                <div className="text-xs text-slate-500">{event?.name}</div>
                                            </div>
                                        </div>
                                        <div className="font-mono font-bold text-emerald-400">
                                            {new Date(race.totalTime || 0).toISOString().slice(14, 21)}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-slate-500 italic text-sm">Pas de temps enregistrés.</p>
                        )}
                    </div>
                </div>

                {/* Best Shooters Overall */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Meilleurs Tireurs
                    </h2>
                    <div className="space-y-3">
                        {/* We calculate accuracy for all racers who have done at least 1 race in current period */}
                        {competitors.map(c => {
                            const cRaces = currentPeriodRaces.filter(r => r.competitorId === c.id && (r.shooting1 || r.shooting2));
                            let hits = 0;
                            let shots = 0;
                            cRaces.forEach(r => {
                                if (r.shooting1) { hits += (5 - r.shooting1.errors); shots += 5; }
                                if (r.shooting2) { hits += (5 - r.shooting2.errors); shots += 5; }
                            });
                            const accuracy = shots > 0 ? (hits / shots) * 100 : 0;
                            return { ...c, accuracy, shots };
                        }).filter(c => c.shots >= 10) // Min 10 shots to be ranked
                            .sort((a, b) => b.accuracy - a.accuracy)
                            .slice(0, 5)
                            .map((c, idx) => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <div className="flex gap-3">
                                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                                        <div className="font-medium text-white">{c.name}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500">{c.shots} tirs</span>
                                        <span className="font-mono font-bold text-blue-400">{Math.round(c.accuracy)}%</span>
                                    </div>
                                </div>
                            ))}
                        {currentPeriodRaces.length === 0 && <p className="text-slate-500 text-sm italic">Pas de données de tir.</p>}
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                            <th className="p-4">Rang</th>
                            <th className="p-4">Concurrent</th>
                            <th className="p-4 text-center">Courses</th>
                            <th className="p-4 text-center">Podiums</th>
                            <th className="p-4 text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {competitorStats.map((stat, idx) => (
                            <tr
                                key={stat.id}
                                onClick={() => navigate(`/competitors/${stat.id}`)}
                                className="hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <td className="p-4 font-mono text-slate-400">#{idx + 1}</td>
                                <td className="p-4 font-medium">{stat.name}</td>
                                <td className="p-4 text-center text-slate-400">{stat.racesCount}</td>
                                <td className="p-4 text-center text-slate-400">{stat.podiums}</td>
                                <td className="p-4 text-right font-bold text-yellow-500">{stat.totalPoints}</td>
                            </tr>
                        ))}
                        {competitorStats.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Aucun concurrent classé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
