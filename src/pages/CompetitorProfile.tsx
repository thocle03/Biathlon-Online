import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ArrowLeft, Trophy, Target, Timer, Medal, Snowflake } from 'lucide-react';

export const CompetitorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const compId = Number(id);

    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [activeTab, setActiveTab] = useState<'profile' | 'ski'>('profile');

    const competitor = useLiveQuery(() => db.competitors.get(compId), [compId]);
    const allRacesInDb = useLiveQuery(() => db.races.toArray());
    const allEvents = useLiveQuery(() => db.events.toArray());

    if (!competitor || !allRacesInDb || !allEvents) return null;

    // Years for filter
    const availableYears = Array.from(new Set(allEvents.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

    // Filter Logic - Only Sprint events for stats
    const competitorsRaces = allRacesInDb.filter(r => r.competitorId === compId && r.totalTime);

    const filteredRaces = competitorsRaces.filter(race => {
        const event = allEvents.find(e => e.id === race.eventId);
        if (!event) return false;
        // Only include sprint events
        if (event.type && event.type !== 'sprint') return false;
        if (selectedYear === 'all') return true;
        return new Date(event.date).getFullYear() === selectedYear;
    });

    // Stats Calculation
    let totalRaces = filteredRaces.length;
    let podiums = 0;

    // Shooting
    let proneShots = 0, proneHits = 0;
    let standShots = 0, standHits = 0;

    // Times
    let bestTime = Infinity;
    let bestSkiTime = Infinity;

    filteredRaces.forEach(race => {
        // Podiums Logic: Compare with all other racers in the same event
        const eventRaces = allRacesInDb.filter(r => r.eventId === race.eventId && r.totalTime);
        eventRaces.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
        const rank = eventRaces.findIndex(r => r.id === race.id) + 1;

        if (rank > 0 && rank <= 3) podiums++;

        // Shooting Stats
        if (race.shooting1) { proneShots += 5; proneHits += (5 - race.shooting1.errors); }
        if (race.shooting2) { standShots += 5; standHits += (5 - race.shooting2.errors); }

        // Best Total Time
        if (race.totalTime && race.totalTime < bestTime) bestTime = race.totalTime;

        // Best Ski Time (Total - Shooting Time on range)
        // Note: This matches logic in EventDashboard
        if (race.splits.shoot1 && race.splits.lap1 && race.splits.shoot2 && race.splits.lap2 && race.totalTime) {
            const shoot1Duration = race.splits.shoot1 - race.splits.lap1;
            const shoot2Duration = race.splits.shoot2 - race.splits.lap2;
            const ski = race.totalTime - shoot1Duration - shoot2Duration;
            if (ski < bestSkiTime) bestSkiTime = ski;
        }
    });

    const pronePct = proneShots > 0 ? Math.round((proneHits / proneShots) * 100) : 0;
    const standPct = standShots > 0 ? Math.round((standHits / standShots) * 100) : 0;
    const totalPct = (proneShots + standShots) > 0 ? Math.round(((proneHits + standHits) / (proneShots + standShots)) * 100) : 0;

    const formatTime = (ms: number) => {
        if (ms === Infinity) return '-';
        return new Date(ms).toISOString().slice(14, 21);
    };



    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/competitors')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">{competitor.name}</h1>
                        <p className="text-slate-400">Statistiques {selectedYear === 'all' ? 'Globales' : selectedYear}</p>
                    </div>
                </div>

                {/* Tabs & Year Selector */}
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Profil
                        </button>
                        <button
                            onClick={() => setActiveTab('ski')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'ski' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Temps de Ski
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg overflow-x-auto">
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
            </div>

            {activeTab === 'profile' ? (
                <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                                <Medal className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-white">{totalRaces}</div>
                            <div className="text-sm text-slate-400">Courses</div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-3">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-white">{podiums}</div>
                            <div className="text-sm text-slate-400">Podiums</div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                                <Timer className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-white font-mono">
                                {formatTime(bestTime)}
                            </div>
                            <div className="text-sm text-slate-400">Meilleur Temps</div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                                <Snowflake className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold text-white font-mono">
                                {formatTime(bestSkiTime)}
                            </div>
                            <div className="text-sm text-slate-400">Meilleur Temps Ski</div>
                        </div>
                    </div>

                    {/* Detailed Shooting Stats */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            Détails de Tir
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Prone */}
                            <div className="flex flex-col items-center">
                                <div className="mb-2 font-medium text-slate-300">Couché (Prone)</div>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - pronePct / 100)}
                                            className="text-emerald-500 transition-all duration-1000"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-bold">{pronePct}%</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">{proneHits} / {proneShots} tirs</div>
                            </div>

                            {/* Standing */}
                            <div className="flex flex-col items-center border-l border-r border-white/5">
                                <div className="mb-2 font-medium text-slate-300">Debout (Standing)</div>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - standPct / 100)}
                                            className="text-blue-500 transition-all duration-1000"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-bold">{standPct}%</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">{standHits} / {standShots} tirs</div>
                            </div>

                            {/* Total */}
                            <div className="flex flex-col items-center">
                                <div className="mb-2 font-medium text-slate-300">Global</div>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - totalPct / 100)}
                                            className="text-purple-500 transition-all duration-1000"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-bold">{totalPct}%</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">{proneHits + standHits} / {proneShots + standShots} tirs</div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <h2 className="text-xl font-semibold p-6 border-b border-white/10">Historique des courses</h2>
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-slate-400 font-medium">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Événement</th>
                                    <th className="p-4 text-center">Tirs</th>
                                    <th className="p-4 text-right">Temps</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRaces?.slice().reverse().map(race => {
                                    const event = allEvents?.find(e => e.id === race.eventId);
                                    const errors = (race.shooting1?.errors || 0) + (race.shooting2?.errors || 0);
                                    return (
                                        <tr key={race.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-slate-400">{event ? new Date(event.date).toLocaleDateString() : '-'}</td>
                                            <td className="p-4 font-medium text-white">{event?.name || 'Inconnu'}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center text-xs">
                                                    <span className={errors === 0 ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                                        {10 - errors}/10
                                                    </span>
                                                    <span className="text-slate-600 scale-75">
                                                        C: {5 - (race.shooting1?.errors || 0)} | D: {5 - (race.shooting2?.errors || 0)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono">
                                                {race.totalTime ? new Date(race.totalTime).toISOString().slice(14, 21) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <SkiAnalysisView races={filteredRaces} allEvents={allEvents} navigate={navigate} />
            )}
        </div>
    );
};

const SkiAnalysisView = ({ races, allEvents, navigate }: { races: any[], allEvents: any[], navigate: any }) => {
    // Calculate Ski Times
    const data = races.map(race => {
        if (!race.splits.shoot1 || !race.splits.lap1 || !race.splits.shoot2 || !race.splits.lap2 || !race.totalTime) return null;
        const shoot1Duration = race.splits.shoot1 - race.splits.lap1;
        const shoot2Duration = race.splits.shoot2 - race.splits.lap2;
        const skiTime = race.totalTime - shoot1Duration - shoot2Duration;
        const event = allEvents.find(e => e.id === race.eventId);
        return { ...race, skiTime, eventName: event?.name, eventDate: event?.date };
    }).filter(d => d !== null).sort((a, b) => a!.skiTime - b!.skiTime);

    // Calculate Best Lap Stats?
    // Not easy without dedicated lap data in DB (currently stored as cumulative splits)
    // Lap 1 = lap1 - start
    // Lap 2 = lap2 - shoot1
    // Lap 3 = finish - shoot2

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best Ski Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center bg-gradient-to-br from-cyan-900/30 to-blue-900/10">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                        <Snowflake className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {data[0] ? new Date(data[0].skiTime).toISOString().slice(14, 21) : '-'}
                    </div>
                    <div className="text-sm text-slate-400">Meilleur Temps Ski</div>
                    {data[0] && <div className="text-xs text-slate-500 mt-1">{data[0].eventName}</div>}
                </div>

                {/* Average Ski Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                        <Timer className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {data.length > 0
                            ? new Date(data.reduce((acc, curr) => acc + curr!.skiTime, 0) / data.length).toISOString().slice(14, 21)
                            : '-'
                        }
                    </div>
                    <div className="text-sm text-slate-400">Temps Moyen Ski</div>
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <h2 className="text-xl font-semibold p-6 border-b border-white/10 flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-cyan-400" />
                    Classement par Temps de Ski
                </h2>
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                            <th className="p-4 w-10">#</th>
                            <th className="p-4">Événement</th>
                            <th className="p-4 text-right">Temps Ski</th>
                            <th className="p-4 text-right text-xs text-slate-500">Écart</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, idx) => (
                            <tr
                                key={row!.id}
                                onClick={() => navigate(`/competitors/${races[0].competitorId}/analysis/${row!.id}`)}
                                className="hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <td className="p-4 font-bold text-slate-500">{idx + 1}</td>
                                <td className="p-4">
                                    <div className="font-medium text-white">{row!.eventName}</div>
                                    <div className="text-xs text-slate-500">{new Date(row!.eventDate).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-cyan-400">
                                    {new Date(row!.skiTime).toISOString().slice(14, 21)}
                                </td>
                                <td className="p-4 text-right font-mono text-slate-500 text-xs">
                                    {idx === 0 ? '-' : `+${((row!.skiTime - data[0]!.skiTime) / 1000).toFixed(1)}s`}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                    Pas assez de données pour calculer les temps de ski
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
