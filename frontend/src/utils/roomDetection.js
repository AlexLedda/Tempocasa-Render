/**
 * Room Detection Algorithm
 * 
 * Converts a set of walls into a graph and finds the minimal closed cycles (basis cycles).
 * Each cycle represents a room.
 */

// Tolerance for considering points "connected"
const SNAP_TOLERANCE = 15;

/**
 * Main function to detect rooms from walls
 * @param {Array} walls - List of wall objects {id, points: [x1, y1, x2, y2]}
 * @returns {Array} List of detected rooms {points: [{x,y}, ...], area: Number}
 */
export const detectRooms = (walls) => {
    if (!walls || walls.length < 3) return [];

    // 1. Build Graph
    const { nodes, adjList } = buildGraph(walls);

    // 2. Find Cycles (Using a simplified approach for finding basis cycles in planar graphs)
    // For a floor plan editor, we want "minimal" cycles.
    // A robust way for 2D is:
    // - Treat edges as directed (two per wall: U->V and V->U)
    // - Sort outgoing edges by angle
    // - Traverse "steer left" (or right) at each node to eventually close a small loop

    const cycles = findMinimalCycles(nodes, adjList);

    // 3. Convert cycles to Polygon Rooms
    const rooms = cycles.map(cycle => {
        // Calculate area
        const area = calculatePolygonArea(cycle);

        // Filter out very small areas (noise) or negative areas (outer boundary usually)
        // We assume counter-clockwise order is positive area.
        // Ideally we want positive area.
        if (Math.abs(area) < 10000) return null; // < ~1m^2 (depends on scale)

        return {
            id: `auto-room-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            points: cycle,
            area: Math.abs(area)
        };
    }).filter(r => r !== null);

    return rooms;
};

// --- Helpers ---

// Normalize coordinates to merge close points (simple spatial hashing)
const getKey = (x, y) => `${Math.round(x / SNAP_TOLERANCE) * SNAP_TOLERANCE},${Math.round(y / SNAP_TOLERANCE) * SNAP_TOLERANCE}`;

const buildGraph = (walls) => {
    const nodes = {}; // Map 'key' -> {x, y, id}
    const adjList = {}; // Map 'nodeKey' -> [ {targetKey, angle}, ... ]

    walls.forEach(wall => {
        const [x1, y1, x2, y2] = wall.points;
        const key1 = getKey(x1, y1);
        const key2 = getKey(x2, y2);

        if (!nodes[key1]) nodes[key1] = { x: x1, y: y1, id: key1 };
        if (!nodes[key2]) nodes[key2] = { x: x2, y: y2, id: key2 };

        if (!adjList[key1]) adjList[key1] = [];
        if (!adjList[key2]) adjList[key2] = [];

        // Add edges (undirected conceptually, but we store both ways)
        // Avoid self-loops and duplicates
        if (key1 !== key2) {
            // Check if already connected
            if (!adjList[key1].find(e => e.target === key2)) {
                adjList[key1].push({ target: key2, x: x2, y: y2 });
            }
            if (!adjList[key2].find(e => e.target === key1)) {
                adjList[key2].push({ target: key1, x: x1, y: y1 });
            }
        }
    });

    return { nodes, adjList };
};

// Find minimal cycles using the "Angle-sort + Left-turn" rule
const findMinimalCycles = (nodes, adjList) => {
    const edges = [];

    // 1. Create all directed edges and sort them by angle at each node
    Object.keys(adjList).forEach(uKey => {
        const u = nodes[uKey];
        // Calculate angle for each neighbor
        adjList[uKey].forEach(edge => {
            edge.angle = Math.atan2(edge.y - u.y, edge.x - u.x);
        });
        // Sort neighbors by angle (ascending)
        adjList[uKey].sort((a, b) => a.angle - b.angle);
    });

    const visitedDirEdges = new Set(); // Key: "uKey->vKey"
    const cycles = [];

    Object.keys(adjList).forEach(uKey => {
        adjList[uKey].forEach(neighbor => {
            const vKey = neighbor.target;
            const edgeKey = `${uKey}->${vKey}`;

            if (visitedDirEdges.has(edgeKey)) return;

            // Start traversing a cycle
            const path = [];
            let curr = uKey;
            let next = vKey;
            let startEdgeKey = edgeKey;

            // Safety break
            let steps = 0;
            while (steps < 1000) {
                path.push(nodes[curr]);
                visitedDirEdges.add(`${curr}->${next}`);

                if (next === uKey) break; // Closed the loop

                // Find the "most counter-clockwise" outgoing edge from 'next' relative to entry edge 'curr->next'
                // Entrance angle is angle of (curr -> next)
                // We want the edge whose angle is smallest > entrance angle + PI (wrapping around)
                // Simplest heuristic: Look up 'curr' in 'next's formatted adjacency list, pick the previous one (cyclic)

                const neighbors = adjList[next];
                const entryIndex = neighbors.findIndex(n => n.target === curr);

                // Take the one "before" the entry index in the sorted list corresponds to "steer left" usually
                // Note: Sort is by angle. Atan2 returns -PI to PI.
                // If we arrived from curr, we want the "next" spoke in ACW order.
                // Actually, if we want minimal cycles (internal), we usually take the one that forms the smallest interior angle on the left.
                // Let's try Taking the (index - 1) element in the sorted list.

                let nextIndex = (entryIndex - 1 + neighbors.length) % neighbors.length;
                const nextNodeEdge = neighbors[nextIndex];

                curr = next;
                next = nextNodeEdge.target;

                // Check if we hit a dead end or re-visited an edge in THIS path (figure-8)
                if (visitedDirEdges.has(`${curr}->${next}`) && (`${curr}->${next}` !== startEdgeKey)) {
                    // Merged into an old path or twisted? Abort.
                    path.length = 0;
                    break;
                }

                steps++;
            }

            // If we successfully closed the loop back to uKey
            if (path.length > 2 && next === uKey) {
                // Validate it's a simple polygon if possible, or just accept
                cycles.push(path);
            }
        });
    });

    return cycles;
};

// Calculate area using Shoelace Formula
// Returns positive for one winding direction, negative for other
const calculatePolygonArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return area / 2;
};
