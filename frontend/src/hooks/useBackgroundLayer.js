import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useBackgroundLayer = (canvasWidth, canvasHeight) => {
    const [backgroundImg, setBackgroundImg] = useState(null);
    const [imageOpacity, setImageOpacity] = useState(0.5);
    const [imageScale, setImageScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

    const loadFloorPlan = (imageUrl) => {
        if (!imageUrl) return;

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => {
            setBackgroundImg(img);

            // Auto-fit logic
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const autoScale = Math.min(scaleX, scaleY, 0.6); // Max 60% of canvas

            setImageScale(autoScale);

            // Center the image
            const centeredX = (canvasWidth - img.width * autoScale) / 2;
            const centeredY = (canvasHeight - img.height * autoScale) / 2;
            setImagePosition({ x: centeredX, y: centeredY });

            toast.info(`📐 Piantina caricata al ${(autoScale * 100).toFixed(0)}%`);
        };
    };

    return {
        backgroundImg,
        imageOpacity,
        setImageOpacity,
        imageScale,
        setImageScale,
        imagePosition,
        setImagePosition,
        loadFloorPlan
    };
};
