from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Static
from textual.containers import Container
from textual.screen import Screen
from textual.theme import Theme

# Custom green color scheme
green_theme = Theme(
    name="green",
    primary="#2E7D32",  # Dark green (primary color)
    secondary="#4CAF50",  # Medium green (secondary color)
    accent="#8BC34A",  # Light green (accent color)
    foreground="#212121",  # Dark gray (text)
    background="#F5F5F5",  # Light gray (background)
    surface="#FFFFFF",  # White (widget surface)
    panel="#EEEEEE",  # Light gray (panels)
    success="#388E3C",  # Success green
    warning="#FF9800",  # Orange (warning)
    error="#D32F2F",  # Red (error)
    dark=False,
)


# Екрани для кожної функції
class ProcessChatsScreen(Screen):
    """Екран для обробки чатів"""

    def compose(self) -> ComposeResult:
        # yield Header()
        yield Container(
            Static("Обробка чатів", id="title", classes="feature-title"),
            Static(
                "Натисніть кнопку нижче, щоб розпочати обробку чатів",
                id="content",
                classes="feature-content",
            ),
            Button("Обробити чати", id="process", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "process":
            # Тут буде реалізація обробки чатів
            self.query_one("#progress").update("[green]Обробка чатів...[/green]")
        elif event.button.id == "back":
            self.app.pop_screen()


class ScheduleJobsScreen(Screen):
    """Екран для налаштування запланованих завдань"""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static(
                "Налаштування запланованих завдань", id="title", classes="feature-title"
            ),
            Static(
                "Натисніть кнопку нижче, щоб налаштувати завдання",
                id="content",
                classes="feature-content",
            ),
            Button("Налаштувати завдання", id="schedule", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "schedule":
            # Тут буде реалізація налаштування завдань
            self.query_one("#progress").update("[green]Налаштування завдань...[/green]")
        elif event.button.id == "back":
            self.app.pop_screen()


class ViewStatisticsScreen(Screen):
    """Екран для перегляду статистики"""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Перегляд статистики", id="title", classes="feature-title"),
            Static(
                "Натисніть кнопку нижче, щоб переглянути статистику",
                id="content",
                classes="feature-content",
            ),
            Button("Переглянути статистику", id="view", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "view":
            # Тут буде реалізація перегляду статистики
            self.query_one("#progress").update(
                "[green]Завантаження статистики...[/green]"
            )
        elif event.button.id == "back":
            self.app.pop_screen()


class ConfigureLLMScreen(Screen):
    """Екран для налаштування провайдера LLM"""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Налаштування провайдера LLM", id="title", classes="feature-title"),
            Static(
                "Натисніть кнопку нижче, щоб налаштувати LLM",
                id="content",
                classes="feature-content",
            ),
            Button("Налаштувати LLM", id="configure", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "configure":
            # Тут буде реалізація налаштування LLM
            self.query_one("#progress").update("[green]Налаштування LLM...[/green]")
        elif event.button.id == "back":
            self.app.pop_screen()


class DatabaseManagementScreen(Screen):
    """Екран для управління базою даних"""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Управління базою даних", id="title", classes="feature-title"),
            Static(
                "Натисніть кнопку нижче, щоб керувати базою даних",
                id="content",
                classes="feature-content",
            ),
            Button("Керувати БД", id="manage", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "manage":
            # Тут буде реалізація управління БД
            self.query_one("#progress").update(
                "[green]Керування базою даних...[/green]"
            )
        elif event.button.id == "back":
            self.app.pop_screen()


class ExportIssuesScreen(Screen):
    """Екран для експорту проблем"""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Експорт проблем", id="title", classes="feature-title"),
            Static(
                "Натисніть кнопку нижче, щоб експортувати проблеми",
                id="content",
                classes="feature-content",
            ),
            Button("Експортувати", id="export", classes="feature-button"),
            Static("", id="progress", classes="progress"),
            Button("Назад", id="back", classes="feature-button"),
            id="screen_container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "export":
            # Тут буде реалізація експорту
            self.query_one("#progress").update("[green]Експорт проблем...[/green]")
        elif event.button.id == "back":
            self.app.pop_screen()


class MainMenu(Screen):
    """Головне меню додатку Task Tracker."""

    def compose(self) -> ComposeResult:
        """Створення віджетів для головного меню."""
        yield Container(
            Static("Ласкаво просимо до Task Tracker CLI", id="welcome"),
            Container(
                Button("Обробити чати зараз", id="process_chats"),
                Button("Налаштувати заплановані завдання", id="schedule_jobs"),
                Button("Переглянути статистику", id="view_statistics"),
                Button("Налаштувати провайдера LLM", id="configure_llm"),
                Button("Управління базою даних", id="database_management"),
                Button("Експорт проблем", id="export_issues"),
                Button("Вихід", id="exit"),
                id="menu_buttons",
            ),
            id="menu_container",
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Обробка натискання кнопок."""
        button_id = event.button.id

        if button_id == "process_chats":
            self.app.push_screen("process_chats")
        elif button_id == "schedule_jobs":
            self.app.push_screen("schedule_jobs")
        elif button_id == "view_statistics":
            self.app.push_screen("view_statistics")
        elif button_id == "configure_llm":
            self.app.push_screen("configure_llm")
        elif button_id == "database_management":
            self.app.push_screen("database_management")
        elif button_id == "export_issues":
            self.app.push_screen("export_issues")
        elif button_id == "exit":
            self.app.exit()


class TaskTrackerCLI(App):
    """Головний додаток Task Tracker CLI."""

    CSS_PATH = "cli.tcss"
    SCREENS = {
        "main": MainMenu,
        "process_chats": ProcessChatsScreen,
        "schedule_jobs": ScheduleJobsScreen,
        "view_statistics": ViewStatisticsScreen,
        "configure_llm": ConfigureLLMScreen,
        "database_management": DatabaseManagementScreen,
        "export_issues": ExportIssuesScreen,
    }

    def on_mount(self) -> None:
        """Встановлення початкового екрану при запуску додатку."""
        # Реєстрація кастомної теми
        self.register_theme(green_theme)
        # Встановлення теми
        self.theme = "green"
        # Встановлення початкового екрану
        self.push_screen("main")


if __name__ == "__main__":
    app = TaskTrackerCLI()
    app.run()
