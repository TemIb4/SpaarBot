"""
PayPal Integration Service - Complete Subscription Flow
Полная интеграция PayPal для подписок €2.99/мес
"""
import requests
import base64
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PayPalService:
    """
    Professional PayPal integration service

    Features:
    - Subscription management (€2.99/month)
    - Payment processing
    - Webhook handling
    - Account linking (OAuth)
    """

    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.mode = settings.PAYPAL_MODE  # 'sandbox' or 'live'

        if self.mode == 'sandbox':
            self.base_url = "https://api-m.sandbox.paypal.com"
        else:
            self.base_url = "https://api-m.paypal.com"

        self.access_token = None
        self.token_expires_at = None

        # SpaarBot Premium Plan ID (создается один раз)
        self.premium_plan_id = settings.PAYPAL_PREMIUM_PLAN_ID

        logger.info(f"PayPal service initialized in {self.mode} mode")

    def _get_access_token(self) -> str:
        """Get or refresh PayPal access token"""
        # Check if we have a valid token
        if self.access_token and self.token_expires_at:
            if datetime.now() < self.token_expires_at:
                return self.access_token

        # Get new token
        url = f"{self.base_url}/v1/oauth2/token"

        # Encode credentials
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US",
            "Authorization": f"Basic {encoded_credentials}"
        }

        data = {
            "grant_type": "client_credentials"
        }

        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()

            result = response.json()
            self.access_token = result['access_token']

            # Token expires in 'expires_in' seconds (usually 32400 = 9 hours)
            expires_in = result.get('expires_in', 32400)
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer

            logger.info("PayPal access token obtained successfully")
            return self.access_token

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting PayPal access token: {e}")
            raise Exception(f"PayPal authentication failed: {str(e)}")

    # ============================================================================
    # SUBSCRIPTION MANAGEMENT (Core feature)
    # ============================================================================

    def create_billing_plan(
        self,
        product_id: str,
        plan_name: str = "SpaarBot Premium",
        plan_description: str = "Unlimited transactions, AI insights, OCR, bank integration"
    ) -> Dict:
        """
        Создать Billing Plan (выполняется ОДИН РАЗ при setup)

        Returns:
            {
                "success": bool,
                "plan_id": str,
                "status": str
            }
        """
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/billing/plans"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            plan_data = {
                "product_id": product_id,
                "name": plan_name,
                "description": plan_description,
                "status": "ACTIVE",
                "billing_cycles": [{
                    "frequency": {
                        "interval_unit": "MONTH",
                        "interval_count": 1
                    },
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # Бесконечная подписка
                    "pricing_scheme": {
                        "fixed_price": {
                            "value": "2.99",
                            "currency_code": "EUR"
                        }
                    }
                }],
                "payment_preferences": {
                    "auto_bill_outstanding": True,
                    "setup_fee": {
                        "value": "0",
                        "currency_code": "EUR"
                    },
                    "setup_fee_failure_action": "CONTINUE",
                    "payment_failure_threshold": 3
                }
            }

            response = requests.post(url, headers=headers, json=plan_data)
            response.raise_for_status()

            result = response.json()

            logger.info(f"Billing plan created: {result['id']}")

            return {
                "success": True,
                "plan_id": result['id'],
                "status": result['status']
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating billing plan: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def create_product(
        self,
        product_name: str = "SpaarBot Premium Subscription",
        product_type: str = "SERVICE"
    ) -> Dict:
        """
        Создать Product (выполняется ОДИН РАЗ перед созданием плана)

        Returns:
            {
                "success": bool,
                "product_id": str
            }
        """
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/catalogs/products"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            product_data = {
                "name": product_name,
                "description": "AI-powered personal finance assistant - Premium features",
                "type": product_type,
                "category": "SOFTWARE",
                "image_url": "https://example.com/spaarbot-logo.png",  # TODO: Replace with real logo
                "home_url": "https://spaarbot.com"  # TODO: Replace with real URL
            }

            response = requests.post(url, headers=headers, json=product_data)
            response.raise_for_status()

            result = response.json()

            logger.info(f"Product created: {result['id']}")

            return {
                "success": True,
                "product_id": result['id']
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating product: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def create_subscription(
        self,
        return_url: str,
        cancel_url: str,
        custom_id: Optional[str] = None
    ) -> Dict:
        """
        Создать подписку для пользователя

        Args:
            return_url: URL для редиректа после успешной подписки
            cancel_url: URL для редиректа при отмене
            custom_id: Custom ID (telegram_id пользователя)

        Returns:
            {
                "success": bool,
                "subscription_id": str,
                "approval_url": str,
                "status": str
            }
        """
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/billing/subscriptions"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
                "Prefer": "return=representation"
            }

            subscription_data = {
                "plan_id": self.premium_plan_id,
                "custom_id": custom_id,  # Для идентификации пользователя
                "application_context": {
                    "brand_name": "SpaarBot",
                    "locale": "de-DE",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "SUBSCRIBE_NOW",
                    "payment_method": {
                        "payer_selected": "PAYPAL",
                        "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                    },
                    "return_url": return_url,
                    "cancel_url": cancel_url
                }
            }

            response = requests.post(url, headers=headers, json=subscription_data)
            response.raise_for_status()

            result = response.json()

            # Extract approval URL
            approval_url = None
            for link in result.get('links', []):
                if link.get('rel') == 'approve':
                    approval_url = link.get('href')
                    break

            logger.info(f"Subscription created: {result['id']}")

            return {
                "success": True,
                "subscription_id": result['id'],
                "approval_url": approval_url,
                "status": result['status']
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating subscription: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_subscription_details(self, subscription_id: str) -> Dict:
        """Получить детали подписки"""
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            response = requests.get(url, headers=headers)
            response.raise_for_status()

            result = response.json()

            return {
                "success": True,
                "subscription": result
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting subscription details: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def cancel_subscription(
        self,
        subscription_id: str,
        reason: str = "Customer requested cancellation"
    ) -> Dict:
        """Отменить подписку"""
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}/cancel"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            cancel_data = {
                "reason": reason
            }

            response = requests.post(url, headers=headers, json=cancel_data)
            response.raise_for_status()

            logger.info(f"Subscription cancelled: {subscription_id}")

            return {
                "success": True,
                "subscription_id": subscription_id,
                "status": "CANCELLED"
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error cancelling subscription: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def suspend_subscription(self, subscription_id: str, reason: str) -> Dict:
        """Приостановить подписку"""
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}/suspend"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            suspend_data = {
                "reason": reason
            }

            response = requests.post(url, headers=headers, json=suspend_data)
            response.raise_for_status()

            logger.info(f"Subscription suspended: {subscription_id}")

            return {
                "success": True,
                "subscription_id": subscription_id,
                "status": "SUSPENDED"
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error suspending subscription: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================================================
    # ONE-TIME PAYMENTS (Для будущего использования)
    # ============================================================================

    def create_payment(
        self,
        amount: float,
        description: str,
        return_url: str,
        cancel_url: str,
        currency: str = "EUR"
    ) -> Dict:
        """Создать одноразовый платеж"""
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/payments/payment"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            payment_data = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "transactions": [{
                    "amount": {
                        "total": f"{amount:.2f}",
                        "currency": currency
                    },
                    "description": description
                }],
                "redirect_urls": {
                    "return_url": return_url,
                    "cancel_url": cancel_url
                }
            }

            response = requests.post(url, headers=headers, json=payment_data)
            response.raise_for_status()

            result = response.json()

            # Extract approval URL
            approval_url = None
            for link in result.get('links', []):
                if link.get('rel') == 'approval_url':
                    approval_url = link.get('href')
                    break

            logger.info(f"Payment created: {result['id']}")

            return {
                "success": True,
                "payment_id": result['id'],
                "approval_url": approval_url,
                "state": result['state']
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating payment: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def execute_payment(self, payment_id: str, payer_id: str) -> Dict:
        """Выполнить одобренный платеж"""
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/payments/payment/{payment_id}/execute"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            execute_data = {
                "payer_id": payer_id
            }

            response = requests.post(url, headers=headers, json=execute_data)
            response.raise_for_status()

            result = response.json()

            logger.info(f"Payment executed: {payment_id}")

            return {
                "success": True,
                "payment_id": result['id'],
                "state": result['state'],
                "transactions": result.get('transactions', [])
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error executing payment: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================================================
    # WEBHOOK VERIFICATION
    # ============================================================================

    def verify_webhook_signature(
        self,
        headers: dict,
        webhook_id: str,
        webhook_event: dict
    ) -> bool:
        """
        Проверить подпись webhook от PayPal

        Args:
            headers: HTTP headers от webhook request
            webhook_id: PayPal Webhook ID
            webhook_event: Тело webhook event

        Returns:
            True если подпись валидна
        """
        try:
            access_token = self._get_access_token()
            url = f"{self.base_url}/v1/notifications/verify-webhook-signature"

            verify_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }

            verify_data = {
                "auth_algo": headers.get('PAYPAL-AUTH-ALGO'),
                "cert_url": headers.get('PAYPAL-CERT-URL'),
                "transmission_id": headers.get('PAYPAL-TRANSMISSION-ID'),
                "transmission_sig": headers.get('PAYPAL-TRANSMISSION-SIG'),
                "transmission_time": headers.get('PAYPAL-TRANSMISSION-TIME'),
                "webhook_id": webhook_id,
                "webhook_event": webhook_event
            }

            response = requests.post(url, headers=verify_headers, json=verify_data)
            response.raise_for_status()

            result = response.json()
            verification_status = result.get('verification_status')

            is_valid = verification_status == 'SUCCESS'

            if is_valid:
                logger.info(f"Webhook signature verified successfully")
            else:
                logger.warning(f"Webhook signature verification failed: {verification_status}")

            return is_valid

        except requests.exceptions.RequestException as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False


# Global instance
paypal_service = PayPalService()