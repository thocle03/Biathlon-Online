import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Users, Trophy, Timer, Zap, Target } from 'lucide-react';

export const Home = () => {
    const navigate = useNavigate();

    const events = useLiveQuery(() => db.events.toArray());
    const competitors = useLiveQuery(() => db.competitors.toArray());

    const sprintCount = events?.filter(e => !e.type || e.type === 'sprint').length || 0;
    const pursuitCount = events?.filter(e => e.type === 'pursuit').length || 0;
    const relayCount = events?.filter(e => e.type === 'relay').length || 0;
    const individualCount = events?.filter(e => e.type === 'individual').length || 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">Tableau de Bord</h1>
                <p className="text-slate-400">Bienvenue dans votre gestionnaire de biathlon</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{competitors?.length || 0}</div>
                            <div className="text-slate-400 text-sm">Concurrents</div>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{events?.length || 0}</div>
                            <div className="text-slate-400 text-sm">Événements Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Types */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Types d'Événements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Sprint */}
                    <div
                        onClick={() => navigate('/events/sprint')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Zap className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Sprint</h3>
                            <p className="text-slate-400 text-sm mb-4">Courses en duel avec 2 tirs</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-blue-400">{sprintCount}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">événements</span>
                            </div>
                        </div>
                    </div>

                    {/* Pursuit */}
                    <div
                        onClick={() => navigate('/events/pursuit')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Timer className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Poursuite</h3>
                            <p className="text-slate-400 text-sm mb-4">Départs décalés selon résultats</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-purple-400">{pursuitCount}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">événements</span>
                            </div>
                        </div>
                    </div>

                    {/* Relay */}
                    <div
                        onClick={() => navigate('/events/relay')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">Relais</h3>
                            <p className="text-slate-400 text-sm mb-4">Courses par équipes</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-emerald-400">{relayCount}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">événements</span>
                            </div>
                        </div>
                    </div>

                    {/* Individual */}
                    <div
                        onClick={() => navigate('/events/individual')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Target className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">Individuel</h3>
                            <p className="text-slate-400 text-sm mb-4">Courses avec 4 tirs</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-amber-400">{individualCount}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">événements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Statistics */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Classement Général</h2>
                <div
                    onClick={() => navigate('/stats/general')}
                    className="glass-panel p-8 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-[1.02] group relative overflow-hidden border-t-4 border-t-yellow-500"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full -mr-20 -mt-20 group-hover:bg-yellow-500/20 transition-colors" />
                    <div className="relative flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-all group-hover:scale-110">
                            <Trophy className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">Classement Général</h3>
                            <p className="text-slate-400">Toutes spécialités confondues - Tous les points cumulés</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics by Type */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Statistiques par Spécialité</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Sprint Stats */}
                    <div
                        onClick={() => navigate('/stats/sprint')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Sprint</h3>
                            <p className="text-slate-400 text-sm">Classements et performances</p>
                        </div>
                    </div>

                    {/* Pursuit Stats */}
                    <div
                        onClick={() => navigate('/stats/pursuit')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Poursuite</h3>
                            <p className="text-slate-400 text-sm">Classements et performances</p>
                        </div>
                    </div>

                    {/* Relay Stats */}
                    <div
                        onClick={() => navigate('/stats/relay')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">Relais</h3>
                            <p className="text-slate-400 text-sm">Classements et performances</p>
                        </div>
                    </div>

                    {/* Individual Stats */}
                    <div
                        onClick={() => navigate('/stats/individual')}
                        className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all group-hover:scale-110">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">Individuel</h3>
                            <p className="text-slate-400 text-sm">Classements et performances</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Gestion</h2>
                <div
                    onClick={() => navigate('/competitors')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Gérer les Concurrents</h3>
                            <p className="text-slate-400 text-sm">Ajouter ou modifier des athlètes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
