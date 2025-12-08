import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ArrowLeft, Play, Flag, Timer, Edit, Trash2, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { useState } from 'react';

export const EventDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const eventId = Number(id);

    const event = useLiveQuery(() => db.events.get(eventId), [eventId]);
    const races = useLiveQuery(() =>
        db.races.where('eventId').equals(eventId).toArray()
        , [eventId]);

    const competitors = useLiveQuery(() => db.competitors.toArray());

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDate, setEditDate] = useState('');

    // Add Duel State
    const [isAddDuelOpen, setIsAddDuelOpen] = useState(false);
    const [newDuelP1, setNewDuelP1] = useState<number | ''>('');
    const [newDuelP2, setNewDuelP2] = useState<number | ''>('');

    if (!event) return null;

    const startEditing = () => {
        setEditName(event.name);
        setEditDate(new Date(event.date).toISOString().split('T')[0]);
        setIsEditing(true);
    };

    const saveDetails = async () => {
        if (!editName.trim()) {
            toast.error("Le nom ne peut pas être vide");
            return;
        }
        await db.events.update(eventId, {
            name: editName,
            date: new Date(editDate)
        });
        setIsEditing(false);
        toast.success("Modifications enregistrées");
    };

    const handleAddDuel = async () => {
        if (!newDuelP1) {
            toast.error("Sélectionnez au moins un concurrent");
            return;
        }

        const race1 = {
            eventId: eventId,
            competitorId: Number(newDuelP1),
            opponentId: newDuelP2 ? Number(newDuelP2) : undefined,
            mode: 'sprint' as const,
            splits: {},
            shooting1: { errors: 0 },
            shooting2: { errors: 0 },
            penaltyCount: 0,
        };

        if (newDuelP2) {
            const race2 = {
                eventId: eventId,
                competitorId: Number(newDuelP2),
                opponentId: Number(newDuelP1),
                mode: 'sprint' as const,
                splits: {},
                shooting1: { errors: 0 },
                shooting2: { errors: 0 },
                penaltyCount: 0,
            };
            await db.transaction('rw', db.races, async () => {
                await db.races.add(race1);
                await db.races.add(race2);
            });
        } else {
            await db.races.add(race1);
        }

        toast.success("Duel ajouté !");
        setIsAddDuelOpen(false);
        setNewDuelP1('');
        setNewDuelP2('');
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et supprimera toutes les courses associées.")) {
            return;
        }

        try {
            await db.transaction('rw', db.events, db.races, async () => {
                await db.races.where('eventId').equals(eventId).delete();
                await db.events.delete(eventId);
            });

            toast.success("Événement supprimé");
            navigate('/events');
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression");
        }
    };

    // Group races into Duels
    const processedIds = new Set<number>();
    const duels = [];

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

            duels.push(duel);
        }
    }

    const handleDeleteDuel = async (duel: any) => {
        if (!window.confirm("Supprimer ce duel ?")) return;

        try {
            await db.transaction('rw', db.races, async () => {
                await db.races.delete(duel.race1.id!);
                if (duel.race2) {
                    await db.races.delete(duel.race2.id!);
                }
            });
            toast.success("Duel supprimé");
        } catch (error) {
            toast.error("Erreur suppression duel");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/events')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="text-3xl font-bold bg-slate-800 border border-white/10 rounded px-2 py-1 w-full"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-sm text-slate-300"
                                    />
                                    <button onClick={saveDetails} className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors">
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    {event.name}
                                    <button onClick={startEditing} className="p-1 text-slate-500 hover:text-white transition-colors">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                </h1>
                                <div className="flex items-center gap-3 text-slate-400 mt-1">
                                    <span>Niveau {event.level}</span>
                                    <span>•</span>
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleDeleteEvent}
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                    title="Supprimer l'événement"
                >
                    <Trash2 className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Duel List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Duels</h2>
                        <button
                            onClick={() => setIsAddDuelOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un duel
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {duels.map((duel, idx) => (
                            <div
                                key={idx}
                                className="glass-panel p-6 rounded-2xl flex items-center justify-between group relative"
                            >
                                <button
                                    onClick={() => handleDeleteDuel(duel)}
                                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Supprimer ce duel"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex-1 flex items-center justify-between gap-8">
                                    <div className="flex-1 text-right font-semibold text-lg">
                                        {duel.r1Name}
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded text-xs font-bold text-slate-500 uppercase">
                                        VS
                                    </div>
                                    <div className="flex-1 text-left font-semibold text-lg text-slate-300">
                                        {duel.r2Name}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => navigate(`/race/${duel.race1.id}`)}
                                        className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Lancer
                                    </button>
                                    <div className="flex gap-1 justify-center">
                                        <button
                                            onClick={() => navigate(`/race/manual/${duel.race1.id}`)}
                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg font-medium transition-all hover:text-white"
                                            title={`Saisir temps pour ${duel.r1Name}`}
                                        >
                                            <Edit className="w-3 h-3" />
                                            {duel.r1Name?.split(' ')[0]}
                                        </button>
                                        {duel.race2 && duel.race2.id && (
                                            <button
                                                onClick={() => navigate(`/race/manual/${duel.race2!.id}`)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg font-medium transition-all hover:text-white"
                                                title={`Saisir temps pour ${duel.r2Name}`}
                                            >
                                                <Edit className="w-3 h-3" />
                                                {duel.r2Name?.split(' ')[0]}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Leaderboard & Analysis */}
                <div className="space-y-6">
                    {/* Leaderboard */}
                    <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-yellow-500">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-yellow-500" />
                            Classement
                        </h2>

                        <div className="space-y-3">
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
                        </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Timer className="w-5 h-5 text-emerald-500" />
                            Analyses
                        </h2>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Top Temps de Ski</h3>
                            {races?.filter(r => r.totalTime && r.splits.lap1 && r.splits.shoot1 && r.splits.lap2 && r.splits.shoot2).map(r => {
                                // Calculate Ski Time = (Total) - (Shoot1 - Lap1) - (Shoot2 - Lap2)
                                const shoot1Time = (r.splits.shoot1 || 0) - (r.splits.lap1 || 0);
                                const shoot2Time = (r.splits.shoot2 || 0) - (r.splits.lap2 || 0);
                                const skiTime = (r.totalTime || 0) - shoot1Time - shoot2Time;
                                return { ...r, skiTime };
                            }).sort((a, b) => a.skiTime - b.skiTime).slice(0, 5).map((r, idx) => {
                                const competitor = competitors?.find(c => c.id === r.competitorId);
                                return (
                                    <div key={r.id} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-mono text-slate-500">#{idx + 1}</span>
                                            <span>{competitor?.name}</span>
                                        </div>
                                        <span className="font-mono text-emerald-400">{new Date(r.skiTime).toISOString().slice(14, 21)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-4 mt-6 pt-6 border-t border-white/5">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Top Temps de Tir</h3>
                            {races?.filter(r => r.totalTime && r.splits.shoot1 && r.splits.lap1 && r.splits.shoot2 && r.splits.lap2).map(r => {
                                const shootTime = ((r.splits.shoot1 || 0) - (r.splits.lap1 || 0)) + ((r.splits.shoot2 || 0) - (r.splits.lap2 || 0));
                                return { ...r, shootTime };
                            }).sort((a, b) => a.shootTime - b.shootTime).slice(0, 5).map((r, idx) => {
                                const competitor = competitors?.find(c => c.id === r.competitorId);
                                return (
                                    <div key={r.id} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-mono text-slate-500">#{idx + 1}</span>
                                            <span>{competitor?.name}</span>
                                        </div>
                                        <span className="font-mono text-amber-400">{new Date(r.shootTime).toISOString().slice(14, 21)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Duel Modal */}
            <Modal isOpen={isAddDuelOpen} onClose={() => setIsAddDuelOpen(false)} title="Ajouter un Duel">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Concurrent 1</label>
                        <select
                            value={newDuelP1}
                            onChange={e => setNewDuelP1(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Sélectionner...</option>
                            {competitors?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-center text-slate-500 font-bold text-sm uppercase">
                        VS
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Concurrent 2 (Optionnel)</label>
                        <select
                            value={newDuelP2}
                            onChange={e => setNewDuelP2(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Solo</option>
                            {competitors?.filter(c => c.id !== newDuelP1).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleAddDuel}
                        disabled={!newDuelP1}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                    >
                        Créer le duel
                    </button>
                </div>
            </Modal>
        </div>
    );
};
