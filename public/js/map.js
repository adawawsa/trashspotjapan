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
    
    // Try to get user location
    this.getUserLocation();
  },
  
  // Load Google Maps API dynamically
  loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
        
        // Center map on user location
        this.map.setCenter(userLocation);
        
        // Add user location marker
        this.addUserLocationMarker(userLocation);
        
        // Trigger initial search
        window.SearchModule.performSearch(userLocation);
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
      this.userLocationMarker.setMap(null);
    }
    
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