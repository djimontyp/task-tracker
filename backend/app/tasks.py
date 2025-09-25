from ..core.taskiq_config import nats_broker


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""

    print(f"Processing message: {message}")
    # Implementation of message processing will be here
    return f"Processed: {message}"


if __name__ == "__main__":
    # Example usage of TaskIQ with NATS

    import asyncio

    async def main():
        """Main function for sending example task"""

        print("Sending task for message processing...")
        task = await process_message.kiq("Example message for processing")

        print("Waiting for processing result...")
        result = await task.wait_result()

        print(f"Result: {result.return_value}")

    asyncio.run(main())
