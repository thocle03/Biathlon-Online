import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ArrowLeft, Flag } from 'lucide-react';

export const EventDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const eventId = Number(id);

    const event = useLiveQuery(() => db.events.get(eventId), [eventId]);
    const races = useLiveQuery(() =>
        db.races.where('eventId').equals(eventId).toArray()
        , [eventId]);

    const competitors = useLiveQuery(() => db.competitors.toArray());

    if (!event) return null;

    const isMassStart = event.type === 'pursuit' || event.type === 'relay';

    // Group races into Duels (Only relevant for Sprint/Individual or display purposes)
    const processDuels = () => {
        const processedIds = new Set<number>();
        const d = [];
        if (races && competitors) {
            const compMap = new Map(competitors.map(c => [c.id!, c]));
            for (const race of races) {
                if (processedIds.has(race.id!)) continue;
                const duel = {
                    race1: race,
                    r1Name: compMap.get(race.competitorId)?.name,
                    race2: race.opponentId ? races.find(r => r.id !== race.id && r.competitorId === race.opponentId) : null,
                    r2Name: race.opponentId ? compMap.get(race.opponentId)?.name : 'Solo',
                };
                processedIds.add(race.id!);
                if (duel.race2) processedIds.add(duel.race2.id!);
                d.push(duel);
            }
        }
        return d;
    };

    const duels = processDuels();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/events/${event.type || 'sprint'}`)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {event.name}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400 mt-1">
                            <span className="capitalize">{event.type || 'Sprint'}</span>
                            <span>•</span>
                            <span>Niveau {event.level}</span>
                            <span>•</span>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Duel/Participant List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{isMassStart ? 'Participants' : 'Duels'}</h2>
                    </div>

                    {event.type === 'relay' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(teamId => {
                                const teamRaces = races?.filter(r => r.teamId === teamId).sort((a, b) => (a.passageNumber || 0) - (b.passageNumber || 0));
                                if (!teamRaces?.length) return null;

                                return (
                                    <div key={teamId} className={`glass-panel p-6 rounded-2xl border-t-4 ${teamId === 1 ? 'border-blue-500' : 'border-emerald-500'}`}>
                                        <h3 className="text-xl font-bold mb-4">Équipe {teamId}</h3>
                                        <div className="space-y-2">
                                            {teamRaces.map((r, idx) => {
                                                const c = competitors?.find(c => c.id === r.competitorId);
                                                return (
                                                    <div key={r.id} className="flex items-center gap-2 text-slate-300">
                                                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                        <span>{c?.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {duels.map((duel, idx) => (
                                <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between group relative">
                                    <div className="flex-1 flex items-center justify-between gap-8">
                                        <div className="flex-1 text-right font-semibold text-lg">{duel.r1Name}</div>
                                        {!isMassStart && (
                                            <>
                                                <div className="px-3 py-1 bg-white/5 rounded text-xs font-bold text-slate-500 uppercase">VS</div>
                                                <div className="flex-1 text-left font-semibold text-lg text-slate-300">{duel.r2Name}</div>
                                            </>
                                        )}
                                        {isMassStart && <div className="flex-1"></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Leaderboard & Analysis (Compatible for all modes) */}
                <div className="space-y-6">
                    {/* Leaderboard */}
                    <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-yellow-500">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-yellow-500" />
                            Classement
                        </h2>

                        <div className="space-y-3">
                            {event.type === 'relay' ? (
                                <>
                                    {[1, 2].map(teamId => {
                                        // Determine status based on ANY race in the team having rank set
                                        const teamRaces = races?.filter(r => r.teamId === teamId) || [];
                                        if (!teamRaces.length) return null;

                                        const isWinner = teamRaces.some(r => r.rank === 1);
                                        const isLoser = teamRaces.some(r => r.rank === 2);

                                        if (!isWinner && !isLoser) return null; // No result yet

                                        let points = 0;
                                        if (event.level === 10) points = isWinner ? 10 : 4;
                                        else if (event.level === 11) points = isWinner ? 5 : 2;
                                        else if (event.level === 12) points = isWinner ? 3 : 1;
                                        else points = isWinner ? 10 : 0; // Default

                                        return (
                                            <div key={teamId} className={`p-4 rounded-xl border-l-4 ${isWinner ? 'bg-yellow-500/10 border-yellow-500' : 'bg-slate-800 border-slate-600'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isWinner ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                        {isWinner ? <Flag className="w-5 h-5 fill-current" /> : null}
                                                        {isWinner ? 'VICTOIRE ÉQUIPE ' + teamId : 'ÉQUIPE ' + teamId}
                                                    </h3>
                                                    <span className="font-bold text-white bg-white/10 px-2 py-1 rounded">
                                                        +{points} pts
                                                    </span>
                                                </div>
                                                <div className="space-y-1 pl-4 border-l border-white/10">
                                                    {teamRaces.map(r => (
                                                        <div key={r.id} className="text-sm text-slate-300">
                                                            {competitors?.find(c => c.id === r.competitorId)?.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {!races?.some(r => r.rank) && (
                                        <div className="text-center py-8 text-slate-500 text-sm italic">
                                            En attente de résultats...
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {races?.filter(r => r.totalTime).sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0)).map((race, idx) => {
                                        const competitor = competitors?.find(c => c.id === race.competitorId);
                                        return (
                                            <div key={race.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-bold text-slate-400 w-6">#{idx + 1}</div>
                                                    <div className="font-medium text-white">{competitor?.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-emerald-400">
                                                        {new Date(race.totalTime || 0).toISOString().slice(14, 21)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex gap-1 justify-end">
                                                        <span>{(race.shooting1?.errors || 0) + (race.shooting2?.errors || 0)} fautes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {races?.filter(r => r.totalTime).length === 0 && (
                                        <div className="text-center py-8 text-slate-500 text-sm italic">
                                            En attente de résultats...
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
