import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import '../global.css';

export default function WelcomeScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View className="flex-1 bg-gradient-to-br from-tempocasa-blue-600 to-tempocasa-green-600">
            <StatusBar style="light" />

            <View className="flex-1 justify-center items-center px-6">
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                    className="items-center"
                >
                    {/* Logo/Brand */}
                    <View className="mb-8">
                        <Text className="text-6xl font-display font-bold text-white text-center">
                            Tempocasa
                        </Text>
                        <Text className="text-xl font-sans text-white/90 text-center mt-2">
                            Render
                        </Text>
                    </View>

                    {/* Tagline */}
                    <Text className="text-lg font-sans text-white/80 text-center mb-12 max-w-sm">
                        Visualizza i tuoi spazi in 3D con precisione professionale
                    </Text>

                    {/* CTA Button */}
                    <TouchableOpacity
                        className="bg-white rounded-2xl px-8 py-4 shadow-lg active:scale-95"
                        activeOpacity={0.9}
                    >
                        <Text className="text-tempocasa-blue-700 font-display font-semibold text-lg">
                            Inizia Ora
                        </Text>
                    </TouchableOpacity>

                    {/* Secondary Action */}
                    <TouchableOpacity className="mt-6">
                        <Text className="text-white/70 font-sans text-sm underline">
                            Scopri di più
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Bottom Decoration */}
            <View className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
        </View>
    );
}
