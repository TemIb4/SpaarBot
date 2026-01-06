"""add_balance_fields_to_user

Revision ID: 906840bf6fe1
Revises: initial_complete
Create Date: 2026-01-06 02:20:14.916913

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '906840bf6fe1'
down_revision = 'initial_complete'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add balance fields to users table
    op.add_column('users', sa.Column('balance', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('users', sa.Column('currency', sa.String(), nullable=True, server_default='EUR'))
    op.add_column('users', sa.Column('balance_updated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove balance fields from users table
    op.drop_column('users', 'balance_updated_at')
    op.drop_column('users', 'currency')
    op.drop_column('users', 'balance')