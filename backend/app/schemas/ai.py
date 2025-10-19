"""AI-related schemas"""
from pydantic import BaseModel
from typing import List, Optional

class AIQueryRequest(BaseModel):
    """Request for AI assistant"""
    query: str
    user_id: int
    context: Optional[dict] = None

class AIQueryResponse(BaseModel):
    """Response from AI assistant"""
    answer: str
    suggestions: Optional[List[str]] = None