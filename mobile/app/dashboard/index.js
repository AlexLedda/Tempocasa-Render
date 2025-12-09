import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import '../../global.css';

// Component for individual render item
const RenderItem = ({ item }) => (
    <View className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden border border-gray-100">
        <View className="h-40 bg-gray-200">
            {item.thumbnail_url ? (
                <Image
                    source={{ uri: item.thumbnail_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-400">Nessuna anteprima</Text>
                </View>
            )}
            <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg">
                <Text className="text-xs font-semibold text-gray-700 capitalize">
                    {item.status || 'Draft'}
                </Text>
            </View>
        </View>
        <View className="p-4">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
            <Text className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })}
            </Text>
        </View>
    </View>
);

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [scans, setScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (!currentUser) {
                router.replace('/');
                return;
            }
            setUser(currentUser);

            // Fetch floors plans
            const data = await apiService.getFloorPlans(currentUser.id);
            setScans(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleLogout = async () => {
        await authService.logout();
        router.replace('/');
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#005B94" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
                <View>
                    <Text className="text-sm text-gray-500">Bentornato 👋</Text>
                    <Text className="text-xl font-bold text-tempocasa-blue-900">
                        {user?.username}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-gray-100 p-2 rounded-full"
                >
                    <Text className="text-xs text-gray-600 px-2">Esci</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
                data={scans}
                renderItem={({ item }) => <RenderItem item={item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={() => (
                    <View className="flex-1 justify-center items-center py-20">
                        <View className="w-20 h-20 bg-gray-200 rounded-full mb-4 items-center justify-center">
                            <Text className="text-3xl">🏠</Text>
                        </View>
                        <Text className="text-lg font-semibold text-gray-700 mb-2">
                            Nessun progetto
                        </Text>
                        <Text className="text-gray-500 text-center px-10">
                            Carica la tua prima planimetria per vederla qui in 3D
                        </Text>
                    </View>
                )}
            />

            {/* FAB */}
            <TouchableOpacity
                className="absolute bottom-8 right-8 w-14 h-14 bg-tempocasa-green-600 rounded-full items-center justify-center shadow-lg active:scale-95"
                activeOpacity={0.9}
                onPress={() => console.log('New Scan')}
            >
                <Text className="text-white text-3xl font-light mb-1">+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
