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
  addresses: Address[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  document_type: string;
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
