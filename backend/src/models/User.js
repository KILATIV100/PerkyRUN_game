import { query } from '../config/database.js';

class User {
  // Створити або оновити користувача з Telegram
  static async findOrCreate(telegramUser) {
    const { id, username, first_name, last_name, language_code, is_premium } = telegramUser;

    const existingUser = await this.findByTelegramId(id);

    if (existingUser) {
      // Оновити дані користувача
      const result = await query(
        `UPDATE users
         SET username = $1, first_name = $2, last_name = $3,
             language_code = $4, is_premium = $5, last_played_at = CURRENT_TIMESTAMP
         WHERE telegram_id = $6
         RETURNING *`,
        [username, first_name, last_name, language_code, is_premium || false, id]
      );
      return result.rows[0];
    }

    // Створити нового користувача
    const result = await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, language_code, is_premium)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, username, first_name, last_name, language_code, is_premium || false]
    );

    // Додати стартові предмети (default character and skin)
    const userId = result.rows[0].id;
    await query(
      `INSERT INTO user_items (user_id, item_type, item_id)
       VALUES ($1, 'character', 'default'), ($1, 'skin', 'default')`,
      [userId]
    );

    return result.rows[0];
  }

  static async findByTelegramId(telegramId) {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateStats(userId, data) {
    const { totalCoins, totalBeans, highScore, selectedCharacter, selectedSkin } = data;

    const result = await query(
      `UPDATE users
       SET total_coins = $1, total_beans = $2, high_score = GREATEST(high_score, $3),
           selected_character = COALESCE($4, selected_character),
           selected_skin = COALESCE($5, selected_skin),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [totalCoins, totalBeans, highScore, selectedCharacter, selectedSkin, userId]
    );

    return result.rows[0];
  }

  static async addCoins(userId, amount) {
    const result = await query(
      `UPDATE users
       SET total_coins = total_coins + $1
       WHERE id = $2
       RETURNING *`,
      [amount, userId]
    );
    return result.rows[0];
  }

  static async getUserItems(userId) {
    const result = await query(
      'SELECT item_type, item_id FROM user_items WHERE user_id = $1',
      [userId]
    );

    const items = {
      characters: [],
      skins: []
    };

    result.rows.forEach(row => {
      if (row.item_type === 'character') {
        items.characters.push(row.item_id);
      } else if (row.item_type === 'skin') {
        items.skins.push(row.item_id);
      }
    });

    return items;
  }

  static async purchaseItem(userId, itemType, itemId, price) {
    // Перевірити чи достатньо монет
    const user = await this.findById(userId);
    if (user.total_coins < price) {
      throw new Error('Not enough coins');
    }

    // Перевірити чи вже куплено
    const existing = await query(
      'SELECT id FROM user_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [userId, itemType, itemId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Item already purchased');
    }

    // Купити предмет
    await query('BEGIN');

    try {
      await query(
        'UPDATE users SET total_coins = total_coins - $1 WHERE id = $2',
        [price, userId]
      );

      await query(
        'INSERT INTO user_items (user_id, item_type, item_id) VALUES ($1, $2, $3)',
        [userId, itemType, itemId]
      );

      await query(
        `INSERT INTO transactions (user_id, transaction_type, amount, currency, description)
         VALUES ($1, 'purchase', $2, 'coins', $3)`,
        [userId, -price, `Purchased ${itemType}: ${itemId}`]
      );

      await query('COMMIT');

      return await this.findById(userId);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async getLeaderboard(limit = 100) {
    const result = await query(
      `SELECT telegram_id, username, first_name, high_score, total_coins, total_beans
       FROM users
       WHERE high_score > 0
       ORDER BY high_score DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async getUserRank(userId) {
    const result = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM users u1
       JOIN users u2 ON u2.id = $1
       WHERE u1.high_score > u2.high_score`,
      [userId]
    );
    return result.rows[0]?.rank || null;
  }
}

export default User;
