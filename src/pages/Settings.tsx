import { useState } from 'react';
import { db } from '../db/db';
import { Download, Upload, AlertTriangle, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
    const [importing, setImporting] = useState(false);

    const handleExport = async () => {
        try {
            const data = {
                version: 1,
                date: new Date().toISOString(),
                competitors: await db.competitors.toArray(),
                events: await db.events.toArray(),
                races: await db.races.toArray()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `biathlon-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Sauvegarde téléchargée !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'export");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("ATTENTION : Cette action va ÉCRASER toutes les données actuelles. Êtes-vous sûr ?")) {
            e.target.value = ''; // Reset input
            return;
        }

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);

                if (!data.competitors || !data.events || !data.races) {
                    throw new Error("Format invalide");
                }

                await db.transaction('rw', db.competitors, db.events, db.races, async () => {
                    await db.competitors.clear();
                    await db.events.clear();
                    await db.races.clear();

                    await db.competitors.bulkAdd(data.competitors);
                    await db.events.bulkAdd(data.events);
                    await db.races.bulkAdd(data.races);
                });

                toast.success("Données restaurées avec succès !");
                window.location.reload(); // Refresh to ensure valid state
            } catch (error) {
                console.error(error);
                toast.error("Erreur: Fichier invalide ou corrompu");
            } finally {
                setImporting(false);
                e.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    const handleReset = async () => {
        if (!confirm("⚠️ DANGER : Voulez-vous vraiment TOUT effacer ? Cette action est irréversible.")) return;

        try {
            await db.transaction('rw', db.competitors, db.events, db.races, async () => {
                await db.competitors.clear();
                await db.events.clear();
                await db.races.clear();
            });
            toast.success("Base de données réinitialisée");
            window.location.reload();
        } catch (e) {
            toast.error("Erreur lors de la réinitialisation");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">Paramètres</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Sauvegarde (Export)</h2>
                            <p className="text-sm text-slate-400">Télécharger une copie de vos données</p>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm">
                        Cela générera un fichier JSON contenant tous les concurrents, les événements et les résultats de courses.
                        Gardez ce fichier précieusement pour restaurer vos données plus tard.
                    </p>

                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Télécharger la sauvegarde
                    </button>
                    <div className="text-xs text-center text-slate-500">
                        Format: .json
                    </div>
                </div>

                {/* Import Section */}
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Restauration (Import)</h2>
                            <p className="text-sm text-slate-400">Restaurer une sauvegarde précédente</p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-200 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>Attention: Importer un fichier écrasera toutes les données actuelles de l'application.</p>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            disabled={importing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            {importing ? (
                                <span className="animate-pulse">Importation...</span>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choisir un fichier...
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 border border-red-500/20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-red-500/20 text-red-500 rounded-lg">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-red-400">Zone de Départ</h2>
                        <p className="text-sm text-slate-400">Actions destructrices</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                    <div>
                        <div className="font-medium text-white">Réinitialiser l'application</div>
                        <div className="text-sm text-slate-500">Supprime toutes les données définitivement</div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors font-medium text-sm"
                    >
                        Tout effacer
                    </button>
                </div>
            </div>
        </div>
    );
};
