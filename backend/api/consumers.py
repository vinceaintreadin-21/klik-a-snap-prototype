import json
from channels.generic.websocket import AsyncWebsocketConsumer

# consumers.py
class PostConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "posts"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # This handles the signal sent from your Django Service/View
    async def post_update(self, event):
        # We ensure the key 'action' exists so React's if-statement works
        message = event["message"]
        
        # If the message from the view doesn't have 'action', we add it here
        if "action" not in message:
            message["action"] = "status_update"

        await self.send(text_data=json.dumps(message))