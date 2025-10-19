# SpaarBot - AI-Powered Personal Finance Assistant

Intelligenter Finanzassistent für Telegram mit moderner Web-App Integration.

## Features

- 💰 Schnelle Ausgaben-Erfassung (Text, Foto, Voice)
- 🤖 KI-gestützte Kategorisierung
- 📊 Detaillierte Analysen und Charts
- 📅 Abo-Verwaltung (Coming soon)
- 💎 Premium Features mit AI-Insights

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI + Aiogram 3.x
- SQLAlchemy + SQLite
- Groq AI

**Frontend:**
- React + TypeScript
- Telegram SDK
- Zustand (State)
- Tailwind CSS
- Recharts

## Setup

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your tokens
python main.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Telegram Bot

1. Create bot via @BotFather
2. Get token and add to backend/.env
3. Set webhook or use polling

## Development

Run structure generator:
```bash
python create_project_structure.py
```

## License

MIT