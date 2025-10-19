"""
Groq AI Service
"""
import logging
from typing import Optional
from groq import Groq
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqService:
    """Service for interacting with Groq AI API"""

    def __init__(self):
        """Initialize Groq client"""
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set!")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("Groq client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None

    async def get_chat_response(
        self,
        user_message: str,
        context: Optional[str] = None
    ) -> str:
        """
        Get chat response from Groq AI

        Args:
            user_message: User's message
            context: Optional context about user's finances

        Returns:
            AI response string
        """
        if not self.client:
            logger.error("Groq client not initialized")
            return "Entschuldigung, der AI-Service ist momentan nicht verfügbar."

        try:
            # Build messages
            messages = [
                {
                    "role": "system",
                    "content": """Du bist ein freundlicher Finanzassistent für SpaarBot. 
Du hilfst Nutzern beim Geldmanagement, gibst Spar-Tipps und analysierst ihre Ausgaben.
Antworte immer auf Deutsch, sei hilfreich und motivierend.
Halte deine Antworten kurz und prägnant (max 3-4 Sätze)."""
                }
            ]

            # Add context if provided
            if context:
                messages.append({
                    "role": "system",
                    "content": f"Kontext über den Nutzer: {context}"
                })

            # Add user message
            messages.append({
                "role": "user",
                "content": user_message
            })

            logger.info(f"Sending request to Groq: {user_message[:50]}...")

            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=500,
                top_p=1,
                stream=False
            )

            response = chat_completion.choices[0].message.content
            logger.info(f"Received response from Groq: {response[:50]}...")

            return response

        except Exception as e:
            logger.error(f"Error getting Groq response: {e}", exc_info=True)
            return f"Entschuldigung, es gab einen Fehler: {str(e)}"

    async def categorize_transaction(self, description: str) -> str:
        """
        Categorize a transaction based on its description

        Args:
            description: Transaction description

        Returns:
            Category name (in German)
        """
        if not self.client:
            logger.warning("Groq client not initialized, returning default category")
            return "Sonstiges"

        try:
            messages = [
                {
                    "role": "system",
                    "content": """Du bist ein Experte für Transaktionskategorisierung.
Kategorisiere die Ausgabe in eine dieser Kategorien:
- Lebensmittel
- Transport
- Wohnen
- Unterhaltung
- Gesundheit
- Bildung
- Shopping
- Reisen
- Sonstiges

Antworte NUR mit dem Kategorienamen, nichts anderes."""
                },
                {
                    "role": "user",
                    "content": f"Kategorisiere diese Ausgabe: {description}"
                }
            ]

            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=20,
            )

            category = chat_completion.choices[0].message.content.strip()
            logger.info(f"Categorized '{description}' as '{category}'")

            return category

        except Exception as e:
            logger.error(f"Error categorizing transaction: {e}")
            return "Sonstiges"


# Global instance
groq_service = GroqService()


async def get_ai_response(user_message: str, context: Optional[str] = None) -> str:
    """
    Convenience function to get AI response

    Args:
        user_message: User's message
        context: Optional context

    Returns:
        AI response string
    """
    return await groq_service.get_chat_response(user_message, context)


async def categorize_transaction(description: str) -> str:
    """
    Convenience function to categorize transaction

    Args:
        description: Transaction description

    Returns:
        Category name
    """
    return await groq_service.categorize_transaction(description)