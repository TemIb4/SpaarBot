"""
SpaarBot Project Structure Generator - FINAL VERSION
Запустите этот скрипт в корне проекта: python create_project_structure.py
"""
import os
from pathlib import Path


def create_structure():
    """Создает полную структуру проекта SpaarBot"""

    structure = {
        'backend': {
            'app': {
                'api': {
                    'v1': {
                        'endpoints': ['__init__.py', 'transactions.py', 'ai.py', 'auth.py', 'twa.py'],
                        '__init__.py': None
                    },
                    '__init__.py': None
                },
                'bot': {
                    'handlers': ['__init__.py', 'start.py', 'expenses.py', 'stats.py'],
                    'keyboards.py': None,
                    'utils.py': None,
                    '__init__.py': None
                },
                'core': ['__init__.py', 'config.py', 'security.py'],
                'db': ['__init__.py', 'database.py', 'models.py', 'crud.py'],
                'schemas': ['__init__.py', 'user.py', 'transaction.py', 'ai.py'],
                'services': ['__init__.py', 'groq_service.py', 'ocr_service.py'],
                '__init__.py': None
            },
            'alembic': {
                'versions': ['__init__.py'],
                '__init__.py': None,
                'env.py': None,
                'script.py.mako': None
            },
            'tests': ['__init__.py', 'test_api.py', 'test_bot.py'],
            'main.py': None,
            'requirements.txt': None,
            'alembic.ini': None,
            '.env.example': None,
            '.env': None,
            'pytest.ini': None
        },
        'frontend': {
            'public': ['vite.svg'],
            'src': {
                'api': ['index.ts', 'types.ts'],
                'components': {
                    'ui': ['Button.tsx', 'Card.tsx', 'Input.tsx', 'Select.tsx'],
                    'charts': ['ExpenseChart.tsx', 'CategoryPieChart.tsx'],
                    'transactions': ['TransactionList.tsx', 'TransactionItem.tsx', 'AddTransactionForm.tsx'],
                },
                'pages': ['Dashboard.tsx', 'Subscriptions.tsx', 'Stats.tsx', 'Settings.tsx'],
                'store': ['userStore.ts', 'transactionStore.ts', 'uiStore.ts'],
                'hooks': ['useTelegram.ts', 'useAuth.ts', 'useTransactions.ts'],
                'utils': ['formatters.ts', 'validators.ts', 'constants.ts'],
                'types': ['index.ts', 'telegram.d.ts'],
                'App.tsx': None,
                'main.tsx': None,
                'index.css': None,
                'vite-env.d.ts': None
            },
            'package.json': None,
            'tsconfig.json': None,
            'tsconfig.node.json': None,
            'vite.config.ts': None,
            'tailwind.config.js': None,
            'postcss.config.js': None,
            'index.html': None,
            '.env.example': None,
            '.env': None,
            '.eslintrc.cjs': None
        },
        'static': {
            'twa': ['expense_input.html', 'styles.css']
        },
        'docs': ['API.md', 'SETUP.md', 'ARCHITECTURE.md'],
        '.gitignore': None,
        'README.md': None
    }

    def create_from_dict(base_path: Path, struct: dict):
        """Рекурсивно создает структуру из словаря"""
        for name, content in struct.items():
            current_path = base_path / name

            if isinstance(content, dict):
                current_path.mkdir(parents=True, exist_ok=True)
                print(f"📁 Created: {current_path}")
                create_from_dict(current_path, content)
            elif isinstance(content, list):
                current_path.mkdir(parents=True, exist_ok=True)
                print(f"📁 Created: {current_path}")
                for file in content:
                    file_path = current_path / file
                    file_path.touch()
                    print(f"📄 Created: {file_path}")
            else:
                current_path.touch()
                print(f"📄 Created: {current_path}")

    root = Path.cwd()
    create_from_dict(root, structure)

    print("\n" + "=" * 60)
    print("✅ Структура проекта успешно создана!")
    print("=" * 60)
    print(f"\n📍 Корневая директория: {root}")
    print("\n🚀 Следующие шаги:\n")
    print("1. Настройте окружение:")
    print("   • Заполните backend/.env (TELEGRAM_BOT_TOKEN, GROQ_API_KEY)")
    print("   • Заполните frontend/.env (обычно не требуется для dev)\n")
    print("2. Backend setup:")
    print("   cd backend")
    print("   pip install -r requirements.txt")
    print("   alembic upgrade head")
    print("   python main.py\n")
    print("3. Frontend setup (в новом терминале):")
    print("   cd frontend")
    print("   npm install")
    print("   npm run dev\n")
    print("4. Настройте Telegram бота:")
    print("   • Создайте бота через @BotFather")
    print("   • Скопируйте токен в backend/.env")
    print("   • Настройте команды (см. docs/SETUP.md)\n")
    print("5. Откройте бота в Telegram и отправьте /start\n")
    print("📚 Документация:")
    print("   • docs/SETUP.md - Полная инструкция по настройке")
    print("   • docs/API.md - API документация")
    print("   • docs/ARCHITECTURE.md - Архитектура проекта")
    print("\n" + "=" * 60)


if __name__ == '__main__':
    create_structure()