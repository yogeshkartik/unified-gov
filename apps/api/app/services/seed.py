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


def seed_demo_citizen(db: Session) -> None:
    """Create only synthetic, explicitly demo-labelled citizen data."""
    if db.scalar(select(User).where(User.email == DEMO_USER_EMAIL)) is not None:
        return

    user = User(email=DEMO_USER_EMAIL, mobile="9000000000", auth_state="DEMO")
    profile = Profile(
        user=user,
        full_name="Rahul Kumar",
        date_of_birth=date(2005, 3, 15),
        gender="MALE",
        nationality="Indian",
        father_name="Demo Parent One",
        mother_name="Demo Parent Two",
        mobile="9000000000",
        email=DEMO_USER_EMAIL,
        category="GENERAL",
        disability_status="NONE",
    )
    user.addresses.append(
        Address(
            type=AddressType.PERMANENT,
            line1="42 Demo Street",
            line2=None,
            city="Sample City",
            district="Sample District",
            state="Demo State",
            pincode="000000",
        )
    )
    marksheet = Document(
        name="Class 12 Marksheet — Synthetic Demo",
        document_type="12TH_MARKSHEET",
        source=DocumentSource.PROFILE_UPLOAD,
        storage_key="synthetic/class-12-marksheet.pdf",
    )
    user.documents.extend(
        [
            marksheet,
            Document(
                name="Photograph — Synthetic Demo",
                document_type="PHOTOGRAPH",
                source=DocumentSource.PROFILE_UPLOAD,
                storage_key="synthetic/photograph.png",
            ),
        ]
    )
    user.education_records.append(
        Education(
            level=EducationLevel.TWELFTH,
            board_or_university="Demo State Board",
            institution="Sample Senior Secondary School",
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
        return

    recruitment_exam = Service(
        id="RECRUITMENT_EXAM_001",
        name="Government Recruitment Exam — Demo",
        department="Demo Public Recruitment Department",
        description="Synthetic demo recruitment examination for the hackathon prototype.",
        service_type=ServiceType.RECRUITMENT,
        category="Recruitment",
        status=ServiceStatus.OPEN,
        fee=100,
        currency="INR",
        instructions="This is a mock service. Do not provide real personal or payment information.",
        required_profile_fields=["full_name", "date_of_birth", "gender", "address", "category", "education"],
        fields=[
            ServiceField(
                key="exam_city",
                label="Preferred Exam City",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=["Sample City", "Demo Nagar", "Prototype Town"],
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
        name="Post-Matric Scholarship — Demo",
        department="Demo Education Support Department",
        description="Synthetic post-matric scholarship service for the hackathon prototype.",
        service_type=ServiceType.SCHOLARSHIP,
        category="Education",
        status=ServiceStatus.OPEN,
        fee=0,
        currency="INR",
        instructions="This is a mock service. All documents and information are synthetic.",
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
        name="Driving Licence Application — Demo",
        department="Demo Transport Department",
        description="Synthetic driving licence application for the hackathon prototype.",
        service_type=ServiceType.LICENCE,
        category="Transport",
        status=ServiceStatus.OPEN,
        fee=200,
        currency="INR",
        instructions="This is a mock service. It is not connected to any transport authority.",
        required_profile_fields=["full_name", "date_of_birth", "address"],
        fields=[
            ServiceField(
                key="licence_type",
                label="Licence Type",
                field_type=ServiceFieldType.RADIO,
                required=True,
                options=["Learner Licence", "Permanent Licence"],
                position=1,
            ),
            ServiceField(
                key="vehicle_class",
                label="Vehicle Class",
                field_type=ServiceFieldType.SELECT,
                required=True,
                options=["Two Wheeler", "Light Motor Vehicle"],
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
