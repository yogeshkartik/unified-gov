import type { Language } from "@/components/providers/citizen-preferences";
import type { GovernmentService, GovernmentServiceDetail } from "@/src/types";

type ServiceCopy = { name: string; department: string; description: string };

const hindiServices: Record<string, ServiceCopy> = {
  RECRUITMENT_EXAM_001: { name: "सरकारी भर्ती परीक्षा", department: "सार्वजनिक भर्ती विभाग", description: "खुली सरकारी भर्ती परीक्षाओं के लिए आवेदन करें और अपना आवेदन ट्रैक करें।" },
  SCHOLARSHIP_001: { name: "पोस्ट-मैट्रिक छात्रवृत्ति", department: "शिक्षा सहायता विभाग", description: "पोस्ट-मैट्रिक शिक्षा प्राप्त कर रहे पात्र विद्यार्थियों के लिए वित्तीय सहायता।" },
  DRIVING_LICENCE_001: { name: "ड्राइविंग लाइसेंस आवेदन", department: "परिवहन विभाग", description: "लर्नर, स्थायी, नवीनीकरण और वाहन-श्रेणी ड्राइविंग लाइसेंस सेवाओं के लिए आवेदन करें।" },
  JEE_MAIN_001: { name: "जेईई मेन", department: "राष्ट्रीय परीक्षा एजेंसी", description: "इंजीनियरिंग प्रवेश परीक्षा।" },
  NEET_UG_001: { name: "नीट यूजी", department: "राष्ट्रीय परीक्षा एजेंसी", description: "स्नातक चिकित्सा प्रवेश परीक्षा।" },
  CUET_UG_001: { name: "सीयूईटी यूजी", department: "राष्ट्रीय परीक्षा एजेंसी", description: "सामान्य विश्वविद्यालय स्नातक प्रवेश परीक्षा।" },
  WBJEE_001: { name: "डब्ल्यूबीजेईई", department: "पश्चिम बंगाल संयुक्त प्रवेश परीक्षा बोर्ड", description: "पश्चिम बंगाल इंजीनियरिंग प्रवेश परीक्षा।" },
  SSC_CGL_001: { name: "एसएससी सीजीएल", department: "कर्मचारी चयन आयोग", description: "सरकारी भर्ती परीक्षा।" },
  UPSC_CSE_001: { name: "UPSC सिविल सेवा परीक्षा", department: "संघ लोक सेवा आयोग", description: "सिविल सेवा भर्ती परीक्षा।" },
  IBPS_PO_001: { name: "आईबीपीएस पीओ", department: "बैंकिंग कार्मिक चयन संस्थान", description: "बैंक परिवीक्षाधीन अधिकारी भर्ती परीक्षा।" },
  PAN_CARD_001: { name: "पैन कार्ड", department: "डेमो कर सेवाएँ", description: "PAN विवरण के लिए आवेदन या अपडेट करें।" },
  VOTER_ID_001: { name: "मतदाता पहचान पत्र", department: "डेमो निर्वाचन सेवाएँ", description: "मतदाता पंजीकरण या मतदाता जानकारी अपडेट करने के लिए आवेदन करें।" },
  PASSPORT_001: { name: "पासपोर्ट", department: "डेमो पासपोर्ट सेवाएँ", description: "पासपोर्ट संबंधी सेवाओं के लिए आवेदन करें।" },
  NATIONAL_SCHOLARSHIP_001: { name: "राष्ट्रीय छात्रवृत्ति", department: "शिक्षा सहायता विभाग", description: "पात्र विद्यार्थियों के लिए वित्तीय सहायता।" },
  STATE_MERIT_SCHOLARSHIP_001: { name: "राज्य मेधा छात्रवृत्ति", department: "राज्य शिक्षा विभाग", description: "विद्यार्थियों के लिए योग्यता-आधारित वित्तीय सहायता।" },
  HIGHER_EDUCATION_SCHOLARSHIP_001: { name: "उच्च शिक्षा छात्रवृत्ति", department: "उच्च शिक्षा विभाग", description: "उच्च शिक्षा प्राप्त कर रहे विद्यार्थियों के लिए सहायता।" },
  PM_KISAN_001: { name: "पीएम-किसान", department: "डेमो कृषि सेवाएँ", description: "किसान आय-सहायता योजना आवेदन डेमो।" },
  AYUSHMAN_BHARAT_001: { name: "आयुष्मान भारत", department: "डेमो स्वास्थ्य लाभ सेवाएँ", description: "स्वास्थ्य-लाभ नामांकन आवेदन डेमो।" },
  PMAY_001: { name: "पीएमएवाई", department: "डेमो आवास सेवाएँ", description: "आवास सहायता योजना आवेदन डेमो।" },
  E_SHRAM_001: { name: "ई-श्रम पंजीकरण", department: "डेमो श्रम सेवाएँ", description: "सामाजिक सुरक्षा योजनाओं के लिए श्रमिक पंजीकरण डेमो।" },
  INCOME_CERTIFICATE_001: { name: "आय प्रमाण पत्र", department: "डेमो प्रमाण पत्र सेवाएँ", description: "आय प्रमाण पत्र के लिए आवेदन करें।" },
  CASTE_CERTIFICATE_001: { name: "जाति प्रमाण पत्र", department: "डेमो प्रमाण पत्र सेवाएँ", description: "जाति प्रमाण पत्र के लिए आवेदन करें।" },
  DOMICILE_CERTIFICATE_001: { name: "निवास प्रमाण पत्र", department: "डेमो प्रमाण पत्र सेवाएँ", description: "निवास प्रमाण पत्र के लिए आवेदन करें।" }
};

