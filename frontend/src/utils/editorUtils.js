// editorUtils.js

/**
 * Converts pixels to real-world units based on scale
 * @param {number} pixels - Value in pixels
 * @param {number} scale - Pixels per cm
 * @returns {number} Value in cm
 */
export const pixelsToRealUnit = (pixels, scale) => {
    if (!scale || scale === 0) return 0;
    return pixels / scale;
};

/**
 * Formats a measurement in cm or m
 * @param {number} cm - Value in cm
 * @param {string} unit - 'cm', 'm', or 'auto'
 * @returns {string} Formatted string
 */
export const formatMeasurement = (cm, unit = 'auto') => {
    if (unit === 'cm') {
        return `${cm.toFixed(1)} cm`;
    } else if (unit === 'm') {
        return `${(cm / 100).toFixed(2)} m`;
    } else {
        // Auto
        if (cm >= 100) {
            return `${(cm / 100).toFixed(2)} m`;
        } else {
            return `${cm.toFixed(1)} cm`;
        }
    }
};

/**
 * Snaps coordinates to a grid
 */
export const snapToGridCoords = (x, y, gridSize, enabled = true) => {
    if (!enabled) return { x, y };
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    };
};

/**
 * Calculates Smart Snapping for a point against a set of walls
 * @param {number} x - Current X
 * @param {number} y - Current Y
 * @param {Array} walls - List of walls
 * @param {boolean} snapToGrid - Whether grid snap is on
 * @param {number} scale - Current scale
 * @returns {Object} { x, y, guidelines }
 */
export const calculateSmartSnap = (x, y, walls, snapToGrid, scale) => {
    const SNAP_TOLERANCE = 15; // pixels
    let snappedX = x;
    let snappedY = y;
    let guides = [];

    if (snapToGrid) {
        const gridSize = scale * 10;
        snappedX = Math.round(x / gridSize) * gridSize;
        snappedY = Math.round(y / gridSize) * gridSize;
    }

    // 1. ENDPOINT SNAP (High Priority)
    let endpointSnapFound = false;

    const pointsOfInterest = [];
    walls.forEach(wall => {
        pointsOfInterest.push({ x: wall.points[0], y: wall.points[1] });
        pointsOfInterest.push({ x: wall.points[2], y: wall.points[3] });
    });

    for (const p of pointsOfInterest) {
        if (Math.abs(p.x - x) < SNAP_TOLERANCE && Math.abs(p.y - y) < SNAP_TOLERANCE) {
            snappedX = p.x;
            snappedY = p.y;
            endpointSnapFound = true;
            break;
        }
    }

    if (endpointSnapFound) {
        return { x: snappedX, y: snappedY, guidelines: [] };
    }

    // 2. ALIGNMENT SNAP
    for (const p of pointsOfInterest) {
        if (Math.abs(p.x - x) < SNAP_TOLERANCE) {
            snappedX = p.x;
            guides.push({
                points: [p.x, -10000, p.x, 10000],
                stroke: '#fca5a5',
                dash: [4, 4]
            });
            break;
        }
    }

    for (const p of pointsOfInterest) {
        if (Math.abs(p.y - y) < SNAP_TOLERANCE) {
            snappedY = p.y;
            guides.push({
                points: [-10000, p.y, 10000, p.y],
                stroke: '#fca5a5',
                dash: [4, 4]
            });
            break;
        }
    }

    return { x: snappedX, y: snappedY, guidelines: guides };
};
