#!/usr/bin/env python3
"""Comprehensive test script to demonstrate LLM functionality with Ukrainian messages"""

# Примітка: Для форматування коду можна використовувати Ruff - швидкий лінтер та форматувальник Python,
# який об'єднує функції flake8, black, isort та інших інструментів. Можна використовувати в режимі watch
# для автоматичного форматування коду на ходу.

import asyncio

from llm.ollama import OllamaProvider
from config import settings


def test_ollama_initialization():
    """Test that we can initialize the Ollama provider"""
    print("=" * 60)
    print("Ollama Provider Initialization Test")
    print("=" * 60)
    
    config = {
        "model": settings.ollama_model,
        "base_url": settings.ollama_base_url
    }
    
    print(f"Config model: {config['model']}")
    print(f"Config base_url: {config['base_url']}")
    
    try:
        provider = OllamaProvider(config)
        print(f"✓ Successfully initialized Ollama provider")
        print(f"  Model: {provider.model_name}")
        print(f"  Base URL: {provider.base_url}")
        return provider
    except Exception as e:
        print(f"✗ Failed to initialize Ollama provider: {e}")
        return None


async def test_classification(provider, test_message, test_name):
    """Test issue classification"""
    print(f"\n--- {test_name} ---")
    print(f"Повідомлення: '{test_message}'")
    
    try:
        result = await provider.classify_issue(test_message)
        print(f"✓ Класифікація успішна:")
        print(f"  Output: {getattr(result, 'output', result)}")
        try:
            print(f"  Usage: {result.usage()}")
        except Exception:
            pass
        return result
    except Exception as e:
        print(f"✗ Класифікація не вдалася: {e}")
        return None


async def test_entity_extraction(provider, test_message, test_name):
    """Test entity extraction"""
    print(f"\n--- {test_name} ---")
    print(f"Повідомлення: '{test_message}'")
    
    try:
        result = await provider.extract_entities(test_message)
        print(f"✓ Видобування сутностей успішне:")
        print(f"  Output: {getattr(result, 'output', result)}")
        try:
            print(f"  Usage: {result.usage()}")
        except Exception:
            pass
        
        # Додатковий тест для отримання примітки від LLM
        note_result = await provider.get_note_on_message(test_message)
        print(f"  Примітка від LLM: {note_result}")
        
        return result
    except Exception as e:
        print(f"✗ Видобування сутностей не вдалося: {e}")
        return None


