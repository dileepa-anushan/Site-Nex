import React from 'react';
import { Link } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import logoLarge from '../../assets/logo-large.png';

const PMSidebar = () => {
    const { signOut } = useClerk();
    return (
        <aside className="w-64 h-screen bg-steel-blue text-white p-4 flex flex-col shadow-lg z-20 sticky top-0">
            <div className="text-2xl font-bold mb-4 tracking-wide flex items-center gap-2">
                <img src={logoLarge} alt="logo dark" />
            </div>
            <nav className="flex flex-col gap-2 grow">
                <Link to="/pm/dashboard" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Dashboard</Link>
                <Link to="/pm/projects" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Projects</Link>
                <Link to="/pm/tasks" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Tasks</Link>
                <Link to="/pm/workers" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Workers</Link>
                <Link to="/pm/issues" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Issues</Link>
                <Link to="/pm/reports" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Daily Reports</Link>
                <Link to="/pm/safety" className="p-3 hover:bg-concrete/40 rounded transition-colors text-sm font-medium">Safety & Notices</Link>
            </nav>
            <div className="mt-auto pt-4 border-t border-concrete/30 w-full">
                <button
                    onClick={() => signOut({ redirectUrl: '/login' })}
                    className="p-3 w-full text-white/80 hover:text-white hover:bg-red-500/20 rounded transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default PMSidebar;