const hindiCategories: Record<string, string> = {
  "Examinations": "परीक्षाएँ",
  "Identity & Licences": "पहचान और लाइसेंस",
  "Education & Scholarships": "शिक्षा और छात्रवृत्तियाँ",
  "Government Schemes": "सरकारी योजनाएँ",
  "Certificates": "प्रमाण पत्र"
};

const hindiOrbitServiceNames: Record<string, string> = {
  JEE_MAIN_001: "जेईई मेन", NEET_UG_001: "नीट यूजी", CUET_UG_001: "सीयूईटी यूजी", SSC_CGL_001: "एसएससी सीजीएल", UPSC_CSE_001: "UPSC",
  DRIVING_LICENCE_001: "ड्राइविंग लाइसेंस", PASSPORT_001: "पासपोर्ट", PAN_CARD_001: "पैन कार्ड", VOTER_ID_001: "मतदाता पहचान पत्र",
  PM_KISAN_001: "पीएम-किसान", PMAY_001: "पीएमएवाई", E_SHRAM_001: "ई-श्रम", AYUSHMAN_BHARAT_001: "आयुष्मान भारत",
  INCOME_CERTIFICATE_001: "आय प्रमाण पत्र", CASTE_CERTIFICATE_001: "जाति प्रमाण पत्र", DOMICILE_CERTIFICATE_001: "निवास प्रमाण पत्र", NATIONAL_SCHOLARSHIP_001: "छात्रवृत्ति"
};

const hindiFields: Record<string, string> = {
  exam_city: "पसंदीदा परीक्षा शहर", post_preference: "पद वरीयता", course: "वर्तमान पाठ्यक्रम", institution: "संस्थान", academic_year: "शैक्षणिक वर्ष", licence_type: "आवेदन प्रकार", vehicle_class: "वाहन श्रेणी", paper_preference: "पेपर वरीयता", subject_preference: "विषय वरीयता", service_preference: "सेवा वरीयता", application_type: "आवेदन प्रकार", registration_type: "पंजीकरण प्रकार", farmer_declaration: "किसान घोषणा", household_size: "परिवार के सदस्यों की संख्या", housing_need: "आवास आवश्यकता", occupation: "व्यवसाय", certificate_purpose: "प्रमाण पत्र का उद्देश्य"
};

const hindiDocuments: Record<string, string> = {
  PHOTOGRAPH: "फोटो", SIGNATURE: "हस्ताक्षर", DEGREE_CERTIFICATE: "डिग्री प्रमाण पत्र", IDENTITY_DOCUMENT: "पहचान दस्तावेज़", INCOME_CERTIFICATE: "आय प्रमाण पत्र", MARKSHEET: "अंकपत्र", OTHER: "भूमि या सहायक दस्तावेज़"
};

