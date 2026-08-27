from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile import Address, AddressType, Document, DocumentSource, Education, EducationLevel, Profile, User
from app.models.service import (
    Service,
    ServiceDocumentRequirement,
    ServiceField,
    ServiceFieldType,
    ServiceStatus,
    ServiceType,
)
from app.services.profile_service import DEMO_USER_EMAIL


DRIVING_LICENCE_APPLICATION_OPTIONS = [
    "Learner's Licence",
    "Permanent Driving Licence",
    "Add Vehicle Class to Existing Licence",
    "Renew Driving Licence",
    "Duplicate Driving Licence",
]

INDIAN_VEHICLE_CLASS_OPTIONS = [
    "MCWOG — Motorcycle without gear",
    "MCWG — Motorcycle with gear",
    "LMV-NT — Light motor vehicle (non-transport)",
    "LMV-TR — Light motor vehicle (transport)",
    "Transport — Medium/heavy goods or passenger vehicle",
    "E-rickshaw",
    "E-cart",
    "Road roller",
    "Adapted vehicle for persons with disability",
    "Other specified vehicle",
]


def seed_demo_citizen(db: Session) -> None:
    """Create only synthetic, explicitly demo-labelled citizen data."""
    existing_user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if existing_user is not None:
        sync_citizen_display_data(db, existing_user)
        return

    user = User(email=DEMO_USER_EMAIL, mobile="9000000000", auth_state="DEMO")
    profile = Profile(
        user=user,
        full_name="Rahul Kumar",
        date_of_birth=date(2005, 3, 15),
        gender="MALE",
        nationality="Indian",
        father_name="Arun Kumar",
        mother_name="Sunita Kumar",
        mobile="9000000000",
        email="rahul.kumar@example.com",
        category="GENERAL",
        disability_status="NONE",
    )
    user.addresses.append(
        Address(
            type=AddressType.PERMANENT,
            line1="42 Ashoka Road",
            line2=None,
            city="New Delhi",
            district="Central Delhi",
            state="Delhi",
            pincode="110001",
        )
    )
    marksheet = Document(
        name="Class 12 Marksheet",
        document_type="12TH_MARKSHEET",
        source=DocumentSource.PROFILE_UPLOAD,
        storage_key="synthetic/class-12-marksheet.pdf",
    )
    user.documents.extend(
        [
            marksheet,
            Document(
                name="Photograph",
                document_type="PHOTOGRAPH",
                source=DocumentSource.PROFILE_UPLOAD,
                storage_key="synthetic/photograph.png",
            ),
        ]
    )
    user.education_records.append(
        Education(
            level=EducationLevel.TWELFTH,
            board_or_university="Central Board of Secondary Education",
            institution="Government Senior Secondary School",
            year=2023,
            marks_or_percentage="87%",
            certificate_document=marksheet,
        )
    )
    db.add(profile)
    db.commit()


def seed_demo_services(db: Session) -> None:
    """Seed generic service definitions; forms are rendered from these records."""
    if db.scalar(select(Service.id).limit(1)) is not None:
        sync_demo_service_options(db)
        return

    recruitment_exam = Service(
        id="RECRUITMENT_EXAM_001",
        name="Government Recruitment Exam",
        department="Public Recruitment Department",
        description="Apply for open government recruitment examinations and track your application.",
        service_type=ServiceType.RECRUITMENT,
        category="Recruitment",
        status=ServiceStatus.OPEN,
        fee=100,
        currency="INR",
        instructions=None,
        required_profile_fields=["full_name", "date_of_birth", "gender", "address", "category", "education"],
        fields=[
            ServiceField(
                key="exam_city",
                label="Preferred Exam City",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=["New Delhi", "Mumbai", "Bengaluru"],
                position=1,
            ),
            ServiceField(
                key="post_preference",
                label="Post Preference",
                field_type=ServiceFieldType.TEXT,
                required=True,
                options=None,
                position=2,
            ),
        ],
        document_requirements=[
            ServiceDocumentRequirement(document_type="PHOTOGRAPH", label="Photograph", required=True, position=1),
            ServiceDocumentRequirement(document_type="SIGNATURE", label="Signature", required=True, position=2),
            ServiceDocumentRequirement(
                document_type="DEGREE_CERTIFICATE", label="Degree Certificate", required=True, position=3
            ),
        ],
    )
    scholarship = Service(
        id="SCHOLARSHIP_001",
        name="Post-Matric Scholarship",
        department="Education Support Department",
        description="Financial assistance for eligible students pursuing post-matric education.",
        service_type=ServiceType.SCHOLARSHIP,
        category="Education",
        status=ServiceStatus.OPEN,
        fee=0,
        currency="INR",
        instructions=None,
        required_profile_fields=["full_name", "date_of_birth", "address", "category", "education"],
        fields=[
            ServiceField(
                key="course", label="Current Course", field_type=ServiceFieldType.TEXT, required=True, options=None, position=1
            ),
            ServiceField(
                key="institution", label="Institution", field_type=ServiceFieldType.TEXT, required=True, options=None, position=2
            ),
            ServiceField(
                key="academic_year",
                label="Academic Year",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=["2026-27", "2027-28"],
                position=3,
            ),
        ],
        document_requirements=[
            ServiceDocumentRequirement(
                document_type="INCOME_CERTIFICATE", label="Income Certificate", required=True, position=1
            ),
            ServiceDocumentRequirement(document_type="MARKSHEET", label="Marksheet", required=True, position=2),
        ],
    )
    driving_licence = Service(
        id="DRIVING_LICENCE_001",
        name="Driving Licence Application",
        department="Transport Department",
        description="Apply for learner, permanent, renewal and vehicle-class driving licence services.",
        service_type=ServiceType.LICENCE,
        category="Transport",
        status=ServiceStatus.OPEN,
        fee=200,
        currency="INR",
        instructions=None,
        required_profile_fields=["full_name", "date_of_birth", "address"],
        fields=[
            ServiceField(
                key="licence_type",
                label="Application Type",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=DRIVING_LICENCE_APPLICATION_OPTIONS,
                position=1,
            ),
            ServiceField(
                key="vehicle_class",
                label="Vehicle Class",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=INDIAN_VEHICLE_CLASS_OPTIONS,
                position=2,
            ),
        ],
        document_requirements=[
            ServiceDocumentRequirement(document_type="PHOTOGRAPH", label="Photograph", required=True, position=1),
            ServiceDocumentRequirement(
                document_type="IDENTITY_DOCUMENT", label="Identity Document", required=True, position=2
            ),
        ],
    )
    db.add_all([recruitment_exam, scholarship, driving_licence])
    db.commit()


