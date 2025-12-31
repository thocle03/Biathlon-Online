import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, Trophy, ChevronRight } from 'lucide-react';
import { db } from '../db/db';

import { useLocation } from '../context/LocationContext';

export const Events = () => {
    const navigate = useNavigate();
    const { location } = useLocation();
    const events = useLiveQuery(() => db.events.where('location').equals(location).reverse().toArray(), [location]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Événements
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Consultez les résultats des compétitions
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {events?.map(event => (
                    <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="group glass-panel p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {event.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                    <span>{event.date.toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                        Niveau {event.level}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                ))}

                {events?.length === 0 && (
                    <div className="py-16 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-white/5">
                        <p className="text-lg mb-2">Aucun événement à afficher</p>
                        <p className="text-sm">Créez votre première compétition pour commencer</p>
                    </div>
                )}
            </div>
        </div>
    );
};
