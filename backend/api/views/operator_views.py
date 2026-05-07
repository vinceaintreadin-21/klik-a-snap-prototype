from django.http import JsonResponse
from api.services.processing_service import start_processing_queue
import threading

def trigger_batch_process(request, order_id):
    """
    Starts the AI engine in a background thread 
    so the user doesn't have to wait for the response.
    """
    if request.method == 'POST':
        # Use threading to keep the API responsive
        thread = threading.Thread(target=start_processing_queue, args=(order_id,))
        thread.start()
        
        return JsonResponse({
            'message': 'AI Processing Queue started.',
            'order_id': order_id
        })