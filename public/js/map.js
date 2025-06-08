// Google Maps Module
const MapModule = {
  map: null,
  markers: [],
  infoWindow: null,
  userLocationMarker: null,
  searchCircle: null,
  
  // Initialize map
  async init() {
    // Load Google Maps API
    await this.loadGoogleMapsAPI();
    
    // Only create map if Google Maps is available
    if (window.google && window.google.maps) {
      // Create map
      this.map = new google.maps.Map(document.getElementById('map'), {
        center: CONFIG.DEFAULT_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM,
        styles: this.getMapStyles(),
        fullscreenControl: false,
        streetViewControl: false
      });
      
      // Create info window
      this.infoWindow = new google.maps.InfoWindow();
      
      // Don't automatically request location - wait for user gesture
    }
  },
  
  // Load Google Maps API dynamically
  loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      
      // Check if API key is available
      if (!CONFIG.GOOGLE_MAPS_API_KEY || CONFIG.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.info('Google Maps API key not configured - running in demo mode');
        console.info('To use real maps, set GOOGLE_MAPS_API_KEY in your environment');
        this.showMockMap();
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=geometry,marker&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Define global callback
      window.initMap = () => {
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        this.showMockMap();
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  // Show mock map when Google Maps is not available
  showMockMap() {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 20px;">🗾</div>
          <h2>デモモード</h2>
          <p>Google Maps APIキーが設定されていないため、<br>デモモードで表示しています。</p>
          <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
            実際の地図を表示するには、<br>
            <code>API_KEYS_SETUP.md</code> を参照してください。
          </p>
        </div>
      </div>
    `;
    
    // Mock some sample data
    this.showMockData();
  },

  // Show mock trash bin data
  showMockData() {
    const mockTrashBins = [
      // Tokyo Station Area
      {
        id: 'mock-1',
        name: { ja: '東京駅八重洲口', en: 'Tokyo Station Yaesu Exit', zh: '东京车站八重洲口' },
        address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
        location: { lat: 35.6812, lng: 139.7671 },
        facility_type: 'station',
        trash_types: ['burnable', 'plastic_bottle', 'can'],
        quality_score: 0.90,
        distance_meters: 0
      },
      {
        id: 'mock-2',
        name: { ja: '東京駅構内リサイクル', en: 'Tokyo Station Recycling', zh: '东京车站内回收点' },
        address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
        location: { lat: 35.6812, lng: 139.7649 },
        facility_type: 'station',
        trash_types: ['plastic_bottle', 'can', 'paper'],
        quality_score: 0.88,
        distance_meters: 200
      },
      // Shibuya Area
      {
        id: 'mock-3',
        name: { ja: '渋谷センター街入口', en: 'Shibuya Center Gai Entrance', zh: '涩谷中心街入口' },
        address: { ja: '東京都渋谷区宇田川町', en: 'Udagawacho, Shibuya City, Tokyo', zh: '东京都涩谷区宇田川町' },
        location: { lat: 35.6598, lng: 139.7023 },
        facility_type: 'public_facility',
        trash_types: ['burnable'],
        quality_score: 0.75,
        distance_meters: 450
      },
      {
        id: 'mock-4',
        name: { ja: '渋谷ハチ公口自販機', en: 'Shibuya Hachiko Exit Vending', zh: '涩谷八公口自动售货机' },
        address: { ja: '東京都渋谷区道玄坂', en: 'Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂' },
        location: { lat: 35.6590, lng: 139.7016 },
        facility_type: 'vending_machine',
        trash_types: ['plastic_bottle', 'can'],
        quality_score: 0.85,
        distance_meters: 520
      },
      // Shinjuku Area
      {
        id: 'mock-5',
        name: { ja: '新宿御苑前', en: 'Shinjuku Gyoen Entrance', zh: '新宿御苑前' },
        address: { ja: '東京都新宿区内藤町11', en: '11 Naitocho, Shinjuku City, Tokyo', zh: '东京都新宿区内藤町11' },
        location: { lat: 35.6938, lng: 139.7034 },
        facility_type: 'park',
        trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
        quality_score: 0.92,
        distance_meters: 680
      },
      {
        id: 'mock-6',
        name: { ja: '新宿駅南口コンビニ', en: 'Shinjuku Station South Exit Convenience Store', zh: '新宿站南口便利店' },
        address: { ja: '東京都新宿区西新宿1-1-3', en: '1-1-3 Nishi-Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区西新宿1-1-3' },
        location: { lat: 35.6896, lng: 139.7006 },
        facility_type: 'convenience_store',
        trash_types: ['burnable', 'plastic_bottle', 'can'],
        quality_score: 0.88,
        distance_meters: 750
      },
      // Ginza Area
      {
        id: 'mock-7',
        name: { ja: '銀座中央通り', en: 'Ginza Chuo-dori', zh: '银座中央通' },
        address: { ja: '東京都中央区銀座4-6-16', en: '4-6-16 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-6-16' },
        location: { lat: 35.6762, lng: 139.7653 },
        facility_type: 'public_facility',
        trash_types: ['plastic_bottle', 'can', 'glass', 'paper'],
        quality_score: 0.90,
        distance_meters: 850
      },
      // Asakusa Area
      {
        id: 'mock-8',
        name: { ja: '浅草寺境内', en: 'Sensoji Temple Grounds', zh: '浅草寺境内' },
        address: { ja: '東京都台東区浅草2-3-1', en: '2-3-1 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草2-3-1' },
        location: { lat: 35.7148, lng: 139.7967 },
        facility_type: 'public_facility',
        trash_types: ['burnable'],
        quality_score: 0.82,
        distance_meters: 1200
      },
      // Harajuku Area
      {
        id: 'mock-9',
        name: { ja: '竹下通りファミマ', en: 'Takeshita Street FamilyMart', zh: '竹下通全家' },
        address: { ja: '東京都渋谷区神宮前1-19-11', en: '1-19-11 Jingumae, Shibuya City, Tokyo', zh: '东京都涩谷区神宫前1-19-11' },
        location: { lat: 35.6702, lng: 139.7063 },
        facility_type: 'convenience_store',
        trash_types: ['burnable', 'plastic_bottle', 'can'],
        quality_score: 0.87,
        distance_meters: 950
      },
      // Ueno Area
      {
        id: 'mock-10',
        name: { ja: '上野公園入口', en: 'Ueno Park Entrance', zh: '上野公园入口' },
        address: { ja: '東京都台東区上野公園5-20', en: '5-20 Ueno Park, Taito City, Tokyo', zh: '东京都台东区上野公园5-20' },
        location: { lat: 35.7141, lng: 139.7744 },
        facility_type: 'park',
        trash_types: ['burnable', 'plastic_bottle', 'can'],
        quality_score: 0.85,
        distance_meters: 1100
      }
    ];
    
    // Add markers to map
    this.addTrashBinMarkers(mockTrashBins);
    
    // Display in results panel
    if (window.SearchModule && typeof window.SearchModule.displaySearchResults === 'function') {
      window.SearchModule.displaySearchResults(mockTrashBins);
    } else {
      console.log('SearchModule not available, mock data:', mockTrashBins);
    }
    
    // Store mock data globally for search functionality
    window.MOCK_TRASH_BINS = mockTrashBins;
  },
  
  // Get map styles
  getMapStyles() {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  },
  
  // Get user location
  getUserLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Center map on user location (only if map exists)
        if (this.map) {
          this.map.setCenter(userLocation);
          // Add user location marker
          this.addUserLocationMarker(userLocation);
        }
        
        // Trigger initial search
        if (window.SearchModule) {
          window.SearchModule.performSearch(userLocation);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = i18n.t('location_unavailable');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = i18n.t('location_permission_denied');
            break;
          case error.POSITION_UNAVAILABLE:
            message = i18n.t('location_unavailable');
            break;
          case error.TIMEOUT:
            message = i18n.t('location_timeout');
            break;
        }
        
        window.UIUtils.showNotification(message, 'error');
      }
    );
  },
  
  // Add user location marker
  addUserLocationMarker(location) {
    if (this.userLocationMarker) {
      this.userLocationMarker.setMap ? this.userLocationMarker.setMap(null) : (this.userLocationMarker.map = null);
    }
    
    // Use legacy Marker (AdvancedMarkerElement requires Map ID for production use)
    // eslint-disable-next-line no-undef
    this.userLocationMarker = new google.maps.Marker({
      position: location,
      map: this.map,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      zIndex: 999
    });
  },
  
  // Clear all markers
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
  },
  
  // Add trash bin markers
  addTrashBinMarkers(trashBins) {
    this.clearMarkers();
    
    trashBins.forEach((trashBin, index) => {
      // Use legacy Marker (AdvancedMarkerElement requires Map ID for production use)
      // eslint-disable-next-line no-undef
      const marker = new google.maps.Marker({
        position: trashBin.location,
        map: this.map,
        title: trashBin.name[i18n.currentLang] || trashBin.name.en || trashBin.name.ja,
        icon: this.getMarkerIcon(trashBin),
        animation: google.maps.Animation.DROP,
        zIndex: index
      });
      
      // Add click listener
      marker.addListener('click', () => {
        this.showInfoWindow(marker, trashBin);
      });
      
      this.markers.push(marker);
    });
    
    // Fit bounds to show all markers
    if (this.markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      if (this.userLocationMarker) {
        bounds.extend(this.userLocationMarker.getPosition());
      }
      
      this.markers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      
      this.map.fitBounds(bounds);
    }
  },
  
  // Get marker icon based on trash bin type
  getMarkerIcon(trashBin) {
    const primaryType = trashBin.trash_types[0];
    const typeConfig = CONFIG.TRASH_TYPES[primaryType] || CONFIG.TRASH_TYPES.other;
    
    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: typeConfig.color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  },
  
  // Show info window
  showInfoWindow(marker, trashBin) {
    const name = trashBin.name[i18n.currentLang] || trashBin.name.en || trashBin.name.ja;
    const address = trashBin.address[i18n.currentLang] || trashBin.address.en || trashBin.address.ja;
    
    const content = `
      <div class="info-window">
        <h3>${name}</h3>
        <p>${address}</p>
        <p><strong>${i18n.formatDistance(trashBin.distance_meters)}</strong></p>
        <div class="info-window-actions">
          <button onclick="window.MapModule.getDirections(${trashBin.location.lat}, ${trashBin.location.lng})" class="info-btn">
            ${i18n.t('get_directions')}
          </button>
          <button onclick="window.UIUtils.showTrashBinDetails('${trashBin.id}')" class="info-btn">
            ${i18n.t('view_details')}
          </button>
        </div>
      </div>
    `;
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  },
  
  // Get directions
  getDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  },
  
  // Show search radius
  showSearchRadius(center, radius) {
    if (this.searchCircle) {
      this.searchCircle.setMap(null);
    }
    
    this.searchCircle = new google.maps.Circle({
      center: center,
      radius: radius,
      map: this.map,
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 2
    });
  },
  
  // Focus on trash bin
  focusOnTrashBin(trashBin) {
    this.map.setCenter(trashBin.location);
    this.map.setZoom(17);
    
    // Find and trigger click on marker
    const marker = this.markers.find(m => 
      m.getPosition().lat() === trashBin.location.lat &&
      m.getPosition().lng() === trashBin.location.lng
    );
    
    if (marker) {
      google.maps.event.trigger(marker, 'click');
    }
  }
};

// Make MapModule globally available
window.MapModule = MapModule;