import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PlanCard({ plan }) {
    const router = useRouter();

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-tempocasa-green-100 text-tempocasa-green-700';
            case 'processing': return 'bg-yellow-100 text-yellow-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completato';
            case 'processing': return 'In Elaborazione';
            case 'failed': return 'Fallito';
            default: return 'In Attesa';
        }
    };

    return (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
            activeOpacity={0.9}
            onPress={() => router.push(`/dashboard/${plan.id}`)}
        >
            {/* Image Section */}
            <View className="h-48 bg-gray-200 w-full relative">
                {plan.original_image_url ? (
                    <Image
                        source={{ uri: plan.original_image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                    </View>
                )}

                {/* Status Badge Overlay */}
                <View className={`absolute top-3 right-3 px-3 py-1 rounded-full ${getStatusColor(plan.status).split(' ')[0]}`}>
                    <Text className={`text-xs font-semibold ${getStatusColor(plan.status).split(' ')[1]}`}>
                        {getStatusLabel(plan.status)}
                    </Text>
                </View>
            </View>

            {/* Content Section */}
            <View className="p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                        {plan.address || `Progetto #${plan.id.substring(0, 6)}`}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        {new Date(plan.created_at).toLocaleDateString()}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                        {plan.city || 'Posizione non specificata'}
                    </Text>
                </View>

                {/* Tags/Features (Optional) */}
                <View className="flex-row mt-3 space-x-2">
                    {plan.analysis_result && (
                        <View className="bg-blue-50 px-2 py-1 rounded-md">
                            <Text className="text-[10px] text-blue-600 font-medium">✨ Analisi AI</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
