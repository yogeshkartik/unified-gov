from datetime import date
from pathlib import Path
from shutil import copyfile
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.profile import Address, AddressType, Document, DocumentSource, DocumentType, Education, EducationLevel, Profile, User
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

SEEDED_MARKSHEET_FILENAME = "demo-government-document.pdf"
SEED_GENERIC_DOCUMENT_FILENAME = "demo-government-document.pdf"
SEEDED_MARKSHEET_NAME = "Class 12 Marksheet"
SEED_FILES_DIR = Path(__file__).resolve().parents[2] / "seed" / "files"


def seed_demo_citizen(db: Session) -> None:
    """Create only synthetic, explicitly demo-labelled citizen data."""
    existing_user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if existing_user is not None:
        sync_citizen_display_data(db, existing_user)
        seed_demo_marksheet(db, existing_user)
        db.commit()
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
    user.documents.extend(
        [
            Document(
                name="Photograph",
                document_type=DocumentType.PROFILE_PHOTO,
                source=DocumentSource.PROFILE_UPLOAD,
                storage_key="synthetic/photograph.png",
                is_imported=True,
            ),
        ]
    )
    db.add(profile)
    db.flush()
    marksheet = seed_demo_marksheet(db, user)
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
    db.commit()


def seed_demo_marksheet(db: Session, user: User) -> Document:
    """Copy the tracked synthetic PDF to runtime storage and attach it to the demo citizen."""
    source_path = SEED_FILES_DIR / SEED_GENERIC_DOCUMENT_FILENAME
    if not source_path.is_file():
        raise RuntimeError(f"Missing demo seed asset: {source_path}")

    document = db.scalar(
        select(Document).where(
            Document.user_id == user.id,
            Document.document_type == DocumentType.MARKSHEET,
            (Document.original_filename == SEEDED_MARKSHEET_FILENAME)
            | (Document.original_filename == "class-12-marksheet-demo.pdf"),
        )
    )
    if document is None:
        # Upgrade the metadata-only record created by earlier prototype seeds.
        document = db.scalar(
            select(Document).where(
                Document.user_id == user.id,
                Document.document_type == "12TH_MARKSHEET",
                Document.name == SEEDED_MARKSHEET_NAME,
            )
        )

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    if document is None:
        stored_filename = f"{uuid4()}{source_path.suffix}"
        document = Document(user_id=user.id, name=SEEDED_MARKSHEET_NAME)
        db.add(document)
    else:
        stored_filename = document.stored_filename or f"{uuid4()}{source_path.suffix}"

    copyfile(source_path, upload_dir / stored_filename)
    document.name = SEEDED_MARKSHEET_NAME
    document.display_name = SEEDED_MARKSHEET_NAME
    document.document_type = DocumentType.MARKSHEET
    document.source = DocumentSource.SYSTEM_GENERATED
    document.original_filename = SEEDED_MARKSHEET_FILENAME
    document.stored_filename = stored_filename
    document.storage_key = stored_filename
    document.mime_type = "application/pdf"
    document.size_bytes = source_path.stat().st_size
    document.is_imported = True
    db.flush()
    return document


