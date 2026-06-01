import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close(code=4001)
            return

        self.order_id = self.scope['url_route']['kwargs']['order_id']  
        self.group_name = f"order_{self.order_id}"                     

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def post_update(self, event):
        message = event["message"]
        if "action" not in message:
            message["action"] = "status_update"
        await self.send(text_data=json.dumps(message))