import React, { useState } from 'react';
import { usePMContext } from '../../context/PMContext';

const priorityColors = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-green-100 text-green-800 border-green-200',
};

const statusColors = {
    Open: 'bg-red-100 text-red-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Resolved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-600',
};

const leftBorderColor = {
    Critical: 'border-l-red-500',
    High: 'border-l-orange-400',
    Medium: 'border-l-yellow-400',
    Low: 'border-l-green-400',
};

const Issues = () => {
    const { issues, addIssue, updateIssue, deleteIssue, projects } = usePMContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIssue, setCurrentIssue] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');

    const [formData, setFormData] = useState({
        projectId: '', title: '', description: '', reportedBy: '',
        reportedDate: '', status: 'Open', priority: 'Medium', attachments: []
    });

    // Stats from dummy data
    const stats = {
        total: issues.length,
        open: issues.filter(i => i.status === 'Open').length,
        inProg: issues.filter(i => i.status === 'In Progress').length,
        resolved: issues.filter(i => i.status === 'Resolved').length,
        closed: issues.filter(i => i.status === 'Closed').length,
        critical: issues.filter(i => i.priority === 'Critical').length,
    };

    const getProjectName = (id) => projects.find(p => p.id === id)?.name || id;

    const filtered = issues.filter(i => {
        const matchStatus = filterStatus === 'All' || i.status === filterStatus;
        const matchPriority = filterPriority === 'All' || i.priority === filterPriority;
        return matchStatus && matchPriority;
    });

    const openModal = (issue = null) => {
        if (issue) { setCurrentIssue(issue); setFormData(issue); }
        else { setCurrentIssue(null); setFormData({ projectId: projects[0]?.id || '', title: '', description: '', reportedBy: '', reportedDate: new Date().toISOString().split('T')[0], status: 'Open', priority: 'Medium', attachments: [] }); }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setCurrentIssue(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentIssue) updateIssue(currentIssue.id, formData);
        else addIssue(formData);
        closeModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this issue?')) deleteIssue(id);
    };

    return (
        <div className="p-6 bg-concrete-light min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-steel-blue">Issues &amp; Defect Tracking</h1>
                    <p className="text-sm text-concrete mt-1">{stats.open} open issues &mdash; {stats.critical} critical</p>
                </div>
                <button onClick={() => openModal()} className="bg-steel-blue text-white px-4 py-2 rounded shadow hover:bg-steel-blue/90 transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Report Issue
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'border-steel-blue text-steel-blue' },
                    { label: 'Open', value: stats.open, color: 'border-red-400 text-red-600' },
                    { label: 'In Progress', value: stats.inProg, color: 'border-blue-400 text-blue-600' },
                    { label: 'Resolved', value: stats.resolved, color: 'border-green-400 text-green-600' },
                    { label: 'Closed', value: stats.closed, color: 'border-gray-400 text-gray-500' },
                    { label: 'Critical', value: stats.critical, color: 'border-red-600 text-red-700' },
                ].map(s => (
                    <div key={s.label} className={`bg-white rounded-lg p-3 border-l-4 ${s.color} shadow-sm`}>
                        <p className="text-xs text-concrete uppercase font-medium">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <div className="flex gap-2 flex-wrap">
                    {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filterStatus === s ? 'bg-steel-blue text-white border-steel-blue' : 'bg-white text-concrete border-concrete-light hover:border-steel-blue hover:text-steel-blue'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                    className="ml-auto border border-concrete-light rounded px-3 py-1.5 text-sm text-concrete bg-white focus:outline-none focus:border-steel-blue">
                    <option value="All">All Priorities</option>
                    {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {/* Issues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(issue => (
                    <div key={issue.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${leftBorderColor[issue.priority] || 'border-l-gray-300'} border border-concrete-light p-5 flex flex-col hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-2">
                                <span className="text-xs text-concrete font-mono">{issue.id}</span>
                                <h2 className="text-base font-bold text-gray-800 mt-0.5">{issue.title}</h2>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full shrink-0 ${statusColors[issue.status] || 'bg-gray-100 text-gray-600'}`}>{issue.status}</span>
                        </div>

                        <p className="text-xs text-blue-600 font-medium mb-2">{getProjectName(issue.projectId)}</p>
                        <p className="text-sm text-gray-500 flex-1 mb-4 line-clamp-3">{issue.description}</p>

                        <div className="space-y-2 text-sm mt-auto">
                            <div className="flex justify-between">
                                <span className="text-gray-400 text-xs">Reported By</span>
                                <span className="text-gray-700 font-medium text-xs">{issue.reportedBy}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 text-xs">Date</span>
                                <span className="text-gray-700 text-xs">{issue.reportedDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Priority</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${priorityColors[issue.priority] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{issue.priority}</span>
                            </div>
                            {issue.attachments && issue.attachments.length > 0 && (
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-gray-400 text-xs">Attachments</span>
                                    <span className="text-xs text-steel-blue font-medium">📎 {issue.attachments.length} file{issue.attachments.length > 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-concrete-light flex justify-end space-x-3">
                            <button onClick={() => openModal(issue)} className="text-steel-blue hover:text-steel-blue/80 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(issue.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-concrete">
                        <p className="text-lg font-medium">No issues match the current filters.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{currentIssue ? 'Edit Issue' : 'Report New Issue'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                    <select name="projectId" value={formData.projectId} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label><input type="text" name="reportedBy" value={formData.reportedBy} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" name="reportedDate" value={formData.reportedDate} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                        </form>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-steel-blue text-white rounded hover:bg-steel-blue/90 font-medium">Save Issue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Issues;
