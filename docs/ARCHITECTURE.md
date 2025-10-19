# SpaarBot Architecture

## Overview

SpaarBot is a hybrid application consisting of:
1. **Telegram Bot** (Python/Aiogram) - User interface
2. **REST API** (FastAPI) - Backend logic
3. **Telegram Web App** (React) - Rich UI components
4. **Database** (SQLite) - Data persistence

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    Telegram Client                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌─────────────────┐
│   Bot Layer   │            │   Web App UI    │
│   (Aiogram)   │            │     (React)     │
└───────┬───────┘            └────────┬────────┘
        │                             │
        │    ┌────────────────────────┘
        │    │
        ▼    ▼
┌─────────────────────────────────────┐
│         FastAPI Backend              │
│  ┌─────────────────────────────┐   │
│  │   API Routes                 │   │
│  │   - Auth                     │   │
│  │   - Transactions             │   │
│  │   - AI Assistant             │   │
│  │   - TWA Endpoints            │   │
│  └─────────────┬────────────────┘   │
│                │                     │
│  ┌─────────────▼────────────────┐   │
│  │   Business Logic              │   │
│  │   - CRUD Operations           │   │
│  │   - AI Integration (Groq)     │   │
│  │   - Category Management       │   │
│  └─────────────┬────────────────┘   │
└────────────────┼────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │   SQLite DB    │
        │   - Users      │
        │   - Accounts   │
        │   - Categories │
        │   - Trans...   │
        └────────────────┘
```

## Component Details

### 1. Telegram Bot Layer

**Technology:** Aiogram 3.x

**Responsibilities:**
- Handle user commands (/start, /add, /stats)
- Parse text messages for expenses
- Manage inline keyboards
- Coordinate with API layer

**Key Files:**
- `backend/app/bot/handlers/` - Command handlers
- `backend/app/bot/keyboards.py` - UI keyboards

### 2. REST API Layer

**Technology:** FastAPI

**Responsibilities:**
- Expose RESTful endpoints
- Handle authentication
- Business logic orchestration
- Data validation (Pydantic)

**Key Files:**
- `backend/app/api/v1/endpoints/` - API routes
- `backend/app/schemas/` - Request/response schemas

### 3. Web App UI

**Technology:** React + TypeScript + Telegram SDK

**Responsibilities:**
- Rich interactive UI
- Charts and visualizations
- Form handling
- State management (Zustand)

**Key Files:**
- `frontend/src/pages/` - Page components
- `frontend/src/components/` - Reusable components
- `frontend/src/store/` - State management

### 4. Data Layer

**Technology:** SQLAlchemy + SQLite

**Responsibilities:**
- Data persistence
- Schema management (Alembic)
- Query optimization

**Key Files:**
- `backend/app/db/models.py` - Database models
- `backend/app/db/crud.py` - CRUD operations

### 5. AI Integration

**Technology:** Groq API (Mixtral 8x7B)

**Responsibilities:**
- Transaction categorization
- Financial insights
- Conversational assistant

**Key Files:**
- `backend/app/services/groq_service.py`

## Data Flow

### Example: Adding an Expense

1. **User** opens Telegram Web App via button
2. **TWA** loads React form from `/static/twa/`
3. **User** fills form and clicks "Save"
4. **TWA** sends POST to `/api/v1/twa/expense/submit`
5. **API** validates data, calls CRUD
6. **CRUD** creates Transaction record in DB
7. **API** returns success
8. **TWA** shows confirmation, closes
9. **Bot** optionally sends notification

### Example: Viewing Statistics

1. **User** sends /stats command
2. **Bot** receives message via polling
3. **Bot** calls CRUD to get transactions
4. **CRUD** queries DB with filters
5. **Bot** aggregates data
6. **Bot** sends formatted message with inline keyboard
7. **User** can click to open full Web App dashboard

## Security Considerations

- No sensitive data in frontend
- API validates all inputs
- Telegram WebApp init data verification
- CORS properly configured
- Environment variables for secrets

## Scalability Notes

Current MVP uses SQLite, suitable for:
- Up to 10,000 users
- Development and testing
- Single-server deployment

For production scale:
- Migrate to PostgreSQL
- Add Redis for caching
- Implement proper authentication
- Use message queues (Celery)
- Deploy with Docker + K8s

## Performance

- Async/await throughout
- Database connection pooling
- Lazy loading in frontend
- Optimistic UI updates
- Minimal API calls

## Testing Strategy

- Unit tests for business logic
- Integration tests for API
- E2E tests for critical flows
- Manual testing for Telegram integration