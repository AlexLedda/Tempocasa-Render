import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Grid } from '@react-three/drei/native';
import * as THREE from 'three';
import { View } from 'react-native';

const Wall = ({ start, end, height = 2.8, thickness = 0.2 }) => {
    const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[1] + end[1]) / 2; // In 3D, Y is up, so 2D (x,y) -> 3D (x,z) usually, but consistency matters.

    // Let's assume standard architecture: Y is up.
    // Input coords (x, y) map to 3D (x, z).

    return (
        <mesh
            position={[midX, height / 2, midZ]}
            rotation={[0, -angle, 0]} // Negative angle because 3D rotation logic
        >
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color="#e5e7eb" />
        </mesh>
    );
};

export default function Scene3D({ data }) {
    if (!data) return null;

    // Parse data if string
    const sceneData = typeof data === 'string' ? JSON.parse(data) : data;
    const walls = sceneData.walls || [];

    return (
        <View style={{ flex: 1 }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <group>
                    {walls.map((wall, index) => (
                        <Wall
                            key={index}
                            start={wall.start}
                            end={wall.end}
                            height={wall.height}
                            thickness={wall.thickness}
                        />
                    ))}

                    {/* Floor helper */}
                    <Grid infiniteGrid fadeDistance={30} sectionColor={'#3b82f6'} cellColor={'#e5e7eb'} />
                </group>

                <OrbitControls makeDefault />
            </Canvas>
        </View>
    );
}
