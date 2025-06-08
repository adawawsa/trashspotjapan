const { pgPool } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Sample trash bin data for different areas in Japan
const sampleTrashBins = [
  // Tokyo Station Area
  {
    name: { ja: '東京駅八重洲口コンビニ前', en: 'Tokyo Station Yaesu Convenience Store', zh: '东京车站八重洲口便利店前' },
    location: { lat: 35.6812, lng: 139.7671 },
    address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '営業時間内のみ', en: 'During business hours only', zh: '仅营业时间内' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '東京駅構内リサイクルボックス', en: 'Tokyo Station Recycling Box', zh: '东京车站内回收箱' },
    location: { lat: 35.6812, lng: 139.7649 },
    address: { ja: '東京都千代田区丸の内1-9-1', en: '1-9-1 Marunouchi, Chiyoda City, Tokyo', zh: '东京都千代田区丸之内1-9-1' },
    trash_types: ['plastic_bottle', 'can', 'paper'],
    facility_type: 'station',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '始発〜終電', en: 'First train to last train', zh: '首班车至末班车' }
  },
  // Shibuya Area
  {
    name: { ja: '渋谷センター街入口', en: 'Shibuya Center Gai Entrance', zh: '涩谷中心街入口' },
    location: { lat: 35.6598, lng: 139.7023 },
    address: { ja: '東京都渋谷区宇田川町', en: 'Udagawacho, Shibuya City, Tokyo', zh: '东京都涩谷区宇田川町' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  {
    name: { ja: '渋谷駅ハチ公口自販機', en: 'Shibuya Station Hachiko Exit Vending Machine', zh: '涩谷站八公口自动售货机' },
    location: { lat: 35.6590, lng: 139.7016 },
    address: { ja: '東京都渋谷区道玄坂', en: 'Dogenzaka, Shibuya City, Tokyo', zh: '东京都涩谷区道玄坂' },
    trash_types: ['plastic_bottle', 'can'],
    facility_type: 'vending_machine',
    access_conditions: { ja: '購入者のみ', en: 'Customers only', zh: '仅限购买者' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  // Shinjuku Area
  {
    name: { ja: '新宿公園ゴミ箱', en: 'Shinjuku Park Trash Bin', zh: '新宿公园垃圾桶' },
    location: { lat: 35.6938, lng: 139.7034 },
    address: { ja: '東京都新宿区内藤町11', en: '11 Naitocho, Shinjuku City, Tokyo', zh: '东京都新宿区内藤町11' },
    trash_types: ['burnable', 'plastic_bottle', 'can', 'paper'],
    facility_type: 'park',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '6:00-18:00', en: '6:00-18:00', zh: '6:00-18:00' }
  },
  // Asakusa Area
  {
    name: { ja: '浅草寺境内', en: 'Sensoji Temple Grounds', zh: '浅草寺境内' },
    location: { lat: 35.7148, lng: 139.7967 },
    address: { ja: '東京都台東区浅草2-3-1', en: '2-3-1 Asakusa, Taito City, Tokyo', zh: '东京都台东区浅草2-3-1' },
    trash_types: ['burnable'],
    facility_type: 'public_facility',
    access_conditions: { ja: '参拝者のみ', en: 'Visitors only', zh: '仅限参拜者' },
    operating_hours: { ja: '6:00-17:00', en: '6:00-17:00', zh: '6:00-17:00' }
  },
  // Harajuku Area
  {
    name: { ja: '竹下通りファミリーマート', en: 'Takeshita Street FamilyMart', zh: '竹下通全家便利店' },
    location: { lat: 35.6702, lng: 139.7063 },
    address: { ja: '東京都渋谷区神宮前1-19-11', en: '1-19-11 Jingumae, Shibuya City, Tokyo', zh: '东京都涩谷区神宫前1-19-11' },
    trash_types: ['burnable', 'plastic_bottle', 'can'],
    facility_type: 'convenience_store',
    access_conditions: { ja: '店舗利用者のみ', en: 'Store customers only', zh: '仅限店铺顾客' },
    operating_hours: { ja: '24時間', en: '24 hours', zh: '24小时' }
  },
  // Ginza Area
  {
    name: { ja: '銀座中央通りリサイクル', en: 'Ginza Chuo-dori Recycling', zh: '银座中央通回收点' },
    location: { lat: 35.6762, lng: 139.7653 },
    address: { ja: '東京都中央区銀座4-6-16', en: '4-6-16 Ginza, Chuo City, Tokyo', zh: '东京都中央区银座4-6-16' },
    trash_types: ['plastic_bottle', 'can', 'glass', 'paper'],
    facility_type: 'public_facility',
    access_conditions: { ja: '誰でも利用可能', en: 'Available to everyone', zh: '所有人均可使用' },
    operating_hours: { ja: '8:00-20:00', en: '8:00-20:00', zh: '8:00-20:00' }
  }
];

// Sample area data
const sampleAreas = [
  {
    name: { ja: '東京駅周辺', en: 'Tokyo Station Area', zh: '东京车站周边' },
    center: { lat: 35.6812, lng: 139.7649 },
    zoom_level: 15,
    // Simple rectangle boundary around Tokyo Station
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [139.7500, 35.6700],
        [139.7800, 35.6700],
        [139.7800, 35.6900],
        [139.7500, 35.6900],
        [139.7500, 35.6700]
      ]]
    }
  },
  {
    name: { ja: '渋谷駅周辺', en: 'Shibuya Station Area', zh: '涩谷站周边' },
    center: { lat: 35.6598, lng: 139.7023 },
    zoom_level: 15,
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [139.6900, 35.6500],
        [139.7150, 35.6500],
        [139.7150, 35.6700],
        [139.6900, 35.6700],
        [139.6900, 35.6500]
      ]]
    }
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Clear existing data
    await pgPool.query('DELETE FROM data_sources');
    await pgPool.query('DELETE FROM user_feedback');
    await pgPool.query('DELETE FROM quality_metrics');
    await pgPool.query('DELETE FROM trash_bins');
    await pgPool.query('DELETE FROM areas');

    // Insert areas
    for (const area of sampleAreas) {
      const query = `
        INSERT INTO areas (name, center, zoom_level, boundary)
        VALUES ($1, ST_MakePoint($2, $3)::geography, $4, ST_GeomFromGeoJSON($5))
      `;
      
      await pgPool.query(query, [
        JSON.stringify(area.name),
        area.center.lng,
        area.center.lat,
        area.zoom_level,
        JSON.stringify(area.boundary)
      ]);
    }

    logger.info(`Inserted ${sampleAreas.length} areas`);

    // Insert trash bins
    for (const trashBin of sampleTrashBins) {
      const query = `
        INSERT INTO trash_bins (
          name, location, address, trash_types, facility_type,
          access_conditions, operating_hours, quality_score, trust_score,
          ai_verified
        ) VALUES (
          $1, ST_MakePoint($2, $3)::geography, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `;
      
      await pgPool.query(query, [
        JSON.stringify(trashBin.name),
        trashBin.location.lng,
        trashBin.location.lat,
        JSON.stringify(trashBin.address),
        JSON.stringify(trashBin.trash_types),
        trashBin.facility_type,
        trashBin.access_conditions ? JSON.stringify(trashBin.access_conditions) : null,
        trashBin.operating_hours ? JSON.stringify(trashBin.operating_hours) : null,
        0.85, // quality_score
        0.80, // trust_score
        false // ai_verified
      ]);
    }

    logger.info(`Inserted ${sampleTrashBins.length} trash bins`);

    // Insert sample quality metrics
    const trashBinsResult = await pgPool.query('SELECT id FROM trash_bins');
    
    for (const row of trashBinsResult.rows) {
      const query = `
        INSERT INTO quality_metrics (
          trash_bin_id, accuracy_score, freshness_score, reliability_score,
          source_count, verification_method
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pgPool.query(query, [
        row.id,
        0.85 + Math.random() * 0.15, // accuracy_score (0.85-1.0)
        0.80 + Math.random() * 0.20, // freshness_score (0.80-1.0)
        0.75 + Math.random() * 0.25, // reliability_score (0.75-1.0)
        Math.floor(Math.random() * 3) + 1, // source_count (1-3)
        'manual_verification'
      ]);
    }

    logger.info(`Inserted quality metrics for ${trashBinsResult.rows.length} trash bins`);

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };