// Internationalization (i18n) Module
const i18n = {
  // Current language
  currentLang: 'ja',
  
  // Translations
  translations: {
    ja: {
      // UI Elements
      search_title: '最寄りのゴミ箱を探す',
      location_placeholder: '現在地を使用または住所を入力',
      search_radius: '検索範囲:',
      search_button: '検索',
      filter_title: 'ゴミの種類で絞り込む',
      results_title: '検索結果',
      loading: '読み込み中...',
      no_results: 'ゴミ箱が見つかりませんでした。',
      try_different_radius: '検索範囲を広げてみてください。',
      
      // Trash Types
      trash_burnable: '燃えるゴミ',
      trash_plastic_bottle: 'ペットボトル',
      trash_can: '缶',
      trash_glass: 'ビン',
      trash_paper: '紙類',
      trash_plastic: 'プラスチック',
      
      // Advanced Filters
      advanced_filters: '高度なフィルター',
      facility_type: '施設タイプ',
      facility_convenience_store: 'コンビニ',
      facility_station: '駅',
      facility_park: '公園',
      facility_shopping_mall: 'ショッピングモール',
      facility_vending_machine: '自動販売機',
      facility_public_facility: '公共施設',
      quality_score: '品質スコア',
      quality_any: 'すべて',
      quality_high: '高品質のみ',
      access_conditions: '利用条件',
      access_public: '誰でも利用可能',
      access_24hours: '24時間利用可能',
      apply_filters: 'フィルターを適用',
      
      // Feedback
      feedback_title: 'フィードバックを送信',
      feedback_type: 'フィードバックの種類',
      feedback_select_type: '種類を選択してください',
      feedback_correct: '情報が正確',
      feedback_incorrect_location: '場所が間違っている',
      feedback_wrong_info: '情報が間違っている',
      feedback_removed: 'ゴミ箱が撤去された',
      feedback_damaged: 'ゴミ箱が破損している',
      feedback_full: 'ゴミ箱が満杯',
      feedback_other: 'その他',
      feedback_content: '詳細（任意）',
      feedback_content_placeholder: '詳細な説明があれば記入してください',
      feedback_image: '写真を添付（任意）',
      feedback_image_placeholder: 'クリックして写真を選択',
      feedback_image_hint: 'JPG, PNG形式（最大5MB）',
      cancel: 'キャンセル',
      submit: '送信',
      feedback_success: 'フィードバックを送信しました',
      feedback_error: 'フィードバックの送信に失敗しました',
      report_issue: '問題を報告',
      
      // Footer
      privacy_policy: 'プライバシーポリシー',
      terms_of_use: '利用規約',
      contact: 'お問い合わせ',
      
      // Messages
      location_permission_denied: '位置情報の取得が拒否されました。',
      location_unavailable: '位置情報を取得できませんでした。',
      location_timeout: '位置情報の取得がタイムアウトしました。',
      search_error: '検索中にエラーが発生しました。',
      network_error: 'ネットワークエラーが発生しました。',
      
      // Distance
      distance_m: 'm',
      distance_km: 'km',
      
      // Actions
      get_directions: '経路を表示',
      report_issue: '問題を報告',
      view_details: '詳細を見る'
    },
    
    en: {
      // UI Elements
      search_title: 'Find Nearest Trash Bins',
      location_placeholder: 'Use current location or enter address',
      search_radius: 'Search radius:',
      search_button: 'Search',
      filter_title: 'Filter by trash type',
      results_title: 'Search Results',
      loading: 'Loading...',
      no_results: 'No trash bins found.',
      try_different_radius: 'Try expanding your search radius.',
      
      // Trash Types
      trash_burnable: 'Burnable',
      trash_plastic_bottle: 'Plastic Bottle',
      trash_can: 'Can',
      trash_glass: 'Glass',
      trash_paper: 'Paper',
      trash_plastic: 'Plastic',
      
      // Advanced Filters
      advanced_filters: 'Advanced Filters',
      facility_type: 'Facility Type',
      facility_convenience_store: 'Convenience Store',
      facility_station: 'Station',
      facility_park: 'Park',
      facility_shopping_mall: 'Shopping Mall',
      facility_vending_machine: 'Vending Machine',
      facility_public_facility: 'Public Facility',
      quality_score: 'Quality Score',
      quality_any: 'All',
      quality_high: 'High Quality Only',
      access_conditions: 'Access Conditions',
      access_public: 'Public Access',
      access_24hours: '24 Hours Available',
      apply_filters: 'Apply Filters',
      
      // Feedback
      feedback_title: 'Submit Feedback',
      feedback_type: 'Feedback Type',
      feedback_select_type: 'Please select type',
      feedback_correct: 'Information is accurate',
      feedback_incorrect_location: 'Location is incorrect',
      feedback_wrong_info: 'Information is wrong',
      feedback_removed: 'Trash bin has been removed',
      feedback_damaged: 'Trash bin is damaged',
      feedback_full: 'Trash bin is full',
      feedback_other: 'Other',
      feedback_content: 'Details (optional)',
      feedback_content_placeholder: 'Please provide detailed description if any',
      feedback_image: 'Attach photo (optional)',
      feedback_image_placeholder: 'Click to select photo',
      feedback_image_hint: 'JPG, PNG format (max 5MB)',
      cancel: 'Cancel',
      submit: 'Submit',
      feedback_success: 'Feedback submitted successfully',
      feedback_error: 'Failed to submit feedback',
      report_issue: 'Report Issue',
      
      // Footer
      privacy_policy: 'Privacy Policy',
      terms_of_use: 'Terms of Use',
      contact: 'Contact',
      
      // Messages
      location_permission_denied: 'Location permission denied.',
      location_unavailable: 'Location unavailable.',
      location_timeout: 'Location request timed out.',
      search_error: 'An error occurred during search.',
      network_error: 'Network error occurred.',
      
      // Distance
      distance_m: 'm',
      distance_km: 'km',
      
      // Actions
      get_directions: 'Get Directions',
      report_issue: 'Report Issue',
      view_details: 'View Details'
    },
    
    zh: {
      // UI Elements
      search_title: '查找最近的垃圾箱',
      location_placeholder: '使用当前位置或输入地址',
      search_radius: '搜索范围：',
      search_button: '搜索',
      filter_title: '按垃圾类型筛选',
      results_title: '搜索结果',
      loading: '加载中...',
      no_results: '未找到垃圾箱。',
      try_different_radius: '请尝试扩大搜索范围。',
      
      // Trash Types
      trash_burnable: '可燃垃圾',
      trash_plastic_bottle: '塑料瓶',
      trash_can: '罐头',
      trash_glass: '玻璃',
      trash_paper: '纸类',
      trash_plastic: '塑料',
      
      // Advanced Filters
      advanced_filters: '高级筛选',
      facility_type: '设施类型',
      facility_convenience_store: '便利店',
      facility_station: '车站',
      facility_park: '公园',
      facility_shopping_mall: '购物中心',
      facility_vending_machine: '自动售货机',
      facility_public_facility: '公共设施',
      quality_score: '质量评分',
      quality_any: '全部',
      quality_high: '仅高质量',
      access_conditions: '使用条件',
      access_public: '公共使用',
      access_24hours: '24小时可用',
      apply_filters: '应用筛选',
      
      // Feedback
      feedback_title: '提交反馈',
      feedback_type: '反馈类型',
      feedback_select_type: '请选择类型',
      feedback_correct: '信息准确',
      feedback_incorrect_location: '位置错误',
      feedback_wrong_info: '信息错误',
      feedback_removed: '垃圾箱已被移除',
      feedback_damaged: '垃圾箱已损坏',
      feedback_full: '垃圾箱已满',
      feedback_other: '其他',
      feedback_content: '详细信息（可选）',
      feedback_content_placeholder: '如有详细说明请填写',
      feedback_image: '附加照片（可选）',
      feedback_image_placeholder: '点击选择照片',
      feedback_image_hint: 'JPG, PNG格式（最大5MB）',
      cancel: '取消',
      submit: '提交',
      feedback_success: '反馈提交成功',
      feedback_error: '反馈提交失败',
      report_issue: '报告问题',
      
      // Footer
      privacy_policy: '隐私政策',
      terms_of_use: '使用条款',
      contact: '联系我们',
      
      // Messages
      location_permission_denied: '位置权限被拒绝。',
      location_unavailable: '无法获取位置。',
      location_timeout: '位置请求超时。',
      search_error: '搜索时发生错误。',
      network_error: '网络错误。',
      
      // Distance
      distance_m: '米',
      distance_km: '公里',
      
      // Actions
      get_directions: '获取路线',
      report_issue: '报告问题',
      view_details: '查看详情'
    }
  },
  
  // Initialize i18n
  init() {
    // Get user's preferred language
    const savedLang = localStorage.getItem('language');
    const browserLang = navigator.language.substring(0, 2);
    
    if (savedLang && this.translations[savedLang]) {
      this.currentLang = savedLang;
    } else if (this.translations[browserLang]) {
      this.currentLang = browserLang;
    }
    
    // Set initial language
    this.setLanguage(this.currentLang);
    
    // Add language button event listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        this.setLanguage(lang);
      });
    });
  },
  
  // Set language
  setLanguage(lang) {
    if (!this.translations[lang]) return;
    
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update all translated elements
    this.updateTranslations();
    
    // Update document language
    document.documentElement.lang = lang;
  },
  
  // Update all translations
  updateTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (this.translations[this.currentLang][key]) {
        el.textContent = this.translations[this.currentLang][key];
      }
    });
    
    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (this.translations[this.currentLang][key]) {
        el.placeholder = this.translations[this.currentLang][key];
      }
    });
  },
  
  // Get translation
  t(key) {
    return this.translations[this.currentLang][key] || key;
  },
  
  // Format distance
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}${this.t('distance_m')}`;
    } else {
      return `${(meters / 1000).toFixed(1)}${this.t('distance_km')}`;
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
});

// Make i18n globally available
window.i18n = i18n;