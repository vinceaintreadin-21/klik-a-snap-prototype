"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api.routing import websocket_urlpatterns # Import your new routes

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# This handles the "splitting" of traffic
application = ProtocolTypeRouter({
    # Standard HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket requests
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})