const hindiProfileFields: Record<string, string> = {
  full_name: "पूरा नाम", date_of_birth: "जन्म तिथि", gender: "लिंग", address: "पता", category: "श्रेणी", education: "शिक्षा"
};

const hindiOptions: Record<string, string> = {
  "New Delhi": "नई दिल्ली", Mumbai: "मुंबई", Bengaluru: "बेंगलुरु", "Paper 1": "पेपर 1", "Paper 2": "पेपर 2",
  "New application": "नया आवेदन", "Update details": "विवरण अपडेट करें", "New registration": "नया पंजीकरण", "Update information": "जानकारी अपडेट करें", "New passport": "नया पासपोर्ट", "Reissue passport": "पासपोर्ट पुनः जारी करें",
  "Learner's Licence": "लर्नर लाइसेंस", "Permanent Driving Licence": "स्थायी ड्राइविंग लाइसेंस", "Add Vehicle Class to Existing Licence": "मौजूदा लाइसेंस में वाहन श्रेणी जोड़ें", "Renew Driving Licence": "ड्राइविंग लाइसेंस नवीनीकरण", "Duplicate Driving Licence": "डुप्लिकेट ड्राइविंग लाइसेंस",
  "MCWOG — Motorcycle without gear": "MCWOG — बिना गियर मोटरसाइकिल", "MCWG — Motorcycle with gear": "MCWG — गियर वाली मोटरसाइकिल", "LMV-NT — Light motor vehicle (non-transport)": "LMV-NT — हल्का मोटर वाहन (गैर-परिवहन)", "LMV-TR — Light motor vehicle (transport)": "LMV-TR — हल्का मोटर वाहन (परिवहन)", "Transport — Medium/heavy goods or passenger vehicle": "परिवहन — मध्यम/भारी माल या यात्री वाहन", "E-rickshaw": "ई-रिक्शा", "E-cart": "ई-कार्ट", "Road roller": "रोड रोलर", "Adapted vehicle for persons with disability": "दिव्यांग व्यक्ति के लिए अनुकूलित वाहन", "Other specified vehicle": "अन्य निर्दिष्ट वाहन"
};

export function localizeService<T extends GovernmentService>(service: T, language: Language): T {
  if (language === "en") return service;
  const copy = hindiServices[service.id];
  const localized = {
    ...service,
    name: copy?.name ?? service.name,
    department: copy?.department ?? service.department,
    description: copy?.description ?? service.description,
    category: hindiCategories[service.category] ?? service.category
  };
  if (!("fields" in service) || !("document_requirements" in service) || !("required_profile_fields" in service)) return localized;
  const detail = service as unknown as GovernmentServiceDetail;
  return {
    ...localized,
    required_profile_fields: detail.required_profile_fields,
    fields: detail.fields.map((field) => ({ ...field, label: hindiFields[field.key] ?? field.label, options: field.options?.map((option) => hindiOptions[option] ?? option) ?? null })),
    document_requirements: detail.document_requirements.map((document) => ({ ...document, label: hindiDocuments[document.document_type] ?? document.label }))
  } as T;
}

export function localizeServiceName(serviceId: string, fallback: string, language: Language) {
  return language === "hi" ? hindiServices[serviceId]?.name ?? fallback : fallback;
}

export function localizeServiceOrbitName(serviceId: string, fallback: string, language: Language) {
  return language === "hi" ? hindiOrbitServiceNames[serviceId] ?? localizeServiceName(serviceId, fallback, language) : fallback;
}

export function localizeDepartment(serviceId: string, fallback: string, language: Language) {
  return language === "hi" ? hindiServices[serviceId]?.department ?? fallback : fallback;
}

export function localizeProfileField(field: string, language: Language) {
  return language === "hi" ? hindiProfileFields[field] ?? field.replaceAll("_", " ") : field.replaceAll("_", " ");
}

export function localizeDocumentType(type: string, fallback: string, language: Language) {
  return language === "hi" ? hindiDocuments[type] ?? fallback : fallback;
}
