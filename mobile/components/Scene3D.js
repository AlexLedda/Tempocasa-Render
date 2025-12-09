import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Grid } from '@react-three/drei/native';
import * as THREE from 'three';
import { View } from 'react-native';

const Wall = ({ start, end, height = 2.8, thickness = 0.2, color = "#e5e7eb" }) => {
    const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[1] + end[1]) / 2;

    return (
        <mesh
            position={[midX, height / 2, midZ]}
            rotation={[0, -angle, 0]}
        >
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

// Simple floor plane for a room
const RoomFloor = ({ width, depth, position, color = "#e5e7eb" }) => {
    // Assuming rooms are rectangles for simplicity in this version
    return (
        <mesh position={[position[0], 0.05, position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

export default function Scene3D({ data }) {
    if (!data) return null;

    // Parse data if string
    const sceneData = typeof data === 'string' ? JSON.parse(data) : data;
    const walls = sceneData.walls || [];
    const rooms = sceneData.rooms || [];

    return (
        <View style={{ flex: 1 }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <group>
                    {walls.map((wall, index) => (
                        <Wall
                            key={`wall-${index}`}
                            start={wall.start}
                            end={wall.end}
                            height={wall.height}
                            thickness={wall.thickness}
                            color={wall.color}
                        />
                    ))}

                    {rooms.map((room, index) => (
                        <RoomFloor
                            key={`room-${index}`}
                            width={room.width || 5}
                            depth={room.depth || 5}
                            position={[0, 0]} // Simplified: center at 0,0 for now, real app needs room position
                            color={room.color || "#f3f4f6"}
                        />
                    ))}

                    {/* Grid helper (only if no rooms defined) */}
                    {rooms.length === 0 && (
                        <Grid infiniteGrid fadeDistance={30} sectionColor={'#3b82f6'} cellColor={'#e5e7eb'} />
                    )}
                </group>

                <OrbitControls makeDefault />
            </Canvas>
        </View>
    );
}
