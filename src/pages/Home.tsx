import { useNavigate } from 'react-router-dom';
import { Users, CalendarPlus, Trophy } from 'lucide-react';

export const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Bienvenue</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/competitors')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Concurrents</h3>
                    <p className="text-slate-400">Gérez votre base d'athlètes</p>
                </div>
                <div
                    onClick={() => navigate('/events')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group"
                >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <CalendarPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Événements</h3>
                    <p className="text-slate-400">Lancez une compétition ou un duel</p>
                </div>
                <div
                    onClick={() => navigate('/stats')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-all hover:scale-105 group"
                >
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Statistiques</h3>
                    <p className="text-slate-400">Analysez les performances</p>
                </div>
            </div>
        </div>
    );
};
