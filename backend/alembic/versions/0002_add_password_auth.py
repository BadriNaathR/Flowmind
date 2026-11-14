"""Add password auth — make google_id nullable, add password_hash

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-12
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Allow users without Google OAuth (password-only accounts)
    op.alter_column("users", "google_id", nullable=True)
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
    # This will fail if any row has google_id = NULL — clear those rows first
    op.alter_column("users", "google_id", nullable=False)
