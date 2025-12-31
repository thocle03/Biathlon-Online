import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Crown, ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import clsx from 'clsx';

export const GlobalRankings = () => {
    const navigate = useNavigate();

    // Stats Logic
    const competitors = useLiveQuery(() => db.competitors.toArray());
    const allEvents = useLiveQuery(() => db.events.toArray());
    const allRaces = useLiveQuery(() => db.races.toArray());
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    // Calculate Stats
    const getStats = () => {
        if (!competitors || !allEvents || !allRaces) return { stats: [], availableYears: [] };

        const availableYears = Array.from(new Set(allEvents.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

        const filteredEvents = selectedYear === 'all'
            ? allEvents
            : allEvents.filter(e => new Date(e.date).getFullYear() === selectedYear);

        const POINTS_SYSTEM = {
            0: [5, 3, 1],
            1: [10, 6, 4, 2, 1],
            2: [20, 12, 8, 4, 2],
            3: [50, 30, 20, 10, 5],
            4: [100, 60, 40, 20, 10, 8, 6, 4],
            5: [200, 120, 80, 40, 20, 16, 12, 8, 6, 4]
        };

        const eventRankings = new Map<number, { competitorId: number; rank: number; points: number }[]>();

        filteredEvents.forEach(event => {
            const eventRaces = allRaces.filter(r => r.eventId === event.id && r.totalTime);

            if (event.type !== 'relay') {
                eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
            }

            const rankings = eventRaces.map((race, idx) => {
                let rank = idx + 1;
                if (race.rank) rank = race.rank;

                let points = 0;
                if (event.level >= 10) {
                    if (event.level === 10) points = (rank === 1) ? 10 : 4;
                    else if (event.level === 11) points = (rank === 1) ? 5 : 2;
                    else if (event.level === 12) points = (rank === 1) ? 3 : 1;
                } else {
                    const scale = POINTS_SYSTEM[event.level as keyof typeof POINTS_SYSTEM] || [];
                    points = scale[rank - 1] || 0;
                }

                return { competitorId: race.competitorId, rank, points };
            });

            eventRankings.set(event.id!, rankings);
        });

        const getWinPriority = (level: number) => {
            if (level === 5) return 6;
            if (level === 4) return 5;
            if (level === 3) return 4;
            if (level === 2) return 3;
            if (level === 1 || level === 10) return 2; // Level 1 & Relay 10
            if (level === 0 || level === 11) return 1; // Level 0 & Relay 11
            if (level === 12) return 0; // Relay 12
            return -1;
        };

        const eventMap = new Map(filteredEvents.map(e => [e.id, e]));

        const stats = competitors.map(c => {
            let totalPoints = 0;
            let wins = 0;
            let podiums = 0;
            const winsByPriority = [0, 0, 0, 0, 0, 0, 0]; // Index 0 to 6

            eventRankings.forEach((rankings, eventId) => {
                const event = eventMap.get(eventId);
                if (!event) return;

                const perf = rankings.find(r => r.competitorId === c.id);
                if (perf) {
                    totalPoints += perf.points;
                    if (perf.rank === 1) {
                        wins++;
                        const level = event.level ?? 0;
                        const p = getWinPriority(level);
                        if (p >= 0 && p < 7) winsByPriority[p]++;
                    }
                    if (perf.rank <= 3) podiums++;
                }
            });

            return { ...c, totalPoints, wins, podiums, winsByPriority };
        }).filter(c => c.totalPoints > 0).sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

            // Compare wins by priority (descending)
            for (let i = 6; i >= 0; i--) {
                if (b.winsByPriority[i] !== a.winsByPriority[i]) {
                    return b.winsByPriority[i] - a.winsByPriority[i];
                }
            }

            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.podiums !== a.podiums) return b.podiums - a.podiums;
            return a.name.localeCompare(b.name);
        });

        return { stats, availableYears };
    };

    const { stats, availableYears } = getStats();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-8 bg-[url('/biathlon_bg.png')] bg-cover bg-center overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm fixed" />

            <div className="relative z-10 w-full max-w-5xl space-y-8">

                <button
                    onClick={() => navigate('/select-location')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour à la sélection
                </button>

                <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-yellow-500 bg-slate-800/50 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-xl">
                                <Globe className="w-8 h-8 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    Super Classement Général
                                    <Crown className="w-5 h-5 text-yellow-500 fill-current" />
                                </h2>
                                <p className="text-slate-400 text-sm">Tous lieux et disciplines confondus</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl overflow-x-auto">
                            <button
                                onClick={() => setSelectedYear('all')}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                    selectedYear === 'all'
                                        ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Global
                            </button>
                            {availableYears?.map((year: number) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                        selectedYear === year
                                            ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top 3 Podium */}
                        {stats[0] && (
                            <div className="lg:col-span-2 flex flex-col md:flex-row justify-center items-end gap-4 mb-4">
                                {/* 2nd */}
                                {stats[1] && (
                                    <div className="order-2 md:order-1 flex flex-col items-center">
                                        <div className="text-xl font-bold text-slate-300 mb-2">{stats[1].name}</div>
                                        <div className="h-32 w-24 bg-gradient-to-t from-slate-500/40 to-slate-500/10 rounded-t-lg flex items-end justify-center pb-4 border-t-2 border-slate-400">
                                            <span className="text-3xl font-black text-slate-400">2</span>
                                        </div>
                                        <div className="mt-2 font-black text-2xl text-slate-400">{stats[1].totalPoints} pts</div>
                                    </div>
                                )}
                                {/* 1st */}
                                <div className="order-1 md:order-2 flex flex-col items-center">
                                    <Crown className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
                                    <div className="text-2xl font-black text-white mb-2">{stats[0].name}</div>
                                    <div className="h-48 w-32 bg-gradient-to-t from-yellow-500/40 to-yellow-500/10 rounded-t-lg flex items-end justify-center pb-4 border-t-2 border-yellow-500 shadow-[0_-10px_40px_rgba(234,179,8,0.2)]">
                                        <span className="text-5xl font-black text-yellow-500">1</span>
                                    </div>
                                    <div className="mt-2 font-black text-4xl text-yellow-500">{stats[0].totalPoints} pts</div>
                                </div>
                                {/* 3rd */}
                                {stats[2] && (
                                    <div className="order-3 md:order-3 flex flex-col items-center">
                                        <div className="text-xl font-bold text-amber-700 mb-2">{stats[2].name}</div>
                                        <div className="h-24 w-24 bg-gradient-to-t from-amber-700/40 to-amber-700/10 rounded-t-lg flex items-end justify-center pb-4 border-t-2 border-amber-700">
                                            <span className="text-3xl font-black text-amber-700">3</span>
                                        </div>
                                        <div className="mt-2 font-black text-2xl text-amber-700">{stats[2].totalPoints} pts</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="lg:col-span-2">
                            <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/40">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr className="text-left text-slate-400 text-sm uppercase tracking-wider">
                                            <th className="px-6 py-4 font-bold">Rang</th>
                                            <th className="px-6 py-4 font-bold">Concurrent</th>
                                            <th className="px-6 py-4 font-bold text-center">Victoires</th>
                                            <th className="px-6 py-4 font-bold text-center">Podiums</th>
                                            <th className="px-6 py-4 font-bold text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats.slice(3, 10).map((c: any, idx: number) => (
                                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-500">#{idx + 4}</td>
                                                <td className="px-6 py-4 font-semibold text-white">{c.name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {c.wins > 0 && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">{c.wins}</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-400">{c.podiums}</td>
                                                <td className="px-6 py-4 text-right font-bold text-yellow-500 text-lg">{c.totalPoints}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {stats.length > 10 && (
                                    <div className="px-6 py-4 text-center text-slate-500 italic border-t border-white/5 bg-white/5">
                                        ... et {stats.length - 10} autres concurrents
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
