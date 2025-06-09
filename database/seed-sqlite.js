const { initSQLiteDB } = require('../src/config/database-sqlite');
const logger = require('../src/utils/logger');

// Comprehensive trash bin data for different areas in Japan
const sampleTrashBins = [
  // Tokyo Station Area (5 locations)
  {
    name: { ja: '東京駅八重洲口コンビニ前', en: 'Tokyo Station Yaesu Convenience Store', zh: '东京车站八重洲口便利店前' },
    lat: 35.6812, lng: 139.7671,
    address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '東京駅構内リサイクルボックス', en: 'Tokyo Station Recycling Box', zh: '东京车站内回收箱' },
    lat: 35.6812, lng: 139.7649,
    address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
    trash_types: ['plastic_bottle', 'can', 'paper'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  {
    name: { ja: '丸の内オアゾ前', en: 'Marunouchi OAZO Front', zh: '丸之内OAZO前' },
    lat: 35.6823, lng: 139.7640,
    address: { ja: '東京都千代田区丸の内1-6-4', en: '1-6-4 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-6-4' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-21:00', en: '10:00-21:00', zh: '10:00-21:00' }
  },
  {
    name: { ja: '有楽町駅前交番', en: 'Yurakucho Station Police Box', zh: '有乐町站前派出所' },
    lat: 35.6751, lng: 139.7634,
    address: { ja: '東京都千代田区有楽町2-10-1', en: '2-10-1 Yurakucho, Chiyoda City, Tokyo', zh: '东京都千代田区有乐町2-10-1' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '皇居外苑入口', en: 'Imperial Palace Outer Garden Entrance', zh: '皇居外苑入口' },
    lat: 35.6838, lng: 139.7573,
    address: { ja: '東京都千代田区皇居外苑1-1', en: '1-1 Kokyo Gaien, Chiyoda City, Tokyo', zh: '东京都千代田区皇居外苑1-1' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '6:00-18:00', en: '6:00-18:00', zh: '6:00-18:00' }
  },

  // Shibuya Area (10 locations)
  {
    name: { ja: '渋谷センター街入口', en: 'Shibuya Center Gai Entrance', zh: '涩谷中心街入口' },
    lat: 35.6598, lng: 139.7023,
    address: { ja: '東京都渋谷区宇田川町', en: 'Udagawacho, Shibuya City, Tokyo', zh: '东京都涩谷区宇田川町' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '渋谷駅ハチ公口自販機', en: 'Shibuya Station Hachiko Exit Vending Machine', zh: '涩谷站八公口自动售货机' },
    lat: 35.6590, lng: 139.7016,
    address: { ja: '東京都渋谷区道玄坂', en: 'Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂' },
    trash_types: ['plastic_bottle', 'can'],
    facility_type: 'vending_machine',
    access_conditions: { ja: '購入者のみ', en: 'Customers only', zh: '仅限购买者' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '渋谷109前', en: 'Shibuya 109 Front', zh: '涩谷109前' },
    lat: 35.6593, lng: 139.7016,
    address: { ja: '東京都渋谷区道玄坂2-29-1', en: '2-29-1 Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂2-29-1' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-21:00', en: '10:00-21:00', zh: '10:00-21:00' }
  },
  {
    name: { ja: 'スクランブル交差点ファミマ', en: 'Scramble Crossing FamilyMart', zh: '十字路口全家便利店' },
    lat: 35.6595, lng: 139.7006,
    address: { ja: '東京都渋谷区道玄坂1-5-2', en: '1-5-2 Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂1-5-2' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '店舗利用者のみ', en: 'Store customers only', zh: '仅限店铺顾客' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '渋谷公園通り', en: 'Shibuya Koen-dori', zh: '涩谷公园通' },
    lat: 35.6627, lng: 139.7020,
    address: { ja: '東京都渋谷区神南1-20-1', en: '1-20-1 Jinnan, Shibuya City, Tokyo', zh: '东京都涩谷区神南1-20-1' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '渋谷マークシティ', en: 'Shibuya Mark City', zh: '涩谷马克城' },
    lat: 35.6580, lng: 139.6994,
    address: { ja: '東京都渋谷区道玄坂1-12-1', en: '1-12-1 Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂1-12-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-21:00', en: '10:00-21:00', zh: '10:00-21:00' }
  },
  {
    name: { ja: '渋谷駅南口', en: 'Shibuya Station South Exit', zh: '涩谷站南口' },
    lat: 35.6570, lng: 139.7016,
    address: { ja: '東京都渋谷区渋谷3-27-1', en: '3-27-1 Shibuya, Shibuya City, Tokyo', zh: '东京都涩谷区涩谷3-27-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  {
    name: { ja: '代々木公園入口', en: 'Yoyogi Park Entrance', zh: '代代木公园入口' },
    lat: 35.6732, lng: 139.6939,
    address: { ja: '東京都渋谷区代々木神園町2-1', en: '2-1 Yoyogi Kamizono-cho, Shibuya City, Tokyo', zh: '东京都涩谷区代代木神园町2-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '5:00-20:00', en: '5:00-20:00', zh: '5:00-20:00' }
  },
  {
    name: { ja: '表参道ヒルズ前', en: 'Omotesando Hills Front', zh: '表参道之丘前' },
    lat: 35.6655, lng: 139.7126,
    address: { ja: '東京都渋谷区神宮前4-12-10', en: '4-12-10 Jingumae, Shibuya City, Tokyo', zh: '东京都涩谷区神宫前4-12-10' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '11:00-21:00', en: '11:00-21:00', zh: '11:00-21:00' }
  },
  {
    name: { ja: '竹下通りファミリーマート', en: 'Takeshita Street FamilyMart', zh: '竹下通全家便利店' },
    lat: 35.6702, lng: 139.7063,
    address: { ja: '東京都渋谷区神宮前1-19-11', en: '1-19-11 Jingumae, Shibuya City, Tokyo', zh: '东京都涩谷区神宫前1-19-11' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '店舗利用者のみ', en: 'Store customers only', zh: '仅限店铺顾客' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },

  // Shinjuku Area (10 locations)
  {
    name: { ja: '新宿公園ゴミ箱', en: 'Shinjuku Park Trash Bin', zh: '新宿公园垃圾桶' },
    lat: 35.6938, lng: 139.7034,
    address: { ja: '東京都新宿区内藤町11', en: '11 Naitocho, Shinjuku City, Tokyo', zh: '东京都新宿区内藤町11' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '6:00-18:00', en: '6:00-18:00', zh: '6:00-18:00' }
  },
  {
    name: { ja: '新宿駅南口ルミネ', en: 'Shinjuku Station South Exit Lumine', zh: '新宿站南口LUMINE' },
    lat: 35.6896, lng: 139.7006,
    address: { ja: '東京都新宿区西新宿1-1-5', en: '1-1-5 Nishi-Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区西新宿1-1-5' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-22:00', en: '10:00-22:00', zh: '10:00-22:00' }
  },
  {
    name: { ja: '新宿東口アルタ前', en: 'Shinjuku East Exit Alta Front', zh: '新宿东口Alta前' },
    lat: 35.6895, lng: 139.7044,
    address: { ja: '東京都新宿区新宿3-24-3', en: '3-24-3 Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区新宿3-24-3' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '歌舞伎町一番街', en: 'Kabukicho Ichiban-gai', zh: '歌舞伎町一番街' },
    lat: 35.6949, lng: 139.7028,
    address: { ja: '東京都新宿区歌舞伎町1-14-1', en: '1-14-1 Kabukicho, Shinjuku City, Tokyo', zh: '东京都新宿区歌舞伎町1-14-1' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '新宿西口地下広場', en: 'Shinjuku West Exit Underground Plaza', zh: '新宿西口地下广场' },
    lat: 35.6898, lng: 139.6993,
    address: { ja: '東京都新宿区西新宿1-1-1', en: '1-1-1 Nishi-Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区西新宿1-1-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  {
    name: { ja: '高島屋前', en: 'Takashimaya Front', zh: '高岛屋前' },
    lat: 35.6898, lng: 139.7051,
    address: { ja: '東京都新宿区新宿5-24-2', en: '5-24-2 Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区新宿5-24-2' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-20:00', en: '10:00-20:00', zh: '10:00-20:00' }
  },
  {
    name: { ja: '新宿中央公園', en: 'Shinjuku Central Park', zh: '新宿中央公园' },
    lat: 35.6893, lng: 139.6857,
    address: { ja: '東京都新宿区西新宿2-11', en: '2-11 Nishi-Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区西新宿2-11' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '都庁展望台', en: 'Tokyo Metropolitan Government Building Observatory', zh: '都厅展望台' },
    lat: 35.6898, lng: 139.6922,
    address: { ja: '東京都新宿区西新宿2-8-1', en: '2-8-1 Nishi-Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区西新宿2-8-1' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'public_facility',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '9:30-17:30', en: '9:30-17:30', zh: '9:30-17:30' }
  },
  {
    name: { ja: '伊勢丹前', en: 'Isetan Front', zh: '伊势丹前' },
    lat: 35.6918, lng: 139.7056,
    address: { ja: '東京都新宿区新宿3-14-1', en: '3-14-1 Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区新宿3-14-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-20:00', en: '10:00-20:00', zh: '10:00-20:00' }
  },
  {
    name: { ja: '新宿三丁目駅', en: 'Shinjuku-sanchome Station', zh: '新宿三丁目站' },
    lat: 35.6907, lng: 139.7063,
    address: { ja: '東京都新宿区新宿3-17-1', en: '3-17-1 Shinjuku, Shinjuku City, Tokyo', zh: '东京都新宿区新宿3-17-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },

  // Asakusa Area (5 locations)
  {
    name: { ja: '浅草寺境内', en: 'Sensoji Temple Grounds', zh: '浅草寺境内' },
    lat: 35.7148, lng: 139.7967,
    address: { ja: '東京都台東区浅草2-3-1', en: '2-3-1 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草2-3-1' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '参拝者のみ', en: 'Visitors only', zh: '仅限参拜者' },
    operating_hours: { ja: '6:00-17:00', en: '6:00-17:00', zh: '6:00-17:00' }
  },
  {
    name: { ja: '雷門前', en: 'Kaminarimon Gate Front', zh: '雷门前' },
    lat: 35.7107, lng: 139.7966,
    address: { ja: '東京都台東区浅草2-3-1', en: '2-3-1 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草2-3-1' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '仲見世通り中央', en: 'Nakamise-dori Center', zh: '仲见世通中央' },
    lat: 35.7127, lng: 139.7966,
    address: { ja: '東京都台東区浅草1-36-3', en: '1-36-3 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草1-36-3' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '9:00-19:00', en: '9:00-19:00', zh: '9:00-19:00' }
  },
  {
    name: { ja: '浅草駅前ローソン', en: 'Asakusa Station Lawson', zh: '浅草站前罗森' },
    lat: 35.7116, lng: 139.7958,
    address: { ja: '東京都台東区浅草1-4-2', en: '1-4-2 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草1-4-2' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '店舗利用者のみ', en: 'Store customers only', zh: '仅限店铺顾客' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: 'スカイツリー前広場', en: 'Sky Tree Front Plaza', zh: '天空树前广场' },
    lat: 35.7101, lng: 139.8107,
    address: { ja: '東京都墨田区押上1-1-2', en: '1-1-2 Oshiage, Sumida City, Tokyo', zh: '东京都墨田区押上1-1-2' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '8:00-22:00', en: '8:00-22:00', zh: '8:00-22:00' }
  },

  // Ginza Area (5 locations)
  {
    name: { ja: '銀座中央通りリサイクル', en: 'Ginza Chuo-dori Recycling', zh: '银座中央通回收点' },
    lat: 35.6762, lng: 139.7653,
    address: { ja: '東京都中央区銀座4-6-16', en: '4-6-16 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-6-16' },
    trash_types: ['plastic_bottle', 'can', 'glass', 'paper'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '8:00-20:00', en: '8:00-20:00', zh: '8:00-20:00' }
  },
  {
    name: { ja: '銀座駅構内', en: 'Ginza Station Inside', zh: '银座站内' },
    lat: 35.6719, lng: 139.7648,
    address: { ja: '東京都中央区銀座4-1', en: '4-1 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  {
    name: { ja: '和光本館前', en: 'Wako Honkan Front', zh: '和光本馆前' },
    lat: 35.6710, lng: 139.7637,
    address: { ja: '東京都中央区銀座4-5-11', en: '4-5-11 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-5-11' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:30-19:00', en: '10:30-19:00', zh: '10:30-19:00' }
  },
  {
    name: { ja: '築地市場跡地', en: 'Former Tsukiji Market Site', zh: '筑地市场旧址' },
    lat: 35.6654, lng: 139.7707,
    address: { ja: '東京都中央区築地5-2-1', en: '5-2-1 Tsukiji, Chuo City, Tokyo', zh: '东京都中央区筑地5-2-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '歌舞伎座前', en: 'Kabuki-za Theater Front', zh: '歌舞伎座前' },
    lat: 35.6695, lng: 139.7681,
    address: { ja: '東京都中央区銀座4-12-15', en: '4-12-15 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-12-15' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '9:00-21:00', en: '9:00-21:00', zh: '9:00-21:00' }
  },

  // Ueno Area (5 locations)
  {
    name: { ja: '上野公園入口', en: 'Ueno Park Entrance', zh: '上野公园入口' },
    lat: 35.7141, lng: 139.7744,
    address: { ja: '東京都台東区上野公園5-20', en: '5-20 Ueno Park, Taito City, Tokyo', zh: '东京都台东区上野公园5-20' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '5:00-23:00', en: '5:00-23:00', zh: '5:00-23:00' }
  },
  {
    name: { ja: '上野動物園前', en: 'Ueno Zoo Front', zh: '上野动物园前' },
    lat: 35.7180, lng: 139.7718,
    address: { ja: '東京都台東区上野公園9-83', en: '9-83 Ueno Park, Taito City, Tokyo', zh: '东京都台东区上野公园9-83' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'public_facility',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '9:30-17:00', en: '9:30-17:00', zh: '9:30-17:00' }
  },
  {
    name: { ja: '上野駅中央改札', en: 'Ueno Station Central Gate', zh: '上野站中央检票口' },
    lat: 35.7138, lng: 139.7774,
    address: { ja: '東京都台東区上野7-1-1', en: '7-1-1 Ueno, Taito City, Tokyo', zh: '东京都台东区上野7-1-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  {
    name: { ja: 'アメ横入口', en: 'Ameya-Yokocho Entrance', zh: '阿美横丁入口' },
    lat: 35.7094, lng: 139.7752,
    address: { ja: '東京都台東区上野4-6-10', en: '4-6-10 Ueno, Taito City, Tokyo', zh: '东京都台东区上野4-6-10' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '10:00-19:00', en: '10:00-19:00', zh: '10:00-19:00' }
  },
  {
    name: { ja: '東京国立博物館前', en: 'Tokyo National Museum Front', zh: '东京国立博物馆前' },
    lat: 35.7188, lng: 139.7766,
    address: { ja: '東京都台東区上野公園13-9', en: '13-9 Ueno Park, Taito City, Tokyo', zh: '东京都台东区上野公园13-9' },
    trash_types: ['burnable', 'plastic_bottle'],
    facility_type: 'public_facility',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '9:30-17:00', en: '9:30-17:00', zh: '9:30-17:00' }
  },

  // Ikebukuro Area (5 locations)
  {
    name: { ja: '池袋駅東口サンシャイン', en: 'Ikebukuro Station East Exit Sunshine', zh: '池袋站东口阳光城' },
    lat: 35.7295, lng: 139.7199,
    address: { ja: '東京都豊島区東池袋3-1-1', en: '3-1-1 Higashi-Ikebukuro, Toshima City, Tokyo', zh: '东京都丰岛区东池袋3-1-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-22:00', en: '10:00-22:00', zh: '10:00-22:00' }
  },
  {
    name: { ja: '池袋西口パルコ', en: 'Ikebukuro West Exit Parco', zh: '池袋西口PARCO' },
    lat: 35.7295, lng: 139.7081,
    address: { ja: '東京都豊島区南池袋1-28-2', en: '1-28-2 Minami-Ikebukuro, Toshima City, Tokyo', zh: '东京都丰岛区南池袋1-28-2' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-21:00', en: '10:00-21:00', zh: '10:00-21:00' }
  },
  {
    name: { ja: '池袋中央公園', en: 'Ikebukuro Central Park', zh: '池袋中央公园' },
    lat: 35.7346, lng: 139.7158,
    address: { ja: '東京都豊島区東池袋3-1-6', en: '3-1-6 Higashi-Ikebukuro, Toshima City, Tokyo', zh: '东京都丰岛区东池袋3-1-6' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '東武百貨店前', en: 'Tobu Department Store Front', zh: '东武百货店前' },
    lat: 35.7298, lng: 139.7120,
    address: { ja: '東京都豊島区西池袋1-1-25', en: '1-1-25 Nishi-Ikebukuro, Toshima City, Tokyo', zh: '东京都丰岛区西池袋1-1-25' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'shopping_mall',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '10:00-20:00', en: '10:00-20:00', zh: '10:00-20:00' }
  },
  {
    name: { ja: '乙女ロード', en: 'Otome Road', zh: '乙女路' },
    lat: 35.7308, lng: 139.7153,
    address: { ja: '東京都豊島区東池袋3-15-1', en: '3-15-1 Higashi-Ikebukuro, Toshima City, Tokyo', zh: '东京都丰岛区东池袋3-15-1' },
    trash_types: ['burnable', 'plastic'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  }
];

// Sample area data
const sampleAreas = [
  {
    name: { ja: '東京駅周辺', en: 'Tokyo Station Area', zh: '东京车站周边' },
    center_lat: 35.6812, center_lng: 139.7649,
    zoom_level: 15,
    boundary_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        [139.7500, 35.6700],
        [139.7800, 35.6700],
        [139.7800, 35.6900],
        [139.7500, 35.6900],
        [139.7500, 35.6700]
      ]]
    })
  },
  {
    name: { ja: '渋谷駅周辺', en: 'Shibuya Station Area', zh: '涩谷站周边' },
    center_lat: 35.6598, center_lng: 139.7023,
    zoom_level: 15,
    boundary_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        [139.6900, 35.6500],
        [139.7150, 35.6500],
        [139.7150, 35.6700],
        [139.6900, 35.6700],
        [139.6900, 35.6500]
      ]]
    })
  },
  {
    name: { ja: '新宿駅周辺', en: 'Shinjuku Station Area', zh: '新宿站周边' },
    center_lat: 35.6896, center_lng: 139.7006,
    zoom_level: 15,
    boundary_json: JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        [139.6800, 35.6800],
        [139.7200, 35.6800],
        [139.7200, 35.7000],
        [139.6800, 35.7000],
        [139.6800, 35.6800]
      ]]
    })
  }
];

// Seed function for SQLite
const seedSQLiteDatabase = async () => {
  try {
    logger.info('Starting SQLite database seeding...');

    const db = await initSQLiteDB();

    // Clear existing data
    await db.run('DELETE FROM data_sources');
    await db.run('DELETE FROM user_feedback');
    await db.run('DELETE FROM quality_metrics');
    await db.run('DELETE FROM trash_bins');
    await db.run('DELETE FROM areas');

    // Insert areas
    for (const area of sampleAreas) {
      await db.run(`
        INSERT INTO areas (name, center_lat, center_lng, zoom_level, boundary_json)
        VALUES (?, ?, ?, ?, ?)
      `, [
        JSON.stringify(area.name),
        area.center_lat,
        area.center_lng,
        area.zoom_level,
        area.boundary_json
      ]);
    }

    logger.info(`Inserted ${sampleAreas.length} areas`);

    // Insert trash bins
    for (const trashBin of sampleTrashBins) {
      await db.run(`
        INSERT INTO trash_bins (
          name, lat, lng, address, trash_types, facility_type,
          access_conditions, operating_hours, quality_score, trust_score,
          ai_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        JSON.stringify(trashBin.name),
        trashBin.lat,
        trashBin.lng,
        JSON.stringify(trashBin.address),
        JSON.stringify(trashBin.trash_types),
        trashBin.facility_type,
        trashBin.access_conditions ? JSON.stringify(trashBin.access_conditions) : null,
        trashBin.operating_hours ? JSON.stringify(trashBin.operating_hours) : null,
        0.75 + Math.random() * 0.25, // quality_score (0.75-1.0)
        0.70 + Math.random() * 0.30, // trust_score (0.70-1.0)
        false // ai_verified
      ]);
    }

    logger.info(`Inserted ${sampleTrashBins.length} trash bins`);

    // Insert sample quality metrics
    const trashBinsResult = await db.all('SELECT rowid as id FROM trash_bins');
    
    for (const row of trashBinsResult) {
      await db.run(`
        INSERT INTO quality_metrics (
          trash_bin_id, accuracy_score, freshness_score, reliability_score,
          source_count, verification_method
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        row.id,
        0.80 + Math.random() * 0.20, // accuracy_score (0.80-1.0)
        0.75 + Math.random() * 0.25, // freshness_score (0.75-1.0)
        0.70 + Math.random() * 0.30, // reliability_score (0.70-1.0)
        Math.floor(Math.random() * 3) + 1, // source_count (1-3)
        'manual_verification'
      ]);
    }

    logger.info(`Inserted quality metrics for ${trashBinsResult.length} trash bins`);

    logger.info('✅ SQLite database seeding completed successfully');
    console.log(`📊 Total locations: ${sampleTrashBins.length}`);
    console.log('🗾 Coverage areas: Tokyo Station, Shibuya, Shinjuku, Asakusa, Ginza, Ueno, Ikebukuro');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ SQLite database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedSQLiteDatabase();
}

module.exports = { seedSQLiteDatabase };