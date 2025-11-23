// Extended Furniture and Element Library with SVG URLs and custom support

export const EXTENDED_LIBRARY = {
  // SOGGIORNO
  living_room: {
    name: "Soggiorno",
    icon: "🛋️",
    items: [
      { id: 'sofa-2-seat', name: 'Divano 2 posti', width: 150, depth: 90, icon: '🛋️', color: '#8B7355' },
      { id: 'sofa-3-seat', name: 'Divano 3 posti', width: 220, depth: 90, icon: '🛋️', color: '#8B7355' },
      { id: 'sofa-l-shape', name: 'Divano Angolare L', width: 280, depth: 180, icon: '🛋️', color: '#8B7355' },
      { id: 'armchair', name: 'Poltrona', width: 80, depth: 85, icon: '💺', color: '#A0826D' },
      { id: 'coffee-table', name: 'Tavolino da Caffè', width: 120, depth: 60, icon: '🪑', color: '#654321' },
      { id: 'tv-stand', name: 'Mobile TV', width: 180, depth: 45, icon: '📺', color: '#4A4A4A' },
      { id: 'bookshelf', name: 'Libreria', width: 120, depth: 40, icon: '📚', color: '#8B4513' },
      { id: 'side-table', name: 'Tavolino Laterale', width: 50, depth: 50, icon: '🪑', color: '#654321' },
      { id: 'floor-lamp', name: 'Lampada da Terra', width: 30, depth: 30, icon: '💡', color: '#FFD700' },
      { id: 'plant-large', name: 'Pianta Grande', width: 50, depth: 50, icon: '🪴', color: '#228B22' },
    ]
  },
  
  // CAMERA DA LETTO
  bedroom: {
    name: "Camera da Letto",
    icon: "🛏️",
    items: [
      { id: 'bed-single', name: 'Letto Singolo', width: 100, depth: 200, icon: '🛏️', color: '#B0C4DE' },
      { id: 'bed-double', name: 'Letto Matrimoniale', width: 160, depth: 200, icon: '🛏️', color: '#B0C4DE' },
      { id: 'bed-queen', name: 'Letto Queen', width: 180, depth: 210, icon: '🛏️', color: '#B0C4DE' },
      { id: 'bed-king', name: 'Letto King', width: 200, depth: 210, icon: '🛏️', color: '#B0C4DE' },
      { id: 'wardrobe-small', name: 'Armadio 2 Ante', width: 120, depth: 60, icon: '👔', color: '#8B4513' },
      { id: 'wardrobe-large', name: 'Armadio 4 Ante', width: 200, depth: 60, icon: '👔', color: '#8B4513' },
      { id: 'wardrobe-corner', name: 'Cabina Armadio', width: 150, depth: 150, icon: '👔', color: '#8B4513' },
      { id: 'nightstand', name: 'Comodino', width: 50, depth: 40, icon: '🕯️', color: '#A0826D' },
      { id: 'dresser', name: 'Cassettiera', width: 120, depth: 50, icon: '🗄️', color: '#8B4513' },
      { id: 'desk-bedroom', name: 'Scrivania', width: 140, depth: 70, icon: '💻', color: '#654321' },
      { id: 'chair-desk', name: 'Sedia Scrivania', width: 60, depth: 60, icon: '🪑', color: '#696969' },
      { id: 'mirror-standing', name: 'Specchio a Terra', width: 60, depth: 40, icon: '🪞', color: '#C0C0C0' },
    ]
  },
  
  // CUCINA
  kitchen: {
    name: "Cucina",
    icon: "🍳",
    items: [
      { id: 'kitchen-counter-l', name: 'Piano Lavoro L (sx)', width: 60, depth: 200, icon: '🔲', color: '#D3D3D3' },
      { id: 'kitchen-counter-r', name: 'Piano Lavoro L (dx)', width: 200, depth: 60, icon: '🔲', color: '#D3D3D3' },
      { id: 'kitchen-island', name: 'Isola Cucina', width: 200, depth: 100, icon: '🏝️', color: '#A9A9A9' },
      { id: 'refrigerator', name: 'Frigorifero', width: 70, depth: 70, icon: '🧊', color: '#E0E0E0' },
      { id: 'stove', name: 'Piano Cottura', width: 60, depth: 60, icon: '🔥', color: '#000000' },
      { id: 'oven', name: 'Forno', width: 60, depth: 60, icon: '🍕', color: '#2F4F4F' },
      { id: 'dishwasher', name: 'Lavastoviglie', width: 60, depth: 60, icon: '🫧', color: '#C0C0C0' },
      { id: 'sink', name: 'Lavello', width: 80, depth: 50, icon: '🚰', color: '#B0C4DE' },
      { id: 'microwave', name: 'Microonde', width: 50, depth: 40, icon: '📦', color: '#696969' },
      { id: 'dining-table-4', name: 'Tavolo 4 posti', width: 120, depth: 80, icon: '🍽️', color: '#8B4513' },
      { id: 'dining-table-6', name: 'Tavolo 6 posti', width: 180, depth: 90, icon: '🍽️', color: '#8B4513' },
      { id: 'dining-chair', name: 'Sedia', width: 45, depth: 45, icon: '🪑', color: '#654321' },
      { id: 'bar-stool', name: 'Sgabello Bar', width: 40, depth: 40, icon: '🪑', color: '#696969' },
    ]
  },
  
  // BAGNO
  bathroom: {
    name: "Bagno",
    icon: "🚿",
    items: [
      { id: 'bathtub', name: 'Vasca da Bagno', width: 170, depth: 75, icon: '🛁', color: '#F0F8FF' },
      { id: 'shower', name: 'Doccia', width: 90, depth: 90, icon: '🚿', color: '#E0FFFF' },
      { id: 'shower-large', name: 'Doccia Grande', width: 120, depth: 90, icon: '🚿', color: '#E0FFFF' },
      { id: 'toilet', name: 'WC', width: 40, depth: 60, icon: '🚽', color: '#FFFFFF' },
      { id: 'bidet', name: 'Bidet', width: 40, depth: 55, icon: '🚿', color: '#FFFFFF' },
      { id: 'sink-bathroom', name: 'Lavabo', width: 60, depth: 50, icon: '🚰', color: '#F0F8FF' },
      { id: 'sink-double', name: 'Doppio Lavabo', width: 120, depth: 50, icon: '🚰', color: '#F0F8FF' },
      { id: 'vanity', name: 'Mobile Bagno', width: 100, depth: 50, icon: '🗄️', color: '#8B4513' },
      { id: 'washing-machine', name: 'Lavatrice', width: 60, depth: 60, icon: '🧺', color: '#C0C0C0' },
      { id: 'dryer', name: 'Asciugatrice', width: 60, depth: 60, icon: '🌪️', color: '#A9A9A9' },
    ]
  },
  
  // UFFICIO
  office: {
    name: "Ufficio",
    icon: "💼",
    items: [
      { id: 'desk-large', name: 'Scrivania Grande', width: 180, depth: 80, icon: '🖥️', color: '#654321' },
      { id: 'desk-l-shape', name: 'Scrivania L', width: 160, depth: 140, icon: '💻', color: '#654321' },
      { id: 'desk-standing', name: 'Scrivania in Piedi', width: 140, depth: 70, icon: '💻', color: '#696969' },
      { id: 'office-chair', name: 'Sedia Ufficio', width: 65, depth: 65, icon: '💺', color: '#000000' },
      { id: 'filing-cabinet', name: 'Cassettiera Ufficio', width: 50, depth: 70, icon: '🗄️', color: '#808080' },
      { id: 'bookshelf-office', name: 'Libreria Ufficio', width: 120, depth: 40, icon: '📚', color: '#8B4513' },
      { id: 'meeting-table', name: 'Tavolo Riunioni', width: 240, depth: 120, icon: '🪑', color: '#654321' },
      { id: 'printer', name: 'Stampante', width: 50, depth: 45, icon: '🖨️', color: '#696969' },
      { id: 'plant-office', name: 'Pianta Ufficio', width: 40, depth: 40, icon: '🪴', color: '#228B22' },
    ]
  },
  
  // PORTE E FINESTRE
  doors_windows: {
    name: "Porte e Finestre",
    icon: "🚪",
    items: [
      { id: 'door-single', name: 'Porta Singola 80cm', width: 80, height: 210, icon: '🚪', color: '#8B4513' },
      { id: 'door-single-90', name: 'Porta Singola 90cm', width: 90, height: 210, icon: '🚪', color: '#8B4513' },
      { id: 'door-double', name: 'Porta Doppia', width: 160, height: 210, icon: '🚪', color: '#8B4513' },
      { id: 'door-sliding', name: 'Porta Scorrevole', width: 120, height: 210, icon: '↔️', color: '#A0826D' },
      { id: 'door-french', name: 'Porta Finestra', width: 140, height: 210, icon: '🚪', color: '#8B4513' },
      { id: 'window-small', name: 'Finestra Piccola', width: 80, height: 120, icon: '🪟', color: '#87CEEB' },
      { id: 'window-medium', name: 'Finestra Media', width: 120, height: 150, icon: '🪟', color: '#87CEEB' },
      { id: 'window-large', name: 'Finestra Grande', width: 200, height: 180, icon: '🪟', color: '#87CEEB' },
      { id: 'window-bay', name: 'Finestra a Bovindo', width: 250, height: 180, icon: '🪟', color: '#87CEEB' },
    ]
  },
  
  // ESTERNI E GIARDINO
  outdoor: {
    name: "Esterno",
    icon: "🌳",
    items: [
      { id: 'tree-small', name: 'Albero Piccolo', width: 100, depth: 100, icon: '🌳', color: '#228B22' },
      { id: 'tree-large', name: 'Albero Grande', width: 200, depth: 200, icon: '🌳', color: '#006400' },
      { id: 'bush', name: 'Cespuglio', width: 80, depth: 80, icon: '🌿', color: '#32CD32' },
      { id: 'patio-table', name: 'Tavolo Esterno', width: 150, depth: 90, icon: '🪑', color: '#8B4513' },
      { id: 'garden-bench', name: 'Panchina', width: 150, depth: 60, icon: '🪑', color: '#654321' },
      { id: 'bbq-grill', name: 'Barbecue', width: 80, depth: 60, icon: '🔥', color: '#2F4F4F' },
      { id: 'pool', name: 'Piscina', width: 400, depth: 200, icon: '🏊', color: '#00BFFF' },
      { id: 'car', name: 'Auto', width: 180, depth: 450, icon: '🚗', color: '#696969' },
    ]
  },
  
  // PAVIMENTI
  floors: {
    name: "Pavimenti",
    icon: "🟫",
    items: [
      { id: 'floor-parquet', name: 'Parquet', color: '#8B4513', pattern: 'wood', icon: '🪵' },
      { id: 'floor-oak', name: 'Parquet Rovere', color: '#D2691E', pattern: 'wood', icon: '🪵' },
      { id: 'floor-walnut', name: 'Parquet Noce', color: '#654321', pattern: 'wood', icon: '🪵' },
      { id: 'floor-tile-white', name: 'Piastrelle Bianche', color: '#F5F5F5', pattern: 'tile', icon: '⬜' },
      { id: 'floor-tile-gray', name: 'Piastrelle Grigie', color: '#9E9E9E', pattern: 'tile', icon: '◽' },
      { id: 'floor-tile-black', name: 'Piastrelle Nere', color: '#2F4F4F', pattern: 'tile', icon: '⬛' },
      { id: 'floor-marble', name: 'Marmo Bianco', color: '#E8E8E8', pattern: 'marble', icon: '💎' },
      { id: 'floor-marble-black', name: 'Marmo Nero', color: '#36454F', pattern: 'marble', icon: '💎' },
      { id: 'floor-concrete', name: 'Cemento', color: '#696969', pattern: 'solid', icon: '🧱' },
      { id: 'floor-carpet-beige', name: 'Moquette Beige', color: '#F5DEB3', pattern: 'carpet', icon: '🟫' },
      { id: 'floor-carpet-gray', name: 'Moquette Grigia', color: '#A9A9A9', pattern: 'carpet', icon: '🟫' },
      { id: 'floor-terracotta', name: 'Cotto', color: '#CD853F', pattern: 'tile', icon: '🟧' },
    ]
  },
};

export const getAllItems = () => {
  const allItems = [];
  Object.keys(EXTENDED_LIBRARY).forEach(categoryKey => {
    const category = EXTENDED_LIBRARY[categoryKey];
    category.items.forEach(item => {
      allItems.push({
        ...item,
        category: categoryKey,
        categoryName: category.name
      });
    });
  });
  return allItems;
};

export const searchItems = (query) => {
  const allItems = getAllItems();
  const lowerQuery = query.toLowerCase();
  return allItems.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.categoryName.toLowerCase().includes(lowerQuery)
  );
};
