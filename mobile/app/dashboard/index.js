import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import PlanCard from '../../components/PlanCard';
import '../../global.css';

export default function DashboardScreen() {
    const [user, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadData = useCallback(async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (!currentUser) {
                router.replace('/auth/login');
                return;
            }
            setUser(currentUser);

            // Fetch plans
            // Note: If backend requires user_id query param, passing it here.
            // Adjust if your API implementation differs.
            const data = await apiService.getFloorPlans(currentUser.id);
            // Ensure data is array (backend might return { items: [] } or just [])
            const plansList = Array.isArray(data) ? data : (data.items || []);
            setPlans(plansList);
        } catch (error) {
            console.error(error);
            Alert.alert('Errore', 'Impossibile caricare i progetti');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleLogout = async () => {
        await authService.logout();
        router.replace('/auth/login');
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <Stack.Screen
                options={{
                    headerShown: false
                }}
            />

            {/* Custom Header */}
            <View className="bg-white pt-12 pb-4 px-6 shadow-sm z-10">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Bentornato</Text>
                        <Text className="text-2xl font-bold text-tempocasa-blue-900">{user?.username}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            {isLoading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <PlanCard plan={item} />}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons name="documents-outline" size={64} color="#D1D5DB" />
                            <Text className="text-gray-400 mt-4 text-center text-lg">Nessun progetto trovato</Text>
                            <Text className="text-gray-400 text-center text-sm">Carica una piantina per iniziare</Text>
                        </View>
                    }
                />
            )}

            {/* FAB for New Project */}
            <TouchableOpacity
                className="absolute bottom-8 right-6 bg-tempocasa-green-600 w-14 h-14 rounded-full shadow-lg items-center justify-center active:scale-95"
                activeOpacity={0.9}
                onPress={() => Alert.alert('Presto disponibile', 'La funzione di upload da mobile arriverà a breve!')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}
