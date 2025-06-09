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
    
    // Initialize feedback form handlers
    this.initFeedbackHandlers();
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
      const response = await fetch(`/api/v1/trash-bins/${trashBinId}`);
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
    const modal = document.getElementById('feedback-modal');
    const trashBinIdInput = document.getElementById('feedback-trash-bin-id');
    
    if (trashBinIdInput) {
      trashBinIdInput.value = trashBinId;
    }
    
    // Reset form
    const form = document.getElementById('feedback-form');
    if (form) {
      form.reset();
      this.removeSelectedImage();
    }
    
    // Close detail modal
    this.hideModal();
    
    // Show feedback modal
    modal.classList.remove('hidden');
  },

  // Initialize feedback form handlers
  initFeedbackHandlers() {
    // Image upload area
    const imageUploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('feedback-image');
    const removeImageBtn = document.getElementById('remove-image');
    
    if (imageUploadArea && fileInput) {
      // Click to select file
      imageUploadArea.addEventListener('click', () => {
        fileInput.click();
      });
      
      // Handle file selection
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleImageSelection(file);
        }
      });
      
      // Remove image button
      if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeSelectedImage();
        });
      }
      
      // Drag and drop support
      imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#2ecc71';
      });
      
      imageUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#ddd';
      });
      
      imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#ddd';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            fileInput.files = files;
            this.handleImageSelection(file);
          }
        }
      });
    }
    
    // Form submission
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => this.handleFeedbackSubmit(e));
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('feedback-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeFeedbackModal());
    }
    
    // Close button
    const closeBtn = document.getElementById('feedback-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeFeedbackModal());
    }
  },

  // Handle image selection and preview
  handleImageSelection(file) {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification(i18n.t('feedback_error') || 'ファイルサイズが大きすぎます（最大5MB）', 'error');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showNotification('画像ファイルを選択してください', 'error');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadPlaceholder = document.getElementById('upload-placeholder');
      const imagePreview = document.getElementById('image-preview');
      const previewImage = document.getElementById('preview-image');
      
      if (uploadPlaceholder && imagePreview && previewImage) {
        previewImage.src = e.target.result;
        uploadPlaceholder.classList.add('hidden');
        imagePreview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  },

  // Remove selected image
  removeSelectedImage() {
    const fileInput = document.getElementById('feedback-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const imagePreview = document.getElementById('image-preview');
    
    if (fileInput) {
      fileInput.value = '';
    }
    
    if (uploadPlaceholder && imagePreview) {
      uploadPlaceholder.classList.remove('hidden');
      imagePreview.classList.add('hidden');
    }
  },

  // Handle feedback form submission
  async handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';
      
      // Create FormData for file upload
      const formData = new FormData(form);
      
      // Add user location if available
      if (navigator.geolocation) {
        try {
          const position = await this.getCurrentPosition();
          formData.append('user_lat', position.coords.latitude);
          formData.append('user_lng', position.coords.longitude);
        } catch (error) {
          // Location not available, continue without it
          console.log('Location not available for feedback');
        }
      }
      
      // Submit feedback
      const response = await fetch(`/api/v1/trash-bins/feedback`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        this.showNotification(i18n.t('feedback_success') || 'フィードバックを送信しました', 'success');
        this.closeFeedbackModal();
      } else {
        throw new Error(result.message || 'フィードバックの送信に失敗しました');
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showNotification(i18n.t('feedback_error') || 'フィードバックの送信に失敗しました', 'error');
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  // Get current position as Promise
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Close feedback modal
  closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const form = document.getElementById('feedback-form');
    
    if (modal) {
      modal.classList.add('hidden');
    }
    
    if (form) {
      form.reset();
      this.removeSelectedImage();
    }
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