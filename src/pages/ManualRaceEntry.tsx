import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to parse "MM:SS.t" or "SS.t" or just "SS" to ms
const parseTimeInput = (input: string): number | null => {
    if (!input) return null;
    try {
        const parts = input.split(':');
        let seconds = 0;
        if (parts.length === 2) {
            seconds += parseInt(parts[0]) * 60;
            seconds += parseFloat(parts[1]);
        } else if (parts.length === 1) {
            seconds += parseFloat(parts[0]);
        } else {
            return null;
        }
        return Math.round(seconds * 1000);
    } catch (e) {
        return null;
    }
};

// Helper format reverse
const formatTimeInput = (ms: number | undefined) => {
    if (!ms && ms !== 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
};

export const ManualRaceEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const raceId = Number(id);

    const race = useLiveQuery(() => db.races.get(raceId), [raceId]);
    const competitor = useLiveQuery(() => race ? db.competitors.get(race.competitorId) : undefined, [race]);

    const [lap1, setLap1] = useState('');
    const [shoot1Time, setShoot1Time] = useState('');
    const [lap2, setLap2] = useState('');
    const [shoot2Time, setShoot2Time] = useState('');
    const [finish, setFinish] = useState(''); // This is usually total time

    // Errors
    const [shoot1Errors, setShoot1Errors] = useState(0);
    const [shoot2Errors, setShoot2Errors] = useState(0);

    useEffect(() => {
        if (race && race.splits) {
            if (race.splits.lap1) setLap1(formatTimeInput(race.splits.lap1));
            // Shoot split in DB is usually cumulative from start. 
            // Manual entry usually implies "Time spent in Lap 1", "Time spent in Lap 2".
            // However, our data model stores CUMULATIVE timestamps (splits).
            // Users usually have "Lap Times" or "Split Times".
            // "Temps intermediaire" usually means cumulative time at a checkpoint. 
            // I will assume they enter CUMULATIVE times.
            if (race.splits.shoot1) setShoot1Time(formatTimeInput(race.splits.shoot1));
            if (race.splits.lap2) setLap2(formatTimeInput(race.splits.lap2));
            if (race.splits.shoot2) setShoot2Time(formatTimeInput(race.splits.shoot2));
            if (race.splits.finish) setFinish(formatTimeInput(race.splits.finish));
        }
        if (race?.shooting1) setShoot1Errors(race.shooting1.errors);
        if (race?.shooting2) setShoot2Errors(race.shooting2.errors);
    }, [race]);

    const handleSave = async () => {
        if (!race) return;

        const splits: any = { ...race.splits };

        const l1 = parseTimeInput(lap1);
        const s1 = parseTimeInput(shoot1Time);
        const l2 = parseTimeInput(lap2);
        const s2 = parseTimeInput(shoot2Time);
        const fin = parseTimeInput(finish);

        if (l1 !== null) splits.lap1 = l1;
        if (s1 !== null) splits.shoot1 = s1;
        if (l2 !== null) splits.lap2 = l2;
        if (s2 !== null) splits.shoot2 = s2;
        if (fin !== null) splits.finish = fin;

        await db.races.update(raceId, {
            splits,
            shooting1: { errors: shoot1Errors },
            shooting2: { errors: shoot2Errors },
            totalTime: fin !== null ? fin : race.totalTime, // Update total time mostly
            penaltyCount: shoot1Errors + shoot2Errors,
        });

        toast.success("Temps enregistrés !");
        navigate(-1);
    };

    if (!race || !competitor) return null;

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold">Saisie Manuelle</h1>
            </div>

            <div className="glass-panel p-8 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <h2 className="text-xl font-bold">{competitor.name}</h2>
                        <p className="text-slate-400 text-sm">Entrée manuelle des temps (Format MM:SS.t)</p>
                    </div>
                    {/* Potential "Auto-Calculate" helper could go here later */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Times Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-300">Temps Intermédiaires (Cumulés)</h3>

                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Fin Tour 1</label>
                            <input
                                type="text"
                                value={lap1} onChange={e => setLap1(e.target.value)}
                                placeholder="ex: 2:15.5"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Sortie Tir 1</label>
                            <input
                                type="text"
                                value={shoot1Time} onChange={e => setShoot1Time(e.target.value)}
                                placeholder="ex: 3:05.1"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Fin Tour 2</label>
                            <input
                                type="text"
                                value={lap2} onChange={e => setLap2(e.target.value)}
                                placeholder="ex: 5:20.8"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Sortie Tir 2</label>
                            <input
                                type="text"
                                value={shoot2Time} onChange={e => setShoot2Time(e.target.value)}
                                placeholder="ex: 6:10.2"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-xs font-bold text-emerald-400 mb-1">TEMPS FINAL</label>
                            <input
                                type="text"
                                value={finish} onChange={e => setFinish(e.target.value)}
                                placeholder="ex: 8:45.0"
                                className="w-full bg-slate-800/50 border border-emerald-500/50 rounded-lg px-4 py-2 font-mono text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Shooting Section */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-slate-300">Résultats de Tir</h3>

                        <div className="bg-slate-800/30 p-4 rounded-xl">
                            <label className="block text-sm font-medium mb-3">Tir 1 (Couché) - Erreurs</label>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setShoot1Errors(v)}
                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${shoot1Errors === v ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-800/30 p-4 rounded-xl">
                            <label className="block text-sm font-medium mb-3">Tir 2 (Debout) - Erreurs</label>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setShoot2Errors(v)}
                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${shoot2Errors === v ? 'bg-blue-500 text-white shadow-lg scale-110' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-amber-200 text-sm">
                            <p>Note: Les temps entrés doivent inclure les éventuels temps de pénalité.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-900/20 hover:scale-105 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};
