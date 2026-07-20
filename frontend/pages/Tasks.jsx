import React, { useState } from 'react';
import { usePMContext } from '../../context/PMContext';

const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-800',
    'Planning': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800',
};

const Projects = () => {
    const { projects, addProject, updateProject, deleteProject } = usePMContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    const [formData, setFormData] = useState({
        name: '', location: '', startDate: '', estimatedEndDate: '',
        budget: '', status: 'Planning', progress: 0,
        projectManager: '', siteEngineer: '', description: ''
    });

    // Stats derived from dummy data
    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In Progress').length,
        planning: projects.filter(p => p.status === 'Planning').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        onHold: projects.filter(p => p.status === 'On Hold').length,
        avgProgress: projects.length
            ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length)
            : 0,
    };

    const filtered = filterStatus === 'All'
        ? projects
        : projects.filter(p => p.status === filterStatus);

    const openModal = (project = null) => {
        if (project) { setCurrentProject(project); setFormData(project); }
        else {
            setCurrentProject(null);
            setFormData({ name: '', location: '', startDate: '', estimatedEndDate: '', budget: '', status: 'Planning', progress: 0, projectManager: '', siteEngineer: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setCurrentProject(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentProject) updateProject(currentProject.id, formData);
        else addProject(formData);
        closeModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) deleteProject(id);
    };

    return (
        <div className="p-6 bg-concrete-light min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-steel-blue">Projects Management</h1>
                    <p className="text-sm text-concrete mt-1">{stats.total} projects total &mdash; {stats.inProgress} active</p>
                </div>
                <button onClick={() => openModal()} className="bg-steel-blue text-white px-4 py-2 rounded shadow hover:bg-steel-blue/90 transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add New Project
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'border-steel-blue text-steel-blue' },
                    { label: 'In Progress', value: stats.inProgress, color: 'border-blue-400 text-blue-600' },
                    { label: 'Planning', value: stats.planning, color: 'border-yellow-400 text-yellow-600' },
                    { label: 'Completed', value: stats.completed, color: 'border-green-400 text-green-600' },
                    { label: 'On Hold', value: stats.onHold, color: 'border-gray-400 text-gray-600' },
                    { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'border-amber text-amber' },
                ].map(s => (
                    <div key={s.label} className={`bg-white rounded-lg p-4 border-l-4 ${s.color} shadow-sm`}>
                        <p className="text-xs text-concrete uppercase font-medium">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['All', 'In Progress', 'Planning', 'Completed', 'On Hold'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${filterStatus === status ? 'bg-steel-blue text-white border-steel-blue' : 'bg-white text-concrete border-concrete-light hover:border-steel-blue hover:text-steel-blue'}`}
                    >{status}</button>
                ))}
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(project => (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-concrete-light p-5 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-xs text-concrete font-mono">{project.id}</span>
                                <h2 className="text-lg font-bold text-gray-800 mt-0.5">{project.name}</h2>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                                {project.status}
                            </span>
                        </div>

                        <p className="text-sm text-concrete flex items-center gap-1.5 mb-3">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {project.location}
                        </p>

                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description}</p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                            <div>
                                <span className="text-xs text-concrete block">Manager</span>
                                <span className="font-medium text-gray-800">{project.projectManager}</span>
                            </div>
                            <div>
                                <span className="text-xs text-concrete block">Engineer</span>
                                <span className="font-medium text-gray-800">{project.siteEngineer}</span>
                            </div>
                            <div>
                                <span className="text-xs text-concrete block">Start Date</span>
                                <span className="font-medium text-gray-800">{project.startDate}</span>
                            </div>
                            <div>
                                <span className="text-xs text-concrete block">Est. End Date</span>
                                <span className="font-medium text-gray-800">{project.estimatedEndDate}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-xs text-concrete block">Budget</span>
                                <span className="font-bold text-steel-blue">${Number(project.budget).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-auto">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-concrete">Progress</span>
                                <span className="font-bold text-steel-blue">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-concrete-light rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${project.progress === 100 ? 'bg-green-500' : 'bg-steel-blue'}`}
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-concrete-light flex justify-end space-x-3">
                            <button onClick={() => openModal(project)} className="text-steel-blue hover:text-steel-blue/80 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-concrete">
                        <p className="text-lg font-medium">No projects found for this filter.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{currentProject ? 'Edit Project' : 'Add New Project'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-steel-blue/30 focus:border-steel-blue outline-none" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-steel-blue/30 focus:border-steel-blue outline-none" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Est. End Date</label><input type="date" name="estimatedEndDate" value={formData.estimatedEndDate} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label><input type="number" name="budget" value={formData.budget} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Planning">Planning</option><option value="In Progress">In Progress</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label><input type="number" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label><input type="text" name="projectManager" value={formData.projectManager} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Site Engineer</label><input type="text" name="siteEngineer" value={formData.siteEngineer} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                        </form>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-steel-blue text-white rounded hover:bg-steel-blue/90 font-medium">Save Project</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
