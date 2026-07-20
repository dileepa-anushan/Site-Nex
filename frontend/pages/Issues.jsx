import React, { useState } from 'react';
import { usePMContext } from '../../context/PMContext';

const DailyReports = () => {
    const { dailyReports, addDailyReport, updateDailyReport, deleteDailyReport, projects } = usePMContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [filterProject, setFilterProject] = useState('All');

    const [formData, setFormData] = useState({
        projectId: '', date: '', submittedBy: '', weather: '',
        workCompleted: '', materialsUsed: '', equipmentOnSite: '', workerCount: 0, notes: ''
    });

    // Stats from dummy data
    const stats = {
        total: dailyReports.length,
        totalWorkers: dailyReports.reduce((sum, r) => sum + (r.workerCount || 0), 0),
        projects: [...new Set(dailyReports.map(r => r.projectId))].length,
        latest: dailyReports.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || '—',
    };

    const getProjectName = (id) => projects.find(p => p.id === id)?.name || id;

    const filtered = filterProject === 'All'
        ? [...dailyReports].sort((a, b) => new Date(b.date) - new Date(a.date))
        : [...dailyReports].filter(r => r.projectId === filterProject).sort((a, b) => new Date(b.date) - new Date(a.date));

    const openModal = (report = null) => {
        if (report) {
            setCurrentReport(report);
            setFormData({ ...report, equipmentOnSite: report.equipmentOnSite ? report.equipmentOnSite.join(', ') : '' });
        } else {
            setCurrentReport(null);
            setFormData({ projectId: projects[0]?.id || '', date: new Date().toISOString().split('T')[0], submittedBy: '', weather: '', workCompleted: '', materialsUsed: '', equipmentOnSite: '', workerCount: 0, notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setCurrentReport(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const processedData = {
            ...formData,
            equipmentOnSite: formData.equipmentOnSite.split(',').map(item => item.trim()).filter(Boolean)
        };
        if (currentReport) updateDailyReport(currentReport.id, processedData);
        else addDailyReport(processedData);
        closeModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this report?')) deleteDailyReport(id);
    };

    const weatherIcon = (weather = '') => {
        if (weather.toLowerCase().includes('rain')) return '🌧️';
        if (weather.toLowerCase().includes('cloud') || weather.toLowerCase().includes('overcast')) return '☁️';
        if (weather.toLowerCase().includes('sun') || weather.toLowerCase().includes('clear')) return '☀️';
        return '🌤️';
    };

    return (
        <div className="p-6 bg-concrete-light min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-steel-blue">Daily Log &amp; Reports</h1>
                    <p className="text-sm text-concrete mt-1">{stats.total} reports across {stats.projects} projects &mdash; latest: {stats.latest}</p>
                </div>
                <button onClick={() => openModal()} className="bg-steel-blue text-white px-4 py-2 rounded shadow hover:bg-steel-blue/90 transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Daily Report
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Reports', value: stats.total, color: 'border-steel-blue text-steel-blue' },
                    { label: 'Projects Covered', value: stats.projects, color: 'border-blue-400 text-blue-600' },
                    { label: 'Worker Logs', value: stats.totalWorkers, color: 'border-green-400 text-green-600' },
                    { label: 'Latest Report', value: stats.latest, color: 'border-amber text-amber' },
                ].map(s => (
                    <div key={s.label} className={`bg-white rounded-lg p-4 border-l-4 ${s.color} shadow-sm`}>
                        <p className="text-xs text-concrete uppercase font-medium">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color.split(' ')[1]} mt-1`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Project Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button onClick={() => setFilterProject('All')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${filterProject === 'All' ? 'bg-steel-blue text-white border-steel-blue' : 'bg-white text-concrete border-concrete-light hover:border-steel-blue hover:text-steel-blue'}`}>
                    All Projects
                </button>
                {projects.map(p => (
                    <button key={p.id} onClick={() => setFilterProject(p.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition truncate max-w-[200px] ${filterProject === p.id ? 'bg-steel-blue text-white border-steel-blue' : 'bg-white text-concrete border-concrete-light hover:border-steel-blue hover:text-steel-blue'}`}>
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(report => (
                    <div key={report.id} className="bg-white rounded-xl shadow-sm border border-concrete-light p-5 flex flex-col hover:shadow-md transition-shadow">
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-steel-blue/10 text-steel-blue rounded-lg p-2.5 text-center min-w-[52px]">
                                <div className="text-xs font-bold uppercase">
                                    {new Date(report.date).toLocaleString('default', { month: 'short' })}
                                </div>
                                <div className="text-2xl font-bold leading-none">
                                    {new Date(report.date).getDate()}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs text-concrete font-mono">{report.id}</span>
                                <p className="text-sm font-bold text-gray-800">{getProjectName(report.projectId)}</p>
                                <p className="text-xs text-concrete">by {report.submittedBy}</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            {/* Weather */}
                            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                                <span className="text-lg">{weatherIcon(report.weather)}</span>
                                <span className="text-sm text-blue-800 font-medium">{report.weather}</span>
                            </div>

                            {/* Work Completed */}
                            <div>
                                <span className="text-xs text-concrete uppercase font-medium block mb-1">Work Completed</span>
                                <p className="text-sm text-gray-700 line-clamp-3">{report.workCompleted}</p>
                            </div>

                            {/* Materials Used */}
                            {report.materialsUsed && (
                                <div>
                                    <span className="text-xs text-concrete uppercase font-medium block mb-1">Materials Used</span>
                                    <p className="text-xs text-gray-600">{report.materialsUsed}</p>
                                </div>
                            )}

                            {/* Equipment */}
                            {report.equipmentOnSite && report.equipmentOnSite.length > 0 && (
                                <div>
                                    <span className="text-xs text-concrete uppercase font-medium block mb-1">Equipment On Site</span>
                                    <div className="flex flex-wrap gap-1">
                                        {report.equipmentOnSite.map((eq, i) => (
                                            <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{eq}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer row */}
                            <div className="flex justify-between pt-2 border-t border-concrete-light text-xs">
                                <span className="text-concrete">👷 {report.workerCount} workers</span>
                                {report.notes && <span className="text-amber font-medium truncate ml-2" title={report.notes}>📝 Notes</span>}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-concrete-light flex justify-end space-x-3">
                            <button onClick={() => openModal(report)} className="text-steel-blue hover:text-steel-blue/80 text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(report.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-concrete">
                        <p className="text-lg font-medium">No reports found for this project.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{currentReport ? 'Edit Daily Report' : 'Add Daily Report'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                    <select name="projectId" value={formData.projectId} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label><input type="text" name="submittedBy" value={formData.submittedBy} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Weather Condition</label><input type="text" name="weather" placeholder="e.g. Clear, 75°F" value={formData.weather} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Worker Count</label><input type="number" name="workerCount" value={formData.workerCount} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Work Completed</label><textarea name="workCompleted" value={formData.workCompleted} onChange={handleChange} rows="2" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Materials Used</label><textarea name="materialsUsed" value={formData.materialsUsed} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Equipment On Site (comma separated)</label><textarea name="equipmentOnSite" placeholder="Excavator (1), Concrete Mixer (2)" value={formData.equipmentOnSite} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                        </form>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-steel-blue text-white rounded hover:bg-steel-blue/90 font-medium">Save Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReports;
