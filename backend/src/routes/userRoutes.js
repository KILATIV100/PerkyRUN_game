import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  purchaseItem,
  getLeaderboard
} from '../controllers/userController.js';

const router = express.Router();

// Отримати профіль користувача
router.get('/:telegramId', getUserProfile);

// Оновити профіль користувача
router.put('/:telegramId', updateUserProfile);

// Купити предмет
router.post('/:telegramId/purchase', purchaseItem);

// Таблиця лідерів
router.get('/leaderboard/top', getLeaderboard);

export default router;
