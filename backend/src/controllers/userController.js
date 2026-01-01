import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const items = await User.getUserItems(user.id);
    const rank = await User.getUserRank(user.id);

    res.json({
      user: {
        ...user,
        rank,
        ownedCharacters: items.characters,
        ownedSkins: items.skins
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const updateData = req.body;

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await User.updateStats(user.id, updateData);

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const purchaseItem = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { itemType, itemId, price } = req.body;

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await User.purchaseItem(user.id, itemType, itemId, price);

    res.json({
      success: true,
      user: updatedUser,
      message: 'Item purchased successfully'
    });
  } catch (error) {
    if (error.message === 'Not enough coins') {
      return res.status(400).json({ error: 'Not enough coins' });
    }
    if (error.message === 'Item already purchased') {
      return res.status(400).json({ error: 'Item already purchased' });
    }

    console.error('Error purchasing item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await User.getLeaderboard(limit);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
