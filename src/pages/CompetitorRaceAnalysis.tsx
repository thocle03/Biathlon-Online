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
    const isIndividual = race.mode === 'individual';
    const startVal = s.start || 0;

    // Lap 1: start -> lap1
    const lap1Time = (s.lap1 !== undefined) ? s.lap1 - startVal : null;
    // Shoot 1: lap1 -> shoot1
    const shoot1Time = (s.shoot1 !== undefined && s.lap1 !== undefined) ? s.shoot1 - s.lap1 : null;
    // Lap 2: shoot1 -> lap2
    const lap2Time = (s.lap2 !== undefined && s.shoot1 !== undefined) ? s.lap2 - s.shoot1 : null;
    // Shoot 2: lap2 -> shoot2
    const shoot2Time = (s.shoot2 !== undefined && s.lap2 !== undefined) ? s.shoot2 - s.lap2 : null;

    const finishVal = s.finish || race.totalTime || 0;

    // Lap 3: shoot2 -> lap3 (Individual) or shoot2 -> finish (Sprint)
    const lap3Time = isIndividual
        ? (s.lap3 !== undefined && s.shoot2 !== undefined ? s.lap3 - s.shoot2 : null)
        : (finishVal && s.shoot2 !== undefined ? finishVal - s.shoot2 : null);

    // Individual specific
    const shoot3Time = isIndividual && s.shoot3 !== undefined && s.lap3 !== undefined ? s.shoot3 - s.lap3 : null;
    const lap4Time = isIndividual && s.lap4 !== undefined && s.shoot3 !== undefined ? s.lap4 - s.shoot3 : null;
    const shoot4Time = isIndividual && s.shoot4 !== undefined && s.lap4 !== undefined ? s.shoot4 - s.lap4 : null;
    const lap5Time = isIndividual && finishVal && s.shoot4 !== undefined ? finishVal - s.shoot4 : null;

    const totalSkiTime = (lap1Time || 0) + (lap2Time || 0) + (lap3Time || 0) + (lap4Time || 0) + (lap5Time || 0);
    const totalShootTime = (shoot1Time || 0) + (shoot2Time || 0) + (shoot3Time || 0) + (shoot4Time || 0);

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
                    <div className="text-sm text-slate-400">Temps Total Course</div>
                </div>

                {/* Total Shooting Time */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-4 border-t-emerald-400">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                        <Target className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {formatTime(totalShootTime)}
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

                {/* Tour 1 & Tir 1 */}
                <LapRow number={1} time={lap1Time} />
                <ShootRow
                    number={1}
                    time={shoot1Time}
                    errors={race.shooting1?.errors}
                    type={isIndividual ? "Couché" : "Couché"}
                    color="emerald"
                />

                {/* Tour 2 & Tir 2 */}
                <LapRow number={2} time={lap2Time} />
                <ShootRow
                    number={2}
                    time={shoot2Time}
                    errors={race.shooting2?.errors}
                    type={isIndividual ? "Couché" : "Debout"}
                    color={isIndividual ? "emerald" : "blue"}
                />

                {/* Individual sessions */}
                {isIndividual && (
                    <>
                        <LapRow number={3} time={lap3Time} />
                        <ShootRow
                            number={3}
                            time={shoot3Time}
                            errors={race.shooting3?.errors}
                            type="Debout"
                            color="blue"
                        />
                        <LapRow number={4} time={lap4Time} />
                        <ShootRow
                            number={4}
                            time={shoot4Time}
                            errors={race.shooting4?.errors}
                            type="Debout"
                            color="blue"
                        />
                        <LapRow number={5} time={lap5Time} />
                    </>
                )}

                {/* Non-individual Lap 3 */}
                {!isIndividual && (
                    <LapRow number={3} time={lap3Time} />
                )}
            </div>
        </div>
    );
};

const LapRow = ({ number, time }: { number: number, time: number | null }) => {
    const formatTime = (ms: number) => {
        if (!ms && ms !== 0) return '-';
        return new Date(ms).toISOString().slice(14, 21);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">{number}</div>
                <div className="font-semibold text-lg">Tour {number}</div>
            </div>
            <div className="font-mono text-2xl font-bold text-cyan-400">
                {formatTime(time || 0)}
            </div>
        </div>
    );
};

const ShootRow = ({ number, time, errors, type, color }: { number: number, time: number | null, errors?: number, type: string, color: 'emerald' | 'blue' }) => {
    const formatTime = (ms: number) => {
        if (!ms && ms !== 0) return '-';
        return new Date(ms).toISOString().slice(14, 21);
    };

    const colorClasses = {
        emerald: "border-emerald-500/30 bg-emerald-900/10 text-emerald-400 ring-emerald-500",
        blue: "border-blue-500/30 bg-blue-900/10 text-blue-400 ring-blue-500"
    };

    const dotClasses = {
        emerald: "bg-emerald-500",
        blue: "bg-blue-500"
    };

    return (
        <div className="flex justify-center">
            <div className={`glass-panel px-8 py-3 rounded-xl flex items-center gap-6 border ${colorClasses[color]}`}>
                <div className="text-sm font-medium uppercase tracking-wider">Tir {number} ({type})</div>
                <div className="font-mono text-xl font-bold text-white mx-4">
                    {formatTime(time || 0)}
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i <= (5 - (errors || 0)) ? dotClasses[color] : 'bg-red-500'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};
