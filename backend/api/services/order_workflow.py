from api.models.orders import Order


def get_order_workflow(order):
    status = order['status']
    if status == Order.Status.PROCESSING:
        return {'stage': 'PROCESSING', 'primary_action': 'view_pipeline'}
    if status in (Order.Status.COMPLETED, Order.Status.CANCELLED):
        return {'stage': status, 'primary_action': 'view_order'}
    if status == Order.Status.APPROVED:
        return {'stage': status, 'primary_action': 'send_to_print'}
    if status == Order.Status.PRINTING:
        return {'stage': status, 'primary_action': 'mark_completed'}
    if not order['has_layout']:
        return {'stage': 'AWAITING_LAYOUT', 'primary_action': 'set_layout'}
    if order['manual_review_count'] > 0:
        return {'stage': 'NEEDS_REVIEW', 'primary_action': 'review_photos'}
    if status == Order.Status.PROOFING:
        return {'stage': status, 'primary_action': 'view_proofs'}
    return {'stage': status, 'primary_action': 'upload_photos'}
