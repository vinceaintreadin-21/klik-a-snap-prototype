# api/services/__init__.py
#
# Services organised by domain:
#
#   OPERATOR / SHARED
#     id_engine.py           — AI photo processing pipeline, face crop, ID card render
#     processing_service.py  — async queue management, WebSocket broadcast helpers
#     order_service.py       — order creation, student bulk-import orchestration
#     qr_service.py          — per-student and bulk QR code generation
