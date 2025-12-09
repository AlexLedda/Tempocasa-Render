const API_URL = 'https://vision-3d-render.com/api';

export const apiService = {
    async getFloorPlans(userId) {
        try {
            const response = await fetch(`${API_URL}/floorplans?user_id=${userId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching floor plans:', error);
            throw error;
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
