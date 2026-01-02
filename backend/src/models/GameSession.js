import { query } from '../config/database.js';

class GameSession {
  static async create(sessionData) {
    const {
      userId,
      score,
      coinsCollected,
      beansCollected,
      distance,
      maxMultiplier,
      durationSeconds,
      characterUsed,
      skinUsed
    } = sessionData;

    const result = await query(
      `INSERT INTO game_sessions
       (user_id, score, coins_collected, beans_collected, distance, max_multiplier,
        duration_seconds, character_used, skin_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, score, coinsCollected, beansCollected, distance, maxMultiplier,
       durationSeconds, characterUsed, skinUsed]
    );

    // Оновити статистику користувача
    await query(
      `UPDATE users
       SET games_played = games_played + 1,
           total_distance = total_distance + $1,
           last_played_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [distance, userId]
    );

    return result.rows[0];
  }

  static async getUserSessions(userId, limit = 50) {
    const result = await query(
      `SELECT * FROM game_sessions
       WHERE user_id = $1
       ORDER BY played_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getUserStats(userId) {
    const result = await query(
      `SELECT
         COUNT(*) as total_games,
         SUM(score) as total_score,
         MAX(score) as best_score,
         SUM(coins_collected) as total_coins_collected,
         SUM(beans_collected) as total_beans_collected,
         SUM(distance) as total_distance,
         AVG(score) as avg_score,
         MAX(max_multiplier) as best_multiplier
       FROM game_sessions
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async getTopSessions(limit = 100) {
    const result = await query(
      `SELECT gs.*, u.username, u.first_name, u.telegram_id
       FROM game_sessions gs
       JOIN users u ON gs.user_id = u.id
       ORDER BY gs.score DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async validateScore(sessionData) {
    const { score, distance, durationSeconds, maxMultiplier } = sessionData;

    // Прості перевірки на шахрайство
    const maxScorePerSecond = 50; // Максимальний приріст очок за секунду
    const expectedMaxScore = durationSeconds * maxScorePerSecond;

    if (score > expectedMaxScore * 1.5) {
      return { valid: false, reason: 'Score too high for duration' };
    }

    if (distance < score * 0.5) {
      return { valid: false, reason: 'Distance too low for score' };
    }

    if (maxMultiplier > 5) {
      return { valid: false, reason: 'Invalid multiplier' };
    }

    return { valid: true };
  }
}

export default GameSession;
