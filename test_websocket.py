#!/usr/bin/env python3
"""Simple WebSocket test client for API testing"""
import asyncio
import websockets
import json
import sys

async def test_websocket():
    try:
        # Connect to the WebSocket
        uri = "ws://localhost:8000/ws"
        print(f"Connecting to {uri}...")

        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established successfully")

            # Listen for messages for a few seconds
            timeout_counter = 0
            while timeout_counter < 3:  # Listen for 3 seconds
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    print(f"📨 Received: {message}")

                    # Try to parse as JSON
                    try:
                        data = json.loads(message)
                        print(f"   Type: {data.get('type', 'unknown')}")
                        if 'data' in data:
                            print(f"   Data: {data['data']}")
                    except json.JSONDecodeError:
                        print(f"   Raw message (not JSON): {message}")

                except asyncio.TimeoutError:
                    timeout_counter += 1
                    print(f"⏰ Waiting for messages... ({timeout_counter}/3)")

            print("✅ WebSocket test completed successfully")

    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    success = asyncio.run(test_websocket())
    sys.exit(0 if success else 1)