import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RaceMode } from '../db/db';
import { Calendar, Trophy, Plus, ArrowRight } from 'lucide-react';

interface EventsByTypeProps {
    type: RaceMode;
    title: string;
    description: string;
}

export const EventsByType = ({ type, title, description }: EventsByTypeProps) => {
    const navigate = useNavigate();
    const allEvents = useLiveQuery(() => db.events.reverse().toArray(), []);
    const events = allEvents?.filter(e => e.type === type || (!e.type && type === 'sprint'));
    const allRaces = useLiveQuery(() => db.races.toArray());

    if (!events || !allRaces) return <div>Chargement...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">{title}</h1>
                    <p className="text-slate-400 mt-2">{description}</p>
                </div>
                <button
                    onClick={() => navigate('/events/new')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Nouvel Événement
                </button>
            </div>

            {events.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center">
                    <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun événement {title.toLowerCase()}</h3>
                    <p className="text-slate-500 mb-6">Créez votre premier événement pour commencer</p>
                    <button
                        onClick={() => navigate('/events/new')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                    >
                        Créer un événement
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => {
                        const eventRaces = allRaces.filter(r => r.eventId === event.id);
                        const finishedRaces = eventRaces.filter(r => r.totalTime);
                        const participants = eventRaces.length;

                        return (
                            <div
                                key={event.id}
                                onClick={() => navigate(`/events/${event.id}`)}
                                className="glass-panel p-6 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                                            {event.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                                        Niveau {event.level}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-slate-400">
                                        <span className="font-bold text-white">{participants}</span> participant{participants > 1 ? 's' : ''}
                                    </div>
                                    <div className="text-slate-400">
                                        <span className="font-bold text-emerald-400">{finishedRaces.length}</span> terminé{finishedRaces.length > 1 ? 's' : ''}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                                    Voir détails
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
