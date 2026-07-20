import EventEmitter from "events";
import { syncProjectProgress } from "../utils/projectSync.js";

class EventProvider extends EventEmitter { }
const EventService = new EventProvider();

// Listen to specific domain events to trigger complex, non-blocking calculations

EventService.on("project:syncProgress", async (projectId) => {
    try {
        if (!projectId) return;
        // Asynchronously run the progress calculation and save it to the DB
        await syncProjectProgress(projectId);
        console.log(`[EventService] Successfully synced progress for project: ${projectId}`);
    } catch (error) {
        console.error(`[EventService] Failed to sync progress for project ${projectId}:`, error);
    }
});

// We can add more async events here later (e.g., sending emails, slack notifications)
// EventService.on("user:registered", ...)

export default EventService;
