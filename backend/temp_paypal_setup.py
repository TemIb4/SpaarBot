# Содержимое temp_paypal_setup.py
from app.services.paypal_service import paypal_service

# Шаг 3: Создание продукта
result = paypal_service.create_product('SpaarBot Premium Subscription')
print(f'Product ID: {result["product_id"]}')

# Шаг 4: Создание плана (После того как получишь ID продукта)
# result = paypal_service.create_billing_plan(
#     product_id='ТВОЙ_PRODUCT_ID_СЮДА',
#     plan_name='SpaarBot Premium',
#     plan_description='€2.99/month - Unlimited transactions, AI insights, OCR, bank integration'
# )
# print(f'Plan ID: {result["plan_id"]}')