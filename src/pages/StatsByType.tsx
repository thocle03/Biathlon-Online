import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RaceMode } from '../db/db';
import { Trophy, Star, Timer, Target, Snowflake, Zap } from 'lucide-react';

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
        1: [10, 7, 5, 3, 1], // Level 1
        2: [20, 14, 10, 6, 3], // Level 2
        3: [50, 35, 25, 15, 10], // Level 3
        4: [100, 80, 60, 40, 20, 16, 12, 8], // Level 4
        5: [200, 140, 100, 60, 40, 30, 20, 10, 5, 2] // Level 5
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

                // Individual Bonus: 1.5x (arrondi au supérieur)
                if (event.type === 'individual') {
                    points = Math.ceil(points * 1.5);
                }
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
        const pointsByYear = new Map<number, number[]>();

        eventRankings.forEach((rankings, eventId) => {
            const event = eventMap.get(eventId);
            if (!event) return;
            const year = new Date(event.date).getFullYear();

            const perf = rankings.find(r => r.competitorId === c.id);
            if (perf) {
                if (!pointsByYear.has(year)) pointsByYear.set(year, []);
                pointsByYear.get(year)?.push(perf.points);

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

        // Rule: Top 10 per year
        pointsByYear.forEach(points => {
            const sorted = [...points].sort((a, b) => b - a);
            totalPoints += sorted.slice(0, 10).reduce((sum, p) => sum + p, 0);
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

    // Filter races for best times/shooters
    const filteredEventIds = filteredEvents.map(e => e.id);
    const currentPeriodRaces = allRaces.filter(r => filteredEventIds.includes(r.eventId));

    // Calculate Best Laps and Averages
    const racePerformances: { competitorId: number; avgTime: number; raceId: number; lapsCount: number }[] = [];
    const allLaps = currentPeriodRaces.flatMap(race => {
        const s = race.splits || {};
        const laps = [];
        const isIndividual = race.mode === 'individual';
        const targetLaps = isIndividual ? 5 : 3;

        // Lap 1: passage 1 - start
        const startVal = s.start || 0;
        if (s.lap1 !== undefined) laps.push({ time: s.lap1 - startVal, competitorId: race.competitorId, lapNum: 1, raceId: race.id });
        // Lap 2: passage 2 - shoot 1
        if (s.lap2 !== undefined && s.shoot1 !== undefined) laps.push({ time: s.lap2 - s.shoot1, competitorId: race.competitorId, lapNum: 2, raceId: race.id });

        if (isIndividual) {
            if (s.lap3 !== undefined && s.shoot2 !== undefined) laps.push({ time: s.lap3 - s.shoot2, competitorId: race.competitorId, lapNum: 3, raceId: race.id });
            if (s.lap4 !== undefined && s.shoot3 !== undefined) laps.push({ time: s.lap4 - s.shoot3, competitorId: race.competitorId, lapNum: 4, raceId: race.id });
            if (s.finish !== undefined && s.shoot4 !== undefined) laps.push({ time: s.finish - s.shoot4, competitorId: race.competitorId, lapNum: 5, raceId: race.id });
        } else {
            if (s.finish !== undefined && s.shoot2 !== undefined) laps.push({ time: s.finish - s.shoot2, competitorId: race.competitorId, lapNum: 3, raceId: race.id });
        }

        // If performance is complete, calculate average
        if (laps.length === targetLaps) {
            const sum = laps.reduce((a, b) => a + b.time, 0);
            racePerformances.push({
                competitorId: race.competitorId,
                avgTime: sum / targetLaps,
                raceId: race.id!,
                lapsCount: targetLaps
            });
        }

        return laps;
    }).sort((a, b) => a.time - b.time);

    const bestAvgs = racePerformances.sort((a, b) => a.avgTime - b.avgTime).slice(0, 10);

    const bestLapOverall = allLaps[0];
    const bestTimeOverall = currentPeriodRaces.filter(r => r.totalTime).sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0))[0];

    // Best Shooter logic
    const bestShooters = competitors
        .map(c => {
            const competitorRaces = currentPeriodRaces.filter(r => r.competitorId === c.id && r.totalTime);
            if (competitorRaces.length === 0) return null;
            const totalShots = competitorRaces.reduce((sum, r) => sum + (r.mode === 'individual' ? 20 : 10), 0);
            const totalErrors = competitorRaces.reduce((sum, r) =>
                sum + (r.shooting1?.errors || 0) + (r.shooting2?.errors || 0) + (r.shooting3?.errors || 0) + (r.shooting4?.errors || 0)
                , 0);
            const accuracy = ((totalShots - totalErrors) / totalShots) * 100;
            return { ...c, accuracy, totalShots, totalErrors };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.accuracy !== undefined)
        .sort((a, b) => b.accuracy - a.accuracy);

    const bestShooterOverall = bestShooters[0];

    const formatTime = (ms: number) => {
        if (!ms) return '-';
        return new Date(ms).toISOString().slice(14, 21);
    };

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

            {/* Top Cards Summary */}
            {competitorStats.length > 0 && type !== 'relay' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-500/5">
                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                            <Timer className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">Meilleur Temps Final</span>
                        </div>
                        <div className="text-3xl font-black font-mono text-white mb-1">
                            {formatTime(bestTimeOverall?.totalTime || 0)}
                        </div>
                        <div className="text-sm text-slate-400">
                            {competitors.find(c => c.id === bestTimeOverall?.competitorId)?.name || '-'}
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500 bg-blue-500/5">
                        <div className="flex items-center gap-3 text-blue-400 mb-2">
                            <Target className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">Précision Max</span>
                        </div>
                        <div className="text-3xl font-black font-mono text-white mb-1">
                            {bestShooterOverall?.accuracy.toFixed(1) || '0.0'}%
                        </div>
                        <div className="text-sm text-slate-400">
                            {bestShooterOverall?.name || '-'}
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-400 bg-cyan-400/5">
                        <div className="flex items-center gap-3 text-cyan-400 mb-2">
                            <Snowflake className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">Meilleur Tour Course</span>
                        </div>
                        <div className="text-3xl font-black font-mono text-white mb-1">
                            {formatTime(bestLapOverall?.time || 0)}
                        </div>
                        <div className="text-sm text-slate-400">
                            {competitors.find(c => c.id === bestLapOverall?.competitorId)?.name || '-'}
                        </div>
                    </div>
                </div>
            )}

            {competitorStats.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center">
                    <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucune statistique</h3>
                    <p className="text-slate-500">Aucun événement {title.toLowerCase()} pour cette période</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Rankings */}
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
                                                        {formatTime(race.totalTime || 0)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Best Laps */}
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-cyan-400">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Snowflake className="w-5 h-5 text-cyan-400" />
                                    Meilleurs Tours (Course)
                                </h2>
                                <div className="space-y-3">
                                    {allLaps.slice(0, 5).map((lap, idx) => {
                                        const competitor = competitors.find(c => c.id === lap.competitorId);
                                        return (
                                            <div key={`${lap.raceId}-${lap.lapNum}`} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/competitors/${competitor?.id}/analysis/${lap.raceId}`)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-slate-400/20 text-slate-400' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm leading-tight">{competitor?.name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Tour {lap.lapNum}</div>
                                                    </div>
                                                </div>
                                                <span className="font-mono text-cyan-400 font-bold">
                                                    {formatTime(lap.time)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Best Shooters */}
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Meilleurs Tireurs
                                </h2>
                                <div className="space-y-3">
                                    {bestShooters.slice(0, 5).map((c, idx) => (
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
                        <div className="space-y-8">
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

                            {/* Best Averages Section (New) */}
                            {type !== 'relay' && bestAvgs.length > 0 && (
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500">
                                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-emerald-500" />
                                        Meilleures Moyennes de Course ({type === 'individual' ? 'Sur 5 tours' : 'Sur 3 tours'})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {bestAvgs.map((avg, idx) => {
                                            const competitor = competitors.find(c => c.id === avg.competitorId);
                                            return (
                                                <div key={`${avg.raceId}-avg-${idx}`} className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/competitors/${competitor?.id}/analysis/${avg.raceId}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-slate-400/20 text-slate-400' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-slate-400'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{competitor?.name}</div>
                                                            <div className="text-[10px] text-slate-500 uppercase">Moyenne / tour</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono text-emerald-400 font-bold text-lg">
                                                            {formatTime(avg.avgTime)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
