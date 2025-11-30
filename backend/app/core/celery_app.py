"""
Celery Configuration for SpaarBot
Background tasks and scheduled jobs
"""
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta

from app.core.config import get_settings

settings = get_settings()

# Create Celery app
celery_app = Celery(
    "spaarbot",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        'app.tasks.reports',
        'app.tasks.subscriptions',
        'app.tasks.notifications'
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Berlin',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Scheduled tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Weekly reports - Every Monday at 9:00 AM
    'send-weekly-reports': {
        'task': 'app.tasks.reports.send_weekly_reports',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
        'options': {'expires': 3600}
    },

    # Daily subscription reminders - Every day at 10:00 AM
    'check-subscription-renewals': {
        'task': 'app.tasks.subscriptions.check_subscription_renewals',
        'schedule': crontab(hour=10, minute=0),
        'options': {'expires': 3600}
    },

    # Monthly AI insights - First day of month at 8:00 AM
    'generate-monthly-insights': {
        'task': 'app.tasks.reports.generate_monthly_insights_all_users',
        'schedule': crontab(hour=8, minute=0, day_of_month=1),
        'options': {'expires': 7200}
    },

    # Check for anomalies - Every day at 20:00
    'detect-spending-anomalies': {
        'task': 'app.tasks.notifications.detect_anomalies_all_users',
        'schedule': crontab(hour=20, minute=0),
        'options': {'expires': 3600}
    },

    # Cleanup old notifications - Every Sunday at 3:00 AM
    'cleanup-old-notifications': {
        'task': 'app.tasks.notifications.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
        'options': {'expires': 3600}
    },
}

# Task routes
celery_app.conf.task_routes = {
    'app.tasks.reports.*': {'queue': 'reports'},
    'app.tasks.subscriptions.*': {'queue': 'subscriptions'},
    'app.tasks.notifications.*': {'queue': 'notifications'},
}

if __name__ == '__main__':
    celery_app.start()