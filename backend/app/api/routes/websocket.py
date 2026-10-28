import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.connection_manager import ws_manager
from app.core.security import decode_access_token

logger = logging.getLogger("crowdsync.ws_route")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/queues/{queue_id}")
async def websocket_queue_endpoint(websocket: WebSocket, queue_id: str):
    await ws_manager.connect(websocket)
    channel = f"queue:{queue_id}"
    ws_manager.subscribe(websocket, channel)
    try:
        # Send initial confirmation
        await websocket.send_text(json.dumps({
            "type": "SUBSCRIBED",
            "channel": channel,
            "message": f"Listening for real-time updates on queue session {queue_id}"
        }))
        while True:
            # Keep-alive ping/pong
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on queue {queue_id}: {e}")
        ws_manager.disconnect(websocket)

@router.websocket("/ws/locations/{location_id}")
async def websocket_location_endpoint(websocket: WebSocket, location_id: str):
    await ws_manager.connect(websocket)
    channel = f"location:{location_id}"
    ws_manager.subscribe(websocket, channel)
    try:
        await websocket.send_text(json.dumps({
            "type": "SUBSCRIBED",
            "channel": channel,
            "message": f"Listening for crowd condition updates on location {location_id}"
        }))
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on location {location_id}: {e}")
        ws_manager.disconnect(websocket)

@router.websocket("/ws/user")
async def websocket_user_endpoint(websocket: WebSocket, token: str = Query(None)):
    user_id = None
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    await ws_manager.connect(websocket)
    if user_id:
        channel = f"user:{user_id}"
        ws_manager.subscribe(websocket, channel)
        
    try:
        await websocket.send_text(json.dumps({
            "type": "CONNECTED",
            "authenticated": bool(user_id),
            "user_id": user_id
        }))
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
                elif msg.get("action") == "subscribe" and msg.get("channel"):
                    ws_manager.subscribe(websocket, msg.get("channel"))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on user channel: {e}")
        ws_manager.disconnect(websocket)
