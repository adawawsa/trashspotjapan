const cron = require('node-cron');
const aiResearchService = require('./aiResearchService');
const logger = require('../utils/logger');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  // Initialize all scheduled jobs
  init() {
    this.scheduleAIUpdate();
    this.scheduleDataCleanup();
    this.scheduleQualityMetrics();

    logger.info('Cron jobs initialized');
  }

  // Schedule AI research update (weekly on Monday at 2 AM)
  scheduleAIUpdate() {
    const schedule = process.env.AI_UPDATE_CRON_SCHEDULE || '0 2 * * 1';

    if (process.env.AI_UPDATE_ENABLED === 'false') {
      logger.info('AI update scheduling disabled');
      return;
    }

    const job = cron.schedule(schedule, async () => {
      logger.info('Starting scheduled AI research update');

      try {
        await aiResearchService.runWeeklyUpdate();
        logger.info('Scheduled AI research update completed successfully');
      } catch (error) {
        logger.error('Scheduled AI research update failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

    this.jobs.set('ai_update', job);
    job.start();

    logger.info(`AI update scheduled: ${schedule}`);
  }

  // Schedule data cleanup (daily at 3 AM)
  scheduleDataCleanup() {
    const job = cron.schedule('0 3 * * *', async () => {
      logger.info('Starting scheduled data cleanup');

      try {
        await this.runDataCleanup();
        logger.info('Scheduled data cleanup completed successfully');
      } catch (error) {
        logger.error('Scheduled data cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

    this.jobs.set('data_cleanup', job);
    job.start();

    logger.info('Data cleanup scheduled: daily at 3 AM');
  }

  // Schedule quality metrics calculation (daily at 4 AM)
  scheduleQualityMetrics() {
    const job = cron.schedule('0 4 * * *', async () => {
      logger.info('Starting scheduled quality metrics calculation');

      try {
        await this.calculateQualityMetrics();
        logger.info('Scheduled quality metrics calculation completed successfully');
      } catch (error) {
        logger.error('Scheduled quality metrics calculation failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

    this.jobs.set('quality_metrics', job);
    job.start();

    logger.info('Quality metrics scheduled: daily at 4 AM');
  }

  // Run data cleanup
  async runDataCleanup() {
    const { pgPool } = require('../config/database');

    try {
      // Clean up old research history (keep last 30 days)
      await pgPool.query(`
        DELETE FROM ai_research_history 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);

      // Clean up old quality metrics (keep last 90 days)
      await pgPool.query(`
        DELETE FROM quality_metrics 
        WHERE measured_at < NOW() - INTERVAL '90 days'
      `);

      // Clean up old user feedback (keep last 180 days)
      await pgPool.query(`
        DELETE FROM user_feedback 
        WHERE created_at < NOW() - INTERVAL '180 days'
        AND is_verified = false
      `);

      // Update trash bins that haven't been verified in 90 days
      await pgPool.query(`
        UPDATE trash_bins 
        SET quality_score = quality_score * 0.9,
            trust_score = trust_score * 0.9
        WHERE last_verified < NOW() - INTERVAL '90 days'
        AND quality_score > 0.1
      `);

      logger.info('Data cleanup completed');
    } catch (error) {
      logger.error('Data cleanup error:', error);
      throw error;
    }
  }

  // Calculate quality metrics
  async calculateQualityMetrics() {
    const { pgPool } = require('../config/database');

    try {
      // Get all active trash bins
      const result = await pgPool.query(`
        SELECT id, last_verified, quality_score, trust_score
        FROM trash_bins 
        WHERE is_active = true
      `);

      for (const trashBin of result.rows) {
        await this.calculateTrashBinQualityMetrics(trashBin.id);
      }

      logger.info(`Quality metrics calculated for ${result.rows.length} trash bins`);
    } catch (error) {
      logger.error('Quality metrics calculation error:', error);
      throw error;
    }
  }

  // Calculate quality metrics for a single trash bin
  async calculateTrashBinQualityMetrics(trashBinId) {
    const { pgPool } = require('../config/database');

    try {
      // Calculate accuracy score based on user feedback
      const feedbackResult = await pgPool.query(`
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(*) FILTER (WHERE feedback_type = 'correct') as positive_feedback,
          COUNT(*) FILTER (WHERE feedback_type IN ('incorrect_location', 'wrong_info')) as negative_feedback
        FROM user_feedback 
        WHERE trash_bin_id = $1 
        AND created_at > NOW() - INTERVAL '30 days'
      `, [trashBinId]);

      const feedback = feedbackResult.rows[0];
      const totalFeedback = parseInt(feedback.total_feedback);
      const positiveFeedback = parseInt(feedback.positive_feedback);
      const negativeFeedback = parseInt(feedback.negative_feedback);

      // Calculate scores
      let accuracyScore = 0.5; // Default
      if (totalFeedback > 0) {
        accuracyScore = Math.max(0, Math.min(
          1,
          (positiveFeedback - negativeFeedback * 2) / totalFeedback + 0.5
        ));
      }

      // Calculate freshness score based on last verification
      const freshnessResult = await pgPool.query(`
        SELECT 
          EXTRACT(EPOCH FROM (NOW() - last_verified)) / 86400 as days_since_verification
        FROM trash_bins 
        WHERE id = $1
      `, [trashBinId]);

      const daysSinceVerification = freshnessResult.rows[0].days_since_verification;
      const freshnessScore = Math.max(0, Math.min(1, 1 - daysSinceVerification / 90));

      // Calculate reliability score based on data sources
      const sourceResult = await pgPool.query(`
        SELECT 
          COUNT(*) as source_count,
          AVG(reliability_score) as avg_reliability
        FROM data_sources 
        WHERE trash_bin_id = $1
      `, [trashBinId]);

      const sourceData = sourceResult.rows[0];
      const sourceCount = parseInt(sourceData.source_count);
      const avgReliability = parseFloat(sourceData.avg_reliability) || 0.5;

      const reliabilityScore = Math.min(1, avgReliability * (1 + Math.log(sourceCount + 1) / 5));

      // Insert quality metrics
      await pgPool.query(`
        INSERT INTO quality_metrics (
          trash_bin_id, accuracy_score, freshness_score, reliability_score,
          source_count, verification_method
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        trashBinId,
        accuracyScore,
        freshnessScore,
        reliabilityScore,
        sourceCount,
        'automated'
      ]);

      // Update trash bin overall quality score
      const overallQuality = (accuracyScore + freshnessScore + reliabilityScore) / 3;
      await pgPool.query(`
        UPDATE trash_bins 
        SET quality_score = $1
        WHERE id = $2
      `, [overallQuality, trashBinId]);
    } catch (error) {
      logger.error(`Quality metrics calculation error for trash bin ${trashBinId}:`, error);
    }
  }

  // Stop all jobs
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    logger.info('All cron jobs stopped');
  }

  // Get job status
  getStatus() {
    const status = {};

    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });

    return status;
  }
}

module.exports = new CronService();
