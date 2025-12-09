import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Text, Image, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import '../../global.css';

export default function PlanDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlanDetails();
    }, [id]);

    const loadPlanDetails = async () => {
        try {
            const data = await apiService.getFloorPlan(id);
            setPlan(data);
        } catch (error) {
            Alert.alert('Errore', 'Impossibile caricare i dettagli del progetto');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!plan?.original_image_url) return;
        try {
            await Share.share({
                message: `Guarda il mio progetto Tempocasa Render: ${plan.address || 'Nuovo Progetto'}`,
                url: plan.original_image_url,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <StatusBar style="dark" />
                <Text>Caricamento...</Text>
            </View>
        );
    }

    if (!plan) return null;

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Sticky Header with Image */}
            <ScrollView className="flex-1" bounces={false}>
                <View className="relative h-72 bg-gray-900">
                    <Image
                        source={{ uri: plan.processed_image_url || plan.original_image_url }}
                        className="w-full h-full opacity-90"
                        resizeMode="cover"
                    />

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        className="absolute top-12 left-6 bg-white/20 p-2 rounded-full backdrop-blur-md"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Share Button Overlay */}
                    <TouchableOpacity
                        className="absolute top-12 right-6 bg-white/20 p-2 rounded-full backdrop-blur-md"
                        onPress={handleShare}
                    >
                        <Ionicons name="share-outline" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <Text className="text-white text-2xl font-bold font-display">
                            {plan.address || `Progetto #${plan.id.substring(0, 6)}`}
                        </Text>
                        <Text className="text-white/80 text-base">
                            {plan.city || 'Posizione non specificata'}
                        </Text>
                    </View>
                </View>

                {/* Details Body */}
                <View className="p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center space-x-2">
                            <View className={`px-3 py-1 rounded-full ${plan.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                <Text className={`text-sm font-semibold ${plan.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                                    {plan.status === 'completed' ? 'Completato' : 'In lavorazione'}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-gray-400 text-sm">
                            {new Date(plan.created_at).toLocaleDateString()}
                        </Text>
                    </View>

                    <Text className="text-lg font-bold text-gray-900 mb-2">Dettagli</Text>
                    <Text className="text-gray-600 leading-relaxed">
                        Questo render è stato generato utilizzando l'intelligenza artificiale di Tempocasa Render.
                        Il modello 3D offre una visione realistica degli spazi.
                    </Text>

                    {/* Actions */}
                    <View className="mt-8 space-y-3">
                        <TouchableOpacity className="w-full bg-tempocasa-blue-600 py-4 rounded-xl items-center shadow-lg active:opacity-90">
                            <Text className="text-white font-bold text-lg">Visualizza in 3D (Beta)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
