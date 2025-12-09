import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../../services/auth';
import '../../global.css';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!username.trim()) {
            Alert.alert('Errore', 'Inserisci un nome utente');
            return;
        }

        setIsLoading(true);
        try {
            await authService.login(username);
            // Navigate to dashboard (placeholder for now, or back to index which will handle redirect)
            Alert.alert('Successo', 'Login effettuato!', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            Alert.alert('Errore', 'Impossibile accedere. Riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white justify-center px-8">
            <StatusBar style="dark" />

            <View className="mb-12 items-center">
                <Text className="text-4xl font-bold text-tempocasa-blue-900 mb-2">Benvenuto</Text>
                <Text className="text-gray-500 text-center">Inserisci il tuo nome per accedere ai tuoi render 3D</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">Nome Utente</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg"
                        placeholder="Es. Mario Rossi"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity
                    className={`w-full bg-tempocasa-green-600 rounded-xl py-4 items-center shadow-md ${isLoading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">Accedi</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
