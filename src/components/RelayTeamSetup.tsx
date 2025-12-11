import { useState } from 'react';
import type { Competitor } from '../db/db';
import { Plus, X, ArrowUp, ArrowDown, Users } from 'lucide-react';

interface RelayTeamSetupProps {
    competitors: Competitor[];
    team1: number[];
    team2: number[];
    onTeam1Change: (team: number[]) => void;
    onTeam2Change: (team: number[]) => void;
}

export const RelayTeamSetup = ({ competitors, team1, team2, onTeam1Change, onTeam2Change }: RelayTeamSetupProps) => {
    const [selectedForTeam1, setSelectedForTeam1] = useState<number | ''>('');
    const [selectedForTeam2, setSelectedForTeam2] = useState<number | ''>('');

    const addToTeam1 = () => {
        if (selectedForTeam1) {
            onTeam1Change([...team1, selectedForTeam1]);
            setSelectedForTeam1('');
        }
    };

    const addToTeam2 = () => {
        if (selectedForTeam2) {
            onTeam2Change([...team2, selectedForTeam2]);
            setSelectedForTeam2('');
        }
    };

    const removeFromTeam1 = (index: number) => {
        onTeam1Change(team1.filter((_, i) => i !== index));
    };

    const removeFromTeam2 = (index: number) => {
        onTeam2Change(team2.filter((_, i) => i !== index));
    };

    const moveUp1 = (index: number) => {
        if (index === 0) return;
        const newTeam = [...team1];
        [newTeam[index - 1], newTeam[index]] = [newTeam[index], newTeam[index - 1]];
        onTeam1Change(newTeam);
    };

    const moveDown1 = (index: number) => {
        if (index === team1.length - 1) return;
        const newTeam = [...team1];
        [newTeam[index], newTeam[index + 1]] = [newTeam[index + 1], newTeam[index]];
        onTeam1Change(newTeam);
    };

    const moveUp2 = (index: number) => {
        if (index === 0) return;
        const newTeam = [...team2];
        [newTeam[index - 1], newTeam[index]] = [newTeam[index], newTeam[index - 1]];
        onTeam2Change(newTeam);
    };

    const moveDown2 = (index: number) => {
        if (index === team2.length - 1) return;
        const newTeam = [...team2];
        [newTeam[index], newTeam[index + 1]] = [newTeam[index + 1], newTeam[index]];
        onTeam2Change(newTeam);
    };

    const getCompetitorName = (id: number) => {
        return competitors.find(c => c.id === id)?.name || 'Inconnu';
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Configuration des Équipes</h3>
                <p className="text-slate-400 text-sm">Ajoutez les coureurs dans l'ordre de passage. Un même coureur peut passer plusieurs fois.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 */}
                <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-500" />
                        <h4 className="text-lg font-bold">Équipe 1</h4>
                        <span className="text-sm text-slate-400">({team1.length} passages)</span>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedForTeam1}
                            onChange={e => setSelectedForTeam1(Number(e.target.value) || '')}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm"
                        >
                            <option value="">Sélectionner un coureur</option>
                            {competitors.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={addToTeam1}
                            disabled={!selectedForTeam1}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {team1.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm py-8">
                                Aucun coureur ajouté
                            </div>
                        ) : (
                            team1.map((competitorId, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 font-medium">{getCompetitorName(competitorId)}</span>
                                    <button
                                        onClick={() => moveUp1(index)}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveDown1(index)}
                                        disabled={index === team1.length - 1}
                                        className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeFromTeam1(index)}
                                        className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Team 2 */}
                <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-emerald-500" />
                        <h4 className="text-lg font-bold">Équipe 2</h4>
                        <span className="text-sm text-slate-400">({team2.length} passages)</span>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedForTeam2}
                            onChange={e => setSelectedForTeam2(Number(e.target.value) || '')}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm"
                        >
                            <option value="">Sélectionner un coureur</option>
                            {competitors.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={addToTeam2}
                            disabled={!selectedForTeam2}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {team2.length === 0 ? (
                            <div className="text-center text-slate-500 text-sm py-8">
                                Aucun coureur ajouté
                            </div>
                        ) : (
                            team2.map((competitorId, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 font-medium">{getCompetitorName(competitorId)}</span>
                                    <button
                                        onClick={() => moveUp2(index)}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveDown2(index)}
                                        disabled={index === team2.length - 1}
                                        className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeFromTeam2(index)}
                                        className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {team1.length !== team2.length && team1.length > 0 && team2.length > 0 && (
                <div className="glass-panel p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-yellow-500 text-sm text-center">
                        ⚠️ Les deux équipes doivent avoir le même nombre de passages ({team1.length} vs {team2.length})
                    </p>
                </div>
            )}
        </div>
    );
};
