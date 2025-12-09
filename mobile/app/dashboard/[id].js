import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Text, Image, ScrollView, TouchableOpacity, Share, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import Scene3D from '../../components/Scene3D';
import '../../global.css';

export default function PlanDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [is3DMode, setIs3DMode] = useState(false);

    // AI Restyle State
    const [restyleModalVisible, setRestyleModalVisible] = useState(false);
    const [stylePrompt, setStylePrompt] = useState('');
    const [isRestyling, setIsRestyling] = useState(false);

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

    const handleRestyle = async () => {
        if (!stylePrompt.trim()) return;

        setIsRestyling(true);
        try {
            // Call API (simulated for now since apiService needs update or direct fetch)
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://vision-3d-render.com/api'}/floorplans/${id}/restyle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style: stylePrompt })
            });

            if (!response.ok) throw new Error('Restyle failed');

            const result = await response.json();

            // Update plan with new data
            setPlan(prev => ({
                ...prev,
                three_d_data: result.three_d_data
            }));

            setRestyleModalVisible(false);
            setStylePrompt('');
            Alert.alert('Successo', 'Il design è stato aggiornato!');
        } catch (error) {
            Alert.alert('Errore', 'Impossibile applicare lo stile: ' + error.message);
        } finally {
            setIsRestyling(false);
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

            {/* Sticky Header with Image/3D */}
            <ScrollView className="flex-1" bounces={false} scrollEnabled={!is3DMode}>
                <View className="relative h-96 bg-gray-900">
                    {is3DMode && plan.three_d_data ? (
                        <Scene3D data={plan.three_d_data} />
                    ) : (
                        <Image
                            source={{ uri: plan.processed_image_url || plan.original_image_url }}
                            className="w-full h-full opacity-90"
                            resizeMode="cover"
                        />
                    )}

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        className="absolute top-12 left-6 bg-white/20 p-2 rounded-full backdrop-blur-md z-10"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Share Button Overlay */}
                    <TouchableOpacity
                        className="absolute top-12 right-6 bg-white/20 p-2 rounded-full backdrop-blur-md z-10"
                        onPress={handleShare}
                    >
                        <Ionicons name="share-outline" size={24} color="white" />
                    </TouchableOpacity>

                    {!is3DMode && (
                        <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <Text className="text-white text-2xl font-bold font-display">
                                {plan.address || `Progetto #${plan.id.substring(0, 6)}`}
                            </Text>
                            <Text className="text-white/80 text-base">
                                {plan.city || 'Posizione non specificata'}
                            </Text>
                        </View>
                    )}

                    {/* 3D Toggle Control */}
                    {plan.three_d_data && (
                        <View className="absolute bottom-4 right-4 flex-row bg-black/50 rounded-full p-1 z-10">
                            <TouchableOpacity
                                onPress={() => setIs3DMode(false)}
                                className={`px-4 py-2 rounded-full ${!is3DMode ? 'bg-white' : 'bg-transparent'}`}
                            >
                                <Text className={`font-semibold ${!is3DMode ? 'text-black' : 'text-white'}`}>2D</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIs3DMode(true)}
                                className={`px-4 py-2 rounded-full ${is3DMode ? 'bg-white' : 'bg-transparent'}`}
                            >
                                <Text className={`font-semibold ${is3DMode ? 'text-black' : 'text-white'}`}>3D</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
                        {!is3DMode && plan.three_d_data && (
                            <TouchableOpacity
                                onPress={() => setIs3DMode(true)}
                                className="w-full bg-tempocasa-blue-600 py-4 rounded-xl items-center shadow-lg active:opacity-90"
                            >
                                <Text className="text-white font-bold text-lg">Apri Modello 3D</Text>
                            </TouchableOpacity>
                        )}

                        {is3DMode && (
                            <TouchableOpacity
                                onPress={() => setRestyleModalVisible(true)}
                                className="w-full bg-purple-600 py-4 rounded-xl items-center shadow-lg active:opacity-90 flex-row justify-center space-x-2"
                            >
                                <Ionicons name="color-wand" size={24} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">AI Interior Design</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* AI Restyle Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={restyleModalVisible}
                        onRequestClose={() => setRestyleModalVisible(false)}
                    >
                        <View className="flex-1 justify-end">
                            {/* Backdrop */}
                            <TouchableOpacity
                                className="absolute inset-0 bg-black/50"
                                onPress={() => setRestyleModalVisible(false)}
                            />

                            <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xl font-bold text-gray-900">AI Design Magic ✨</Text>
                                    <TouchableOpacity onPress={() => setRestyleModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>

                                <Text className="text-gray-600 mb-4">
                                    Descrivi lo stile che vuoi applicare (es. "Industrial", "Minimal beige", "Pavimento in marmo").
                                </Text>

                                <TextInput
                                    className="bg-gray-100 p-4 rounded-xl text-lg mb-6 border border-gray-200"
                                    placeholder="Es. Moderno con parquet..."
                                    value={stylePrompt}
                                    onChangeText={setStylePrompt}
                                    autoFocus
                                />

                                <TouchableOpacity
                                    className={`w-full py-4 rounded-xl items-center shadow-lg ${isRestyling ? 'bg-gray-400' : 'bg-purple-600'}`}
                                    onPress={handleRestyle}
                                    disabled={isRestyling}
                                >
                                    {isRestyling ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Applica Stile</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            </ScrollView>
        </View>
    );
}
