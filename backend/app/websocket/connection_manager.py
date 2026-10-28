import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("crowdsync.websocket")

class ConnectionManager:
    def __init__(self):
        # Map channel name -> set of active WebSockets
        self.channel_subscriptions: Dict[str, Set[WebSocket]] = {}
        # Map WebSocket -> set of subscribed channels
        self.socket_channels: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.socket_channels[websocket] = set()
        logger.info("WebSocket connected")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.socket_channels:
            channels = self.socket_channels[websocket]
            for channel in channels:
                if channel in self.channel_subscriptions:
                    self.channel_subscriptions[channel].discard(websocket)
                    if not self.channel_subscriptions[channel]:
                        del self.channel_subscriptions[channel]
            del self.socket_channels[websocket]
        logger.info("WebSocket disconnected and cleaned up")

    def subscribe(self, websocket: WebSocket, channel: str):
        if websocket not in self.socket_channels:
            self.socket_channels[websocket] = set()
        self.socket_channels[websocket].add(channel)

        if channel not in self.channel_subscriptions:
            self.channel_subscriptions[channel] = set()
        self.channel_subscriptions[channel].add(websocket)
        logger.info(f"Subscribed socket to channel {channel}")

    def unsubscribe(self, websocket: WebSocket, channel: str):
        if websocket in self.socket_channels:
            self.socket_channels[websocket].discard(channel)
        if channel in self.channel_subscriptions:
            self.channel_subscriptions[channel].discard(websocket)
            if not self.channel_subscriptions[channel]:
                del self.channel_subscriptions[channel]

    async def broadcast_to_channel(self, channel: str, message: Dict[str, Any]):
        """Broadcasts a JSON message to all subscribers of a channel."""
        if channel not in self.channel_subscriptions:
            return

        dead_sockets = []
        payload = json.dumps(message)
        
        for websocket in list(self.channel_subscriptions[channel]):
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to websocket on channel {channel}: {e}")
                dead_sockets.append(websocket)

        for dead_ws in dead_sockets:
            self.disconnect(dead_ws)

    # Convenience broadcast methods
    async def broadcast_queue_update(self, queue_id: str, data: Dict[str, Any]):
        await self.broadcast_to_channel(f"queue:{queue_id}", {
            "type": "QUEUE_UPDATE",
            "queue_id": queue_id,
            "data": data
        })

    async def broadcast_location_update(self, location_id: str, data: Dict[str, Any]):
        await self.broadcast_to_channel(f"location:{location_id}", {
            "type": "LOCATION_UPDATE",
            "location_id": location_id,
            "data": data
        })

    async def send_user_notification(self, user_id: str, notification: Dict[str, Any]):
        await self.broadcast_to_channel(f"user:{user_id}", {
            "type": "NOTIFICATION",
            "user_id": user_id,
            "data": notification
        })

ws_manager = ConnectionManager()
