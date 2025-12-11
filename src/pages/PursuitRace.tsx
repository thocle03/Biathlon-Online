import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Race as RaceType, type Competitor } from '../db/db';
import { Play, Flag, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const formatTime = (ms: number) => {
    if (ms < 0) return "00:00.0";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
};

export const PursuitRace = () => {
    const { id } = useParams();
    const eventId = Number(id);
    const navigate = useNavigate();

    const event = useLiveQuery(() => db.events.get(eventId), [eventId]);
    const races = useLiveQuery(() => db.races.where('eventId').equals(eventId).toArray(), [eventId]);
    const competitors = useLiveQuery(() => db.competitors.toArray());

    // Map competitors
    const compMap = new Map<number, Competitor>();
    competitors?.forEach(c => compMap.set(c.id!, c));

    const [now, setNow] = useState(Date.now());

    // Check if all races are finished
    const allFinished = races?.every(r => r.splits.finish) || false;

    useEffect(() => {
        // Stop timer if all finished
        if (allFinished && event?.startTime) {
            return; // Don't update timer
        }

        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, [allFinished, event?.startTime]);

    // Auto-start individual timers when their offset is reached
    useEffect(() => {
        if (!event?.startTime || !races) return;

        const masterTime = Date.now() - event.startTime;

        races.forEach(async (race) => {
            const shouldAutoStart = masterTime >= (race.startOffset || 0) && !race.splits.start;
            if (shouldAutoStart) {
                const splits = { ...race.splits, start: Date.now() };
                await db.races.update(race.id!, { splits });
            }
        });
    }, [now, event?.startTime, races]);

    const startEvent = async () => {
        if (!event) return;
        if (confirm("Lancer le chrono général ?")) {
            await db.events.update(eventId, { startTime: Date.now() });
        }
    };

    const stopEvent = async () => {
        if (!event) return;
        if (confirm("Arrêter le chrono général ?")) {
            await db.events.update(eventId, { startTime: undefined });
        }
    };

    const updateOffset = async (raceId: number, offsetSec: string) => {
        const offset = parseFloat(offsetSec) * 1000; // Store in ms
        if (isNaN(offset)) return;
        await db.races.update(raceId, { startOffset: offset });
    };

    const handleSplit = async (race: RaceType, currentPhase: string) => {
        const currentTime = Date.now();
        const splits = { ...race.splits };
        const updates: Partial<RaceType> = {};

        switch (currentPhase) {
            case 'ready':
                splits.start = currentTime;
                break;
            case 'lap1':
                splits.lap1 = currentTime;
                break;
            case 'shoot1':
                splits.shoot1 = currentTime;
                break;
            case 'lap2':
                splits.lap2 = currentTime;
                break;
            case 'shoot2':
                splits.shoot2 = currentTime;
                break;
            case 'finish':
                splits.finish = currentTime;
                updates.totalTime = splits.finish - (splits.start || 0);
                break;
        }
        updates.splits = splits;
        await db.races.update(race.id!, updates);
    };

    const handleShooting = async (race: RaceType, hits: number, round: 1 | 2) => {
        const updates: Partial<RaceType> = {};
        const errors = 5 - hits;
        if (round === 1) updates.shooting1 = { errors };
        else updates.shooting2 = { errors };

        updates.penaltyCount = (race.penaltyCount || 0) - ((round === 1 ? race.shooting1?.errors || 0 : race.shooting2?.errors || 0)) + errors;
        await db.races.update(race.id!, updates);
    };

    if (!event || !races) return <div>Chargement...</div>;

    const masterTime = event.startTime ? now - event.startTime : 0;

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md p-4 border-b border-white/10 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{event.name}</h1>
                        <span className="text-sm text-slate-400 capitalize">{event.type}</span>
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-slate-400">CHRONO GÉNÉRAL</div>
                    <div className={clsx("text-4xl font-black font-mono tabular-nums", allFinished ? "text-emerald-400" : "text-white")}>
                        {formatTime(masterTime)}
                    </div>
                    {allFinished && <div className="text-xs text-emerald-400 font-bold mt-1">ARRÊTÉ</div>}
                </div>

                <div>
                    {!event.startTime && (
                        <button onClick={startEvent} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                            <Play className="w-5 h-5" /> LANCER DÉPART
                        </button>
                    )}
                    {event.startTime && !allFinished && (
                        <button onClick={stopEvent} className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg">
                            ARRÊTER
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                        <tr>
                            <th className="p-4 rounded-tl-xl">Concurrent</th>
                            <th className="p-4">Départ (Offset)</th>
                            <th className="p-4">Chrono Course</th>
                            <th className="p-4">Tir 1</th>
                            <th className="p-4">Tir 2</th>
                            <th className="p-4">Action</th>
                            <th className="p-4 rounded-tr-xl">Résultat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {races.sort((a, b) => (a.startOffset || 0) - (b.startOffset || 0)).map(race => {
                            const c = compMap.get(race.competitorId);
                            if (!c) return null;

                            // Determine Phase
                            let phase = 'ready';
                            let phaseLabel = 'DÉPART';
                            let timeDisplay = 'En attente';
                            let rowClass = '';

                            if (race.splits.start) {
                                phase = 'lap1';
                                phaseLabel = 'FIN TOUR 1';
                                timeDisplay = formatTime(now - race.splits.start);
                            }
                            if (race.splits.lap1) {
                                phase = 'shoot1';
                                phaseLabel = 'SORTIE TIR 1';
                            }
                            if (race.splits.shoot1) {
                                phase = 'lap2';
                                phaseLabel = 'FIN TOUR 2';
                            }
                            if (race.splits.lap2) {
                                phase = 'shoot2';
                                phaseLabel = 'SORTIE TIR 2';
                            }
                            if (race.splits.shoot2) {
                                phase = 'finish';
                                phaseLabel = 'ARRIVÉE';
                            }
                            if (race.splits.finish) {
                                phase = 'done';
                                phaseLabel = 'TERMINE';
                                timeDisplay = formatTime(race.splits.finish - (race.splits.start || 0));
                                rowClass = 'opacity-60 bg-white/5';
                            }

                            // Start Offset Logic
                            const shouldStart = event.startTime && (masterTime >= (race.startOffset || 0)) && !race.splits.start;
                            if (shouldStart) rowClass += ' from-emerald-900/20 to-transparent bg-gradient-to-r';

                            // Hits
                            const h1 = 5 - (race.shooting1?.errors ?? 0);
                            const h2 = 5 - (race.shooting2?.errors ?? 0);

                            return (
                                <tr key={race.id} className={clsx("hover:bg-white/5 transition-colors", rowClass)}>
                                    <td className="p-4 font-bold text-lg">{c.name}</td>
                                    <td className="p-4">
                                        {!event.startTime ? (
                                            <input
                                                className="w-20 bg-slate-800 border-white/10 rounded px-2"
                                                defaultValue={(race.startOffset || 0) / 1000}
                                                onBlur={(e) => updateOffset(race.id!, e.target.value)}
                                                placeholder="sec"
                                            />
                                        ) : (
                                            <span className="font-mono text-slate-400">+{formatTime(race.startOffset || 0)}</span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-xl tabular-nums">
                                        {timeDisplay}
                                        {shouldStart && <span className="ml-2 text-emerald-400 text-xs animate-pulse font-bold">START!</span>}
                                    </td>

                                    {/* Shoot 1 */}
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3, 4, 5].map(h => (
                                                <button key={h} onClick={() => handleShooting(race, h, 1)}
                                                    className={clsx("w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                                        h1 === h ? "bg-emerald-500 text-slate-900" : "bg-slate-700 text-slate-500 hover:bg-slate-600")}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Shoot 2 */}
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3, 4, 5].map(h => (
                                                <button key={h} onClick={() => handleShooting(race, h, 2)}
                                                    className={clsx("w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                                        h2 === h ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-500 hover:bg-slate-600")}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        {phase !== 'done' && (
                                            <button
                                                onClick={() => handleSplit(race, phase)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2",
                                                    phase === 'ready' ? "bg-emerald-500 hover:bg-emerald-400 text-white" :
                                                        phase === 'finish' ? "bg-amber-500 hover:bg-amber-400 text-white" :
                                                            "bg-blue-600 hover:bg-blue-500 text-white"
                                                )}
                                            >
                                                {phase === 'ready' && <Play className="w-4 h-4" />}
                                                {phase === 'finish' && <Flag className="w-4 h-4" />}
                                                {phaseLabel}
                                            </button>
                                        )}
                                    </td>

                                    <td className="p-4 font-bold text-emerald-400">
                                        {race.totalTime ? formatTime(race.totalTime) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
