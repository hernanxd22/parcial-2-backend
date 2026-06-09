import asyncio
import json
import sys
sys.path.insert(0, '.')

import jwt
import os

async def test_ws():
    # Get JWT_SECRET
    from app.core.security import JWT_SECRET, JWT_ALGORITHM, decode_access_token

    # Create a test token for user_id=1 (admin)
    payload = {'sub': '1'}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f'Token: {token[:50]}...')

    # Try to decode it
    decoded = decode_access_token(token)
    print(f'Decoded: {decoded}')

    # Now test WebSocket connection
    import websockets

    ws_url = f'ws://localhost:8000/pedidos/ws?token={token}'
    print(f'\nConnecting to: {ws_url[:80]}...')

    try:
        async with websockets.connect(ws_url) as ws:
            print('Connected!')

            # Receive message
            msg = await ws.recv()
            print(f'Received: {msg}')

            # Send subscribe order
            await ws.send(json.dumps({'action': 'subscribe-order', 'order_id': 1}))
            print('Sent subscribe-order')

            # Wait for response
            msg = await ws.recv()
            print(f'Received: {msg}')

    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test_ws())