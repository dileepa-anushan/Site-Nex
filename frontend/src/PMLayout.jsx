import React from 'react';
import { Outlet } from 'react-router-dom';
import PMSidebar from '../components/PM/PMSidebar';
import NavBar from '../components/PM/NavBar';
import Footer from '../components/PM/Footer';

const PMLayout = () => {
    return (
        <div className="flex h-screen bg-concrete-light overflow-hidden font-sans">
            <PMSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <NavBar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-concrete-light">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default PMLayout;
