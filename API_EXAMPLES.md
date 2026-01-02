# 📡 API Examples

Приклади використання API для PerkUP Runner.

## Base URL

```
Local: http://localhost:3000
Production: https://your-app.railway.app
```

---

## 🔐 Authentication

API використовує Telegram ID для ідентифікації користувачів.

---

## 📋 Endpoints

### 1. Health Check

**GET** `/api/health`

```bash
curl https://your-app.railway.app/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production"
}
```

---

### 2. Authenticate User

**POST** `/api/auth/telegram`

```bash
curl -X POST https://your-app.railway.app/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUser": {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "uk",
      "is_premium": false
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "telegram_id": 123456789,
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "total_coins": 0,
    "total_beans": 0,
    "high_score": 0,
    "selected_character": "default",
    "selected_skin": "default",
    "ownedCharacters": ["default"],
    "ownedSkins": ["default"],
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 3. Get User Profile

**GET** `/api/users/:telegramId`

```bash
curl https://your-app.railway.app/api/users/123456789
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "telegram_id": 123456789,
    "username": "johndoe",
    "first_name": "John",
    "total_coins": 1500,
    "total_beans": 50,
    "high_score": 2340,
    "games_played": 25,
    "rank": 5,
    "ownedCharacters": ["default", "golden"],
    "ownedSkins": ["default", "ocean"]
  }
}
```

---

### 4. Update User Profile

**PUT** `/api/users/:telegramId`

```bash
curl -X PUT https://your-app.railway.app/api/users/123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "totalCoins": 1500,
    "totalBeans": 50,
    "highScore": 2340,
    "selectedCharacter": "golden",
    "selectedSkin": "ocean"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "telegram_id": 123456789,
    "total_coins": 1500,
    "total_beans": 50,
    "high_score": 2340,
    "selected_character": "golden",
    "selected_skin": "ocean"
  }
}
```

---

### 5. Purchase Item

**POST** `/api/users/:telegramId/purchase`

```bash
curl -X POST https://your-app.railway.app/api/users/123456789/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "itemType": "character",
    "itemId": "golden",
    "price": 500
  }'
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "total_coins": 1000
  },
  "message": "Item purchased successfully"
}
```

**Error Response (Not enough coins):**
```json
{
  "error": "Not enough coins"
}
```

**Error Response (Already purchased):**
```json
{
  "error": "Item already purchased"
}
```

---

### 6. Submit Game Result

**POST** `/api/game/:telegramId/submit`

```bash
curl -X POST https://your-app.railway.app/api/game/123456789/submit \
  -H "Content-Type: application/json" \
  -d '{
    "score": 2340,
    "coins": 150,
    "beans": 5,
    "maxMultiplier": 3,
    "duration": 120,
    "character": "golden",
    "skin": "ocean"
  }'
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 42,
    "user_id": 1,
    "score": 2340,
    "coins_collected": 150,
    "beans_collected": 5,
    "distance": 2340,
    "max_multiplier": 3,
    "duration_seconds": 120,
    "played_at": "2024-01-01T12:00:00.000Z"
  },
  "user": {
    "total_coins": 1650,
    "total_beans": 55,
    "high_score": 2340
  },
  "isNewRecord": true
}
```

**Error Response (Invalid score):**
```json
{
  "error": "Invalid game result",
  "reason": "Score too high for duration"
}
```

---

### 7. Get User Stats

**GET** `/api/game/:telegramId/stats`

```bash
curl https://your-app.railway.app/api/game/123456789/stats
```

**Response:**
```json
{
  "stats": {
    "total_games": 25,
    "total_score": 35000,
    "best_score": 2340,
    "total_coins_collected": 1500,
    "total_beans_collected": 50,
    "total_distance": 35000,
    "avg_score": 1400,
    "best_multiplier": 3
  },
  "recentSessions": [
    {
      "id": 42,
      "score": 2340,
      "coins_collected": 150,
      "beans_collected": 5,
      "played_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### 8. Get Leaderboard

**GET** `/api/users/leaderboard/top?limit=10`

```bash
curl "https://your-app.railway.app/api/users/leaderboard/top?limit=10"
```

**Response:**
```json
{
  "leaderboard": [
    {
      "telegram_id": 123456789,
      "username": "johndoe",
      "first_name": "John",
      "high_score": 5000,
      "total_coins": 3000,
      "total_beans": 100
    },
    {
      "telegram_id": 987654321,
      "username": "janedoe",
      "first_name": "Jane",
      "high_score": 4500,
      "total_coins": 2500,
      "total_beans": 80
    }
  ]
}
```

---

### 9. Get Top Games

**GET** `/api/game/top?limit=10`

```bash
curl "https://your-app.railway.app/api/game/top?limit=10"
```

**Response:**
```json
{
  "topGames": [
    {
      "id": 142,
      "score": 5000,
      "coins_collected": 500,
      "beans_collected": 20,
      "username": "johndoe",
      "first_name": "John",
      "telegram_id": 123456789,
      "played_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 🔒 Rate Limiting

API має rate limiting:
- **Window**: 15 хвилин
- **Max Requests**: 100 запитів на IP

При перевищенні ліміту:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Invalid hash"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 🧪 Testing with Postman

1. Import this collection: [Download Postman Collection](./postman_collection.json)
2. Set environment variables:
   - `base_url`: `https://your-app.railway.app`
   - `telegram_id`: your Telegram ID
3. Run requests

---

## 📝 Notes

- Всі дати в форматі ISO 8601
- Telegram ID має бути числом
- Score та coins мають бути додатними числами
- Duration в секундах
- Multiplier від 1 до 5
