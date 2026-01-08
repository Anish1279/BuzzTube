import axios from "axios";

export const RunStatus = async (eventId: string) => {
    // Calls your own secure route (no keys needed here)
    const response = await axios.get(`/api/inngest-status?eventId=${eventId}`);
    return response.data.data; 
}