# api/views/__init__.py
#
# Views are organised by role/domain:
#
#   SHARED / AUTH
#     auth_views.py          — register, login, logout, profile, account invite
#
#   ADMIN
#     admin_views.py         — operator CRUD, institution CRUD, order assignment,
#                              status override, all-orders list
#     analytics_views.py     — overview, orders-per-month, manual-review-rate,
#                              avg-turnaround
#     logs_views.py          — audit logs, processing logs, error logs
#
#   OPERATOR
#     order_views.py         — order CRUD, file parse, QR download, photo upload,
#                              AI processing trigger, ID card download
#     student_views.py       — student CRUD, quick-add, manual-link, approve,
#                              request-revision, reprocess, process-linked
#     layout_views.py        — layout create / get / preview
#
#   INSTITUTION
#     institution_views.py   — institution profile, coordinator invite, coordinator list
#
#   COORDINATOR
#     coordinator_views.py   — coordinator orders, student list, mark-photographed,
#                              proofing orders, join-invite flow
#
#   _unused/
#     operator_views.py      — superseded by order_views.py; kept for reference
