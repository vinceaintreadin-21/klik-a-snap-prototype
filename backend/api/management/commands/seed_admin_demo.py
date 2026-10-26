"""
Management command: seed_admin_demo
Creates realistic demo data for the admin panel.

The Subject model replaced the old Student model (migration 0023).
Subjects are generic ID-card recipients — could be students, employees,
members, or any other type depending on the institution's use case.

Usage:
    python manage.py seed_admin_demo
    python manage.py seed_admin_demo --clear   # wipes existing demo data first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from api.models.user_profile import UserProfile
from api.models.institution import Institution
from api.models.orders import Order
from api.models.subjects import Subject   # ← Subject, not Student
from api.models.coordinator_invite import CoordinatorInvite


# ── Institutions ───────────────────────────────────────────────────────────────

INSTITUTIONS = [
    {
        "username": "greenvalley",
        "email": "admin@greenvalley.edu",
        "name": "Green Valley College",
        "contact_person": "Dr. Patricia Reyes",
        "contact_phone": "+63-2-8123-4567",
        "address": "123 Emerald Ave, Quezon City, Metro Manila",
        "status": "ACTIVE",
        "order_quota": 10,
    },
    {
        "username": "northsideprep",
        "email": "admin@northsideprep.edu",
        "name": "Northside Prep School",
        "contact_person": "Mr. Carlos Mendoza",
        "contact_phone": "+63-32-255-1234",
        "address": "45 Bonifacio St, Cebu City",
        "status": "ACTIVE",
        "order_quota": 5,
    },
    {
        "username": "maplewoodhigh",
        "email": "admin@maplewood.edu",
        "name": "Maplewood High School",
        "contact_person": "Ms. Diana Park",
        "contact_phone": "+63-2-8765-4321",
        "address": "78 Maple Drive, Pasig City, Metro Manila",
        "status": "ACTIVE",
        "order_quota": None,
    },
    {
        "username": "riversidemiddle",
        "email": "admin@riverside.edu",
        "name": "Riverside Middle School",
        "contact_person": "Mr. Ben Wallace",
        "contact_phone": "+63-82-227-8901",
        "address": "12 Riverside Blvd, Davao City",
        "status": "SUSPENDED",
        "order_quota": 3,
    },
    {
        "username": "westbrookacademy",
        "email": "admin@westbrook.edu",
        "name": "Westbrook Academy",
        "contact_person": "Mrs. Elena Santos",
        "contact_phone": "+63-2-8234-5678",
        "address": "99 Scholar Lane, Makati City, Metro Manila",
        "status": "ACTIVE",
        "order_quota": 8,
    },
]

# ── Coordinators ──────────────────────────────────────────────────────────────
# Each coordinator is tied to an institution by index (matches INSTITUTIONS list).
# No expiry — demo accounts are permanently active.

COORDINATORS = [
    {
        "username":          "coord_lena",
        "email":             "lena.garcia@greenvalley.edu",
        "first_name":        "Lena Garcia",
        "institution_idx":   0,   # Green Valley College
    },
    {
        "username":          "coord_marco",
        "email":             "marco.bautista@northsideprep.edu",
        "first_name":        "Marco Bautista",
        "institution_idx":   1,   # Northside Prep School
    },
    {
        "username":          "coord_nina",
        "email":             "nina.reyes@maplewood.edu",
        "first_name":        "Nina Reyes",
        "institution_idx":   2,   # Maplewood High School
    },
]

OPERATORS = [
    {"username": "op_miguel", "email": "miguel@klik-a-snap.com"},
    {"username": "op_sarah",  "email": "sarah@klik-a-snap.com"},
    {"username": "op_james",  "email": "james@klik-a-snap.com"},
]

# ── Orders ─────────────────────────────────────────────────────────────────────

ORDERS = [
    {
        "institution_idx": 0, "operator_idx": 0,
        "school_name": "Green Valley College",
        "batch_name": "SY 2025-2026 First Batch",
        "subject_count": 280, "status": "PROCESSING", "deadline_days": 7,
    },
    {
        "institution_idx": 0, "operator_idx": 1,
        "school_name": "Green Valley College",
        "batch_name": "SY 2024-2025 Second Batch",
        "subject_count": 245, "status": "COMPLETED", "deadline_days": -30,
    },
    {
        "institution_idx": 1, "operator_idx": 0,
        "school_name": "Northside Prep School",
        "batch_name": "SY 2025-2026 Grades 7-10",
        "subject_count": 640, "status": "PROOFING", "deadline_days": 3,
    },
    {
        "institution_idx": 1, "operator_idx": 2,
        "school_name": "Northside Prep School",
        "batch_name": "SY 2024-2025 Grades 11-12",
        "subject_count": 198, "status": "COMPLETED", "deadline_days": -60,
    },
    {
        "institution_idx": 2, "operator_idx": 1,
        "school_name": "Maplewood High School",
        "batch_name": "SY 2025-2026 Main Batch",
        "subject_count": 1150, "status": "PENDING", "deadline_days": 14,
    },
    {
        "institution_idx": 2, "operator_idx": None,
        "school_name": "Maplewood High School",
        "batch_name": "SY 2025-2026 Transferees",
        "subject_count": 42, "status": "PENDING", "deadline_days": 21,
    },
    {
        "institution_idx": 3, "operator_idx": 2,
        "school_name": "Riverside Middle School",
        "batch_name": "SY 2024-2025 Full Batch",
        "subject_count": 310, "status": "CANCELLED", "deadline_days": -15,
    },
    {
        "institution_idx": 4, "operator_idx": 0,
        "school_name": "Westbrook Academy",
        "batch_name": "SY 2025-2026 K-5 Batch",
        "subject_count": 890, "status": "APPROVED", "deadline_days": 5,
    },
    {
        "institution_idx": 4, "operator_idx": 1,
        "school_name": "Westbrook Academy",
        "batch_name": "SY 2024-2025 K-5 Batch",
        "subject_count": 845, "status": "PRINTING", "deadline_days": 2,
    },
]

# ── Sample subjects for the PROOFING order ─────────────────────────────────────
# These represent the flexible "subject" concept — could be any type of ID
# recipient: students, faculty, employees, members, etc.
# The extra_data JSONField captures any domain-specific attributes.

SAMPLE_SUBJECTS = [
    {
        "student_id": "SUB-001",
        "full_name": "Aiden Walsh",
        "grade_level": "Grade 9",
        "section": "9-A",
        "extra_data": {"department": "General Education", "type": "Student"},
    },
    {
        "student_id": "SUB-002",
        "full_name": "Brianna Cole",
        "grade_level": "Grade 10",
        "section": "10-B",
        "extra_data": {"department": "Science & Technology", "type": "Student"},
    },
    {
        "student_id": "SUB-003",
        "full_name": "Carlos Reyes",
        "grade_level": "Grade 11",
        "section": "11-A",
        "extra_data": {"department": "STEM", "type": "Student"},
    },
    {
        "student_id": "SUB-004",
        "full_name": "Diana Park",
        "grade_level": "Grade 9",
        "section": "9-C",
        "extra_data": {"department": "Arts & Humanities", "type": "Student"},
    },
    {
        "student_id": "SUB-005",
        "full_name": "Evan Torres",
        "grade_level": "Grade 12",
        "section": "12-A",
        "extra_data": {"department": "STEM", "type": "Student"},
    },
    {
        "student_id": "SUB-006",
        "full_name": "Fiona Nash",
        "grade_level": "Faculty",
        "section": "Administration",
        "extra_data": {"position": "Math Teacher", "type": "Faculty"},
    },
    {
        "student_id": "SUB-007",
        "full_name": "Gabriel Kim",
        "grade_level": "Grade 11",
        "section": "11-B",
        "extra_data": {"department": "Business & Entrepreneurship", "type": "Student"},
    },
    {
        "student_id": "SUB-008",
        "full_name": "Hannah Bell",
        "grade_level": "Grade 9",
        "section": "9-B",
        "extra_data": {"department": "General Education", "type": "Student"},
    },
    {
        "student_id": "SUB-009",
        "full_name": "Isaac Cruz",
        "grade_level": "Grade 12",
        "section": "12-C",
        "extra_data": {"department": "HUMSS", "type": "Student"},
    },
    {
        "student_id": "SUB-010",
        "full_name": "Julia Voss",
        "grade_level": "Staff",
        "section": "Registrar",
        "extra_data": {"position": "Records Officer", "type": "Staff"},
    },
]


class Command(BaseCommand):
    help = "Seeds realistic demo data for the admin panel (Subject schema)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing demo data before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing demo data...")
            usernames = (
                [i["username"] for i in INSTITUTIONS] +
                [o["username"] for o in OPERATORS] +
                [c["username"] for c in COORDINATORS] +
                ["demo_admin"]
            )
            User.objects.filter(username__in=usernames).delete()
            self.stdout.write(self.style.WARNING("  Demo data cleared."))

        # ── 1. Admin user ──────────────────────────────────────────────────────
        admin_user, created = User.objects.get_or_create(
            username="demo_admin",
            defaults={
                "email": "admin@klik-a-snap.com",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        if created:
            admin_user.set_password("Admin@2025!")
            admin_user.save()
            UserProfile.objects.filter(user=admin_user).update(role=UserProfile.Role.ADMIN)
            self.stdout.write(self.style.SUCCESS(
                "  Admin created  →  demo_admin  |  password: Admin@2025!"
            ))
        else:
            self.stdout.write("  Admin already exists, skipping.")

        # ── 2. Operators ───────────────────────────────────────────────────────
        operator_users = []
        for op in OPERATORS:
            user, created = User.objects.get_or_create(
                username=op["username"],
                defaults={"email": op["email"], "is_active": True},
            )
            if created:
                user.set_password("Operator@2025!")
                user.save()
                UserProfile.objects.filter(user=user).update(
                    role=UserProfile.Role.OPERATOR,
                    is_active=True,
                )
                self.stdout.write(self.style.SUCCESS(
                    f"  Operator created  →  {op['username']}  |  password: Operator@2025!"
                ))
            operator_users.append(user)

        # ── 3. Institutions ────────────────────────────────────────────────────
        institution_objects = []
        for inst_data in INSTITUTIONS:
            user, created = User.objects.get_or_create(
                username=inst_data["username"],
                defaults={"email": inst_data["email"], "is_active": True},
            )
            if created:
                user.set_password("Institution@2025!")
                user.save()
                UserProfile.objects.filter(user=user).update(
                    role=UserProfile.Role.INSTITUTION,
                    is_active=True,
                )

            inst, inst_created = Institution.objects.get_or_create(
                user=user,
                defaults={
                    "name":           inst_data["name"],
                    "address":        inst_data["address"],
                    "contact_person": inst_data["contact_person"],
                    "contact_email":  inst_data["email"],
                    "contact_phone":  inst_data["contact_phone"],
                    "status":         inst_data["status"],
                    "order_quota":    inst_data["order_quota"],
                },
            )
            institution_objects.append(inst)
            if inst_created:
                self.stdout.write(self.style.SUCCESS(
                    f"  Institution created  →  {inst_data['name']}"
                ))

        # ── 4. Orders ──────────────────────────────────────────────────────────
        # Note: Order.student_count field keeps its DB column name for
        # backwards compatibility; it now represents the generic subject count.
        created_orders = []
        for order_data in ORDERS:
            inst   = institution_objects[order_data["institution_idx"]]
            op_idx = order_data["operator_idx"]
            op     = operator_users[op_idx] if op_idx is not None else None
            deadline = timezone.now().date() + timedelta(days=order_data["deadline_days"])

            order, order_created = Order.objects.get_or_create(
                institution=inst,
                school_name=order_data["school_name"],
                batch_name=order_data["batch_name"],
                defaults={
                    "assigned_operator": op,
                    "student_count":     order_data["subject_count"],   # DB column name unchanged
                    "status":            order_data["status"],
                    "deadline":          deadline,
                    "completed_at": (
                        timezone.now() if order_data["status"] == "COMPLETED" else None
                    ),
                },
            )
            created_orders.append(order)
            if order_created:
                self.stdout.write(
                    f"  Order  →  [{order_data['status']:12}]  "
                    f"{order_data['school_name']} / {order_data['batch_name']}"
                )

        # ── 5. Sample subjects on the first PROOFING order ─────────────────────
        # Uses the Subject model (migration 0023). extra_data captures
        # domain-specific flexible fields (position, department, type, etc.)
        proofing_order = next(
            (o for o in created_orders if o.status == Order.Status.PROOFING), None
        )
        if proofing_order and not Subject.objects.filter(order=proofing_order).exists():
            for s in SAMPLE_SUBJECTS:
                Subject.objects.create(
                    order=proofing_order,
                    student_id=s["student_id"],          # column name kept for FK compatibility
                    full_name=s["full_name"],
                    grade_level=s["grade_level"],
                    section=s.get("section", ""),
                    extra_data=s.get("extra_data", {}),
                    photo_status=Subject.PhotoStatus.PROCESSED,
                )
            self.stdout.write(
                f"  {len(SAMPLE_SUBJECTS)} sample subjects added to PROOFING order."
            )

        # ── 6. Coordinators ────────────────────────────────────────────────────
        # Demo coordinator accounts are fully active with no invite expiry.
        # A CoordinatorInvite record is still created (marked used) so the
        # list_coordinators endpoint has something to show — but the account
        # itself logs in normally with a password.
        for coord_data in COORDINATORS:
            inst = institution_objects[coord_data["institution_idx"]]

            user, created = User.objects.get_or_create(
                username=coord_data["username"],
                defaults={
                    "email":      coord_data["email"],
                    "first_name": coord_data["first_name"],
                    "is_active":  True,
                },
            )
            if created:
                user.set_password("Coordinator@2025!")
                user.save()

                profile = user.profile
                profile.role        = UserProfile.Role.COORDINATOR
                profile.institution = inst
                profile.is_active   = True
                profile.save()

                # Mark invite as already-used so it doesn't block login
                CoordinatorInvite.objects.get_or_create(
                    user=user,
                    defaults={
                        "institution": inst,
                        # Far-future expiry so is_valid() never fails for demo
                        "expires_at":  timezone.now() + timedelta(days=36500),
                        "is_used":     True,
                    },
                )

                self.stdout.write(self.style.SUCCESS(
                    f"  Coordinator created  →  {coord_data['username']}  "
                    f"({inst.name})  |  password: Coordinator@2025!"
                ))
            else:
                self.stdout.write(
                    f"  Coordinator already exists, skipping  →  {coord_data['username']}"
                )

        # ── Summary ────────────────────────────────────────────────────────────
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("  Demo data seeded successfully!"))
        self.stdout.write("=" * 60)
        self.stdout.write("  Admin        →  demo_admin       / Admin@2025!")
        self.stdout.write("  Operators    →  op_miguel etc    / Operator@2025!")
        self.stdout.write("  Institutions →  greenvalley etc  / Institution@2025!")
        self.stdout.write("  Coordinators →  coord_lena etc   / Coordinator@2025!")
        self.stdout.write("=" * 60 + "\n")
