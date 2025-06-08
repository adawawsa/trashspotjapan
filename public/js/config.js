// Application Configuration
const CONFIG = {
  // API Configuration
  API_BASE_URL: window.location.origin + '/api/v1',
  
  // Google Maps Configuration  
  GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY', // ⚠️ 実際のAPIキーに置き換えてください
  DEFAULT_CENTER: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  DEFAULT_ZOOM: 13,
  
  // Search Configuration
  DEFAULT_SEARCH_RADIUS: 500, // meters
  MAX_SEARCH_RESULTS: 50,
  
  // WebSocket Configuration
  WEBSOCKET_URL: `ws://${window.location.host}/ws/updates`,
  WEBSOCKET_RECONNECT_INTERVAL: 5000, // 5 seconds
  
  // Cache Configuration
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // UI Configuration
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 500, // milliseconds
  
  // Trash Types
  TRASH_TYPES: {
    burnable: { name: '燃えるゴミ', color: '#FF6B6B', icon: '🔥' },
    plastic_bottle: { name: 'ペットボトル', color: '#4ECDC4', icon: '🍶' },
    can: { name: '缶', color: '#45B7D1', icon: '🥫' },
    glass: { name: 'ビン', color: '#96CEB4', icon: '🍾' },
    paper: { name: '紙類', color: '#FECA57', icon: '📄' },
    plastic: { name: 'プラスチック', color: '#48C9B0', icon: '♻️' },
    other: { name: 'その他', color: '#95A5A6', icon: '🗑️' }
  },
  
  // Facility Types
  FACILITY_TYPES: {
    convenience_store: { name: 'コンビニ', icon: '🏪' },
    station: { name: '駅', icon: '🚉' },
    park: { name: '公園', icon: '🌳' },
    vending_machine: { name: '自動販売機', icon: '🥤' },
    shopping_mall: { name: 'ショッピングモール', icon: '🛍️' },
    restaurant: { name: 'レストラン', icon: '🍴' },
    public_facility: { name: '公共施設', icon: '🏛️' },
    other: { name: 'その他', icon: '📍' }
  }
};

// Make CONFIG globally available
window.CONFIG = CONFIG;