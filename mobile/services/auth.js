import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const USER_KEY = 'tempocasa_user';

export const authService = {
    async login(username) {
        try {
            // Simulate backend user ID generation (since backend uses user_id context)
            // In a real app, this would be a POST /api/auth/login
            const userId = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                username
            );

            const user = {
                id: userId.slice(0, 12), // Keep it short
                username: username,
                isGuest: false
            };

            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async getCurrentUser() {
        try {
            const jsonValue = await AsyncStorage.getItem(USER_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }
};
