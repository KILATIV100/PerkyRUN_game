import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import User from './models/User.js';
import GameSession from './models/GameSession.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL || 'https://your-app.railway.app';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не налаштовано в .env файлі');
  process.exit(1);
}

// Створення бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 PerkUP Runner Bot запущено!');

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  try {
    // Створити/оновити користувача в БД
    await User.findOrCreate(user);

    const keyboard = {
      inline_keyboard: [
        [{ text: '🎮 Грати', web_app: { url: WEBAPP_URL } }],
        [
          { text: '📊 Статистика', callback_data: 'stats' },
          { text: '🏆 Лідери', callback_data: 'leaderboard' }
        ],
        [{ text: 'ℹ️ Допомога', callback_data: 'help' }]
      ]
    };

    const welcomeMessage = `
🤖 Вітаю в PerkUP Runner, ${user.first_name}!

🏃 Бігай вулицями Броварів
☕ Збирай кавові зерна
🪙 Заробляй монети
🎁 Отримуй знижки в PerkUP!

Натисни "Грати" щоб почати! 🚀
    `;

    bot.sendMessage(chatId, welcomeMessage.trim(), {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error in /start command:', error);
    bot.sendMessage(chatId, '❌ Виникла помилка. Спробуйте ще раз.');
  }
});

// Команда /stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return bot.sendMessage(chatId, '❌ Користувача не знайдено. Використайте /start');
    }

    const stats = await GameSession.getUserStats(user.id);
    const rank = await User.getUserRank(user.id);

    const message = `
📊 Твоя статистика

🏆 Рекорд: ${user.high_score} м
🎮 Ігор зіграно: ${user.games_played}
🪙 Монет: ${user.total_coins}
🫘 Кавових зерен: ${user.total_beans}

📈 Детальна статистика:
• Всього дистанції: ${stats.total_distance || 0} м
• Середній результат: ${Math.floor(stats.avg_score || 0)} м
• Найкращий множник: x${stats.best_multiplier || 1}

🏅 Твоє місце в рейтингу: #${rank || 'N/A'}
    `;

    bot.sendMessage(chatId, message.trim(), {
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Грати', web_app: { url: WEBAPP_URL } }]]
      }
    });
  } catch (error) {
    console.error('Error in /stats command:', error);
    bot.sendMessage(chatId, '❌ Не вдалося отримати статистику.');
  }
});

// Команда /leaderboard
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const leaderboard = await User.getLeaderboard(10);

    if (leaderboard.length === 0) {
      return bot.sendMessage(chatId, '📊 Таблиця лідерів поки пуста. Будь першим!');
    }

    let message = '🏆 ТОП-10 ГРАВЦІВ\n\n';

    leaderboard.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const name = player.username || player.first_name || 'Аноним';
      message += `${medal} ${name} - ${player.high_score} м\n`;
    });

    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Спробувати побити рекорд', web_app: { url: WEBAPP_URL } }]]
      }
    });
  } catch (error) {
    console.error('Error in /leaderboard command:', error);
    bot.sendMessage(chatId, '❌ Не вдалося завантажити таблицю лідерів.');
  }
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
ℹ️ Довідка по боту

Доступні команди:
/start - Почати гру
/stats - Переглянути свою статистику
/leaderboard - Таблиця лідерів
/help - Ця довідка

🎮 Як грати:
• Свайп вліво/вправо - змінити смугу
• Свайп вгору - стрибок
• Свайп вниз - підковзування
• Збирай 🪙 монети та ☕ кавові зерна
• Уникай 🚗 машин та ☕ перешкод

🎁 Кавові зерна можна обміняти на знижки в PerkUP кафе Броварів!

Питання? Пиши @your_support
  `;

  bot.sendMessage(chatId, helpMessage.trim(), {
    reply_markup: {
      inline_keyboard: [[{ text: '🎮 Грати', web_app: { url: WEBAPP_URL } }]]
    }
  });
});

// Обробка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  switch (data) {
    case 'stats':
      bot.sendMessage(chatId, 'Використайте команду /stats');
      break;

    case 'leaderboard':
      bot.sendMessage(chatId, 'Використайте команду /leaderboard');
      break;

    case 'help':
      bot.sendMessage(chatId, 'Використайте команду /help');
      break;

    default:
      break;
  }
});

// Обробка помилок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

export default bot;
