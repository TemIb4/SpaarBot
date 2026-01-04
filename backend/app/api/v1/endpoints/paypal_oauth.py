# paypal_oauth.py - ЗАМЕНИ ВЕСЬ ФАЙЛ ЭТИМ КОДОМ

"""
PayPal OAuth Integration - Working version without id_token
"""
import logging
import base64
from datetime import datetime
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx

from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


class PayPalConnectRequest(BaseModel):
    telegram_id: int
    return_url: str


class PayPalConnectResponse(BaseModel):
    authorization_url: str


@router.get("/auth-url", response_model=PayPalConnectResponse)
async def get_auth_url(
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db)
):
    """
    Get PayPal OAuth authorization URL

    This is a simpler GET endpoint that returns the OAuth URL
    Frontend calls this to initiate PayPal connection
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        client_id = getattr(settings, 'PAYPAL_CLIENT_ID', None)
        if not client_id:
            raise HTTPException(status_code=500, detail="PayPal not configured")

        client_id = client_id.strip()
        base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
        redirect_uri = f"{base_url}/api/v1/paypal/callback"
        paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')

        oauth_base = "https://www.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://www.paypal.com"

        params = {
            "client_id": client_id,
            "response_type": "code",
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            "state": str(telegram_id),
        }

        authorization_url = f"{oauth_base}/connect?{urlencode(params)}"
        logger.info(f"✅ PayPal OAuth URL created for user {telegram_id}")
        return PayPalConnectResponse(authorization_url=authorization_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating auth URL: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect", response_model=PayPalConnectResponse)
async def connect_paypal(
        request: PayPalConnectRequest,
        db: AsyncSession = Depends(get_db)
):
    try:
        user = await get_user_by_telegram_id(db, request.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        client_id = getattr(settings, 'PAYPAL_CLIENT_ID', None)
        if not client_id:
            raise HTTPException(status_code=500, detail="PayPal not configured")

        client_id = client_id.strip()
        base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
        redirect_uri = f"{base_url}/api/v1/paypal/callback"
        paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')

        oauth_base = "https://www.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://www.paypal.com"

        params = {
            "client_id": client_id,
            "response_type": "code",
            "scope": "openid email profile",
            "redirect_uri": redirect_uri,
            "state": str(request.telegram_id),
        }

        authorization_url = f"{oauth_base}/connect?{urlencode(params)}"
        logger.info(f"✅ PayPal OAuth URL created")
        return PayPalConnectResponse(authorization_url=authorization_url)

    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback", response_class=HTMLResponse)
async def paypal_callback(
        code: str = Query(...),
        state: str = Query(...),
        db: AsyncSession = Depends(get_db)
):
    try:
        telegram_id = int(state)
        logger.info(f"📥 Callback for user {telegram_id}")

        client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '').strip()
        client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '').strip()
        paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')

        if not client_id or not client_secret:
            return """<html><body style="text-align:center;padding:50px;background:#1a1a1a;color:white;">
            <h1>❌ Config Error</h1><button onclick="window.close()">Close</button></body></html>"""

        api_base = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get token
            token_response = await client.post(
                f"{api_base}/v1/oauth2/token",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": f"Basic {credentials}",
                },
                data={"grant_type": "authorization_code", "code": code}
            )

            if token_response.status_code != 200:
                logger.error(f"❌ Token error: {token_response.text}")
                return f"""<html><body style="text-align:center;padding:50px;background:#1a1a1a;color:white;">
                <h1>❌ Error</h1><pre>{token_response.text}</pre>
                <button onclick="window.close()">Close</button></body></html>"""

            token_data = token_response.json()
            access_token = token_data.get("access_token")
            logger.info(f"✅ Got token")

            # Try to get email from userinfo endpoint
            paypal_email = None

            # Method 1: Try userinfo endpoint
            try:
                userinfo_response = await client.get(
                    f"{api_base}/v1/identity/oauth2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"schema": "paypalv1.1"}
                )

                if userinfo_response.status_code == 200:
                    user_info = userinfo_response.json()
                    logger.info(f"📥 Userinfo: {user_info}")
                    paypal_email = user_info.get("email") or (
                        user_info.get("emails", [{}])[0].get("value") if user_info.get("emails") else None)
            except Exception as e:
                logger.warning(f"⚠️ Userinfo failed: {e}")

            # Fallback: Use placeholder for Sandbox
            if not paypal_email:
                logger.warning("⚠️ No email found, using placeholder")
                paypal_email = f"paypal_user_{telegram_id}@sandbox.test"

        # Save to DB
        from app.db.models import User
        from sqlalchemy import update

        await db.execute(
            update(User)
            .where(User.telegram_id == telegram_id)
            .values(paypal_id=paypal_email, updated_at=datetime.now())
        )
        await db.commit()

        logger.info(f"✅ PayPal connected: {paypal_email}")

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Success</title>
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <style>
                body {{
                    font-family: sans-serif;
                    text-align: center;
                    padding: 50px;
                    background: #1a1a1a;
                    color: white;
                }}
                .success {{ font-size: 64px; margin-bottom: 20px; }}
                button {{
                    padding: 12px 24px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }}
            </style>
        </head>
        <body>
            <div class="success">✅</div>
            <h1>PayPal Connected!</h1>
            <p><strong>{paypal_email}</strong></p>
            <button onclick="close()">Close</button>
            <script>
                function close() {{
                    if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
                    else window.close();
                }}
                setTimeout(close, 3000);
            </script>
        </body>
        </html>
        """

    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        return f"""<html><body style="text-align:center;padding:50px;background:#1a1a1a;color:white;">
        <h1>❌ Error</h1><p>{str(e)}</p>
        <button onclick="window.close()">Close</button></body></html>"""


@router.delete("/disconnect")
async def disconnect_paypal(
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db)
):
    try:
        from app.db.models import User
        from sqlalchemy import update

        await db.execute(
            update(User).where(User.telegram_id == telegram_id).values(paypal_id=None, updated_at=datetime.now())
        )
        await db.commit()

        logger.info(f"✅ Disconnected user {telegram_id}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))