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

export interface GovernmentService {
  id: string;
  name: string;
  department: string;
  description: string;
  service_type: string;
  category: string;
  status: string;
  fee: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "TEXTAREA"
  | "FILE";

export interface ServiceField {
  id: string;
  key: string;
  label: string;
  field_type: ServiceFieldType;
  required: boolean;
  options: string[] | null;
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
