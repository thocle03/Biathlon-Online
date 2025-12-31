import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation as useRouteLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Timer, Trophy, MapPin, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useLocation } from '../context/LocationContext';

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: React.ElementType; label: string; onClick?: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
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
    const { location } = useLocation();
    const routeLocation = useRouteLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [routeLocation]);

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden bg-[url('/biathlon_bg.png')] bg-cover bg-center">
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

            {/* Mobile Header with Burger Menu */}
            {/* Mobile Navigation Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-slate-900/60 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold tracking-tight">BiathlonPro</span>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Backdrop for Mobile Menu */}
            <div
                className={clsx(
                    "fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-lg transition-opacity duration-300 md:hidden",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar / Mobile Menu */}
            <aside className={clsx(
                // Position and Transition
                "fixed inset-y-0 left-0 z-[110] transition-transform duration-500 ease-out",
                // Mobile behavior: starts off-screen
                "-translate-x-full",
                // Desktop behavior: always visible on the left
                "md:relative md:translate-x-0 md:z-10",
                // Shown on mobile if open
                isSidebarOpen && "translate-x-0 shadow-2xl shadow-blue-500/20",
                // Sizing and Styles
                "w-full sm:w-80 md:w-64 h-full border-r border-white/10 bg-slate-900 md:bg-slate-900/40 p-8 flex flex-col"
            )}>
                <div className="flex items-center justify-between mb-12">
                    <Link to="/select-location" className="block group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all">
                                BiathlonPro
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white/5 py-1.5 px-4 rounded-full w-fit border border-white/5 group-hover:border-white/20 transition-colors">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {location}
                        </div>
                    </Link>

                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                        aria-label="Close Menu"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    <NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" onClick={() => setIsSidebarOpen(false)} />
                    <NavItem to="/competitors" icon={Users} label="Concurrents" onClick={() => setIsSidebarOpen(false)} />

                    <div className="pt-6 pb-2">
                        <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Événements
                        </div>
                        <div className="space-y-1">
                            <NavItem to="/events/sprint" icon={Timer} label="Sprint" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/events/pursuit" icon={Timer} label="Poursuite" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/events/relay" icon={Timer} label="Relais" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/events/individual" icon={Timer} label="Individuel" onClick={() => setIsSidebarOpen(false)} />
                        </div>
                    </div>

                    <div className="pt-6 pb-2">
                        <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Statistiques
                        </div>
                        <div className="space-y-1">
                            <NavItem to="/stats/general" icon={Trophy} label="Général" onClick={() => setIsSidebarOpen(false)} />
                            <div className="border-t border-white/5 my-2" />
                            <NavItem to="/stats/sprint" icon={Trophy} label="Sprint" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/stats/pursuit" icon={Trophy} label="Poursuite" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/stats/relay" icon={Trophy} label="Relais" onClick={() => setIsSidebarOpen(false)} />
                            <NavItem to="/stats/individual" icon={Trophy} label="Individuel" onClick={() => setIsSidebarOpen(false)} />
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="relative z-10 flex-1 overflow-auto pt-20 md:pt-0">
                <div className="container mx-auto p-4 sm:p-10 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
