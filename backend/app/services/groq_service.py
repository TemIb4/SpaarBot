"""
Groq AI Service
"""
from groq import AsyncGroq
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqService:
    """Groq AI service for chat completions"""

    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        logger.info("✅ Groq client initialized successfully")

    async def chat_completion(self, messages: list, temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """
        Send chat request to Groq API

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Returns:
            AI response text
        """
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            response = chat_completion.choices[0].message.content
            return response

        except Exception as e:
            logger.error(f"❌ Groq API error: {e}")
            raise Exception(f"AI service error: {str(e)}")


# Глобальный экземпляр
groq_client = GroqService()


async def chat(message: str, context: str = "", language: str = "German") -> str:
    """
    Chat function for AI assistant

    Args:
        message: User's message
        context: Additional context (transactions, user info)
        language: Response language

    Returns:
        AI response
    """
    try:
        system_prompts = {
            "German": """Du bist ein persönlicher Finanzassistent. Beantworte die Fragen des Nutzers direkt und konkret auf DEUTSCH.
Gib praktische Ratschläge zu Finanzen, Ausgaben und Budgetplanung. Sei freundlich aber präzise.
Antworte NUR auf die gestellte Frage - keine Begrüßungen oder Wiederholungen.
WICHTIG: Antworte ausschließlich auf DEUTSCH.""",

            "English": """You are a personal finance assistant. Answer the user's questions directly and specifically in ENGLISH.
Give practical advice on finances, expenses, and budget planning. Be friendly but precise.
Answer ONLY the question asked - no greetings or repetitions.
IMPORTANT: Respond exclusively in ENGLISH.""",

            "Russian": """Ты персональный финансовый ассистент. Отвечай на вопросы пользователя прямо и конкретно на РУССКОМ языке.
Давай практические советы по финансам, расходам и планированию бюджета. Будь дружелюбным, но точным.
Отвечай ТОЛЬКО на заданный вопрос - никаких приветствий или повторений.
ВАЖНО: Отвечай исключительно на РУССКОМ языке.""",

            "Ukrainian": """Ти персональний фінансовий асистент. Відповідай на питання користувача прямо і конкретно УКРАЇНСЬКОЮ мовою.
Давай практичні поради щодо фінансів, витрат та планування бюджету. Будь дружелюбним, але точним.
Відповідай ТІЛЬКИ на поставлене питання - ніяких привітань або повторень.
ВАЖЛИВО: Відповідай виключно УКРАЇНСЬКОЮ мовою."""
        }

        system_prompt = system_prompts.get(language, system_prompts["German"])

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if context:
            messages.append({
                "role": "system",
                "content": f"User financial data:\n{context}"
            })

        messages.append({
            "role": "user",
            "content": message
        })

        logger.info(f"Sending to Groq with language: {language}")

        response = await groq_client.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )

        return response

    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise


async def categorize_transaction(description: str, available_categories: list) -> dict:
    """
    Automatically categorize transaction using AI

    Args:
        description: Transaction description
        available_categories: List of available category names

    Returns:
        dict with suggested category_name
    """
    try:
        categories_str = ", ".join(available_categories)

        prompt = f"""Given this transaction description: "{description}"
        
Choose the most appropriate category from this list:
{categories_str}

Respond with ONLY the category name, nothing else."""

        messages = [
            {"role": "system", "content": "You are a financial categorization assistant. Respond with only the category name."},
            {"role": "user", "content": prompt}
        ]

        response = await groq_client.chat_completion(messages, temperature=0.3, max_tokens=50)
        category_name = response.strip()

        if category_name in available_categories:
            return {"category_name": category_name}
        else:
            logger.warning(f"⚠️ AI returned invalid category: {category_name}, using default")
            return {"category_name": available_categories[0] if available_categories else "Sonstiges"}

    except Exception as e:
        logger.error(f"❌ Categorization error: {e}")
        return {"category_name": "Sonstiges"}