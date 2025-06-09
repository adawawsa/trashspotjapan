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
    
    // Advanced filters toggle
    document.getElementById('advanced-filters-toggle').addEventListener('click', () => {
      this.toggleAdvancedFilters();
    });
    
    // Quality score slider
    const qualitySlider = document.getElementById('quality-score-slider');
    const qualityValue = document.getElementById('quality-score-value');
    qualitySlider.addEventListener('input', (e) => {
      qualityValue.textContent = e.target.value + '%';
    });
    
    // Apply advanced filters button
    document.getElementById('apply-advanced-filters').addEventListener('click', () => {
      this.handleSearch();
    });
  },
  
  // Toggle advanced filters
  toggleAdvancedFilters() {
    const toggleBtn = document.getElementById('advanced-filters-toggle');
    const advancedFilters = document.getElementById('advanced-filters');
    
    toggleBtn.classList.toggle('active');
    advancedFilters.classList.toggle('hidden');
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
    const selectedFacilityTypes = this.getSelectedFacilityTypes();
    const minQualityScore = parseInt(document.getElementById('quality-score-slider').value) / 100;
    
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
      
      if (selectedFacilityTypes.length > 0) {
        params.append('facility_types', selectedFacilityTypes.join(','));
      }
      
      if (minQualityScore > 0) {
        params.append('min_quality_score', minQualityScore);
      }
      
      // Use mock data if available (demo mode)
      if (window.MOCK_TRASH_BINS) {
        console.log('Using mock data for search');
        this.searchResults = this.filterMockData(window.MOCK_TRASH_BINS, location, radius, selectedTrashTypes, selectedFacilityTypes, minQualityScore);
      } else {
        // Make API request
        const response = await fetch(`${CONFIG.API_BASE_URL}/trash-bins/search?${params}`);
        
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        
        const data = await response.json();
        this.searchResults = data.data.trash_bins;
      }
      
      // Update UI
      this.displaySearchResults(this.searchResults);
      
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
  
  // Filter mock data based on search criteria
  filterMockData(mockData, location, radius, trashTypes, facilityTypes, minQualityScore) {
    return mockData.filter(trashBin => {
      // Calculate distance
      const distance = this.calculateDistance(
        location.lat, location.lng,
        trashBin.location.lat, trashBin.location.lng
      );
      
      // Update distance in result
      trashBin.distance_meters = Math.round(distance);
      
      // Filter by radius
      if (distance > radius) return false;
      
      // Filter by trash types if specified
      if (trashTypes && trashTypes.length > 0) {
        const hasMatchingType = trashTypes.some(type => 
          trashBin.trash_types.includes(type)
        );
        if (!hasMatchingType) return false;
      }
      
      // Filter by facility types if specified
      if (facilityTypes && facilityTypes.length > 0) {
        if (!facilityTypes.includes(trashBin.facility_type)) return false;
      }
      
      // Filter by quality score if specified
      if (minQualityScore && minQualityScore > 0) {
        if (trashBin.quality_score < minQualityScore) return false;
      }
      
      return true;
    }).sort((a, b) => a.distance_meters - b.distance_meters);
  },
  
  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  
  // Get selected trash types
  getSelectedTrashTypes() {
    const selected = [];
    document.querySelectorAll('.trash-type-filter:checked').forEach(checkbox => {
      selected.push(checkbox.value);
    });
    return selected;
  },
  
  // Get selected facility types
  getSelectedFacilityTypes() {
    const selected = [];
    document.querySelectorAll('.facility-type-filter:checked').forEach(checkbox => {
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

  // Alias for backward compatibility and mock usage
  displaySearchResults(trashBins) {
    this.displayResults(trashBins);
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