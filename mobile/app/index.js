import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// Import from shared code (Frontend)
import { calculateSmartSnap, pixelsToRealUnit } from '../../frontend/src/utils/editorUtils';

export default function Index() {
    // Verify logic works
    const snapResult = calculateSmartSnap(100, 100, [], true, 1);
    const realUnit = pixelsToRealUnit(100, 50); // 100px / 50scale = 2cm

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Vision3D Mobile 📱</Text>
            <Text style={styles.subtitle}>Shared Logic Test:</Text>

            <View style={styles.card}>
                <Text>Smart Snap Result: {JSON.stringify(snapResult)}</Text>
                <Text>Real Unit (100px @ 50scale): {realUnit} cm</Text>
            </View>

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 10,
        color: '#666',
    },
    card: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    }
});
