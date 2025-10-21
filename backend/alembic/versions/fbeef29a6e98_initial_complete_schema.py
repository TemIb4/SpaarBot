"""initial_complete_schema

Revision ID: initial_complete
Revises:
Create Date: 2025-01-21
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'initial_complete'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === USERS TABLE ===
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('language_code', sa.String(), server_default='de', nullable=True),

        # User preferences
        sa.Column('tier', sa.String(), server_default='free', nullable=True),
        sa.Column('ui_mode', sa.String(), server_default='pro', nullable=True),
        sa.Column('language', sa.String(), server_default='de', nullable=True),

        # Premium & PayPal
        sa.Column('is_premium', sa.Boolean(), server_default='0', nullable=True),
        sa.Column('paypal_subscription_id', sa.String(), nullable=True),
        sa.Column('premium_since', sa.DateTime(), nullable=True),

        # Legacy fields
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('paypal_id', sa.String(), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=True)
    op.create_index(op.f('ix_users_paypal_subscription_id'), 'users', ['paypal_subscription_id'], unique=True)

    # === CATEGORIES TABLE ===
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), server_default='📦', nullable=True),
        sa.Column('color', sa.String(), server_default='#808080', nullable=True),
        sa.Column('category_type', sa.String(), server_default='expense', nullable=True),
        sa.Column('transaction_type', sa.String(), server_default='expense', nullable=True),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)

    # === TRANSACTIONS TABLE ===
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('transaction_type', sa.String(), server_default='expense', nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),

        sa.ForeignKeyConstraint(['telegram_id'], ['users.telegram_id']),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_telegram_id'), 'transactions', ['telegram_id'], unique=False)

    # === SUBSCRIPTIONS TABLE ===
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),

        # Subscription details
        sa.Column('service_name', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), server_default='💳', nullable=True),

        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(), server_default='EUR', nullable=True),

        sa.Column('billing_frequency', sa.String(), server_default='monthly', nullable=True),
        sa.Column('billing_cycle', sa.String(), server_default='monthly', nullable=True),

        sa.Column('next_payment_date', sa.Date(), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(), nullable=True),

        sa.Column('status', sa.String(), server_default='active', nullable=True),

        # Auto-detection fields
        sa.Column('confirmed', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('auto_detected', sa.Boolean(), server_default='0', nullable=False),

        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),

        sa.ForeignKeyConstraint(['telegram_id'], ['users.telegram_id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_telegram_id'), 'subscriptions', ['telegram_id'], unique=False)

    # === CHAT MESSAGES TABLE ===
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),

        sa.ForeignKeyConstraint(['telegram_id'], ['users.telegram_id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_telegram_id'), 'chat_messages', ['telegram_id'], unique=False)

    # === FEEDBACK TABLE ===
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),

        sa.ForeignKeyConstraint(['telegram_id'], ['users.telegram_id']),
        sa.PrimaryKeyConstraint('id')
    )

    # === NOTIFICATIONS TABLE ===
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),

        sa.ForeignKeyConstraint(['telegram_id'], ['users.telegram_id']),
        sa.PrimaryKeyConstraint('id')
    )

    # === INSERT DEFAULT CATEGORIES ===
    op.execute("""
        INSERT INTO categories (id, name, icon, color, category_type) VALUES
        (1, 'food', '🍔', '#ef4444', 'expense'),
        (2, 'transport', '🚗', '#f59e0b', 'expense'),
        (3, 'shopping', '🛍️', '#8b5cf6', 'expense'),
        (4, 'entertainment', '🎬', '#ec4899', 'expense'),
        (5, 'health', '💊', '#10b981', 'expense'),
        (6, 'bills', '📄', '#6366f1', 'expense'),
        (7, 'other', '📦', '#6b7280', 'expense'),
        (8, 'salary', '💰', '#10b981', 'income'),
        (9, 'freelance', '💻', '#3b82f6', 'income'),
        (10, 'investment', '📈', '#14b8a6', 'income'),
        (11, 'gift', '🎁', '#f472b6', 'income')
    """)


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('feedback')
    op.drop_table('chat_messages')
    op.drop_table('subscriptions')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('users')