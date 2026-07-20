import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import PMLayout from "./layouts/PMLayout";
import Dashboard from "./pages/PM/Dashboard";
import { PMProvider } from "./context/PMContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/PM/Projects";
import Tasks from "./pages/PM/Tasks";
import Workers from "./pages/PM/Workers";
import Issues from "./pages/PM/Issues";
import DailyReports from "./pages/PM/DailyReports";
import SafetyNotices from "./pages/PM/SafetyNotices";

const App = () => {
    const { getToken, isSignedIn } = useAuth();

    React.useEffect(() => {
        const printToken = async () => {
            if (isSignedIn) {
                const token = await getToken();
                console.log("Welcome!", "Your Clerk Auth Token is:", token);
            }
        };
        printToken();
    }, [isSignedIn, getToken]);

    return (
        <PMProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                    <>
                        <SignedIn>
                            <Navigate to="/pm/dashboard" replace />
                        </SignedIn>
                        <SignedOut>
                            <Login />
                        </SignedOut>
                    </>
                } />
                <Route path="/register" element={
                    <>
                        <SignedIn>
                            <Navigate to="/pm/dashboard" replace />
                        </SignedIn>
                        <SignedOut>
                            <Register />
                        </SignedOut>
                    </>
                } />

                {/* Redirect logic if trying to access root */}
                <Route path="/" element={
                    <>
                        <SignedIn>
                            <Navigate to="/pm/dashboard" replace />
                        </SignedIn>
                        <SignedOut>
                            <Navigate to="/login" replace />
                        </SignedOut>
                    </>
                } />

                {/* Protected PM Routes */}
                <Route path="/pm" element={
                    <SignedIn>
                        <PMLayout />
                    </SignedIn>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="workers" element={<Workers />} />
                    <Route path="issues" element={<Issues />} />
                    <Route path="reports" element={<DailyReports />} />
                    <Route path="safety" element={<SafetyNotices />} />
                </Route>

                {/* Fallback for unknown routes inside /pm or otherwise if unauthenticated */}
                <Route path="*" element={
                    <SignedOut>
                        <Navigate to="/login" replace />
                    </SignedOut>
                } />
            </Routes>
        </PMProvider>
    );
};

export default App;