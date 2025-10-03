from app.schemas import EntityExtraction, EntityStructured, TextClassification
from core.llm import ollama_model
from pydantic_ai import Agent, ModelSettings
from rich.pretty import pprint

agent_classification = Agent(
    model=ollama_model,
    output_type=TextClassification,
    system_prompt="""
    Ви є експертом з класифікації повідомлень. Ваше завдання - визначити, чи є повідомлення 
    описом задачі/проблеми, і якщо так, то визначити категорію та пріоритет.
    Ми цінуєм наших користувачів, задоволений користувач - стабільний дохід.
    """,
)

agent_extractor = Agent(
    model=ollama_model,
    output_type=EntityExtraction,
    system_prompt="""
    Ви є експертом з видобування сутностей з тексту. Ваше завдання - визначити 
    всі важливі сутності з повідомлення
    """,
)

agent_analyse = Agent(
    model=ollama_model,
    output_type=EntityStructured,
    system_prompt="""
    Ви є експертом з аналізу повідомлень. Ваше завдання - надати примітки щодо повідомлення, 
    які можуть допомогти в подальшій обробці.
    """,
    model_settings=ModelSettings(temperature=0.95),
)


if __name__ == "__main__":
    problem1 = """
    Взагалі, адмінка, там де створення користувача, надання доступів, 
    зміна паролів, вантажить дуже повільно, я 2 год потратила 
    на надання доступів 15 користувачам, це не ок @Sucre_91
    """

    classification1 = agent_classification.run_sync(problem1)
    extraction1 = agent_extractor.run_sync(problem1)
    analise1 = agent_analyse.run_sync(problem1)
    pprint([classification1, extraction1, analise1])

    problem2 = """
    якщо 2-3 репліки робити (для надійності щоб меседжі не вєбались
    випадково/робота продовжилась іф один брокер відєбне)
    то до 100 доларів буде шо то шо ето
    """
    # [
    # │   AgentRunResult(
    # │   │   output=TextClassification(
    # │   │   │   is_issue=True,
    # │   │   │   category='bug',
    # │   │   │   priority='high',
    # │   │   │   confidence=0.95
    # │   │   )
    # │   ),
    # │   AgentRunResult(
    # │   │   output=EntityExtraction(
    # │   │   │   projects=[],
    # │   │   │   components=['адмінка'],
    # │   │   │   technologies=[],
    # │   │   │   mentions=['@Sucre_91'],
    # │   │   │   dates=[],
    # │   │   │   versions=[]
    # │   │   )
    # │   ),
    # │   AgentRunResult(
    # │   │   output=EntityStructured(
    # │   │   │   short='Адмінка може бути оптимізована для швидшого надання доступів користувачам.'
    # │   │   )
    # │   )
    # ]

    classification2 = agent_classification.run_sync(problem2)
    extraction2 = agent_extractor.run_sync(problem2)
    analise2 = agent_analyse.run_sync(problem2)
    pprint([classification2, extraction2, analise2])

    # [
    # │   AgentRunResult(
    # │   │   output=TextClassification(
    # │   │   │   is_issue=True,
    # │   │   │   category='improvement',
    # │   │   │   priority='medium',
    # │   │   │   confidence=0.8
    # │   │   )
    # │   ),
    # │   AgentRunResult(
    # │   │   output=EntityExtraction(
    # │   │   │   projects=[],
    # │   │   │   components=['repliques'],
    # │   │   │   technologies=[],
    # │   │   │   mentions=[],
    # │   │   │   dates=[],
    # │   │   │   versions=[]
    # │   │   )
    # │   ),
    # │   AgentRunResult(
    # │   │   output=EntityStructured(
    # │   │   │   short='Для надійної роботи і згідно з умовами, рекомендується запускати більше ніж двох або трьох реплік.'
    # │   │   )
    # │   )
    # ]
