import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Timer, Trophy, Settings } from 'lucide-react';
import clsx from 'clsx';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )
        }
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </NavLink>
);

export const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden bg-[url('/biathlon_bg.png')] bg-cover bg-center">
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

            {/* Sidebar */}
            <aside className="relative z-10 w-64 h-full border-r border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        BiathlonPro
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" />
                    <NavItem to="/competitors" icon={Users} label="Concurrents" />

                    {/* Event Types */}
                    <div className="pt-4 pb-2">
                        <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Événements
                        </div>
                        <div className="space-y-1">
                            <NavItem to="/events/sprint" icon={Timer} label="Sprint" />
                            <NavItem to="/events/pursuit" icon={Timer} label="Poursuite" />
                            <NavItem to="/events/relay" icon={Timer} label="Relais" />
                            <NavItem to="/events/individual" icon={Timer} label="Individuel" />
                        </div>
                    </div>

                    <NavItem to="/stats" icon={Trophy} label="Statistiques" />
                </nav>

                <div className="pt-6 border-t border-white/10">
                    <NavItem to="/settings" icon={Settings} label="Paramètres" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="relative z-10 flex-1 overflow-auto">
                <div className="container mx-auto p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
