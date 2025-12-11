import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ArrowLeft, Timer, Snowflake, Target } from 'lucide-react';

export const CompetitorRaceAnalysis = () => {
    const { id, raceId } = useParams();
    const navigate = useNavigate();
    const compId = Number(id);
    const rId = Number(raceId);

    const competitor = useLiveQuery(() => db.competitors.get(compId), [compId]);
    const race = useLiveQuery(() => db.races.get(rId), [rId]);
    const event = useLiveQuery(() => race ? db.events.get(race.eventId) : undefined, [race]);

    if (!competitor || !race || !event) return null;

    // Helper to format time
    const formatTime = (ms: number) => {
        if (!ms && ms !== 0) return '-';
        return new Date(ms).toISOString().slice(14, 21);
    };

    // Calculate Lap Times
    // Lap 1: start -> lap1
    // Lap 2: shoot1 -> lap2
    // Lap 3: shoot2 -> finish

    // Note: splits are cumulative or absolute timestamps.
    // Based on previous files, they seem to be absolute timestamps.
    // So duration = split_end - split_start.

    // Safety check for splits
    const s = race.splits || {};

    const lap1Time = (s.lap1 && s.start) ? s.lap1 - s.start : null;
    const lap2Time = (s.lap2 && s.shoot1) ? s.lap2 - s.shoot1 : null;
    const lap3Time = (s.finish && s.shoot2) ? s.finish - s.shoot2 : null;

    // Shooting Times (Range Time)
    // Shoot 1: lap1 -> shoot1
    // Shoot 2: lap2 -> shoot2
    const shoot1Time = (s.shoot1 && s.lap1) ? s.shoot1 - s.lap1 : null;
    const shoot2Time = (s.shoot2 && s.lap2) ? s.shoot2 - s.lap2 : null;

    const totalSkiTime = (lap1Time || 0) + (lap2Time || 0) + (lap3Time || 0);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">{competitor.name}</h1>
                    <p className="text-slate-400">Analyse détaillée - {event.name} ({new Date(event.date).toLocaleDateString()})</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Ski Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center bg-gradient-to-br from-cyan-900/30 to-blue-900/10 border-t-4 border-t-cyan-400">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                        <Snowflake className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {formatTime(totalSkiTime)}
                    </div>
                    <div className="text-sm text-slate-400">Temps Total Ski</div>
                </div>

                {/* Total Shooting Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-4 border-t-emerald-400">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                        <Target className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {formatTime((shoot1Time || 0) + (shoot2Time || 0))}
                    </div>
                    <div className="text-sm text-slate-400">Temps Total Pas de Tir</div>
                </div>

                {/* Total Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-4 border-t-purple-400">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                        <Timer className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {formatTime(race.totalTime || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Temps Final</div>
                </div>
            </div>

            {/* Lap Detail */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Timer className="w-5 h-5 text-slate-400" />
                    Détail par Tour
                </h2>

                {/* Lap 1 */}
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">1</div>
                        <div className="font-semibold text-lg">Tour 1</div>
                    </div>
                    <div className="font-mono text-2xl font-bold text-cyan-400">
                        {formatTime(lap1Time || 0)}
                    </div>
                </div>

                {/* Shoot 1 */}
                <div className="flex justify-center">
                    <div className="glass-panel px-8 py-3 rounded-xl flex items-center gap-6 border border-emerald-500/30 bg-emerald-900/10">
                        <div className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Tir 1 (Couché)</div>
                        <div className="font-mono text-xl font-bold text-white mx-4">
                            {formatTime(shoot1Time || 0)}
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i <= (5 - (race.shooting1?.errors || 0)) ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lap 2 */}
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">2</div>
                        <div className="font-semibold text-lg">Tour 2</div>
                    </div>
                    <div className="font-mono text-2xl font-bold text-cyan-400">
                        {formatTime(lap2Time || 0)}
                    </div>
                </div>

                {/* Shoot 2 */}
                <div className="flex justify-center">
                    <div className="glass-panel px-8 py-3 rounded-xl flex items-center gap-6 border border-blue-500/30 bg-blue-900/10">
                        <div className="text-sm font-medium text-blue-400 uppercase tracking-wider">Tir 2 (Debout)</div>
                        <div className="font-mono text-xl font-bold text-white mx-4">
                            {formatTime(shoot2Time || 0)}
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i <= (5 - (race.shooting2?.errors || 0)) ? 'bg-blue-500' : 'bg-red-500'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lap 3 */}
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">3</div>
                        <div className="font-semibold text-lg">Tour 3</div>
                    </div>
                    <div className="font-mono text-2xl font-bold text-cyan-400">
                        {formatTime(lap3Time || 0)}
                    </div>
                </div>
            </div>
        </div>
    );
};
