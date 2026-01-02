-- PerkUP Runner Database Schema
-- PostgreSQL

-- Користувачі
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'uk',
    is_premium BOOLEAN DEFAULT FALSE,
    total_coins INTEGER DEFAULT 0,
    total_beans INTEGER DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    total_distance INTEGER DEFAULT 0,
    selected_character VARCHAR(50) DEFAULT 'default',
    selected_skin VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMP
);

-- Куплені предмети
CREATE TABLE IF NOT EXISTS user_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'character' або 'skin'
    item_id VARCHAR(50) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- Історія ігор
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    coins_collected INTEGER DEFAULT 0,
    beans_collected INTEGER DEFAULT 0,
    distance INTEGER NOT NULL,
    max_multiplier INTEGER DEFAULT 1,
    duration_seconds INTEGER,
    character_used VARCHAR(50),
    skin_used VARCHAR(50),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Досягнення
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    achievement_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    reward_coins INTEGER DEFAULT 0,
    requirement_type VARCHAR(50), -- 'score', 'distance', 'games', 'beans'
    requirement_value INTEGER
);

-- Досягнення користувачів
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) REFERENCES achievements(achievement_id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Щоденні завдання
CREATE TABLE IF NOT EXISTS daily_challenges (
    id SERIAL PRIMARY KEY,
    challenge_id VARCHAR(100) UNIQUE NOT NULL,
    challenge_type VARCHAR(50), -- 'collect_coins', 'run_distance', 'play_games'
    target_value INTEGER,
    reward_coins INTEGER DEFAULT 0,
    reward_beans INTEGER DEFAULT 0,
    active_date DATE DEFAULT CURRENT_DATE
);

-- Виконані завдання користувачів
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(100) REFERENCES daily_challenges(challenge_id),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- Реферальна система
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);

-- Транзакції (покупки, нагороди)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50), -- 'purchase', 'reward', 'refund', 'gift'
    amount INTEGER NOT NULL,
    currency VARCHAR(20), -- 'coins', 'beans', 'stars'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_high_score ON users(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Початкові досягнення
INSERT INTO achievements (achievement_id, name, description, icon, reward_coins, requirement_type, requirement_value) VALUES
('first_run', 'Перший забіг', 'Зіграй свою першу гру', '🏃', 50, 'games', 1),
('runner_100', 'Початківець', 'Пробіжи 100 метрів', '🎯', 100, 'distance', 100),
('runner_1000', 'Досвідчений бігун', 'Пробіжи 1000 метрів', '🏅', 500, 'distance', 1000),
('collector_100', 'Колекціонер монет', 'Зібери 100 монет', '🪙', 200, 'coins', 100),
('coffee_lover', 'Любитель кави', 'Зібери 50 зерен', '☕', 300, 'beans', 50),
('speed_demon', 'Демон швидкості', 'Досягни множника x5', '⚡', 1000, 'multiplier', 5),
('marathon', 'Марафонець', 'Зіграй 50 ігор', '🏃‍♂️', 1500, 'games', 50)
ON CONFLICT (achievement_id) DO NOTHING;
