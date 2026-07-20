/* eslint react-refresh/only-export-components: 0 */
import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import {
    projects as dummyProjects,
    tasks as dummyTasks,
    workers as dummyWorkers,
    issues as dummyIssues,
    dailyReports as dummyReports,
    safetyObservations as dummySafety,
    stopHoldNotices as dummyNotices
} from "../assets/dummyData";

export const PMContext = createContext();

export const PMProvider = (props) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    // Initialize with dummy data so we don't need a useEffect that triggers setState.
    const [projects, setProjects] = useState(dummyProjects);
    const [tasks, setTasks] = useState(() => {
        const derivePercentFromStatus = (status) => {
            switch (status) {
                case "Completed":
                    return 100;
                case "In Progress":
                    return 50;
                case "Blocked":
                    return 25;
                case "Under Review":
                    return 75;
                case "On Hold":
                    return 20;
                case "To Do":
                default:
                    return 0;
            }
        };

        const ensureProgressNotes = (task) => {
            const startDate = task?.startDate ? new Date(task.startDate) : new Date();
            const endDate = task?.endDate ? new Date(task.endDate) : new Date();

            const currentStatus = task?.status || "To Do";
            const currentPercent =
                typeof task?.percentComplete === "number" && !Number.isNaN(task.percentComplete)
                    ? task.percentComplete
                    : derivePercentFromStatus(currentStatus);

            const notes = Array.isArray(task?.progressNotes) ? [...task.progressNotes] : [];

            const hasInitialZero = notes.some((n) => {
                const note = n?.note || "";
                const match = /PROGRESS_PERCENT:(\d+)/.exec(note);
                return match && Number(match[1]) === 0;
            });

            if (!hasInitialZero) {
                notes.push({
                    note: `PROGRESS_PERCENT:0;STATUS:To Do`,
                    createdBy: null,
                    createdAt: startDate.toISOString(),
                });
            }

            // If task already shows 0% in current status, don't add an extra "current" point.
            if (currentPercent > 0 && !notes.some((n) => {
                const note = n?.note || "";
                const match = /PROGRESS_PERCENT:(\d+)/.exec(note);
                return match && Number(match[1]) === currentPercent;
            })) {
                notes.push({
                    note: `PROGRESS_PERCENT:${currentPercent};STATUS:${currentStatus}`,
                    createdBy: null,
                    createdAt: endDate.toISOString(),
                });
            }

            return {
                ...task,
                percentComplete: typeof task?.percentComplete === "number" ? task.percentComplete : currentPercent,
                progressNotes: notes,
            };
        };

        return dummyTasks.map(ensureProgressNotes);
    });
    const [workers, setWorkers] = useState(dummyWorkers);
    const [issues, setIssues] = useState(dummyIssues);
    const [dailyReports, setDailyReports] = useState(dummyReports);
    const [safetyObservations, setSafetyObservations] = useState(dummySafety);
    const [stopHoldNotices, setStopHoldNotices] = useState(dummyNotices);

    // --- Fetch Functions (Dummy Data Simulated) ---

    const fetchProjects = () => {
        setProjects(dummyProjects);
    };

    const fetchTasks = async () => {
        try {
            if (isSignedIn) {
                const token = await getToken();
                const validBackendProjectId = "69c5f44d6d96266f92632953";
                
                const response = await axios.get(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                // Format backend tasks to match UI expectations
                const backendTasks = response.data.tasks.map(t => ({
                    ...t,
                    id: t._id, // critical for the frontend 'id' field
                    projectId: validBackendProjectId,
                    status: t.status === "Not Started" ? "To Do" : t.status,
                    progressNotes: t.progressNotes || []
                }));

                // Set combining existing dummy tasks to keep the full experience
                setTasks([...dummyTasks, ...backendTasks]);
            } else {
                setTasks(dummyTasks);
            }
        } catch (error) {
            console.error("Failed to fetch tasks from backend:", error);
            setTasks(dummyTasks); // fallback strictly to dummy
        }
    };

    // Automatically load user's real database tasks once Clerk signs them in securely
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchTasks();
        }
    }, [isLoaded, isSignedIn]);

    const fetchWorkers = () => {
        setWorkers(dummyWorkers);
    };

    const fetchIssues = () => {
        setIssues(dummyIssues);
    };

    const fetchDailyReports = () => {
        setDailyReports(dummyReports);
    };

    const fetchSafetyObservations = () => {
        setSafetyObservations(dummySafety);
    };

    const fetchStopHoldNotices = () => {
        setStopHoldNotices(dummyNotices);
    };

    // --- Shared Helpers for CRUD ---

    const upsertById = (collection, item, prefix) => {
        if (item.id) {
            return collection.map(colItem => {
                if (colItem.id === item.id) {
                    // Start with the existing item
                    const merged = { ...colItem, ...item };
                    
                    // Specific logic for tasks: if the update doesn't include progressNotes,
                    // we must preserve the existing ones to avoid overwriting recent updates
                    // from recordTaskProgress.
                    if (prefix === 'TASK' && item.progressNotes === undefined) {
                        merged.progressNotes = colItem.progressNotes;
                    }
                    
                    return merged;
                }
                return colItem;
            });
        }
        return [...collection, { ...item, id: `${prefix}-${Date.now()}` }];
    };

    const deriveStatusFromPercent = (percent) => {
        const p = Number(percent);
        if (p === 0) return "To Do";
        if (p === 100) return "Completed";
        return "In Progress";
    };

    const removeById = (collection, id) => {
        return collection.filter(item => item.id !== id);
    };

    const addProgressNoteToTask = (task, note) => {
        const notes = Array.isArray(task?.progressNotes) ? [...task.progressNotes] : [];
        notes.push(note);
        return { ...task, progressNotes: notes };
    };

    // --- CRUD Functions ---

    // Projects
    const addProject = (project) => setProjects(prev => upsertById(prev, project, 'PROJ'));
    const updateProject = (id, updated) => setProjects(prev => upsertById(prev, { ...updated, id }, 'PROJ'));
    const deleteProject = (id) => setProjects(prev => removeById(prev, id));

    // Tasks
    const addTask = async (task) => {
        const startDate = task?.startDate ? new Date(task.startDate) : new Date();
        const currentStatus = task?.status || "To Do";
        
        let currentPercent = 0;
        if (typeof task?.percentComplete === "number" && !Number.isNaN(task.percentComplete)) {
            currentPercent = task.percentComplete;
        } else if (currentStatus === "Completed") {
            currentPercent = 100;
        } else if (currentStatus === "In Progress") {
            currentPercent = 50;
        } else if (currentStatus === "Blocked") {
            currentPercent = 25;
        }

        const progressNotes = [
            { note: `PROGRESS_PERCENT:0;STATUS:To Do`, createdBy: null, createdAt: startDate.toISOString() },
        ];
        if (currentPercent > 0) {
            progressNotes.push({
                note: `PROGRESS_PERCENT:${currentPercent};STATUS:${currentStatus}`,
                createdBy: null,
                createdAt: task?.endDate ? new Date(task.endDate).toISOString() : new Date().toISOString(),
            });
        }

        const newTaskObj = { ...task, percentComplete: currentPercent, progressNotes };

        if (!isSignedIn) {
            console.warn("User not signed in, saving to local context only.");
            setTasks(prev => upsertById(prev, newTaskObj, "TASK"));
            return;
        }

        try {
            const token = await getToken();
            const backendStatus = currentStatus === "To Do" ? "Not Started" : currentStatus;
            
            // Force valid MongoDB ObjectId for project to prevent backend 400 validation error
            const validBackendProjectId = "69c5f44d6d96266f92632953";
            
            const response = await axios.post(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks`, {
                name: task.name,
                description: task.description || "No description provided",
                status: backendStatus,
                priority: task.priority || "Medium",
                startDate: startDate.toISOString(),
                endDate: task.endDate ? new Date(task.endDate).toISOString() : new Date().toISOString(),
                percentComplete: currentPercent
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const dbTask = response.data.task;
            
            // Add to UI context array explicitly with the real MongoDB ObjectId
            setTasks(prev => [...prev, { ...newTaskObj, projectId: validBackendProjectId, id: dbTask._id }]);
            
        } catch (error) {
            console.error("Failed to add task to database:", error.response?.data || error.message);
            setTasks(prev => upsertById(prev, newTaskObj, "TASK"));
        }
    };

    const updateTask = async (id, updated) => {
        // Optimistic UI update
        setTasks(prev => upsertById(prev, { ...updated, id }, 'TASK'));

        if (!isSignedIn || String(id).startsWith("TASK-")) {
            // Cannot update dummy tasks in the backend
            return;
        }

        try {
            const token = await getToken();
            const backendStatus = updated.status === "To Do" ? "Not Started" : updated.status;
            const validBackendProjectId = "69c5f44d6d96266f92632953";

            await axios.put(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks/${id}`, {
                name: updated.name,
                description: updated.description,
                status: backendStatus,
                priority: updated.priority,
                startDate: updated.startDate ? new Date(updated.startDate).toISOString() : undefined,
                endDate: updated.endDate ? new Date(updated.endDate).toISOString() : undefined,
                percentComplete: updated.percentComplete
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            console.log("Updated task successfully in DB!");
        } catch (error) {
            console.error("Failed to update task in DB:", error.response?.data || error.message);
            alert("Warning: Failed to sync task update to backend DB.");
        }
    };

    const deleteTask = async (id) => {
        // Optimistic UI deletion
        setTasks(prev => removeById(prev, id));
        if (!isSignedIn || String(id).startsWith("TASK-")) return;

        try {
            const token = await getToken();
            const validBackendProjectId = "69c5f44d6d96266f92632953";
            await axios.patch(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks/${id}/cancel`, {
                reason: "Deleted from frontend PM UI"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Deleted task successfully from DB!");
        } catch (error) {
            console.error("Failed to delete task from DB:", error);
            alert("Warning: Failed to sync deletion to backend DB.");
        }
    };

    const recordTaskProgress = async (taskId, editedByUserId, percent) => {
        const p = clamp(Number(percent), 0, 100);
        const status = deriveStatusFromPercent(p);
        const createdAt = new Date().toISOString();

        const note = {
            note: `PROGRESS_PERCENT:${p};STATUS:${status}`,
            createdBy: editedByUserId || null,
            createdAt,
        };

        // Optimistic UI update
        setTasks(prev =>
            prev.map((t) => {
                if (t.id !== taskId) return t;
                return addProgressNoteToTask(
                    {
                        ...t,
                        percentComplete: p,
                        status,
                    },
                    note
                );
            })
        );

        if (!isSignedIn || String(taskId).startsWith("TASK-")) {
            return;
        }

        try {
            const token = await getToken();
            const validBackendProjectId = "69c5f44d6d96266f92632953";
            const backendStatus = status === "To Do" ? "Not Started" : status;

            // 1. Send the progress note natively to the backend notes endpoint
            await axios.post(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks/${taskId}/notes`, {
                note: note.note
            }, { headers: { Authorization: `Bearer ${token}` } });

            // 2. Put the task to sync the actual scalar values
            await axios.put(`http://localhost:5000/api/projects/${validBackendProjectId}/tasks/${taskId}`, {
                percentComplete: p,
                status: backendStatus
            }, { headers: { Authorization: `Bearer ${token}` } });

        } catch (error) {
            console.error("Failed to sync task progress to database:", error);
        }
    };

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    // Workers
    const addWorker = (worker) => setWorkers(prev => upsertById(prev, worker, 'WRK'));
    const updateWorker = (id, updated) => setWorkers(prev => upsertById(prev, { ...updated, id }, 'WRK'));
    const deleteWorker = (id) => setWorkers(prev => removeById(prev, id));

    // Issues
    const addIssue = (issue) => setIssues(prev => upsertById(prev, issue, 'ISS'));
    const updateIssue = (id, updated) => setIssues(prev => upsertById(prev, { ...updated, id }, 'ISS'));
    const deleteIssue = (id) => setIssues(prev => removeById(prev, id));

    // Daily Reports
    const addDailyReport = (report) => setDailyReports(prev => upsertById(prev, report, 'REP'));
    const updateDailyReport = (id, updated) => setDailyReports(prev => upsertById(prev, { ...updated, id }, 'REP'));
    const deleteDailyReport = (id) => setDailyReports(prev => removeById(prev, id));

    // Safety Observations
    const addSafetyObservation = (obs) => setSafetyObservations(prev => upsertById(prev, obs, 'SAF'));
    const updateSafetyObservation = (id, updated) => setSafetyObservations(prev => upsertById(prev, { ...updated, id }, 'SAF'));
    const deleteSafetyObservation = (id) => setSafetyObservations(prev => removeById(prev, id));

    // Stop and Hold Notices
    const addStopHoldNotice = (notice) => setStopHoldNotices(prev => upsertById(prev, notice, 'SHN'));
    const updateStopHoldNotice = (id, updated) => setStopHoldNotices(prev => upsertById(prev, { ...updated, id }, 'SHN'));
    const deleteStopHoldNotice = (id) => setStopHoldNotices(prev => removeById(prev, id));


    // --- Computed Helper Functions ---

    const getProjectTasks = (projectId) => {
        return tasks.filter(task => task.projectId === projectId);
    };

    const getProjectIssues = (projectId) => {
        return issues.filter(issue => issue.projectId === projectId);
    };

    const calculateProjectProgress = (projectId) => {
        const projectTasks = getProjectTasks(projectId);
        if (projectTasks.length === 0) return 0;
        const completedTasks = projectTasks.filter(task => task.status === "Completed").length;
        return Math.round((completedTasks / projectTasks.length) * 100);
    };

    const countOpenIssues = (projectId) => {
        return getProjectIssues(projectId).filter(issue => issue.status === "Open" || issue.status === "In Progress").length;
    };

    const getWorkerTaskLoad = (workerId) => {
        return tasks.filter(task => task.assignedTo && task.assignedTo.includes(workerId) && task.status !== "Completed").length;
    };

    const getOverdueTasks = (referenceDate) => {
        const refDateObj = new Date(referenceDate);
        return tasks.filter(task => {
            if (task.status === "Completed") return false;
            const dueDate = new Date(task.endDate);
            return dueDate < refDateObj;
        });
    };

    // Note: we intentionally avoid fetching/setState in useEffect to prevent
    // render-cascade warnings during linting.

    // --- Context Value ---

    const value = {
        projects, tasks, workers, issues, dailyReports, safetyObservations, stopHoldNotices,
        fetchProjects, fetchTasks, fetchWorkers, fetchIssues, fetchDailyReports, fetchSafetyObservations, fetchStopHoldNotices,
        addProject, updateProject, deleteProject,
        addTask, updateTask, deleteTask,
        addWorker, updateWorker, deleteWorker,
        addIssue, updateIssue, deleteIssue,
        addDailyReport, updateDailyReport, deleteDailyReport,
        addSafetyObservation, updateSafetyObservation, deleteSafetyObservation,
        addStopHoldNotice, updateStopHoldNotice, deleteStopHoldNotice,
        recordTaskProgress,
        getProjectTasks, getProjectIssues, calculateProjectProgress, countOpenIssues, getWorkerTaskLoad, getOverdueTasks
    };

    return (
        <PMContext.Provider value={value}>
            {props.children}
        </PMContext.Provider>
    );
};

export const usePMContext = () => useContext(PMContext);
