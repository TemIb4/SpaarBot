# SpaarBot API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication

All endpoints require `telegram_id` parameter for user identification.

## Endpoints

### Auth

#### GET /auth/me
Get current user information.

**Query Parameters:**
- `telegram_id` (required): User's Telegram ID

**Response:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "john_doe",
  "first_name": "John",
  "language": "de",
  "tier": "free",
  "subscription_status": "inactive",
  "created_at": "2025-01-01T00:00:00"
}
```

### Transactions

#### GET /transactions/
List user's transactions.

**Query Parameters:**
- `telegram_id` (required)
- `start_date` (optional): ISO format datetime
- `end_date` (optional): ISO format datetime
- `category_id` (optional): Filter by category
- `limit` (optional): Max 500, default 100

**Response:**
```json
[
  {
    "id": 1,
    "account_id": 1,
    "category_id": 2,
    "amount": 15.50,
    "description": "Kaffee bei Starbucks",
    "transaction_type": "expense",
    "transaction_date": "2025-01-15T10:30:00",
    "receipt_url": null,
    "created_at": "2025-01-15T10:30:00",
    "category": {
      "id": 2,
      "name": "Essen & Trinken",
      "icon": "🍔",
      "color": "#FF6B6B"
    }
  }
]
```

#### POST /transactions/
Create new transaction.

**Query Parameters:**
- `telegram_id` (required)

**Body:**
```json
{
  "account_id": 1,
  "amount": 15.50,
  "description": "Kaffee",
  "category_id": 2,
  "transaction_type": "expense",
  "transaction_date": "2025-01-15T10:30:00"
}
```

#### GET /transactions/analytics/by-category
Get spending breakdown by category.

**Query Parameters:**
- `telegram_id` (required)
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
{
  "data": [
    {
      "name": "Essen & Trinken",
      "icon": "🍔",
      "color": "#FF6B6B",
      "total": 234.50
    }
  ],
  "start_date": "2025-01-01T00:00:00",
  "end_date": "2025-01-31T23:59:59"
}
```

### AI Assistant

#### POST /ai/query
Ask AI financial assistant.

**Body:**
```json
{
  "query": "Wo kann ich sparen?",
  "user_id": 123456789,
  "context": {}
}
```

**Response:**
```json
{
  "answer": "Basierend auf deinen Ausgaben...",
  "suggestions": ["Tipp 1", "Tipp 2"]
}
```

### Telegram Web App

#### GET /twa/data/categories
Get categories for TWA dropdown.

**Query Parameters:**
- `telegram_id` (optional)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Essen & Trinken",
    "icon": "🍔",
    "color": "#FF6B6B"
  }
]
```

#### POST /twa/expense/submit
Submit expense from TWA.

**Body:**
```json
{
  "telegram_id": 123456789,
  "amount": 15.50,
  "description": "Kaffee",
  "category_id": 2
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error