def sync_demo_service_options(db: Session) -> None:
    """Keep option-backed demo fields current in already-created local databases."""
    services = {
        service.id: service
        for service in db.scalars(select(Service)).all()
    }
    service_copy = {
        "RECRUITMENT_EXAM_001": (
            "Government Recruitment Exam",
            "Public Recruitment Department",
            "Apply for open government recruitment examinations and track your application.",
        ),
        "SCHOLARSHIP_001": (
            "Post-Matric Scholarship",
            "Education Support Department",
            "Financial assistance for eligible students pursuing post-matric education.",
        ),
        "DRIVING_LICENCE_001": (
            "Driving Licence Application",
            "Transport Department",
            "Apply for learner, permanent, renewal and vehicle-class driving licence services.",
        ),
    }
    for service_id, (name, department, description) in service_copy.items():
        service = services.get(service_id)
        if service is not None:
            service.name = name
            service.department = department
            service.description = description
            service.instructions = None

    fields = {
        field.key: field
        for field in db.scalars(
            select(ServiceField).where(ServiceField.service_id == "DRIVING_LICENCE_001")
        ).all()
    }
    licence_type = fields.get("licence_type")
    if licence_type is not None:
        licence_type.label = "Application Type"
        licence_type.field_type = ServiceFieldType.SELECT
        licence_type.options = DRIVING_LICENCE_APPLICATION_OPTIONS
    vehicle_class = fields.get("vehicle_class")
    if vehicle_class is not None:
        vehicle_class.field_type = ServiceFieldType.SELECT
        vehicle_class.options = INDIAN_VEHICLE_CLASS_OPTIONS
    exam_city = db.scalar(
        select(ServiceField).where(
            ServiceField.service_id == "RECRUITMENT_EXAM_001",
            ServiceField.key == "exam_city",
        )
    )
    if exam_city is not None:
        exam_city.options = ["New Delhi", "Mumbai", "Bengaluru"]
    db.commit()


def sync_citizen_display_data(db: Session, user: User) -> None:
    if user.profile is not None:
        user.profile.father_name = "Arun Kumar"
        user.profile.mother_name = "Sunita Kumar"
        user.profile.email = "rahul.kumar@example.com"
    if user.addresses:
        address = user.addresses[0]
        address.line1 = "42 Ashoka Road"
        address.city = "New Delhi"
        address.district = "Central Delhi"
        address.state = "Delhi"
        address.pincode = "110001"
    if user.education_records:
        education = user.education_records[0]
        education.board_or_university = "Central Board of Secondary Education"
        education.institution = "Government Senior Secondary School"
    document_names = {
        "10TH_MARKSHEET": "Class 10 Marksheet",
        "12TH_MARKSHEET": "Class 12 Marksheet",
        "INCOME_CERTIFICATE": "Income Certificate",
        "CASTE_CERTIFICATE": "Caste Certificate",
        "DRIVING_LICENCE": "Driving Licence",
        "DEGREE_CERTIFICATE": "Degree Certificate",
        "PHOTOGRAPH": "Photograph",
    }
    for document in user.documents:
        if document.document_type in document_names:
            document.name = document_names[document.document_type]
    db.commit()