async def main():
    """Main test function"""
    print("=" * 60)
    print("Комплексне тестування інтеграції LLM з українськими повідомленнями")
    print("=" * 60)
    
    # Test initialization
    provider = test_ollama_initialization()
    if not provider:
        return
    
    # Test cases with Ukrainian messages
    test_cases = [
        {
            "name": "Повідомлення про помилку",
            "message": "Сторінка входу не завантажується, користувачі отримують помилки таймауту.",
            "type": "both"
        },
        {
            "name": "Запит на нову функцію",
            "message": "Потрібно додати нову функцію для експорту звітів у форматі PDF.",
            "type": "both"
        },
        {
            "name": "Питання",
            "message": "Допоможіть зрозуміти, як працює система автентифікації?",
            "type": "both"
        },
        {
            "name": "Пропозиція щодо вдосконалення",
            "message": "Інтерфейс користувача можна покращити, додавши кращий контраст кольорів для доступності.",
            "type": "both"
        },
        {
            "name": "",
            "message": "Як же воно заїбало! ленд лагає, сторінки не грузяться! Менеджери вже червоні в дзвінків від користувачів. ми момежмо втратити довіру та жирного клієнта.",
            "type": "both"
        },
        {
            "name": "Від фронтендера з нічого",
            "message": "Ребята, хто таке написав? Кнопка в меню влітає в іншу галактику при скролі. ЛОЛ, ну ви даєте...",
            "type": "both"
        },
        {
            "name": "Від тімліда в паніці",
            "message": "ДЕВСТАНЦІЯ!!! Всі на мітинги, терміново! Продакт менеджер вже вислав військові частини. СРОЧНО треба фіксити баг з авторизацією!",
            "type": "both"
        },
        {
            "name": "Від дідька з інфраструктури",
            "message": "Ну ви і дали... Сервера лягли, бо хтось вирішив зберігати всі логи в пам'яті. Тепер всі в дупі, як завжди.",
            "type": "both"
        },
        {
            "name": "Від дізайнерки в негодуванні",
            "message": "Ви що, зовсім очей позбавились? Ці кольори не відповідають нашим гайдлайнам! Хто робив - іди сюди, поговоримо.",
            "type": "both"
        },
        {
            "name": "Від нетропа на тестуванні",
            "message": "Тестове середовище знову не доступне. Вже третій день не можу перевірити фікси. Чи можна хоч трохи подумати про якість?",
            "type": "both"
        },
        {
            "name": "Від бекендера в стилі хіп-хоп",
            "message": "Йой-йой, фронтенди знову щось намудрили з API. Всі ендпоінти повертають 500. Братан, треба синхронізуватись.",
            "type": "both"
        },
        {
            "name": "Від CEO в стресі",
            "message": "Діти, ми в дупі по коліно! Клієнти скаргуються, акціонери нервують, а ви тут баги фіксите. Потрібно терміново релізити хотфікс!",
            "type": "both"
        },
        {
            "name": "Від користувача з іронією",
            "message": "О, новий асистент Дія.AI! Чудово, ще одна система, яка буде витягувати мої дані. А може ще й каву зробить?",
            "type": "both"
        },
        {
            "name": "Від розробника з сумнівами",
            "message": "Люди хворіють, і бувають нюанси. Але ж ми стараємось по-швидше зробити. Хоча іноді виникає відчуття, що швидкість важливіша за якість.",
            "type": "both"
        },
        # Три конкретні повідомлення, які були запитані
        {
            "name": "Про Ruff та форматування коду",
            "message": "додай ще ---- я би заюзав ruff - https://docs.astral.sh/ruff/faq/. Сам до нього активно користувався блеком. він об'єднав у собі flake, black, isort та кучу усього іншого. і дуже швидко працює та можно включити у режимі вотч і на ходу що б він фоновим процесом форматував. ----",
            "type": "both"
        },
        {
            "name": "Про хвороби людей та нюанси",
            "message": "люди хворіють. і бувають нюанси. але ж ми стараємось по-швидше зробити)",
            "type": "both"
        },
        {
            "name": "Про Дія.AI",
            "message": "Перший у світі 🌍 національний AI-асистент з державних послуг: скажіть «Привіт» Дія.AІ 👋🏻 У нас з'явився новий співробітник Дія.AІ —  ваш персональний асистент. Він надаватиме державні послуги та консультуватиме вас щодо них на порталі Дія [скоро запустимо мобільну версію]. Асистент спілкується у форматі чату на порталі Дія 💬 як жива людина. Він легко підбере послугу під вашу життєву ситуацію: як:от народження малюка чи запуск власної справи. І головне — він на зв'язку цілодобово. Дія.АІ — ваш провідник у світі державних послуг. Будучи вузькопрофільним спеціалістом, він не порадить вам ім'я для кота чи рецепт том- яму. Його сфера — виключно державні послуги 💁🏼‍♂️ Наприклад, на запит «Як перереєструвати авто?»  він надасть покрокову інструкцію. А за командою «Дай довідку про доходи»  одразу замовить її для вас [і це лише перша з багатьох послуг, що з'являться до кінця року]. Як почати розмову з Дія.АІ: 1️⃣ Відкрийте портал Дія 2️⃣ Оберіть «Дія.AІ» над пошуковою стрічкою 3️⃣ Авторизуйтесь і напишіть свій запит Чи заміняє АІ-асистент службу підтримки Дії? 🧐 Ні, АІ-асистент консультує та надає готові послуги, а команда підтримки й надалі буде на зв‘язку для вирішення питань користувачів. AI-асистент доступний у відкритому бета-тестування і ще активно навчається. Ви можете нам допомогти покращити його. Заходьте на портал, тестуйте асистента різними запитами, і залишайте свій відгук 👍🏻 чи 👎🏻 на його відповіді [найцікавіші додавайте у сториз із відміткою Дії]. Держава стає ближчою до вас. Запитайте у Дія.AІ і переконайтесь ⚡️ Дія.АІ розроблено за сприяння проєкту «Цифровізація для зростання, доброчесності та прозорості» (UK DIGIT), що виконується Фондом Євразія і фінансується UK Dev,  та за підтримки швейцарсько-української програми EGAP, що виконується Фондом Східна Європа.",
            "type": "both"
        }
    ]
    
    # Run tests
    for test_case in test_cases:
        if test_case["type"] in ["both", "classification"]:
            await test_classification(provider, test_case["message"], test_case["name"])
        if test_case["type"] in ["both", "extraction"]:
            await test_entity_extraction(provider, test_case["message"], test_case["name"])
    
    print("\n" + "=" * 60)
    print("Всі тести завершено!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
