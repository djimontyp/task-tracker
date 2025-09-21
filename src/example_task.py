"""
Example usage of TaskIQ with NATS
"""

import asyncio


async def main():
    """Main function for sending example task"""
    print("Sending task for message processing...")

    # Add small delay for NATS to start up
    await asyncio.sleep(2)

    # Import function
    from src.worker import process_message

    # Send task
    task = await process_message.kiq("Example message for processing")

    # Wait for result
    print("Waiting for processing result...")
    result = await task.wait_result()

    # Output result
    print(f"Result: {result.return_value}")


if __name__ == "__main__":
    # Run async function
    asyncio.run(main())
