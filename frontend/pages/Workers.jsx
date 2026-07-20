import React, { useState } from 'react';
import { usePMContext } from '../../context/PMContext';

const SafetyNotices = () => {
    const {
        safetyObservations, addSafetyObservation, updateSafetyObservation, deleteSafetyObservation,
        stopHoldNotices, addStopHoldNotice, updateStopHoldNotice, deleteStopHoldNotice,
        projects
    } = usePMContext();

    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [currentSafety, setCurrentSafety] = useState(null);
    const [safetyFormData, setSafetyFormData] = useState({
        projectId: '', date: '', observer: '', type: 'Hazard',
        description: '', actionTaken: '', status: 'Open', severity: 'Low'
    });

    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [currentNotice, setCurrentNotice] = useState(null);
    const [noticeFormData, setNoticeFormData] = useState({
        projectId: '', dateIssued: '', issuedBy: '', reason: '',
        affectedArea: '', status: 'Active', dateLifted: '', resolution: ''
    });

    const getProjectName = (id) => projects.find(p => p.id === id)?.name || id;

    // Stats from dummy data
    const safetyStats = {
        total: safetyObservations.length,
        hazards: safetyObservations.filter(o => o.type === 'Hazard').length,
        nearMiss: safetyObservations.filter(o => o.type === 'Near Miss').length,
        bestPractice: safetyObservations.filter(o => o.type === 'Best Practice').length,
        highSeverity: safetyObservations.filter(o => o.severity === 'High').length,
    };

    const noticeStats = {
        total: stopHoldNotices.length,
        active: stopHoldNotices.filter(n => n.status === 'Active').length,
        lifted: stopHoldNotices.filter(n => n.status === 'Lifted').length,
    };

    // Safety Observation Handlers
    const openSafetyModal = (obs = null) => {
        if (obs) { setCurrentSafety(obs); setSafetyFormData(obs); }
        else { setCurrentSafety(null); setSafetyFormData({ projectId: projects[0]?.id || '', date: new Date().toISOString().split('T')[0], observer: '', type: 'Hazard', description: '', actionTaken: '', status: 'Open', severity: 'Low' }); }
        setIsSafetyModalOpen(true);
    };

    const handleSafetyChange = (e) => setSafetyFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSafetySubmit = (e) => {
        e.preventDefault();
        if (currentSafety) updateSafetyObservation(currentSafety.id, safetyFormData);
        else addSafetyObservation(safetyFormData);
        setIsSafetyModalOpen(false);
    };

    const handleSafetyDelete = (id) => {
        if (window.confirm('Delete this safety observation?')) deleteSafetyObservation(id);
    };

    // Stop/Hold Notice Handlers
    const openNoticeModal = (notice = null) => {
        if (notice) { setCurrentNotice(notice); setNoticeFormData(notice); }
        else { setCurrentNotice(null); setNoticeFormData({ projectId: projects[0]?.id || '', dateIssued: new Date().toISOString().split('T')[0], issuedBy: '', reason: '', affectedArea: '', status: 'Active', dateLifted: '', resolution: '' }); }
        setIsNoticeModalOpen(true);
    };

    const handleNoticeChange = (e) => setNoticeFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleNoticeSubmit = (e) => {
        e.preventDefault();
        if (currentNotice) updateStopHoldNotice(currentNotice.id, noticeFormData);
        else addStopHoldNotice(noticeFormData);
        setIsNoticeModalOpen(false);
    };

    const handleNoticeDelete = (id) => {
        if (window.confirm('Delete this stop/hold notice?')) deleteStopHoldNotice(id);
    };

    const typeColors = {
        Hazard: 'bg-red-100 text-red-800 border-red-200',
        'Near Miss': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Best Practice': 'bg-green-100 text-green-800 border-green-200',
    };

    const severityDot = {
        High: 'bg-red-500',
        Medium: 'bg-yellow-500',
        Low: 'bg-green-500',
    };

    return (
        <div className="p-6 bg-concrete-light min-h-full space-y-10">

            {/* ===== SAFETY OBSERVATIONS ===== */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-steel-blue">Safety Observations</h1>
                        <p className="text-sm text-concrete mt-1">{safetyStats.total} observations &mdash; {safetyStats.hazards} hazards, {safetyStats.highSeverity} high severity</p>
                    </div>
                    <button onClick={() => openSafetyModal()} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Observation
                    </button>
                </div>

                {/* Safety Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    {[
                        { label: 'Total', value: safetyStats.total, color: 'border-steel-blue text-steel-blue' },
                        { label: 'Hazards', value: safetyStats.hazards, color: 'border-red-400 text-red-600' },
                        { label: 'Near Misses', value: safetyStats.nearMiss, color: 'border-yellow-400 text-yellow-600' },
                        { label: 'Best Practice', value: safetyStats.bestPractice, color: 'border-green-400 text-green-600' },
                        { label: 'High Severity', value: safetyStats.highSeverity, color: 'border-red-600 text-red-700' },
                    ].map(s => (
                        <div key={s.label} className={`bg-white rounded-lg p-3 border-l-4 ${s.color} shadow-sm`}>
                            <p className="text-xs text-concrete uppercase font-medium">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safetyObservations.map(obs => (
                        <div key={obs.id} className="bg-white rounded-xl shadow-sm border border-concrete-light p-5 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${severityDot[obs.severity] || 'bg-gray-400'}`} title={`${obs.severity} severity`} />
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${typeColors[obs.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{obs.type}</span>
                                </div>
                                <span className="text-xs text-concrete font-medium">{obs.date}</span>
                            </div>

                            <p className="text-xs text-blue-600 font-medium mb-2">{getProjectName(obs.projectId)}</p>
                            <p className="text-sm text-gray-800 flex-1 mb-3">{obs.description}</p>

                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-3 border border-gray-100">
                                <span className="font-semibold text-gray-700">Action Taken: </span>{obs.actionTaken}
                            </div>

                            <div className="flex justify-between items-center text-sm pt-2 border-t border-concrete-light">
                                <span className="text-gray-500 text-xs">Observer: <span className="font-medium text-gray-700">{obs.observer}</span></span>
                                <span className={`text-xs font-semibold ${obs.status === 'Resolved' || obs.status === 'Closed' ? 'text-green-600' : 'text-orange-500'}`}>{obs.status}</span>
                            </div>

                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-xs text-concrete">Severity: <span className={`font-bold ${obs.severity === 'High' ? 'text-red-600' : obs.severity === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{obs.severity}</span></span>
                                <div className="flex gap-3">
                                    <button onClick={() => openSafetyModal(obs)} className="text-steel-blue hover:text-steel-blue/80 text-xs font-medium">Edit</button>
                                    <button onClick={() => handleSafetyDelete(obs.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {safetyObservations.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-concrete">No safety observations recorded.</div>
                    )}
                </div>
            </div>

            {/* ===== STOP / HOLD NOTICES ===== */}
            <div>
                <div className="flex justify-between items-center mb-6 border-t border-concrete-light pt-10">
                    <div>
                        <h1 className="text-2xl font-bold text-red-700">Stop / Hold Notices</h1>
                        <p className="text-sm text-concrete mt-1">{noticeStats.total} notices &mdash; <span className="text-red-600 font-semibold">{noticeStats.active} active</span>, {noticeStats.lifted} lifted</p>
                    </div>
                    <button onClick={() => openNoticeModal()} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        Issue Notice
                    </button>
                </div>

                {/* Notice Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Notices', value: noticeStats.total, color: 'border-steel-blue text-steel-blue' },
                        { label: 'Active', value: noticeStats.active, color: 'border-red-500 text-red-600' },
                        { label: 'Lifted', value: noticeStats.lifted, color: 'border-green-400 text-green-600' },
                    ].map(s => (
                        <div key={s.label} className={`bg-white rounded-lg p-4 border-l-4 ${s.color} shadow-sm`}>
                            <p className="text-xs text-concrete uppercase font-medium">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stopHoldNotices.map(notice => (
                        <div key={notice.id} className={`bg-white rounded-xl shadow-sm border border-concrete-light border-l-4 ${notice.status === 'Active' ? 'border-l-red-500' : 'border-l-green-500'} p-5 flex flex-col hover:shadow-md transition-shadow`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-xs text-concrete font-mono">{notice.id}</span>
                                    <h3 className="font-bold text-gray-800 text-base mt-0.5">{notice.affectedArea}</h3>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${notice.status === 'Active' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'}`}>{notice.status}</span>
                            </div>

                            <p className="text-xs text-blue-600 font-medium mb-3">{getProjectName(notice.projectId)}</p>

                            <div className="text-sm text-gray-700 mb-3 bg-red-50 p-3 rounded-lg border border-red-100 flex-shrink-0">
                                <strong className="text-red-800">Reason: </strong>{notice.reason}
                            </div>

                            {notice.resolution && (
                                <div className="text-xs text-gray-600 mb-3 bg-green-50 p-3 rounded-lg border border-green-100">
                                    <strong className="text-green-800">Resolution: </strong>{notice.resolution}
                                </div>
                            )}

                            <div className="text-xs text-gray-500 space-y-1 mt-auto pt-3 border-t border-concrete-light">
                                <p>Issued by <span className="font-medium text-gray-700">{notice.issuedBy}</span> on {notice.dateIssued}</p>
                                {notice.dateLifted && <p>Lifted on <span className="font-medium text-green-700">{notice.dateLifted}</span></p>}
                            </div>

                            <div className="mt-3 flex justify-end gap-3">
                                <button onClick={() => openNoticeModal(notice)} className="text-steel-blue hover:text-steel-blue/80 text-xs font-medium">Edit</button>
                                <button onClick={() => handleNoticeDelete(notice.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                            </div>
                        </div>
                    ))}
                    {stopHoldNotices.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-concrete">No stop/hold notices issued.</div>
                    )}
                </div>
            </div>

            {/* Safety Observation Modal */}
            {isSafetyModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{currentSafety ? 'Edit Observation' : 'Add Observation'}</h3>
                            <button type="button" onClick={() => setIsSafetyModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSafetySubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                    <select name="projectId" value={safetyFormData.projectId} onChange={handleSafetyChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" name="date" value={safetyFormData.date} onChange={handleSafetyChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Observer</label><input type="text" name="observer" value={safetyFormData.observer} onChange={handleSafetyChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select name="type" value={safetyFormData.type} onChange={handleSafetyChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Hazard">Hazard</option><option value="Best Practice">Best Practice</option><option value="Near Miss">Near Miss</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={safetyFormData.status} onChange={handleSafetyChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Open">Open</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                    <select name="severity" value={safetyFormData.severity} onChange={handleSafetyChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={safetyFormData.description} onChange={handleSafetyChange} rows="2" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label><textarea name="actionTaken" value={safetyFormData.actionTaken} onChange={handleSafetyChange} rows="2" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                        </form>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsSafetyModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                            <button type="button" onClick={handleSafetySubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stop/Hold Notice Modal */}
            {isNoticeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{currentNotice ? 'Edit Notice' : 'Issue Stop/Hold Notice'}</h3>
                            <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleNoticeSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                    <select name="projectId" value={noticeFormData.projectId} onChange={handleNoticeChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Issued</label><input type="date" name="dateIssued" value={noticeFormData.dateIssued} onChange={handleNoticeChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label><input type="text" name="issuedBy" value={noticeFormData.issuedBy} onChange={handleNoticeChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Affected Area</label><input type="text" name="affectedArea" value={noticeFormData.affectedArea} onChange={handleNoticeChange} required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" value={noticeFormData.status} onChange={handleNoticeChange} className="w-full border border-gray-300 rounded px-3 py-2">
                                        <option value="Active">Active</option><option value="Lifted">Lifted</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Lifted (if applicable)</label><input type="date" name="dateLifted" value={noticeFormData.dateLifted || ''} onChange={handleNoticeChange} className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason for Stop/Hold</label><textarea name="reason" value={noticeFormData.reason} onChange={handleNoticeChange} rows="2" required className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Resolution Details</label><textarea name="resolution" value={noticeFormData.resolution} onChange={handleNoticeChange} rows="2" className="w-full border border-gray-300 rounded px-3 py-2" /></div>
                        </form>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                            <button type="button" onClick={handleNoticeSubmit} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">Save Notice</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SafetyNotices;
