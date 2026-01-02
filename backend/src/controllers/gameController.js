import GameSession from '../models/GameSession.js';
import User from '../models/User.js';

export const submitGameResult = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const gameData = req.body;

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Валідація результату
    const validation = await GameSession.validateScore(gameData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid game result',
        reason: validation.reason
      });
    }

    // Створити сесію
    const session = await GameSession.create({
      userId: user.id,
      score: gameData.score,
      coinsCollected: gameData.coins,
      beansCollected: gameData.beans,
      distance: gameData.score, // Припускаємо що score = distance
      maxMultiplier: gameData.maxMultiplier || 1,
      durationSeconds: gameData.duration,
      characterUsed: gameData.character,
      skinUsed: gameData.skin
    });

    // Оновити користувача
    const updatedUser = await User.updateStats(user.id, {
      totalCoins: user.total_coins + gameData.coins,
      totalBeans: user.total_beans + gameData.beans,
      highScore: Math.max(user.high_score, gameData.score),
      selectedCharacter: gameData.character,
      selectedSkin: gameData.skin
    });

    // Перевірити досягнення (можна додати пізніше)

    res.json({
      success: true,
      session,
      user: updatedUser,
      isNewRecord: gameData.score > user.high_score
    });
  } catch (error) {
    console.error('Error submitting game result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await GameSession.getUserStats(user.id);
    const sessions = await GameSession.getUserSessions(user.id, 10);

    res.json({ stats, recentSessions: sessions });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopGames = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const topGames = await GameSession.getTopSessions(limit);

    res.json({ topGames });
  } catch (error) {
    console.error('Error getting top games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
