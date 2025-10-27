"""
Groq AI Service
"""
from groq import AsyncGroq
from app.core.config import get_settings  # ✅ ИСПРАВЛЕНО: правильный импорт
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqService:
    """Groq AI service for chat completions"""

    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-70b-versatile"
        logger.info("✅ Groq client initialized successfully")

    async def chat(self, messages: list, temperature: float = 0.7, max_tokens: int = 1024) -> str:
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


# ✅ СОЗДАЕМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР
groq_client = GroqService()


# ✅ ДОБАВЬТЕ ЭТУ ФУНКЦИЮ:
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

        response = await groq_client.chat(messages, temperature=0.3, max_tokens=50)
        category_name = response.strip()

        # Validate that response is in available categories
        if category_name in available_categories:
            return {"category_name": category_name}
        else:
            # Fallback to first category if AI returned invalid category
            logger.warning(f"⚠️ AI returned invalid category: {category_name}, using default")
            return {"category_name": available_categories[0] if available_categories else "Sonstiges"}

    except Exception as e:
        logger.error(f"❌ Categorization error: {e}")
        return {"category_name": "Sonstiges"}