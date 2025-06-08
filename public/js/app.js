// Main Application Module
const App = {
  websocket: null,
  
  // Initialize application
  async init() {
    try {
      // Initialize map
      await MapModule.init();
      
      // Initialize search
      SearchModule.init();
      
      // Initialize WebSocket
      this.initWebSocket();
      
      // Initialize UI utilities
      UIUtils.init();
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Application initialization error:', error);
      UIUtils.showNotification(i18n.t('network_error'), 'error');
    }
  },
  
  // Initialize WebSocket connection
  initWebSocket() {
    if (!CONFIG.WEBSOCKET_URL) return;
    
    try {
      this.websocket = new WebSocket(CONFIG.WEBSOCKET_URL);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after delay
        setTimeout(() => {
          this.initWebSocket();
        }, CONFIG.WEBSOCKET_RECONNECT_INTERVAL);
      };
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  },
  
  // Handle WebSocket messages
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'trash_bin_update':
          this.handleTrashBinUpdate(message.data);
          break;
        case 'new_trash_bin':
          this.handleNewTrashBin(message.data);
          break;
        case 'trash_bin_removed':
          this.handleTrashBinRemoved(message.data);
          break;
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  },
  
  // Handle trash bin update
  handleTrashBinUpdate(data) {
    console.log('Trash bin updated:', data);
    // TODO: Update UI with new data
  },
  
  // Handle new trash bin
  handleNewTrashBin(data) {
    console.log('New trash bin added:', data);
    // TODO: Add new marker to map
  },
  
  // Handle trash bin removed
  handleTrashBinRemoved(data) {
    console.log('Trash bin removed:', data);
    // TODO: Remove marker from map
  }
};

// UI Utilities
const UIUtils = {
  notificationTimeout: null,
  
  // Initialize UI utilities
  init() {
    // Modal close button
    document.getElementById('modal-close').addEventListener('click', () => {
      this.hideModal();
    });
    
    // Modal background click
    document.getElementById('detail-modal').addEventListener('click', (e) => {
      if (e.target.id === 'detail-modal') {
        this.hideModal();
      }
    });
  },
  
  // Show loading indicator
  showLoading() {
    document.getElementById('loading-indicator').classList.remove('hidden');
    document.getElementById('results-list').classList.add('hidden');
    document.getElementById('no-results').classList.add('hidden');
  },
  
  // Hide loading indicator
  hideLoading() {
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('results-list').classList.remove('hidden');
  },
  
  // Show notification
  showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    // Clear previous timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // Auto hide after 5 seconds
    this.notificationTimeout = setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  },
  
  // Show trash bin details
  async showTrashBinDetails(trashBinId) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/trash-bins/${trashBinId}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      
      const data = await response.json();
      const trashBin = data.data;
      
      // Build modal content
      const name = trashBin.name[i18n.currentLang] || trashBin.name.en || trashBin.name.ja;
      const address = trashBin.address[i18n.currentLang] || trashBin.address.en || trashBin.address.ja;
      const facilityType = CONFIG.FACILITY_TYPES[trashBin.facility_type] || CONFIG.FACILITY_TYPES.other;
      
      const modalContent = `
        <h2>${name}</h2>
        <p><strong>${facilityType.icon} ${facilityType.name}</strong></p>
        <p>${address}</p>
        
        <div class="detail-section">
          <h3>${i18n.t('trash_types')}</h3>
          <div class="trash-types-grid">
            ${trashBin.trash_types.map(type => {
              const typeConfig = CONFIG.TRASH_TYPES[type] || CONFIG.TRASH_TYPES.other;
              return `<div class="trash-type-item">${typeConfig.icon} ${i18n.t(`trash_${type}`)}</div>`;
            }).join('')}
          </div>
        </div>
        
        ${trashBin.operating_hours ? `
          <div class="detail-section">
            <h3>${i18n.t('operating_hours')}</h3>
            <p>${this.formatOperatingHours(trashBin.operating_hours)}</p>
          </div>
        ` : ''}
        
        ${trashBin.access_conditions ? `
          <div class="detail-section">
            <h3>${i18n.t('access_conditions')}</h3>
            <p>${trashBin.access_conditions[i18n.currentLang] || trashBin.access_conditions.en || trashBin.access_conditions.ja}</p>
          </div>
        ` : ''}
        
        <div class="detail-actions">
          <button onclick="window.MapModule.getDirections(${trashBin.location.lat}, ${trashBin.location.lng})" class="primary-btn">
            ${i18n.t('get_directions')}
          </button>
          <button onclick="window.UIUtils.showReportForm('${trashBinId}')" class="secondary-btn">
            ${i18n.t('report_issue')}
          </button>
        </div>
      `;
      
      document.getElementById('modal-body').innerHTML = modalContent;
      this.showModal();
      
    } catch (error) {
      console.error('Error fetching trash bin details:', error);
      this.showNotification(i18n.t('network_error'), 'error');
    }
  },
  
  // Format operating hours
  formatOperatingHours(hours) {
    // TODO: Implement proper formatting based on language
    return '24時間';
  },
  
  // Show modal
  showModal() {
    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  
  // Hide modal
  hideModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.style.overflow = '';
  },
  
  // Show report form
  showReportForm(trashBinId) {
    // TODO: Implement report form
    console.log('Show report form for:', trashBinId);
  }
};

// Notification styles
const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    background-color: #333;
    color: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 1001;
    max-width: 300px;
  }
  
  .notification.show {
    transform: translateX(0);
  }
  
  .notification.error {
    background-color: #D32F2F;
  }
  
  .notification.success {
    background-color: #388E3C;
  }
  
  .info-window {
    padding: 8px;
    max-width: 250px;
  }
  
  .info-window h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
  }
  
  .info-window p {
    margin: 4px 0;
    font-size: 14px;
  }
  
  .info-window-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
  
  .info-btn {
    padding: 6px 12px;
    background-color: #2E7D32;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .info-btn:hover {
    background-color: #1B5E20;
  }
  
  .detail-section {
    margin: 20px 0;
  }
  
  .detail-section h3 {
    margin-bottom: 10px;
    font-size: 18px;
  }
  
  .trash-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .trash-type-item {
    padding: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
    text-align: center;
  }
  
  .detail-actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
  }
  
  .primary-btn, .secondary-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  }
  
  .primary-btn {
    background-color: #2E7D32;
    color: white;
  }
  
  .primary-btn:hover {
    background-color: #1B5E20;
  }
  
  .secondary-btn {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .secondary-btn:hover {
    background-color: #d0d0d0;
  }
`;

// Add notification styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Make modules globally available
window.App = App;
window.UIUtils = UIUtils;