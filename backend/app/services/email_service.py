import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader


class EmailService:
    def __init__(self) -> None:
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_address = os.getenv("EMAIL_FROM", self.smtp_user)

        template_dir = Path(__file__).parent.parent / "templates" / "email"
        self.jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))

    async def send_email(
        self, to: str, subject: str, body_html: str, body_text: str | None = None
    ) -> None:
        """Send email via SMTP."""
        if not self.smtp_user or not self.smtp_password:
            raise ValueError("SMTP credentials not configured")

        msg = MIMEMultipart("alternative")
        msg["From"] = self.from_address or ""
        msg["To"] = to
        msg["Subject"] = subject

        if body_text:
            msg.attach(MIMEText(body_text, "plain"))

        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)

    async def send_test_email(self, to: str) -> None:
        """Send test email."""
        subject = "Task Tracker - Test Notification"
        body = self._render_template(
            "test_email.html",
            {"dashboard_url": os.getenv("DASHBOARD_URL", "http://localhost")},
        )
        await self.send_email(to, subject, body)

    async def send_pending_alert(self, to: str, pending_count: int) -> None:
        """Send alert about high pending count."""
        subject = f"Task Tracker - {pending_count} Pending Versions"
        body = self._render_template(
            "pending_alert.html",
            {
                "pending_count": pending_count,
                "dashboard_url": os.getenv("DASHBOARD_URL", "http://localhost"),
            },
        )
        await self.send_email(to, subject, body)

    async def send_daily_digest(self, to: str, stats: dict[str, int]) -> None:
        """Send daily digest."""
        subject = "Task Tracker - Daily Automation Digest"
        body = self._render_template(
            "daily_digest.html",
            {
                "stats": stats,
                "dashboard_url": os.getenv("DASHBOARD_URL", "http://localhost"),
            },
        )
        await self.send_email(to, subject, body)

    def _render_template(self, template_name: str, context: dict[str, str | int | dict[str, int]]) -> str:
        """Render Jinja2 template."""
        template = self.jinja_env.get_template(template_name)
        return template.render(**context)


email_service = EmailService()
