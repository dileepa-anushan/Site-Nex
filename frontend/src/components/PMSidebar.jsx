import React from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { usePMContext } from '../../context/PMContext';

const NavBar = () => {
    const { user, isLoaded } = useUser();
    const { issues } = usePMContext();

    // Count open/urgent issues as "notifications"
    const notificationCount = issues.filter(
        i => i.status === 'Open' || i.status === 'In Progress'
    ).length;

    // Build display name from Clerk user
    const fullName = isLoaded && user
        ? (user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'User')
        : '...';

    return (
        <header className="bg-white border-b border-concrete-light sticky top-0 z-30 w-full flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button className="md:hidden text-concrete hover:text-steel-blue transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
                <div className="flex items-center">
                    <div className="hidden md:flex flex-col ml-3">
                        <span className="text-xl font-bold text-steel-blue tracking-tight">SiteNex</span>
                        <span className="text-xs font-medium text-amber uppercase tracking-wider">PM Portal</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Search Bar */}
                <div className="hidden md:flex relative text-concrete focus-within:text-steel-blue">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input
                        type="search"
                        name="q"
                        className="py-2 text-sm text-white bg-concrete-light/30 rounded-full pl-10 focus:outline-none focus:bg-white focus:text-steel-blue placeholder-concrete/70 border border-transparent focus:border-steel-blue/30 transition-all w-64"
                        placeholder="Search projects, tasks..."
                        autoComplete="off"
                    />
                </div>

                {/* Notifications — badge count from open issues */}
                <button className="relative text-concrete hover:text-steel-blue transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-amber rounded-full">
                            {notificationCount}
                        </span>
                    )}
                </button>

                {/* User Profile — from Clerk */}
                <div className="flex items-center gap-3 border-l border-concrete-light pl-6">
                    <div className="flex-col text-right hidden sm:flex">
                        <span className="text-sm font-semibold text-steel-blue block leading-tight">{fullName}</span>
                        <span className="text-xs text-concrete block">Project Manager</span>
                    </div>
                    <UserButton afterSignOut="/login" appearance={{
                        elements: {
                            userButtonAvatarBox: "w-10 h-10"
                        }
                    }} />
                </div>
            </div>
        </header>
    );
};

export default NavBar;