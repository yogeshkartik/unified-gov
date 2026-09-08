export type AddressType = "PERMANENT" | "CURRENT" | string;
export type DocumentSource = "PROFILE_UPLOAD" | "DIGILOCKER" | "SYSTEM_GENERATED" | string;
export type ApplicationStatus =
  | "DRAFT"
  | "ADDITIONAL_INFO_REQUIRED"
  | "CONSENT_REQUIRED"
  | "READY_FOR_REVIEW"
  | "PAYMENT_REQUIRED"
  | "SUBMITTED"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface Address {
  id: string;
  type: AddressType;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Education {
  id: string;
  user_id: string;
  level: string;
  board_or_university: string;
  institution: string;
  year: number;
  marks_or_percentage: string | null;
  certificate_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CitizenProfile {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string | null;
  nationality: string | null;
  father_name: string | null;
  mother_name: string | null;
  mobile: string | null;
  email: string | null;
  category: string | null;
  disability_status: string | null;
  alternate_mobile: string | null;
  marital_status: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  ews_status: string | null;
  ex_serviceman_status: string | null;
  minority_status: string | null;
  highest_qualification: string | null;
  current_education_status: string | null;
  current_course: string | null;
  current_institution: string | null;
  employment_status: string | null;
  occupation: string | null;
  annual_family_income_range: string | null;
  preferred_language: string | null;
  current_address_same_as_permanent: boolean;
  addresses: Address[];
  profile_photo: Document | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  document_type: string;
  display_name: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  source: DocumentSource;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  value: string;
  label: string;
}

export interface GovernmentService {
  id: string;
  name: string;
  department: string;
  description: string;
  service_type: string;
  service_key: string | null;
  category: string;
  government_level: "CENTRAL" | "STATE" | "UNION_TERRITORY" | "DISTRICT" | "LOCAL";
  jurisdiction_code: string;
  status: string;
  fee: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecommendedService {
  service: GovernmentService;
  recommendation_status: "RECOMMENDED";
  reasons: string[];
}

export type ServiceFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "textarea"
  | "file";

export interface ServiceField {
  id: string;
  key: string;
  label: string;
  field_type: ServiceFieldType;
  required: boolean;
  options: string[] | null;
  option_labels?: Record<string, string>;
  help_text: string | null;
  position: number;
}

export interface ServiceDocumentRequirement {
  id: string;
  document_type: string;
  label: string;
  required: boolean;
  position: number;
}

export interface GovernmentServiceDetail extends GovernmentService {
  required_profile_fields: string[];
  fields: ServiceField[];
  document_requirements: ServiceDocumentRequirement[];
}

export interface Application {
  id: string;
  user_id: string;
  service_id: string;
  status: ApplicationStatus;
  answers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEngineResponse extends Application {
  missing_profile_fields: string[];
  missing_documents: string[];
  missing_fields: string[];
}

export interface ApplicationSummary {
  id: string;
  service_id: string;
  service_name: string;
  department: string;
  status: ApplicationStatus;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  requires_action: boolean;
}

export type ApplicationPaymentStatus = "COMPLETED" | "FAILED" | "NOT_REQUIRED" | "PENDING";

export interface ApplicationDetail extends ApplicationEngineResponse {
  service_name: string;
  department: string;
  reference_number: string | null;
  submitted_at: string | null;
  consent_status: "GRANTED" | "DENIED" | "REVOKED" | null;
  payment_status: ApplicationPaymentStatus;
  submission_status: ApplicationStatus | null;
}

export interface Consent {
  id: string;
  user_id: string;
  application_id: string;
  service_id: string;
  data_requested: string[];
  document_types: string[];
  document_ids: string[];
  purpose: string;
  status: "GRANTED" | "DENIED" | "REVOKED";
  granted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationPreview {
  application_id: string;
  status: ApplicationStatus;
  profile: Record<string, unknown>;
  education: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  answers: Record<string, unknown>;
  service: Record<string, unknown>;
  fee: number;
  currency: string;
}

export interface PaymentResult {
  application_id: string;
  skipped: boolean;
  status: "SUCCESS" | "FAILED" | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
}

export interface SubmissionResult {
  application_id: string;
  government_reference_number: string;
  submission_timestamp: string;
  status: ApplicationStatus;
}

export interface MockDigiLockerDocument {
  id: string;
  name: string;
  document_type: string;
  issuer: string;
}

export interface ChatServiceCard {
  type: "SERVICE_CARD";
  service_id: string;
  name: string;
  description: string;
  department: string;
  category: string;
  government_level: string;
  jurisdiction_code: string;
  fee: number;
  currency: string;
}

export interface ProgressField { key: string; label: string; field_type: string; required: boolean; options: string[] | null; value?: unknown; }
export interface ProgressDocument { requirement_id: string; document_type: string; label: string; required: boolean; document_id: string | null; }
export interface ApplicationProgress {
  type: "APPLICATION_PROGRESS";
  application_id: string;
  service: { id: string; name: string; department: string };
  status: string;
  profile: { satisfied: string[]; missing: string[] };
  application_fields: { satisfied: ProgressField[]; missing: ProgressField[] };
  documents: { satisfied: ProgressDocument[]; missing: ProgressDocument[] };
  consent: { required: boolean; granted: boolean; status: string };
  payment: { required: boolean; amount: number; currency: string; status: string };
  submission_status: string;
  ready_for_review: boolean;
  ready_for_consent: boolean;
  ready_for_payment: boolean;
  ready_for_submission: boolean;
  next_stage: string;
}
export type ApplicationQuestionType = "TEXT_QUESTION" | "TEXTAREA_QUESTION" | "SELECT_QUESTION" | "BOOLEAN_QUESTION" | "NUMBER_QUESTION";
export interface ApplicationQuestion {
  type: ApplicationQuestionType;
  application_id: string;
  field: { key: string; label: string; field_type: string; required: boolean; options: string[] | null; help_text: string | null };
}
export interface DocumentRequest {
  type: "DOCUMENT_REQUEST";
  application_id: string;
  requirement: { id: string; label: string; document_type: string; required: boolean };
  existing_documents: Array<{ document_id: string; name: string; document_type: string; source: string }>;
  digilocker_options: Array<{ document_id: string; name: string; document_type: string; issuer: string }>;
  upload_allowed: boolean;
}
export interface ApplicationDocumentActionResponse {
  attached_document: { document_id: string; name: string; document_type: string; source: string };
  progress: ApplicationProgress;
  next_document: DocumentRequest | null;
}
export interface ReviewValue { key: string; label: string; value: unknown; field_type: string; options: string[] | null; }
export interface ReviewDocument { requirement_id: string; label: string; document_type: string; name: string; source: string; }
export interface ApplicationReview {
  type: "REVIEW_CARD";
  application_id: string;
  service: { id: string; name: string; department: string };
  applicant_information: ReviewValue[];
  application_details: ReviewValue[];
  documents: ReviewDocument[];
  payment: { required: boolean; amount: number; currency: string; status: string };
  consent: { granted: boolean; status: string };
}
export interface ConsentCard {
  type: "CONSENT_CARD";
  application_id: string;
  purpose: string;
  data_categories: string[];
  document_types: string[];
  consent_text_key: "APPLICATION_PROCESSING_CONSENT";
}
export interface ApplicationReviewResponse { review: ApplicationReview; consent_card: ConsentCard | null; }
export interface GrantChatConsentResponse { progress: ApplicationProgress; review: ApplicationReview; }
export interface PaymentCard {
  type: "PAYMENT_CARD";
  application_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  demo: true;
  transaction_reference: string | null;
  completed_at: string | null;
}
export interface SubmissionConfirmation { type: "SUBMISSION_CONFIRMATION"; application_id: string; service_name: string; }
export interface SubmissionSuccess { type: "SUBMISSION_SUCCESS"; application_id: string; service_name: string; reference_number: string; submitted_at: string; status: string; }
export interface TransactionComponentsResponse { payment_card: PaymentCard | null; submission_confirmation: SubmissionConfirmation | null; submission_success: SubmissionSuccess | null; }
export interface PayChatApplicationResponse { payment: PaymentResult; payment_card: PaymentCard; progress: ApplicationProgress; submission_confirmation: SubmissionConfirmation | null; }
export interface SubmitChatApplicationResponse { progress: ApplicationProgress; success: SubmissionSuccess; }
export type ChatComponent = ChatServiceCard | ApplicationProgress | ApplicationQuestion | DocumentRequest | ApplicationReview | ConsentCard | PaymentCard | SubmissionConfirmation | SubmissionSuccess;
export interface ChatResponse { message: string; components: ChatComponent[]; }
export interface StartApplicationResponse { result: "CREATED" | "RESUMED"; application_id: string; progress: ApplicationProgress; next_question: ApplicationQuestion | null; next_document: DocumentRequest | null; }
export interface SetApplicationFieldResponse { saved_field_key: string; saved_value: unknown; progress: ApplicationProgress; next_question: ApplicationQuestion | null; next_document: DocumentRequest | null; }

export interface CitizenApplicationSummary {
  id: string;
  service_id: string;
  service_name: string;
  status: ApplicationStatus;
  fee: number;
  currency: string;
  created_at: string;
  government_reference_number?: string;
}