def seed_demo_services(db: Session) -> None:
    """Seed generic service definitions; forms are rendered from these records."""
    if db.scalar(select(Service.id).limit(1)) is not None:
        sync_demo_service_options(db)
        seed_extended_demo_services(db)
        return

    recruitment_exam = Service(
        id="RECRUITMENT_EXAM_001",
        name="Government Recruitment Exam",
        department="Public Recruitment Department",
        description="Apply for open government recruitment examinations and track your application.",
        service_type=ServiceType.RECRUITMENT,
        category="Examinations",
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
        category="Education & Scholarships",
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
        category="Identity & Licences",
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
    seed_extended_demo_services(db)
    db.commit()


def seed_extended_demo_services(db: Session) -> None:
    """Add synthetic directory entries using the same generic service schema."""
    existing_ids = set(db.scalars(select(Service.id)).all())

    def make_fields(*definitions: tuple[str, str, ServiceFieldType, list[str] | None]) -> list[ServiceField]:
        return [ServiceField(key=key, label=label, field_type=field_type, required=True, options=options, position=position) for position, (key, label, field_type, options) in enumerate(definitions, start=1)]

    def make_documents(*definitions: tuple[str, str]) -> list[ServiceDocumentRequirement]:
        return [ServiceDocumentRequirement(document_type=document_type, label=label, required=True, position=position) for position, (document_type, label) in enumerate(definitions, start=1)]

    exam_profile = ["full_name", "date_of_birth", "gender", "address", "category", "education"]
    identity_profile = ["full_name", "date_of_birth", "address"]
    exam_documents = (("PHOTOGRAPH", "Photograph"), ("SIGNATURE", "Signature"), ("MARKSHEET", "Class 12 Marksheet"))
    exam_fields = (("exam_city", "Preferred Exam City", ServiceFieldType.SELECT, ["New Delhi", "Mumbai", "Bengaluru"]),)
    catalog = [
        ("JEE_MAIN_001", "JEE Main", "National Testing Agency", "Engineering entrance examination.", ServiceType.EXAM, "Examinations", 100, exam_profile, exam_fields + (("paper_preference", "Paper Preference", ServiceFieldType.SELECT, ["Paper 1", "Paper 2"]),), exam_documents),
        ("NEET_UG_001", "NEET UG", "National Testing Agency", "Medical undergraduate entrance examination.", ServiceType.EXAM, "Examinations", 100, exam_profile, exam_fields, exam_documents),
        ("CUET_UG_001", "CUET UG", "National Testing Agency", "Common university undergraduate entrance examination.", ServiceType.EXAM, "Examinations", 100, exam_profile, exam_fields + (("subject_preference", "Subject Preference", ServiceFieldType.TEXT, None),), exam_documents),
        ("WBJEE_001", "WBJEE", "West Bengal Joint Entrance Examinations Board", "West Bengal engineering entrance examination.", ServiceType.EXAM, "Examinations", 100, exam_profile, exam_fields, exam_documents),
        ("SSC_CGL_001", "SSC CGL", "Staff Selection Commission", "Government recruitment examination.", ServiceType.RECRUITMENT, "Examinations", 100, exam_profile, exam_fields + (("post_preference", "Post Preference", ServiceFieldType.TEXT, None),), (("PHOTOGRAPH", "Photograph"), ("SIGNATURE", "Signature"), ("DEGREE_CERTIFICATE", "Degree Certificate"))),
        ("UPSC_CSE_001", "UPSC Civil Services Examination", "Union Public Service Commission", "Civil services recruitment examination.", ServiceType.RECRUITMENT, "Examinations", 100, exam_profile, exam_fields + (("service_preference", "Service Preference", ServiceFieldType.TEXT, None),), (("PHOTOGRAPH", "Photograph"), ("SIGNATURE", "Signature"), ("DEGREE_CERTIFICATE", "Degree Certificate"))),
        ("IBPS_PO_001", "IBPS PO", "Institute of Banking Personnel Selection", "Bank probationary officer recruitment examination.", ServiceType.RECRUITMENT, "Examinations", 100, exam_profile, exam_fields, (("PHOTOGRAPH", "Photograph"), ("SIGNATURE", "Signature"), ("DEGREE_CERTIFICATE", "Degree Certificate"))),
        ("PAN_CARD_001", "PAN Card", "Demo Tax Services", "Apply for or update PAN details.", ServiceType.LICENCE, "Identity & Licences", 110, identity_profile, (("application_type", "Application Type", ServiceFieldType.SELECT, ["New application", "Update details"]),), (("PHOTOGRAPH", "Photograph"), ("IDENTITY_DOCUMENT", "Identity Document"))),
        ("VOTER_ID_001", "Voter ID", "Demo Electoral Services", "Apply for voter registration or update voter information.", ServiceType.LICENCE, "Identity & Licences", 0, identity_profile, (("registration_type", "Registration Type", ServiceFieldType.SELECT, ["New registration", "Update information"]),), (("PHOTOGRAPH", "Photograph"), ("IDENTITY_DOCUMENT", "Identity Document"))),
        ("PASSPORT_001", "Passport", "Demo Passport Services", "Apply for passport-related services.", ServiceType.LICENCE, "Identity & Licences", 500, identity_profile, (("application_type", "Application Type", ServiceFieldType.SELECT, ["New passport", "Reissue passport"]),), (("PHOTOGRAPH", "Photograph"), ("IDENTITY_DOCUMENT", "Identity Document"))),
        ("NATIONAL_SCHOLARSHIP_001", "National Scholarship", "Education Support Department", "Financial support for eligible students.", ServiceType.SCHOLARSHIP, "Education & Scholarships", 0, exam_profile, (("course", "Current Course", ServiceFieldType.TEXT, None), ("academic_year", "Academic Year", ServiceFieldType.SELECT, ["2026-27", "2027-28"])), (("INCOME_CERTIFICATE", "Income Certificate"), ("MARKSHEET", "Marksheet"))),
        ("STATE_MERIT_SCHOLARSHIP_001", "State Merit Scholarship", "State Education Department", "Merit-based financial support for students.", ServiceType.SCHOLARSHIP, "Education & Scholarships", 0, exam_profile, (("course", "Current Course", ServiceFieldType.TEXT, None), ("institution", "Institution", ServiceFieldType.TEXT, None)), (("MARKSHEET", "Marksheet"),)),
        ("HIGHER_EDUCATION_SCHOLARSHIP_001", "Higher Education Scholarship", "Higher Education Department", "Support for students pursuing higher education.", ServiceType.SCHOLARSHIP, "Education & Scholarships", 0, exam_profile, (("course", "Current Course", ServiceFieldType.TEXT, None), ("institution", "Institution", ServiceFieldType.TEXT, None)), (("INCOME_CERTIFICATE", "Income Certificate"), ("MARKSHEET", "Marksheet"))),
        ("PM_KISAN_001", "PM-KISAN", "Demo Agriculture Services", "Farmer income-support scheme application demo.", ServiceType.SCHEME, "Government Schemes", 0, ["full_name", "address"], (("farmer_declaration", "Farmer Declaration", ServiceFieldType.CHECKBOX, None),), (("IDENTITY_DOCUMENT", "Identity Document"), ("OTHER", "Land or Supporting Document"))),
        ("AYUSHMAN_BHARAT_001", "Ayushman Bharat", "Demo Health Benefits Services", "Health-benefit enrollment application demo.", ServiceType.SCHEME, "Government Schemes", 0, identity_profile, (("household_size", "Household Size", ServiceFieldType.NUMBER, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
        ("PMAY_001", "PMAY", "Demo Housing Services", "Housing assistance scheme application demo.", ServiceType.SCHEME, "Government Schemes", 0, ["full_name", "address"], (("housing_need", "Housing Need", ServiceFieldType.TEXTAREA, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
        ("E_SHRAM_001", "e-Shram Registration", "Demo Labour Services", "Worker registration for social-security schemes demo.", ServiceType.SCHEME, "Government Schemes", 0, ["full_name", "date_of_birth", "address"], (("occupation", "Occupation", ServiceFieldType.TEXT, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
        ("INCOME_CERTIFICATE_001", "Income Certificate", "Demo Certificate Services", "Apply for an income certificate.", ServiceType.CERTIFICATE, "Certificates", 20, ["full_name", "address"], (("certificate_purpose", "Certificate Purpose", ServiceFieldType.TEXT, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
        ("CASTE_CERTIFICATE_001", "Caste Certificate", "Demo Certificate Services", "Apply for a caste certificate.", ServiceType.CERTIFICATE, "Certificates", 20, ["full_name", "address", "category"], (("certificate_purpose", "Certificate Purpose", ServiceFieldType.TEXT, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
        ("DOMICILE_CERTIFICATE_001", "Domicile Certificate", "Demo Certificate Services", "Apply for a domicile certificate.", ServiceType.CERTIFICATE, "Certificates", 20, ["full_name", "address"], (("certificate_purpose", "Certificate Purpose", ServiceFieldType.TEXT, None),), (("IDENTITY_DOCUMENT", "Identity Document"),)),
    ]
    for service_id, name, department, description, service_type, category, fee, profile_fields, service_fields, service_documents in catalog:
        if service_id not in existing_ids:
            db.add(Service(id=service_id, name=name, department=department, description=description, service_type=service_type, category=category, status=ServiceStatus.OPEN, fee=fee, currency="INR", instructions=None, required_profile_fields=profile_fields, fields=make_fields(*service_fields), document_requirements=make_documents(*service_documents)))
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
            "Examinations",
        ),
        "SCHOLARSHIP_001": (
            "Post-Matric Scholarship",
            "Education Support Department",
            "Financial assistance for eligible students pursuing post-matric education.",
            "Education & Scholarships",
        ),
        "DRIVING_LICENCE_001": (
            "Driving Licence Application",
            "Transport Department",
            "Apply for learner, permanent, renewal and vehicle-class driving licence services.",
            "Identity & Licences",
        ),
    }
    for service_id, (name, department, description, category) in service_copy.items():
        service = services.get(service_id)
        if service is not None:
            service.name = name
            service.department = department
            service.description = description
            service.category = category
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
        "MARKSHEET": "Class 12 Marksheet",
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
