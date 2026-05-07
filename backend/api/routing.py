from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This matches the 'ws://127.0.0.1:8000/ws/posts/' in your React code
    re_path(r'ws/posts/$', consumers.PostConsumer.as_asgi()), #type: ignore 
]