import express from 'express';
import {
  submitGameResult,
  getUserStats,
  getTopGames
} from '../controllers/gameController.js';

const router = express.Router();

// Відправити результат гри
router.post('/:telegramId/submit', submitGameResult);

// Отримати статистику користувача
router.get('/:telegramId/stats', getUserStats);

// Топ ігор
router.get('/top', getTopGames);

export default router;
