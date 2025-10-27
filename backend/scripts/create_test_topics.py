#!/usr/bin/env python3
"""Quick script to create test topics with unique names."""

import asyncio
import httpx

API_URL = "http://localhost:8000/api/v1/topics"


async def create_topics() -> None:
    """Create test topics."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        topics = []

        # Create topics with timestamp-based unique names
        for i in range(30):
            topics.append({
                "name": f"Test Topic {i + 1:03d}",
                "description": f"Test description for topic number {i + 1}",
            })

        created = 0
        for topic in topics:
            try:
                response = await client.post(API_URL, json=topic)
                if response.status_code in [200, 201]:
                    created += 1
                    print(f"✓ Created: {topic['name']}")
                else:
                    print(f"✗ Failed: {topic['name']} - {response.status_code}")
            except Exception as e:
                print(f"✗ Error: {topic['name']} - {e}")

        print(f"\n✅ Created {created}/{len(topics)} topics")


if __name__ == "__main__":
    asyncio.run(create_topics())
