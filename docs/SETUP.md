# SpaarBot Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Telegram account
- Groq API key (free at groq.com)

## Step 1: Project Structure

Run the structure generator:
```bash
python create_project_structure.py
```

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 Configure Environment

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `TELEGRAM_BOT_TOKEN`: Get from @BotFather
- `GROQ_API_KEY`: Get from console.groq.com
- `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### 2.3 Initialize Database
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 2.4 Run Backend
```bash
python main.py
```

Backend should start on http://localhost:8000

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Configure Environment
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults should work for local development).

### 3.3 Run Frontend
```bash
npm run dev
```

Frontend should start on http://localhost:5173

## Step 4: Telegram Bot Configuration

### 4.1 Create Bot

1. Open Telegram and find @BotFather
2. Send `/newbot`
3. Follow instructions
4. Copy the token to backend/.env

### 4.2 Set Bot Commands

Send to @BotFather:
```
/setcommands

Choose your bot, then paste:

start - 🚀 Bot starten
add - 💰 Ausgabe hinzufügen
stats - 📊 Statistiken
subscriptions - 📅 Abonnements
settings - ⚙️ Einstellungen
help - ❓ Hilfe
```

### 4.3 Enable Inline Mode (Optional)
```
/setinline
Choose your bot
Enable inline mode
```

## Step 5: Testing

1. Open Telegram
2. Find your bot
3. Send `/start`
4. Try adding an expense via Web App

## Troubleshooting

### Backend won't start
- Check if port 8000 is free: `lsof -i :8000`
- Verify all environment variables are set
- Check logs for errors

### Frontend won't connect to backend
- Verify backend is running
- Check CORS settings in backend/main.py
- Verify VITE_API_URL in frontend/.env

### Telegram Web App doesn't open
- Verify TELEGRAM_WEBHOOK_URL is correct
- Check that static files are being served
- Test the TWA URL directly in browser

### Database errors
- Delete spaarbot.db and run migrations again
- Check DATABASE_URL format
- Verify write permissions

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.

## Development Tips

- Use `uvicorn main:app --reload` for auto-reload
- Frontend hot-reload is enabled by default
- Check API docs at http://localhost:8000/docs
- Use Telegram's test environment for testing

## Common Commands

**Backend:**
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Run tests
pytest
```

**Frontend:**
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## Support

For issues, check:
1. Logs in console
2. Network tab in browser
3. Telegram WebApp debug logs