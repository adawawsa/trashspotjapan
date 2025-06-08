// Search Module
const SearchModule = {
  currentLocation: null,
  searchResults: [],
  isSearching: false,
  
  // Initialize search module
  init() {
    // Add event listeners
    document.getElementById('search-btn').addEventListener('click', () => {
      this.handleSearch();
    });
    
    document.getElementById('use-current-location').addEventListener('click', () => {
      this.useCurrentLocation();
    });
    
    document.getElementById('location-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });
    
    // Add filter change listeners
    document.querySelectorAll('.trash-type-filter').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (this.searchResults.length > 0) {
          this.filterResults();
        }
      });
    });
  },
  
  // Handle search
  async handleSearch() {
    if (this.isSearching) return;
    
    const locationInput = document.getElementById('location-input').value.trim();
    
    if (!locationInput && !this.currentLocation) {
      window.UIUtils.showNotification(i18n.t('location_placeholder'), 'error');
      return;
    }
    
    if (locationInput) {
      // Geocode address
      try {
        const location = await this.geocodeAddress(locationInput);
        this.performSearch(location);
      } catch (error) {
        window.UIUtils.showNotification(i18n.t('location_unavailable'), 'error');
      }
    } else if (this.currentLocation) {
      this.performSearch(this.currentLocation);
    }
  },
  
  // Use current location
  useCurrentLocation() {
    if (!navigator.geolocation) {
      window.UIUtils.showNotification(i18n.t('location_unavailable'), 'error');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Clear location input
        document.getElementById('location-input').value = '';
        
        // Update map
        window.MapModule.addUserLocationMarker(this.currentLocation);
        window.MapModule.map.setCenter(this.currentLocation);
        
        // Perform search
        this.performSearch(this.currentLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
        window.UIUtils.showNotification(i18n.t('location_unavailable'), 'error');
      }
    );
  },
  
  // Geocode address
  async geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: address + ', Japan' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          resolve(location);
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  },
  
  // Perform search
  async performSearch(location) {
    if (this.isSearching) return;
    
    this.isSearching = true;
    this.currentLocation = location;
    
    // Show loading
    window.UIUtils.showLoading();
    
    // Get search parameters
    const radius = parseInt(document.getElementById('search-radius').value);
    const selectedTrashTypes = this.getSelectedTrashTypes();
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        lat: location.lat,
        lng: location.lng,
        radius: radius
      });
      
      if (selectedTrashTypes.length > 0) {
        params.append('trash_types', selectedTrashTypes.join(','));
      }
      
      // Make API request
      const response = await fetch(`${CONFIG.API_BASE_URL}/trash-bins/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      
      // Store results
      this.searchResults = data.data.trash_bins;
      
      // Update UI
      this.displayResults(this.searchResults);
      
      // Update map
      window.MapModule.addTrashBinMarkers(this.searchResults);
      window.MapModule.showSearchRadius(location, radius);
      
    } catch (error) {
      console.error('Search error:', error);
      window.UIUtils.showNotification(i18n.t('search_error'), 'error');
    } finally {
      this.isSearching = false;
      window.UIUtils.hideLoading();
    }
  },
  
  // Get selected trash types
  getSelectedTrashTypes() {
    const selected = [];
    document.querySelectorAll('.trash-type-filter:checked').forEach(checkbox => {
      selected.push(checkbox.value);
    });
    return selected;
  },
  
  // Display results
  displayResults(results) {
    const resultsContainer = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Update count
    resultsCount.textContent = `(${results.length})`;
    
    if (results.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }
    
    noResults.classList.add('hidden');
    
    // Create result cards
    results.forEach(trashBin => {
      const card = this.createResultCard(trashBin);
      resultsContainer.appendChild(card);
    });
  },
  
  // Create result card
  createResultCard(trashBin) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const name = trashBin.name[i18n.currentLang] || trashBin.name.en || trashBin.name.ja;
    const address = trashBin.address[i18n.currentLang] || trashBin.address.en || trashBin.address.ja;
    const facilityType = CONFIG.FACILITY_TYPES[trashBin.facility_type] || CONFIG.FACILITY_TYPES.other;
    
    // Create trash type tags
    const trashTypeTags = trashBin.trash_types.map(type => {
      const typeConfig = CONFIG.TRASH_TYPES[type] || CONFIG.TRASH_TYPES.other;
      return `<span class="trash-type-tag" style="background-color: ${typeConfig.color}">${typeConfig.icon} ${i18n.t(`trash_${type}`)}</span>`;
    }).join('');
    
    card.innerHTML = `
      <div class="result-card-header">
        <h4 class="result-card-title">${name}</h4>
        <span class="result-card-distance">${i18n.formatDistance(trashBin.distance_meters)}</span>
      </div>
      <p class="result-card-address">${address}</p>
      <div class="result-card-trash-types">${trashTypeTags}</div>
      <p class="result-card-facility">${facilityType.icon} ${facilityType.name}</p>
    `;
    
    // Add click event
    card.addEventListener('click', () => {
      window.MapModule.focusOnTrashBin(trashBin);
    });
    
    return card;
  },
  
  // Filter results
  filterResults() {
    const selectedTypes = this.getSelectedTrashTypes();
    
    if (selectedTypes.length === 0) {
      this.displayResults(this.searchResults);
      window.MapModule.addTrashBinMarkers(this.searchResults);
      return;
    }
    
    const filtered = this.searchResults.filter(trashBin => {
      return selectedTypes.some(type => trashBin.trash_types.includes(type));
    });
    
    this.displayResults(filtered);
    window.MapModule.addTrashBinMarkers(filtered);
  }
};

// Make SearchModule globally available
window.SearchModule = SearchModule;