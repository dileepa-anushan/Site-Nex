import React, { useState } from 'react';
import { usePMContext } from '../../context/PMContext';
import TaskProgressHistoryBarChart from '../../components/PM/TaskProgressHistoryBarChart';
import TaskDependencyGraph from '../../components/PM/TaskDependencyGraph';

const priorityColors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-green-100 text-green-800 border-green-300',
};

const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Blocked': 'bg-red-100 text-red-800',
    'To Do': 'bg-gray-100 text-gray-700',
};

const Tasks = () => {
    const { tasks, addTask, updateTask, deleteTask, projects, workers, recordTaskProgress } = usePMContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterProject, setFilterProject] = useState('All');

    const [isGraphOpen, setIsGraphOpen] = useState(false);
    const [progressSelectedTaskId, setProgressSelectedTaskId] = useState(null);

    const [formData, setFormData] = useState({
        projectId: '', name: '', description: '', assignedTo: [],
        startDate: '', endDate: '', status: 'To Do', priority: 'Medium',
        progressUpdatedBy: '',
        progressPercent: ''
    });
    const [graphTab, setGraphTab] = useState('progress'); // 'progress' or 'dependencies'

    // Stats from dummy data
    const stats = {
        total: tasks.length,
        toDo: tasks.filter(t => t.status === 'To Do').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        blocked: tasks.filter(t => t.status === 'Blocked').length,
        critical: tasks.filter(t => t.priority === 'Critical').length,
    };

    // helpers
    const getProjectName = (id) => projects.find(p => p.id === id)?.name || id;
    const getWorkerNames = (ids) => {
        if (!ids || ids.length === 0) return 'Unassigned';
        return ids.map(id => workers.find(w => w.id === id)?.name || id).join(', ');
    };

    // filter
    const filtered = tasks.filter(t => {
        const matchStatus = filterStatus === 'All' || t.status === filterStatus;
        const matchProject = filterProject === 'All' || t.projectId === filterProject;
        return matchStatus && matchProject;
    });

    const openModal = (task = null) => {
        if (task) {
            setCurrentTask(task);
            setFormData({
                ...task,
                assignedTo: task.assignedTo || [],
                progressUpdatedBy: workers[0]?.id || '',
                progressPercent: ''
            });
        } else {
            setCurrentTask(null);
            setFormData({
                projectId: projects[0]?.id || '',
                name: '',
                description: '',
                assignedTo: [],
                startDate: '',
                endDate: '',
                status: 'To Do',
                priority: 'Medium',
                progressUpdatedBy: workers[0]?.id || '',
                progressPercent: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setCurrentTask(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, assignedTo: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!currentTask) {
            addTask(formData);
            closeModal();
            return;
        }

        const progressPercentRaw = formData.progressPercent;
        const hasProgressUpdate = progressPercentRaw !== '' && progressPercentRaw !== null && progressPercentRaw !== undefined;

        // Remove progressUpdatedBy and progressNotes from the update object
        // so the context can handle the notes appropriately.
        const { progressUpdatedBy, progressNotes, ...rest } = formData;

        if (hasProgressUpdate) {
            recordTaskProgress(currentTask.id, progressUpdatedBy, Number(progressPercentRaw));

            // We still update other fields. Since rest.progressNotes is now undefined,
            // the context will preserve the notes recently added by recordTaskProgress.
            const restWithoutStatus = { ...rest };
            delete restWithoutStatus.status;
            updateTask(currentTask.id, restWithoutStatus);
        } else {
            updateTask(currentTask.id, rest);
        }

        closeModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) deleteTask(id);
    };

    const openGraph = () => {
        setProgressSelectedTaskId(null);
        setIsGraphOpen(true);
    };

    const closeGraph = () => {
        setIsGraphOpen(false);
    };

    const formatDateDots = (dateLike) => {
        const d = new Date(dateLike);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}.${m}.${day}`;
    };

    const statusToLower = (status) => {
        if (!status) return "";
        return String(status).toLowerCase();
    };

    const deriveStatusFromPercent = (percent) => {
        const p = Number(percent);
        if (p === 0) return "To Do";
        if (p === 100) return "Completed";
        return "In Progress";
    };

    const parseProgressNotes = (task) => {
        const notes = Array.isArray(task?.progressNotes) ? task.progressNotes : [];
        const entries = notes
            .map((n) => {
                const createdAt = n?.createdAt;
                const noteText = n?.note || "";
                const match = /PROGRESS_PERCENT:(\d+)(?:;STATUS:([^;]+))?/.exec(noteText);
                if (!match || !createdAt) return null;
                const percent = Number(match[1]);
                const status = match[2] || deriveStatusFromPercent(percent);
                return {
                    dateLike: createdAt,
                    percent,
                    status,
                };
            })
            .filter(Boolean);

        entries.sort((a, b) => new Date(a.dateLike) - new Date(b.dateLike));

        // Guarantee an initial point at the task startDate with 0%.
        const startDateLike = task?.startDate || (entries[0]?.dateLike ?? new Date().toISOString());
        const hasZero = entries.some((e) => Number(e.percent) === 0);
        if (!hasZero) {
            entries.unshift({
                dateLike: startDateLike,
                percent: 0,
                status: "To Do",
            });
        }

        return entries;
    };

    const timelineLine = (entry) => {
        const dateStr = formatDateDots(entry.dateLike);
        const percent = Number(entry.percent);
        const stLower = statusToLower(entry.status) || "in progress";
        if (percent === 0) return `${dateStr} > to do`;
        if (percent === 100) return `${dateStr} > 100% (completed)`;
        return `${dateStr} > ${percent}% (${stLower})`;
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans selection:bg-steel-blue/10 selection:text-steel-blue">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="animate-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-steel-blue rounded-xl flex items-center justify-center shadow-lg shadow-steel-blue/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Task Logistics</h1>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Monitoring <span className="text-steel-blue font-bold">{stats.total} active assets</span> across the Site-Nex infrastructure</p>
                </div>

                <div className="flex items-center gap-4 animate-in slide-in-from-right duration-700">
                    <button
                        onClick={openGraph}
                        className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-xl shadow-sm hover:border-steel-blue/30 hover:text-steel-blue transition-all duration-300 font-black text-xs uppercase tracking-widest flex items-center gap-3 group"
                        type="button"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Intelligence Hub
                    </button>

                    <button onClick={() => openModal()} className="bg-steel-blue text-white px-8 py-3 rounded-xl shadow-xl shadow-steel-blue/20 hover:bg-[#152a45] transition-all duration-300 font-black text-xs uppercase tracking-widest flex items-center gap-3 transform hover:-translate-y-1 active:translate-y-0" type="button">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        New Task
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10 overflow-hidden">
                {[
                    { label: 'Total Assets', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                    { label: 'In Queue', value: stats.toDo, color: 'text-slate-500', bg: 'bg-slate-50' },
                    { label: 'Operational', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50/50' },
                    { label: 'Blocked', value: stats.blocked, color: 'text-red-500', bg: 'bg-red-50/50' },
                    { label: 'Critical Path', value: stats.critical, color: 'text-orange-600', bg: 'bg-orange-50/50' },
                ].map((s, idx) => (
                    <div key={s.label} className={`group ${s.bg} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-all duration-500 animate-in zoom-in-95 delay-[${idx * 100}ms]`}>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 group-hover:translate-x-1 transition-transform">{s.label}</p>
                        <div className="flex items-end justify-between">
                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                            <div className={`w-2 h-2 rounded-full ${s.color.replace('text', 'bg')} opacity-20`}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-50">
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
                    {['All', 'To Do', 'In Progress', 'Blocked', 'Completed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${filterStatus === s ? 'bg-white text-steel-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 ml-auto w-full md:w-auto">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">Project Filter</span>
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                        className="w-full md:w-64 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-steel-blue/10 transition-all">
                        <option value="All">All Active Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(task => {
                    // Extract progress for the progress bar
                    const timeline = parseProgressNotes(task);
                    const currentProgress = timeline[timeline.length - 1]?.percent || 0;

                    return (
                        <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-steel-blue/10 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                            <div className="h-1.5 w-full bg-gray-100">
                                <div
                                    className={`h-full transition-all duration-500 ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'Blocked' ? 'bg-red-500' : 'bg-steel-blue'}`}
                                    style={{ width: `${currentProgress}%` }}
                                ></div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-tight">{task.id}</span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusColors[task.status] || 'bg-gray-100 text-gray-700'}`}>{task.status}</span>
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-steel-blue transition-colors line-clamp-1">{task.name}</h2>
                                    </div>
                                    <div className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${currentProgress === 100 ? 'border-green-500 text-green-600 bg-green-50' : 'border-steel-blue/20 text-steel-blue'}`}>
                                        {currentProgress}%
                                    </div>
                                </div>

                                <p className="text-xs font-semibold text-blue-600/80 mb-3 bg-blue-50 px-2 py-1 rounded inline-block self-start">{getProjectName(task.projectId)}</p>
                                <p className="text-sm text-gray-500 flex-1 mb-5 line-clamp-2 leading-relaxed">{task.description}</p>

                                <div className="grid grid-cols-2 gap-3 mb-5 border-y border-gray-50 py-3">
                                    <div>
                                        <span className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Timeline</span>
                                        <span className="text-xs text-gray-700 font-medium">{task.startDate}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 block mb-1 uppercase font-bold text-right italic">Priority</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded border italic ${priorityColors[task.priority] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>{task.priority}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {task.assignedTo?.slice(0, 3).map((wId, i) => (
                                            <div key={wId} className="w-8 h-8 rounded-full bg-steel-blue border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={getWorkerNames([wId])}>
                                                {workers.find(w => w.id === wId)?.name.charAt(0) || '?'}
                                            </div>
                                        ))}
                                        {task.assignedTo?.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                                                +{task.assignedTo.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(task)} className="p-2 text-steel-blue hover:bg-steel-blue/5 rounded-lg transition-colors cursor-pointer" title="Edit Task">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Task">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-concrete">
                        <p className="text-lg font-medium">No tasks match the current filters.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 transform animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{currentTask ? 'Refine Task Details' : 'Orchestrate New Task'}</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">{currentTask ? `Editing ${currentTask.id}` : 'Create a new milestone'}</p>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all text-2xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Task Designation</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium placeholder:text-gray-300" placeholder="e.g. Foundation Concrete Pouring" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Associated Project</label>
                                    <select name="projectId" value={formData.projectId} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium">
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Commencement</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Completion Goal</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Operational Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium">
                                        <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Blocked">Blocked</option><option value="Completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Strategic Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium">
                                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-50 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-px flex-1 bg-gray-100"></div>
                                        <span className="text-[10px] font-black text-steel-blue/40 uppercase tracking-[0.2em]">Progress Calibration</span>
                                        <div className="h-px flex-1 bg-gray-100"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Reporting Authority</label>
                                            <select name="progressUpdatedBy" value={formData.progressUpdatedBy} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium">
                                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Completion Quota (%)</label>
                                            <input type="number" name="progressPercent" value={formData.progressPercent} onChange={handleChange} min={0} max={100} step={1} placeholder="0-100" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Task Scope & Intelligence</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium placeholder:text-gray-300" placeholder="Describe the objectives and constraints..." />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Workforce Allocation (Multi-select)</label>
                                <select name="assignedTo" multiple value={formData.assignedTo} onChange={handleMultiSelectChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-steel-blue/20 transition-all font-medium h-32 custom-scrollbar">
                                    {workers.map(w => <option key={w.id} value={w.id} className="py-1 px-2 rounded-md hover:bg-steel-blue/10">{w.name} — {w.trade}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-2 italic">* Hold Ctrl/Cmd for multiple selection</p>
                            </div>
                        </form>

                        <div className="px-8 py-6 border-t border-gray-100 bg-white flex justify-end space-x-4">
                            <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-sm transition-all">Cancel</button>
                            <button type="button" onClick={handleSubmit} className="px-8 py-3 bg-steel-blue text-white rounded-xl hover:shadow-lg hover:shadow-steel-blue/30 font-black text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                {currentTask ? 'Commit Changes' : 'Initialize Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graphical View Modal */}
            {isGraphOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden border border-white/20 transform animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Task Intelligence Dashboard</h3>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Visualizing Project Trajectory & Interdependencies</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setGraphTab('progress')}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all ${graphTab === 'progress' ? 'bg-white text-steel-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Progress Timeline
                                </button>
                                <button
                                    onClick={() => setGraphTab('dependencies')}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all ${graphTab === 'dependencies' ? 'bg-white text-steel-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Dependencies
                                </button>
                            </div>
                            <button onClick={closeGraph} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all text-2xl font-light">&times;</button>
                        </div>

                        <div className="p-8">
                            {graphTab === 'progress' ? (
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                    {/* Left: task list */}
                                    <div className="xl:col-span-4 flex flex-col h-[600px]">
                                        <div className="text-[11px] font-black text-steel-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-steel-blue animate-pulse"></div>
                                            Fleet Overview
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                            {filtered.length === 0 ? (
                                                <div className="text-sm text-gray-400 italic py-20 text-center">No matching trajectories found.</div>
                                            ) : (
                                                filtered.map((t) => {
                                                    const timeline = parseProgressNotes(t);
                                                    const latest = timeline[timeline.length - 1] || { percent: 0, status: t.status || "To Do" };
                                                    const latestPercent = Number(latest.percent ?? 0);
                                                    const selected = progressSelectedTaskId === t.id;

                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => setProgressSelectedTaskId(t.id)}
                                                            className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-300 ${selected
                                                                ? "border-steel-blue bg-steel-blue/5 shadow-inner scale-[0.98]"
                                                                : "border-slate-50 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                                <div className="min-w-0">
                                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{t.id}</div>
                                                                    <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">{t.name}</div>
                                                                </div>
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${selected ? 'bg-steel-blue text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                                    {latestPercent}%
                                                                </div>
                                                            </div>

                                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-steel-blue rounded-full transition-all duration-700"
                                                                    style={{ width: `${latestPercent}%` }}
                                                                ></div>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: progress detail */}
                                    <div className="xl:col-span-8 bg-slate-50/50 rounded-3xl border border-slate-100 p-8 flex flex-col h-[600px] overflow-hidden">
                                        {(() => {
                                            const selectedTask = filtered.find((t) => t.id === progressSelectedTaskId) || null;
                                            if (!selectedTask) {
                                                return (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                                        <div className="w-20 h-20 rounded-full bg-slate-200 mb-6 flex items-center justify-center">
                                                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-900">Select an asset to analyze</h4>
                                                        <p className="text-sm text-slate-500 mt-2 max-w-xs">Interactive analytics and historical progress tracking will appear here.</p>
                                                    </div>
                                                );
                                            }

                                            const timeline = parseProgressNotes(selectedTask);
                                            const history = timeline.map((e) => ({ dateLike: e.dateLike, percent: e.percent, status: e.status }));

                                            return (
                                                <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
                                                    <div className="flex items-start justify-between gap-6 mb-8">
                                                        <div>
                                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{selectedTask.id}</div>
                                                            <h4 className="text-2xl font-black text-slate-900 leading-tight">{selectedTask.name}</h4>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                    {getProjectName(selectedTask.projectId)}
                                                                </div>
                                                                <div className={`px-2 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${statusColors[selectedTask.status] || "bg-gray-100 text-gray-700"}`}>
                                                                    {selectedTask.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => openModal(selectedTask)}
                                                            className="px-5 py-2.5 bg-white border-2 border-slate-100 rounded-xl hover:border-steel-blue/30 text-steel-blue text-[11px] font-black uppercase tracking-tight shadow-sm transition-all"
                                                        >
                                                            Calibrate Progress
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Historical Events</div>
                                                            <div className="space-y-4">
                                                                {timeline.slice(-4).reverse().map((entry, idx) => (
                                                                    <div key={`${entry.dateLike}-${idx}`} className="flex items-center gap-4">
                                                                        <div className="w-2 h-2 rounded-full bg-steel-blue/20"></div>
                                                                        <div>
                                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{formatDateDots(entry.dateLike)}</div>
                                                                            <div className="text-xs font-bold text-slate-800">{timelineLine(entry).split(' > ')[1]}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Metadata</div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-400">Operational Priority</span>
                                                                    <span className="font-bold text-steel-blue bg-steel-blue/5 px-2 py-0.5 rounded italic">{selectedTask.priority}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-400">Window</span>
                                                                    <span className="font-bold">{selectedTask.startDate} &mdash; {selectedTask.endDate}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-400">Team Allocation</span>
                                                                    <span className="font-bold truncate max-w-[120px]">{getWorkerNames(selectedTask.assignedTo)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Analytics</div>
                                                            <div className="flex gap-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-steel-blue opacity-50">
                                                                    <div className="w-3 h-1 bg-steel-blue rounded-full"></div>
                                                                    PERCENTAGE
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <TaskProgressHistoryBarChart history={history} height={220} />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[600px] flex flex-col">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="text-[11px] font-black text-steel-blue uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-steel-blue"></div>
                                            Network Topology
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic">Visualize the Critical Path & Dependencies</p>
                                    </div>
                                    <div className="flex-1 bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden relative">
                                        <TaskDependencyGraph
                                            tasks={filtered}
                                            selectedTaskId={progressSelectedTaskId}
                                            onSelectTask={(id) => setProgressSelectedTaskId(id)}
                                        />
                                        {!progressSelectedTaskId && (
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur shadow-sm px-4 py-2 rounded-full text-[10px] font-black text-steel-blue uppercase tracking-wider border border-steel-blue/10">
                                                Select a node to analyze its dependencies
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
