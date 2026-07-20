import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useUser } from '@clerk/clerk-react';
import { projects, tasks, issues, workers, dailyReports } from '../../assets/dummyData';

const Dashboard = () => {
    const { user, isLoaded } = useUser();

    // Basic stats calculation based on dummy data
    const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
    const openIssuesCount = issues.filter(i => i.status === 'Open').length;
    const activeWorkersCount = workers.filter(w => w.status === 'Active').length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

    // Computed overall health: average progress across all projects
    const overallHealth = projects.length
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0;

    // Helper to resolve a project name from its ID
    const getProjectName = (id) => projects.find(p => p.id === id)?.name || id;

    // Clerk user's first name for the welcome greeting
    const greetName = isLoaded && user ? (user.firstName || user.fullName?.split(' ')[0] || 'there') : '...';

    return (
        <div className="p-6 bg-concrete-light min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-steel-blue">Dashboard Overview</h1>
                    <p className="text-concrete mt-1">Welcome back, {greetName}. Here's what's happening today.</p>
                </div>
                <button className="bg-steel-blue hover:bg-steel-blue/90 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    New Project
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Active Projects" value={activeProjectsCount} icon={<ProjectIcon />} color="text-steel-blue" />
                <StatCard title="Open Issues" value={openIssuesCount} icon={<IssueIcon />} color="text-amber" />
                <StatCard title="Active Workers" value={activeWorkersCount} icon={<WorkerIcon />} color="text-green-600" />
                <StatCard title="High Priority Tasks" value={highPriorityTasks} icon={<TaskIcon />} color="text-red-500" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Projects Overview and Recent Reports */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Projects List */}
                    <div className="bg-white rounded-xl shadow-sm border border-concrete-light overflow-hidden">
                        <div className="px-6 py-4 border-b border-concrete-light flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-steel-blue">Active Projects</h2>
                            <button className="text-sm text-steel-blue hover:underline font-medium">View All</button>
                        </div>
                        <div className="divide-y divide-concrete-light">
                            {projects.map(project => (
                                <div key={project.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg">{project.name}</h3>
                                        <p className="text-sm text-concrete flex items-center gap-1 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            {project.location}
                                        </p>
                                    </div>
                                    <div className="w-48 flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-medium text-concrete">Progress</span>
                                                <span className="font-bold text-steel-blue">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-concrete-light rounded-full h-2">
                                                <div className="bg-steel-blue h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber/10 text-amber'}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Reports */}
                    <div className="bg-white rounded-xl shadow-sm border border-concrete-light p-6">
                        <h2 className="text-lg font-bold text-steel-blue mb-4">Recent Daily Reports</h2>
                        <div className="space-y-4">
                            {dailyReports.slice(0, 2).map(report => (
                                <div key={report.id} className="border border-concrete-light rounded-lg p-4 flex gap-4 items-start hover:border-steel-blue/30 transition-colors">
                                    <div className="bg-blue-50 text-steel-blue p-3 rounded-lg text-center min-w-[60px]">
                                        <div className="text-xs uppercase font-bold">{new Date(report.date).toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-xl font-bold leading-none">{new Date(report.date).getDate()}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Report by {report.submittedBy} — {getProjectName(report.projectId)}</h4>
                                        <p className="text-sm text-concrete mt-1 line-clamp-2">{report.workCompleted}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Key Metrics and Issues */}
                <div className="space-y-8">

                    {/* Project Overall Health (Circular Progress) */}
                    <div className="bg-white rounded-xl shadow-sm border border-concrete-light p-6 flex flex-col items-center justify-center text-center">
                        <h2 className="text-lg font-bold text-steel-blue mb-6 w-full text-left">Overall Health</h2>
                        <div className="w-40 h-40 mb-4">
                            <CircularProgressbar
                                value={overallHealth}
                                text={`${overallHealth}%`}
                                styles={buildStyles({
                                    pathColor: '#1E3A5F', // steel-blue
                                    textColor: '#1E3A5F',
                                    trailColor: '#E5E7EB', // concrete-light
                                    textSize: '24px',
                                })}
                            />
                        </div>
                        <p className="text-sm text-concrete font-medium">Projects are running on schedule</p>
                    </div>

                    {/* Critical Issues */}
                    <div className="bg-white rounded-xl shadow-sm border border-concrete-light p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-steel-blue">Urgent Issues</h2>
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{issues.filter(i => i.priority === 'Critical' || i.priority === 'High').length}</span>
                        </div>
                        <div className="space-y-4">
                            {issues.filter(i => i.status === 'Open').slice(0, 3).map(issue => (
                                <div key={issue.id} className="border-l-4 border-amber bg-gray-50 p-3 rounded-r-md">
                                    <h4 className="font-bold text-sm text-gray-800">{issue.title}</h4>
                                    <p className="text-xs text-concrete mt-1 line-clamp-2">{issue.description}</p>
                                    <div className="mt-2 text-xs font-medium text-amber flex justify-between">
                                        <span>{issue.projectId}</span>
                                        <span>{new Date(issue.reportedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-sm font-semibold text-steel-blue hover:bg-gray-50 border border-concrete-light rounded transition-colors">
                            View All Issues
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Simple Icon Components for Stats Cards (could be grouped elsewhere)
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-concrete-light p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-concrete">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
    </div>
);

const ProjectIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
);
const IssueIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
);
const WorkerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
);
const TaskIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
);

export default Dashboard;
