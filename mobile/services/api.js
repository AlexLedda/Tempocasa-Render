const API_URL = 'https://vision-3d-render.com/api';

export const apiService = {
    async getFloorPlans(userId) {
        try {
            const response = await fetch(`${API_URL}/floorplans?user_id=${userId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) return [];
                throw new Error(`Server returned ${response.status}`);
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                throw new Error("Invalid format failure");
            }
        } catch (error) {
            console.error('Error fetching floor plans:', error);
            // Return empty array to avoid crashing UI on network error
            return [];
        }
    },

    async getFloorPlan(id) {
        try {
            const response = await fetch(`${API_URL}/floorplans/${id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching floor plan:', error);
            throw error;
        }
    }
};
