import React from "react";
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-concrete-light mt-auto w-full py-6 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-concrete">
                <div className="mb-4 md:mb-0">
                    <span className="font-semibold text-steel-blue">SiteNex</span> &copy; {new Date().getFullYear()} All rights reserved.
                </div>

                <div className="flex space-x-6">
                    <Link to="#" className="hover:text-steel-blue transition-colors">Support</Link>
                    <Link to="#" className="hover:text-steel-blue transition-colors">Help Center</Link>
                    <Link to="#" className="hover:text-steel-blue transition-colors">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;