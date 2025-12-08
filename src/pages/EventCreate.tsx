import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Save, Shuffle, Users } from 'lucide-react';
import { db, type Competitor } from '../db/db';
import toast from 'react-hot-toast';

interface Duel {
    p1: Competitor;
    p2?: Competitor; // Can be undefined if odd number
}

export const EventCreate = () => {
    const navigate = useNavigate();
    const competitors = useLiveQuery(() => db.competitors.toArray());

    const [name, setName] = useState('');
    const [date, setDate] = useState('2025-08-14');
    const [level, setLevel] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [duels, setDuels] = useState<Duel[]>([]);
    const [step, setStep] = useState<1 | 2>(1); // 1: Select, 2: Pair

    const toggleSelection = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(ids => ids.filter(i => i !== id));
        } else {
            setSelectedIds(ids => [...ids, id]);
        }
    };

    const generateDuels = () => {
        if (selectedIds.length < 2) {
            toast.error("Sélectionnez au moins 2 concurrents");
            return;
        }

        const selectedCompetitors = competitors?.filter(c => c.id && selectedIds.includes(c.id)) || [];
        // Shuffle
        const shuffled = [...selectedCompetitors].sort(() => Math.random() - 0.5);
        const newDuels: Duel[] = [];

        for (let i = 0; i < shuffled.length; i += 2) {
            newDuels.push({
                p1: shuffled[i],
                p2: shuffled[i + 1] // might be undefined
            });
        }

        setDuels(newDuels);
        setStep(2);
    };

    const saveEvent = async () => {
        if (!name.trim()) {
            toast.error("Donnez un nom à l'événement");
            return;
        }

        try {
            const eventId = await db.events.add({
                name,
                date: new Date(date),
                level,
                status: 'active'
            });

            // Create Races for Duels
            // Note: We need to define how to store races. 
            // For now, let's assume a race is a "Duel" interaction effectively? 
            // Or we create 2 Race entries per duel?
            // "Course en duel" implies they run together. 
            // Let's create two race entries linked by some common ID or just separate races that happen to be displayed together?
            // The requirement says "1 contre 1... sur un parcours".

            // Let's store them as individual Race entries but maybe we link them by `opponentId`.

            const racePromises = duels.flatMap(duel => {
                const race1 = {
                    eventId: eventId as number,
                    competitorId: duel.p1.id!,
                    opponentId: duel.p2?.id,
                    mode: 'sprint' as const,
                    splits: {},
                    shooting1: { errors: 0 },
                    shooting2: { errors: 0 },
                    penaltyCount: 0,
                };

                const promises = [db.races.add(race1)];

                if (duel.p2) {
                    const race2 = {
                        eventId: eventId as number,
                        competitorId: duel.p2.id!,
                        opponentId: duel.p1.id,
                        mode: 'sprint' as const,
                        splits: {},
                        shooting1: { errors: 0 },
                        shooting2: { errors: 0 },
                        penaltyCount: 0,
                    };
                    promises.push(db.races.add(race2));
                }

                return promises;
            });

            await Promise.all(racePromises);

            toast.success("Événement créé !");
            navigate(`/events/${eventId}`);
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la création");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/events')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold">Nouvel Événement</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Col: Settings */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Configuration</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nom de l'événement</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="ex: Coupe du Monde - Étape 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Niveau (Points)</label>
                            <select
                                value={level}
                                onChange={e => setLevel(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg"
                            >
                                <option value={1}>Niveau 1 (10 pts)</option>
                                <option value={2}>Niveau 2 (20 pts)</option>
                                <option value={3}>Niveau 3 (50 pts)</option>
                                <option value={4}>Niveau 4 (100 pts)</option>
                                <option value={5}>Niveau 5 (200 pts)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Col: Competitor Selection */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Concurrents</h2>
                            <span className="text-sm text-slate-400">{selectedIds.length} sélectionnés</span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {competitors?.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => toggleSelection(c.id!)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedIds.includes(c.id!)
                                        ? 'bg-blue-600/20 border border-blue-500/50'
                                        : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="font-medium">{c.name}</span>
                                    {selectedIds.includes(c.id!) && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={generateDuels}
                            disabled={selectedIds.length < 2 || !name}
                            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <Shuffle className="w-4 h-4" />
                            Générer les duels
                        </button>
                    </div>
                </div>
            </div>

            {step === 2 && (
                <div className="glass-panel p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Duels Générés
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {duels.map((duel, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <span className="font-medium text-white">{duel.p1.name}</span>
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">VS</span>
                                <span className="font-medium text-white">{duel.p2 ? duel.p2.name : <em className="text-slate-500">Solo</em>}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={saveEvent}
                        className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Créer l'événement
                    </button>
                </div>
            )}
        </div>
    );
};
