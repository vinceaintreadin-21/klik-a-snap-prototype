import requests
from django.conf import settings


def send_transactional_email(subject: str, message: str, recipient_list: list[str]):
    """
    Sends an email via Brevo if BREVO_API_KEY is configured (production).
    Otherwise, prints to console (local dev) so nothing breaks without an API key.
    """
    if settings.BREVO_API_KEY:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            json={
                "sender": {
                    "name": settings.DEFAULT_FROM_NAME,
                    "email": settings.DEFAULT_FROM_EMAIL,
                },
                "to": [{"email": email} for email in recipient_list],
                "subject": subject,
                "textContent": message,
            },
        )
        response.raise_for_status()  # raises an exception on 4xx/5xx so errors don't fail silently
        return response.json()
    else:
        print("=" * 50)
        print(f"[DEV EMAIL] To: {recipient_list}")
        print(f"Subject: {subject}")
        print(message)
        print("=" * 50)