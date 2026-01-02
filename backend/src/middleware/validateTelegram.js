import crypto from 'crypto';

// Middleware для валідації Telegram WebApp даних
export const validateTelegramWebAppData = (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
      // В режимі розробки дозволяємо без валідації
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Missing Telegram data' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Парсинг initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Сортування параметрів
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Генерація secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Генерація хешу
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
    }

    // Перевірка часу (initData не старше 24 годин)
    const authDate = parseInt(urlParams.get('auth_date'));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - authDate;

    if (timeDiff > 86400) { // 24 години
      return res.status(401).json({ error: 'Unauthorized: Data expired' });
    }

    // Додати дані користувача до req
    const userString = urlParams.get('user');
    if (userString) {
      req.telegramUser = JSON.parse(userString);
    }

    next();
  } catch (error) {
    console.error('Telegram validation error:', error);
    res.status(401).json({ error: 'Unauthorized: Validation failed' });
  }
};
