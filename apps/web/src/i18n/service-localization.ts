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

const marathiServices: Record<string, ServiceCopy> = {
  RECRUITMENT_EXAM_001: { name: "सरकारी भरती परीक्षा", department: "सार्वजनिक भरती विभाग", description: "खुल्या सरकारी भरती परीक्षांसाठी अर्ज करा आणि अर्जाचा मागोवा घ्या." },
  SCHOLARSHIP_001: { name: "मॅट्रिकोत्तर शिष्यवृत्ती", department: "शिक्षण सहाय्य विभाग", description: "मॅट्रिकोत्तर शिक्षण घेणाऱ्या पात्र विद्यार्थ्यांसाठी आर्थिक मदत." },
  DRIVING_LICENCE_001: { name: "वाहनचालक परवाना अर्ज", department: "परिवहन विभाग", description: "शिकाऊ, कायमस्वरूपी, नूतनीकरण आणि वाहन-वर्ग परवाना सेवांसाठी अर्ज करा." },
  JEE_MAIN_001: { name: "JEE Main", department: "राष्ट्रीय परीक्षा संस्था", description: "अभियांत्रिकी प्रवेश परीक्षा." },
  NEET_UG_001: { name: "NEET UG", department: "राष्ट्रीय परीक्षा संस्था", description: "पदवीपूर्व वैद्यकीय प्रवेश परीक्षा." },
  CUET_UG_001: { name: "CUET UG", department: "राष्ट्रीय परीक्षा संस्था", description: "सामायिक विद्यापीठ पदवीपूर्व प्रवेश परीक्षा." },
  WBJEE_001: { name: "WBJEE", department: "पश्चिम बंगाल संयुक्त प्रवेश परीक्षा मंडळ", description: "पश्चिम बंगाल अभियांत्रिकी प्रवेश परीक्षा." },
  SSC_CGL_001: { name: "SSC CGL", department: "कर्मचारी निवड आयोग", description: "सरकारी भरती परीक्षा." },
  UPSC_CSE_001: { name: "UPSC नागरी सेवा परीक्षा", department: "संघ लोकसेवा आयोग", description: "नागरी सेवा भरती परीक्षा." },
  IBPS_PO_001: { name: "IBPS PO", department: "बँकिंग कर्मचारी निवड संस्था", description: "बँक परिविक्षाधीन अधिकारी भरती परीक्षा." },
  PAN_CARD_001: { name: "PAN कार्ड", department: "नमुना कर सेवा", description: "PAN तपशीलांसाठी अर्ज करा किंवा ते अद्ययावत करा." },
  VOTER_ID_001: { name: "मतदार ओळखपत्र", department: "नमुना निवडणूक सेवा", description: "मतदार नोंदणी किंवा मतदार माहिती अद्ययावत करण्यासाठी अर्ज करा." },
  PASSPORT_001: { name: "पासपोर्ट", department: "नमुना पासपोर्ट सेवा", description: "पासपोर्टशी संबंधित सेवांसाठी अर्ज करा." },
  NATIONAL_SCHOLARSHIP_001: { name: "राष्ट्रीय शिष्यवृत्ती", department: "शिक्षण सहाय्य विभाग", description: "पात्र विद्यार्थ्यांसाठी आर्थिक मदत." },
  STATE_MERIT_SCHOLARSHIP_001: { name: "राज्य गुणवत्ता शिष्यवृत्ती", department: "राज्य शिक्षण विभाग", description: "विद्यार्थ्यांसाठी गुणवत्तेवर आधारित आर्थिक मदत." },
  HIGHER_EDUCATION_SCHOLARSHIP_001: { name: "उच्च शिक्षण शिष्यवृत्ती", department: "उच्च शिक्षण विभाग", description: "उच्च शिक्षण घेणाऱ्या विद्यार्थ्यांसाठी मदत." },
  PM_KISAN_001: { name: "PM-KISAN", department: "नमुना कृषी सेवा", description: "शेतकरी उत्पन्न सहाय्य योजनेचा नमुना अर्ज." },
  AYUSHMAN_BHARAT_001: { name: "आयुष्मान भारत", department: "नमुना आरोग्य लाभ सेवा", description: "आरोग्य लाभ नोंदणीचा नमुना अर्ज." },
  PMAY_001: { name: "PMAY गृहनिर्माण सहाय्य", department: "नमुना गृहनिर्माण सेवा", description: "गृहनिर्माण सहाय्य योजनेचा नमुना अर्ज." },
  E_SHRAM_001: { name: "ई-श्रम नोंदणी", department: "नमुना कामगार सेवा", description: "सामाजिक सुरक्षा योजनांसाठी कामगार नोंदणीचा नमुना." },
  INCOME_CERTIFICATE_001: { name: "उत्पन्न प्रमाणपत्र", department: "नमुना प्रमाणपत्र सेवा", description: "उत्पन्न प्रमाणपत्रासाठी अर्ज करा." },
  CASTE_CERTIFICATE_001: { name: "जात प्रमाणपत्र", department: "नमुना प्रमाणपत्र सेवा", description: "जात प्रमाणपत्रासाठी अर्ज करा." },
  DOMICILE_CERTIFICATE_001: { name: "अधिवास प्रमाणपत्र", department: "नमुना प्रमाणपत्र सेवा", description: "अधिवास प्रमाणपत्रासाठी अर्ज करा." }
};

const hindiCategories: Record<string, string> = {
  "Examinations": "परीक्षाएँ",
  "Identity & Licences": "पहचान और लाइसेंस",
  "Education & Scholarships": "शिक्षा और छात्रवृत्तियाँ",
  "Government Schemes": "सरकारी योजनाएँ",
  "Certificates": "प्रमाण पत्र"
};

const marathiCategories: Record<string, string> = {
  Examinations: "परीक्षा", "Identity & Licences": "ओळख आणि परवाने", "Education & Scholarships": "शिक्षण आणि शिष्यवृत्ती", "Government Schemes": "सरकारी योजना", Certificates: "प्रमाणपत्रे"
};

const hindiOrbitServiceNames: Record<string, string> = {
  JEE_MAIN_001: "जेईई मेन", NEET_UG_001: "नीट यूजी", CUET_UG_001: "सीयूईटी यूजी", SSC_CGL_001: "एसएससी सीजीएल", UPSC_CSE_001: "UPSC",
  DRIVING_LICENCE_001: "ड्राइविंग लाइसेंस", PASSPORT_001: "पासपोर्ट", PAN_CARD_001: "पैन कार्ड", VOTER_ID_001: "मतदाता पहचान पत्र",
  PM_KISAN_001: "पीएम-किसान", PMAY_001: "पीएमएवाई", E_SHRAM_001: "ई-श्रम", AYUSHMAN_BHARAT_001: "आयुष्मान भारत",
  INCOME_CERTIFICATE_001: "आय प्रमाण पत्र", CASTE_CERTIFICATE_001: "जाति प्रमाण पत्र", DOMICILE_CERTIFICATE_001: "निवास प्रमाण पत्र", NATIONAL_SCHOLARSHIP_001: "छात्रवृत्ति"
};

const marathiOrbitServiceNames: Record<string, string> = {
  ...Object.fromEntries(Object.entries(marathiServices).map(([id, copy]) => [id, copy.name])),
  DRIVING_LICENCE_001: "वाहनचालक परवाना", UPSC_CSE_001: "UPSC", PMAY_001: "PMAY", NATIONAL_SCHOLARSHIP_001: "शिष्यवृत्ती"
};

const hindiFields: Record<string, string> = {
  exam_city: "पसंदीदा परीक्षा शहर", post_preference: "पद वरीयता", course: "वर्तमान पाठ्यक्रम", institution: "संस्थान", academic_year: "शैक्षणिक वर्ष", licence_type: "आवेदन प्रकार", vehicle_class: "वाहन श्रेणी", paper_preference: "पेपर वरीयता", subject_preference: "विषय वरीयता", service_preference: "सेवा वरीयता", application_type: "आवेदन प्रकार", registration_type: "पंजीकरण प्रकार", farmer_declaration: "किसान घोषणा", household_size: "परिवार के सदस्यों की संख्या", housing_need: "आवास आवश्यकता", occupation: "व्यवसाय", certificate_purpose: "प्रमाण पत्र का उद्देश्य"
};

const marathiFields: Record<string, string> = {
  exam_city: "पसंतीचे परीक्षा शहर", post_preference: "पदाची पसंती", course: "सध्याचा अभ्यासक्रम", institution: "संस्था", academic_year: "शैक्षणिक वर्ष", licence_type: "अर्जाचा प्रकार", vehicle_class: "वाहन वर्ग", paper_preference: "प्रश्नपत्रिकेची पसंती", subject_preference: "विषयाची पसंती", service_preference: "सेवेची पसंती", application_type: "अर्जाचा प्रकार", registration_type: "नोंदणीचा प्रकार", farmer_declaration: "शेतकरी घोषणापत्र", household_size: "कुटुंबातील सदस्यांची संख्या", housing_need: "निवासाची गरज", occupation: "व्यवसाय", certificate_purpose: "प्रमाणपत्राचा उद्देश"
};

const hindiDocuments: Record<string, string> = {
  PHOTOGRAPH: "फोटो", SIGNATURE: "हस्ताक्षर", DEGREE_CERTIFICATE: "डिग्री प्रमाण पत्र", IDENTITY_DOCUMENT: "पहचान दस्तावेज़", INCOME_CERTIFICATE: "आय प्रमाण पत्र", MARKSHEET: "अंकपत्र", OTHER: "भूमि या सहायक दस्तावेज़"
};

const marathiDocuments: Record<string, string> = {
  PHOTOGRAPH: "छायाचित्र", SIGNATURE: "स्वाक्षरी", DEGREE_CERTIFICATE: "पदवी प्रमाणपत्र", IDENTITY_DOCUMENT: "ओळख कागदपत्र", INCOME_CERTIFICATE: "उत्पन्न प्रमाणपत्र", MARKSHEET: "गुणपत्रिका", OTHER: "पूरक कागदपत्र"
};

const hindiProfileFields: Record<string, string> = {
  full_name: "पूरा नाम", date_of_birth: "जन्म तिथि", gender: "लिंग", nationality: "राष्ट्रीयता", marital_status: "वैवाहिक स्थिति", mobile: "प्राथमिक मोबाइल", alternate_mobile: "वैकल्पिक मोबाइल", email: "ईमेल पता", father_name: "पिता का नाम", mother_name: "माता का नाम", guardian_name: "अभिभावक का नाम", guardian_relationship: "अभिभावक से संबंध", category: "श्रेणी", ews_status: "EWS स्थिति", disability_status: "दिव्यांग व्यक्ति (PwD)", ex_serviceman_status: "पूर्व सैनिक स्थिति", minority_status: "अल्पसंख्यक स्थिति", highest_qualification: "उच्चतम योग्यता", current_education_status: "वर्तमान शिक्षा स्थिति", current_course: "वर्तमान पाठ्यक्रम", current_institution: "संस्थान", employment_status: "रोज़गार स्थिति", occupation: "व्यवसाय", annual_family_income_range: "वार्षिक पारिवारिक आय सीमा", preferred_language: "पसंदीदा भाषा", address: "पता"
};

const marathiProfileFields: Record<string, string> = {
  full_name: "पूर्ण नाव", date_of_birth: "जन्मतारीख", gender: "लिंग", nationality: "राष्ट्रीयत्व", marital_status: "वैवाहिक स्थिती", mobile: "मुख्य मोबाइल", alternate_mobile: "पर्यायी मोबाइल", email: "ईमेल पत्ता", father_name: "वडिलांचे नाव", mother_name: "आईचे नाव", guardian_name: "पालकाचे नाव", guardian_relationship: "पालकाशी नाते", category: "प्रवर्ग", ews_status: "EWS स्थिती", disability_status: "दिव्यांग स्थिती", ex_serviceman_status: "माजी सैनिक स्थिती", minority_status: "अल्पसंख्याक स्थिती", highest_qualification: "सर्वोच्च शैक्षणिक पात्रता", current_education_status: "सध्याची शैक्षणिक स्थिती", current_course: "सध्याचा अभ्यासक्रम", current_institution: "संस्था", employment_status: "रोजगार स्थिती", occupation: "व्यवसाय", annual_family_income_range: "वार्षिक कौटुंबिक उत्पन्न श्रेणी", preferred_language: "पसंतीची भाषा", address: "पत्ता", address_line1: "पत्ता ओळ 1", address_line2: "पत्ता ओळ 2", city: "गाव / शहर", district: "जिल्हा", state: "राज्य / केंद्रशासित प्रदेश", pincode: "पिन कोड", country: "देश"
};

const kannadaProfileFields: Record<string, string> = {
  full_name: "ಪೂರ್ಣ ಹೆಸರು", date_of_birth: "ಜನ್ಮ ದಿನಾಂಕ", gender: "ಲಿಂಗ", nationality: "ರಾಷ್ಟ್ರೀಯತೆ", marital_status: "ವೈವಾಹಿಕ ಸ್ಥಿತಿ", mobile: "ಪ್ರಾಥಮಿಕ ಮೊಬೈಲ್", alternate_mobile: "ಪರ್ಯಾಯ ಮೊಬೈಲ್", email: "ಇಮೇಲ್ ವಿಳಾಸ", father_name: "ತಂದೆಯ ಹೆಸರು", mother_name: "ತಾಯಿಯ ಹೆಸರು", guardian_name: "ಪೋಷಕರ ಹೆಸರು", guardian_relationship: "ಪೋಷಕರ ಸಂಬಂಧ", category: "ವರ್ಗ", ews_status: "EWS ಸ್ಥಿತಿ", disability_status: "ಅಂಗವೈಕಲ್ಯ ಸ್ಥಿತಿ", ex_serviceman_status: "ಮಾಜಿ ಸೈನಿಕ ಸ್ಥಿತಿ", minority_status: "ಅಲ್ಪಸಂಖ್ಯಾತ ಸ್ಥಿತಿ", highest_qualification: "ಅತ್ಯುನ್ನತ ವಿದ್ಯಾರ್ಹತೆ", current_education_status: "ಪ್ರಸ್ತುತ ಶಿಕ್ಷಣ ಸ್ಥಿತಿ", current_course: "ಪ್ರಸ್ತುತ ಕೋರ್ಸ್", current_institution: "ಸಂಸ್ಥೆ", employment_status: "ಉದ್ಯೋಗ ಸ್ಥಿತಿ", occupation: "ವೃತ್ತಿ", annual_family_income_range: "ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ ವ್ಯಾಪ್ತಿ", preferred_language: "ಆದ್ಯತೆಯ ಭಾಷೆ", address: "ವಿಳಾಸ"
};

const teluguProfileFields: Record<string, string> = {
  full_name: "పూర్తి పేరు", date_of_birth: "పుట్టిన తేదీ", gender: "లింగం", nationality: "జాతీయత", marital_status: "వైవాహిక స్థితి", mobile: "ప్రాథమిక మొబైల్", alternate_mobile: "ప్రత్యామ్నాయ మొబైల్", email: "ఇమెయిల్ చిరునామా", father_name: "తండ్రి పేరు", mother_name: "తల్లి పేరు", guardian_name: "సంరక్షకుడి పేరు", guardian_relationship: "సంరక్షకుడితో సంబంధం", category: "వర్గం", ews_status: "EWS స్థితి", disability_status: "వైకల్య స్థితి", ex_serviceman_status: "మాజీ సైనికుడి స్థితి", minority_status: "మైనారిటీ స్థితి", highest_qualification: "అత్యున్నత అర్హత", current_education_status: "ప్రస్తుత విద్యా స్థితి", current_course: "ప్రస్తుత కోర్సు", current_institution: "సంస్థ", employment_status: "ఉపాధి స్థితి", occupation: "వృత్తి", annual_family_income_range: "వార్షిక కుటుంబ ఆదాయ పరిధి", preferred_language: "ప్రాధాన్య భాష", address: "చిరునామా"
};

const bengaliProfileFields: Record<string, string> = {
  full_name: "পুরো নাম", date_of_birth: "জন্ম তারিখ", gender: "লিঙ্গ", nationality: "জাতীয়তা", marital_status: "বৈবাহিক অবস্থা", mobile: "প্রাথমিক মোবাইল", alternate_mobile: "বিকল্প মোবাইল", email: "ইমেল ঠিকানা", father_name: "বাবার নাম", mother_name: "মায়ের নাম", guardian_name: "অভিভাবকের নাম", guardian_relationship: "অভিভাবকের সঙ্গে সম্পর্ক", category: "বিভাগ", ews_status: "EWS অবস্থা", disability_status: "প্রতিবন্ধিতার অবস্থা", ex_serviceman_status: "প্রাক্তন সেনাসদস্যের অবস্থা", minority_status: "সংখ্যালঘু অবস্থা", highest_qualification: "সর্বোচ্চ যোগ্যতা", current_education_status: "বর্তমান শিক্ষার অবস্থা", current_course: "বর্তমান কোর্স", current_institution: "প্রতিষ্ঠান", employment_status: "কর্মসংস্থানের অবস্থা", occupation: "পেশা", annual_family_income_range: "বার্ষিক পারিবারিক আয়ের সীমা", preferred_language: "পছন্দের ভাষা", address: "ঠিকানা"
};

const tamilProfileFields: Record<string, string> = {
  full_name: "முழுப் பெயர்", date_of_birth: "பிறந்த தேதி", gender: "பாலினம்", nationality: "தேசியம்", marital_status: "திருமண நிலை", mobile: "முதன்மை மொபைல்", alternate_mobile: "மாற்று மொபைல்", email: "மின்னஞ்சல் முகவரி", father_name: "தந்தையின் பெயர்", mother_name: "தாயின் பெயர்", guardian_name: "பாதுகாவலரின் பெயர்", guardian_relationship: "பாதுகாவலருடனான உறவு", category: "வகை", ews_status: "EWS நிலை", disability_status: "மாற்றுத்திறன் நிலை", ex_serviceman_status: "முன்னாள் ராணுவ வீரர் நிலை", minority_status: "சிறுபான்மை நிலை", highest_qualification: "உயர்ந்த தகுதி", current_education_status: "தற்போதைய கல்வி நிலை", current_course: "தற்போதைய பாடநெறி", current_institution: "நிறுவனம்", employment_status: "வேலைவாய்ப்பு நிலை", occupation: "தொழில்", annual_family_income_range: "வருடாந்திர குடும்ப வருமான வரம்பு", preferred_language: "விருப்ப மொழி", address: "முகவரி"
};

const profileFieldsByLanguage: Partial<Record<Language, Record<string, string>>> = { hi: hindiProfileFields, mr: marathiProfileFields, kn: kannadaProfileFields, te: teluguProfileFields, bn: bengaliProfileFields, ta: tamilProfileFields };

const hindiOptions: Record<string, string> = {
  "New Delhi": "नई दिल्ली", Mumbai: "मुंबई", Bengaluru: "बेंगलुरु", "Paper 1": "पेपर 1", "Paper 2": "पेपर 2",
  "New application": "नया आवेदन", "Update details": "विवरण अपडेट करें", "New registration": "नया पंजीकरण", "Update information": "जानकारी अपडेट करें", "New passport": "नया पासपोर्ट", "Reissue passport": "पासपोर्ट पुनः जारी करें",
  "Learner's Licence": "लर्नर लाइसेंस", "Permanent Driving Licence": "स्थायी ड्राइविंग लाइसेंस", "Add Vehicle Class to Existing Licence": "मौजूदा लाइसेंस में वाहन श्रेणी जोड़ें", "Renew Driving Licence": "ड्राइविंग लाइसेंस नवीनीकरण", "Duplicate Driving Licence": "डुप्लिकेट ड्राइविंग लाइसेंस",
  "MCWOG — Motorcycle without gear": "MCWOG — बिना गियर मोटरसाइकिल", "MCWG — Motorcycle with gear": "MCWG — गियर वाली मोटरसाइकिल", "LMV-NT — Light motor vehicle (non-transport)": "LMV-NT — हल्का मोटर वाहन (गैर-परिवहन)", "LMV-TR — Light motor vehicle (transport)": "LMV-TR — हल्का मोटर वाहन (परिवहन)", "Transport — Medium/heavy goods or passenger vehicle": "परिवहन — मध्यम/भारी माल या यात्री वाहन", "E-rickshaw": "ई-रिक्शा", "E-cart": "ई-कार्ट", "Road roller": "रोड रोलर", "Adapted vehicle for persons with disability": "दिव्यांग व्यक्ति के लिए अनुकूलित वाहन", "Other specified vehicle": "अन्य निर्दिष्ट वाहन"
};

const marathiOptions: Record<string, string> = {
  "New Delhi": "नवी दिल्ली", Mumbai: "मुंबई", Bengaluru: "बेंगळुरू", "Paper 1": "पेपर 1", "Paper 2": "पेपर 2",
  "New application": "नवीन अर्ज", "Update details": "तपशील अद्ययावत करा", "New registration": "नवीन नोंदणी", "Update information": "माहिती अद्ययावत करा", "New passport": "नवीन पासपोर्ट", "Reissue passport": "पासपोर्ट पुन्हा जारी करा",
  "Learner's Licence": "शिकाऊ परवाना", "Permanent Driving Licence": "कायमस्वरूपी वाहनचालक परवाना", "Add Vehicle Class to Existing Licence": "विद्यमान परवान्यात वाहन वर्ग जोडा", "Renew Driving Licence": "वाहनचालक परवान्याचे नूतनीकरण", "Duplicate Driving Licence": "दुय्यम वाहनचालक परवाना",
  "MCWOG — Motorcycle without gear": "MCWOG — गियर नसलेली मोटारसायकल", "MCWG — Motorcycle with gear": "MCWG — गियर असलेली मोटारसायकल", "LMV-NT — Light motor vehicle (non-transport)": "LMV-NT — हलके मोटार वाहन (बिगर-वाहतूक)", "LMV-TR — Light motor vehicle (transport)": "LMV-TR — हलके मोटार वाहन (वाहतूक)", "Transport — Medium/heavy goods or passenger vehicle": "वाहतूक — मध्यम/जड माल किंवा प्रवासी वाहन", "E-rickshaw": "ई-रिक्षा", "E-cart": "ई-कार्ट", "Road roller": "रोड रोलर", "Adapted vehicle for persons with disability": "दिव्यांग व्यक्तींसाठी अनुकूलित वाहन", "Other specified vehicle": "इतर निर्दिष्ट वाहन"
};

const regionalServiceNames: Partial<Record<Language, Record<string, string>>> = {
  kn: { RECRUITMENT_EXAM_001: "ಸರ್ಕಾರಿ ನೇಮಕಾತಿ ಪರೀಕ್ಷೆ", SCHOLARSHIP_001: "ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ", DRIVING_LICENCE_001: "ಚಾಲನಾ ಪರವಾನಗಿ ಅರ್ಜಿ", JEE_MAIN_001: "JEE Main", NEET_UG_001: "NEET UG", CUET_UG_001: "CUET UG", WBJEE_001: "WBJEE", SSC_CGL_001: "SSC CGL", UPSC_CSE_001: "UPSC ನಾಗರಿಕ ಸೇವಾ ಪರೀಕ್ಷೆ", IBPS_PO_001: "IBPS PO", PAN_CARD_001: "PAN ಕಾರ್ಡ್", VOTER_ID_001: "ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ", PASSPORT_001: "ಪಾಸ್‌ಪೋರ್ಟ್", NATIONAL_SCHOLARSHIP_001: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ", STATE_MERIT_SCHOLARSHIP_001: "ರಾಜ್ಯ ಪ್ರತಿಭಾ ವಿದ್ಯಾರ್ಥಿವೇತನ", HIGHER_EDUCATION_SCHOLARSHIP_001: "ಉನ್ನತ ಶಿಕ್ಷಣ ವಿದ್ಯಾರ್ಥಿವೇತನ", PM_KISAN_001: "PM-KISAN", AYUSHMAN_BHARAT_001: "ಆಯುಷ್ಮಾನ್ ಭಾರತ್", PMAY_001: "PMAY ವಸತಿ ನೆರವು", E_SHRAM_001: "ಇ-ಶ್ರಮ್ ನೋಂದಣಿ", INCOME_CERTIFICATE_001: "ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ", CASTE_CERTIFICATE_001: "ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರ", DOMICILE_CERTIFICATE_001: "ನಿವಾಸ ಪ್ರಮಾಣ ಪತ್ರ" },
  ta: { RECRUITMENT_EXAM_001: "அரசுப் பணியாளர் தேர்வு", SCHOLARSHIP_001: "மெட்ரிக் பிந்தைய உதவித்தொகை", DRIVING_LICENCE_001: "ஓட்டுநர் உரிம விண்ணப்பம்", JEE_MAIN_001: "JEE Main", NEET_UG_001: "NEET UG", CUET_UG_001: "CUET UG", WBJEE_001: "WBJEE", SSC_CGL_001: "SSC CGL", UPSC_CSE_001: "UPSC குடிமைப் பணித் தேர்வு", IBPS_PO_001: "IBPS PO", PAN_CARD_001: "PAN அட்டை", VOTER_ID_001: "வாக்காளர் அடையாள அட்டை", PASSPORT_001: "கடவுச்சீட்டு", NATIONAL_SCHOLARSHIP_001: "தேசிய உதவித்தொகை", STATE_MERIT_SCHOLARSHIP_001: "மாநில திறமை உதவித்தொகை", HIGHER_EDUCATION_SCHOLARSHIP_001: "உயர்கல்வி உதவித்தொகை", PM_KISAN_001: "PM-KISAN", AYUSHMAN_BHARAT_001: "ஆயுஷ்மான் பாரத்", PMAY_001: "PMAY வீட்டு உதவி", E_SHRAM_001: "இ-ஷ்ரம் பதிவு", INCOME_CERTIFICATE_001: "வருமானச் சான்றிதழ்", CASTE_CERTIFICATE_001: "சாதிச் சான்றிதழ்", DOMICILE_CERTIFICATE_001: "இருப்பிடச் சான்றிதழ்" },
  te: { RECRUITMENT_EXAM_001: "ప్రభుత్వ నియామక పరీక్ష", SCHOLARSHIP_001: "పోస్ట్-మెట్రిక్ ఉపకార వేతనం", DRIVING_LICENCE_001: "డ్రైవింగ్ లైసెన్స్ దరఖాస్తు", JEE_MAIN_001: "JEE Main", NEET_UG_001: "NEET UG", CUET_UG_001: "CUET UG", WBJEE_001: "WBJEE", SSC_CGL_001: "SSC CGL", UPSC_CSE_001: "UPSC సివిల్ సర్వీసెస్ పరీక్ష", IBPS_PO_001: "IBPS PO", PAN_CARD_001: "PAN కార్డు", VOTER_ID_001: "ఓటరు గుర్తింపు కార్డు", PASSPORT_001: "పాస్‌పోర్ట్", NATIONAL_SCHOLARSHIP_001: "జాతీయ ఉపకార వేతనం", STATE_MERIT_SCHOLARSHIP_001: "రాష్ట్ర ప్రతిభ ఉపకార వేతనం", HIGHER_EDUCATION_SCHOLARSHIP_001: "ఉన్నత విద్య ఉపకార వేతనం", PM_KISAN_001: "PM-KISAN", AYUSHMAN_BHARAT_001: "ఆయుష్మాన్ భారత్", PMAY_001: "PMAY గృహ సహాయం", E_SHRAM_001: "ఈ-శ్రమ్ నమోదు", INCOME_CERTIFICATE_001: "ఆదాయ ధృవీకరణ పత్రం", CASTE_CERTIFICATE_001: "కుల ధృవీకరణ పత్రం", DOMICILE_CERTIFICATE_001: "నివాస ధృవీకరణ పత్రం" },
  bn: { RECRUITMENT_EXAM_001: "সরকারি নিয়োগ পরীক্ষা", SCHOLARSHIP_001: "পোস্ট-ম্যাট্রিক বৃত্তি", DRIVING_LICENCE_001: "ড্রাইভিং লাইসেন্স আবেদন", JEE_MAIN_001: "JEE Main", NEET_UG_001: "NEET UG", CUET_UG_001: "CUET UG", WBJEE_001: "WBJEE", SSC_CGL_001: "SSC CGL", UPSC_CSE_001: "UPSC সিভিল সার্ভিস পরীক্ষা", IBPS_PO_001: "IBPS PO", PAN_CARD_001: "PAN কার্ড", VOTER_ID_001: "ভোটার পরিচয়পত্র", PASSPORT_001: "পাসপোর্ট", NATIONAL_SCHOLARSHIP_001: "জাতীয় বৃত্তি", STATE_MERIT_SCHOLARSHIP_001: "রাজ্য মেধা বৃত্তি", HIGHER_EDUCATION_SCHOLARSHIP_001: "উচ্চশিক্ষা বৃত্তি", PM_KISAN_001: "PM-KISAN", AYUSHMAN_BHARAT_001: "আয়ুষ্মান ভারত", PMAY_001: "PMAY আবাসন সহায়তা", E_SHRAM_001: "ই-শ্রম নিবন্ধন", INCOME_CERTIFICATE_001: "আয় শংসাপত্র", CASTE_CERTIFICATE_001: "জাতি শংসাপত্র", DOMICILE_CERTIFICATE_001: "বাসস্থান শংসাপত্র" }
};

const regionalCategories: Partial<Record<Language, Record<string, string>>> = {
  kn: { Examinations: "ಪರೀಕ್ಷೆಗಳು", "Identity & Licences": "ಗುರುತು ಮತ್ತು ಪರವಾನಗಿಗಳು", "Education & Scholarships": "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ", "Government Schemes": "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು", Certificates: "ಪ್ರಮಾಣ ಪತ್ರಗಳು" },
  ta: { Examinations: "தேர்வுகள்", "Identity & Licences": "அடையாளம் மற்றும் உரிமங்கள்", "Education & Scholarships": "கல்வி மற்றும் உதவித்தொகைகள்", "Government Schemes": "அரசுத் திட்டங்கள்", Certificates: "சான்றிதழ்கள்" },
  te: { Examinations: "పరీక్షలు", "Identity & Licences": "గుర్తింపు మరియు లైసెన్సులు", "Education & Scholarships": "విద్య మరియు ఉపకార వేతనాలు", "Government Schemes": "ప్రభుత్వ పథకాలు", Certificates: "ధృవీకరణ పత్రాలు" },
  bn: { Examinations: "পরীক্ষা", "Identity & Licences": "পরিচয় ও লাইসেন্স", "Education & Scholarships": "শিক্ষা ও বৃত্তি", "Government Schemes": "সরকারি প্রকল্প", Certificates: "শংসাপত্র" }
};

const regionalDescriptions: Partial<Record<Language, Record<string, string>>> = {
  kn: { Examinations: "ಈ ಪರೀಕ್ಷೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಅರ್ಜಿಯ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.", "Identity & Licences": "ಈ ಗುರುತು ಅಥವಾ ಪರವಾನಗಿ ಸೇವೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.", "Education & Scholarships": "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಶಿಕ್ಷಣ ಮತ್ತು ಹಣಕಾಸಿನ ನೆರವು.", "Government Schemes": "ಅರ್ಹ ನಾಗರಿಕರಿಗಾಗಿ ಸರ್ಕಾರಿ ಯೋಜನೆಯ ಪ್ರಾಯೋಗಿಕ ಸೇವೆ.", Certificates: "ಈ ಪ್ರಮಾಣ ಪತ್ರದ ವಿತರಣೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ." },
  ta: { Examinations: "இந்தத் தேர்வுக்கு விண்ணப்பித்து விண்ணப்ப நிலையைப் பார்க்கவும்.", "Identity & Licences": "இந்த அடையாள அல்லது உரிம சேவைக்கு விண்ணப்பிக்கவும்.", "Education & Scholarships": "மாணவர்களுக்கான கல்வி மற்றும் நிதி உதவி.", "Government Schemes": "தகுதியான குடிமக்களுக்கான அரசுத் திட்ட மாதிரி சேவை.", Certificates: "இந்தச் சான்றிதழை வழங்க விண்ணப்பிக்கவும்." },
  te: { Examinations: "ఈ పరీక్షకు దరఖాస్తు చేసి దరఖాస్తు స్థితిని చూడండి.", "Identity & Licences": "ఈ గుర్తింపు లేదా లైసెన్స్ సేవకు దరఖాస్తు చేయండి.", "Education & Scholarships": "విద్యార్థులకు విద్యా మరియు ఆర్థిక సహాయం.", "Government Schemes": "అర్హులైన పౌరుల కోసం ప్రభుత్వ పథకం నమూనా సేవ.", Certificates: "ఈ ధృవీకరణ పత్రం జారీ కోసం దరఖాస్తు చేయండి." },
  bn: { Examinations: "এই পরীক্ষার জন্য আবেদন করুন এবং আবেদনের অবস্থা দেখুন।", "Identity & Licences": "এই পরিচয় বা লাইসেন্স পরিষেবার জন্য আবেদন করুন।", "Education & Scholarships": "শিক্ষার্থীদের জন্য শিক্ষা ও আর্থিক সহায়তা।", "Government Schemes": "যোগ্য নাগরিকদের জন্য সরকারি প্রকল্পের নমুনা পরিষেবা।", Certificates: "এই শংসাপত্র জারির জন্য আবেদন করুন।" }
};

const regionalFields: Partial<Record<Language, Record<string, string>>> = {
  kn: { exam_city: "ಆದ್ಯತೆಯ ಪರೀಕ್ಷಾ ನಗರ", post_preference: "ಹುದ್ದೆಯ ಆದ್ಯತೆ", course: "ಪ್ರಸ್ತುತ ಕೋರ್ಸ್", institution: "ಸಂಸ್ಥೆ", academic_year: "ಶೈಕ್ಷಣಿಕ ವರ್ಷ", licence_type: "ಅರ್ಜಿಯ ವಿಧ", vehicle_class: "ವಾಹನ ವರ್ಗ", paper_preference: "ಪ್ರಶ್ನೆಪತ್ರದ ಆದ್ಯತೆ", subject_preference: "ವಿಷಯದ ಆದ್ಯತೆ", service_preference: "ಸೇವೆಯ ಆದ್ಯತೆ", application_type: "ಅರ್ಜಿಯ ವಿಧ", registration_type: "ನೋಂದಣಿ ವಿಧ", farmer_declaration: "ರೈತರ ಘೋಷಣೆ", household_size: "ಕುಟುಂಬದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ", housing_need: "ವಸತಿ ಅಗತ್ಯ", occupation: "ವೃತ್ತಿ", certificate_purpose: "ಪ್ರಮಾಣ ಪತ್ರದ ಉದ್ದೇಶ" },
  ta: { exam_city: "விருப்பத் தேர்வு நகரம்", post_preference: "பதவி விருப்பம்", course: "தற்போதைய பாடநெறி", institution: "நிறுவனம்", academic_year: "கல்வியாண்டு", licence_type: "விண்ணப்ப வகை", vehicle_class: "வாகன வகை", paper_preference: "தாள் விருப்பம்", application_type: "விண்ணப்ப வகை", registration_type: "பதிவு வகை", farmer_declaration: "விவசாயி உறுதிமொழி", household_size: "குடும்ப உறுப்பினர் எண்ணிக்கை", housing_need: "வீட்டு தேவை", occupation: "தொழில்", certificate_purpose: "சான்றிதழின் நோக்கம்" },
  te: { exam_city: "ప్రాధాన్య పరీక్ష నగరం", post_preference: "పోస్ట్ ప్రాధాన్యత", course: "ప్రస్తుత కోర్సు", institution: "సంస్థ", academic_year: "విద్యా సంవత్సరం", licence_type: "దరఖాస్తు రకం", vehicle_class: "వాహన తరగతి", paper_preference: "పేపర్ ప్రాధాన్యత", application_type: "దరఖాస్తు రకం", registration_type: "నమోదు రకం", farmer_declaration: "రైతు ప్రకటన", household_size: "కుటుంబ సభ్యుల సంఖ్య", housing_need: "గృహ అవసరం", occupation: "వృత్తి", certificate_purpose: "ధృవీకరణ పత్రం ఉద్దేశ్యం" },
  bn: { exam_city: "পছন্দের পরীক্ষার শহর", post_preference: "পদের পছন্দ", course: "বর্তমান কোর্স", institution: "প্রতিষ্ঠান", academic_year: "শিক্ষাবর্ষ", licence_type: "আবেদনের ধরন", vehicle_class: "যানের শ্রেণি", paper_preference: "পত্রের পছন্দ", application_type: "আবেদনের ধরন", registration_type: "নিবন্ধনের ধরন", farmer_declaration: "কৃষকের ঘোষণা", household_size: "পরিবারের সদস্য সংখ্যা", housing_need: "আবাসনের প্রয়োজন", occupation: "পেশা", certificate_purpose: "শংসাপত্রের উদ্দেশ্য" }
};

const regionalDocuments: Partial<Record<Language, Record<string, string>>> = { kn: { PHOTOGRAPH: "ಛಾಯಾಚಿತ್ರ", SIGNATURE: "ಸಹಿ", DEGREE_CERTIFICATE: "ಪದವಿ ಪ್ರಮಾಣ ಪತ್ರ", IDENTITY_DOCUMENT: "ಗುರುತಿನ ದಾಖಲೆ", INCOME_CERTIFICATE: "ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ", MARKSHEET: "ಅಂಕಪಟ್ಟಿ", OTHER: "ಪೂರಕ ದಾಖಲೆ" }, ta: { PHOTOGRAPH: "புகைப்படம்", SIGNATURE: "கையொப்பம்", DEGREE_CERTIFICATE: "பட்டச் சான்றிதழ்", IDENTITY_DOCUMENT: "அடையாள ஆவணம்", INCOME_CERTIFICATE: "வருமானச் சான்றிதழ்", MARKSHEET: "மதிப்பெண் பட்டியல்", OTHER: "ஆதார ஆவணம்" }, te: { PHOTOGRAPH: "ఫోటో", SIGNATURE: "సంతకం", DEGREE_CERTIFICATE: "డిగ్రీ ధృవీకరణ పత్రం", IDENTITY_DOCUMENT: "గుర్తింపు పత్రం", INCOME_CERTIFICATE: "ఆదాయ ధృవీకరణ పత్రం", MARKSHEET: "మార్కుల జాబితా", OTHER: "సహాయక పత్రం" }, bn: { PHOTOGRAPH: "ছবি", SIGNATURE: "স্বাক্ষর", DEGREE_CERTIFICATE: "ডিগ্রি শংসাপত্র", IDENTITY_DOCUMENT: "পরিচয় নথি", INCOME_CERTIFICATE: "আয় শংসাপত্র", MARKSHEET: "মার্কশিট", OTHER: "সহায়ক নথি" } };

const commonRegionalOptions: Partial<Record<Language, Record<string, string>>> = { kn: { "New Delhi": "ನವದೆಹಲಿ", Mumbai: "ಮುಂಬೈ", Bengaluru: "ಬೆಂಗಳೂರು", "Paper 1": "ಪೇಪರ್ 1", "Paper 2": "ಪೇಪರ್ 2", "2026-27": "2026-27", "2027-28": "2027-28" }, ta: { "New Delhi": "புது தில்லி", Mumbai: "மும்பை", Bengaluru: "பெங்களூரு", "Paper 1": "தாள் 1", "Paper 2": "தாள் 2" }, te: { "New Delhi": "న్యూఢిల్లీ", Mumbai: "ముంబై", Bengaluru: "బెంగళూరు", "Paper 1": "పేపర్ 1", "Paper 2": "పేపర్ 2" }, bn: { "New Delhi": "নয়াদিল্লি", Mumbai: "মুম্বই", Bengaluru: "বেঙ্গালুরু", "Paper 1": "পত্র 1", "Paper 2": "পত্র 2" } };

export function localizeService<T extends GovernmentService>(service: T, language: Language): T {
  if (language === "en") return service;
  const copy = ({ hi: hindiServices, mr: marathiServices } as Partial<Record<Language, Record<string, ServiceCopy>>>)[language]?.[service.id];
  const regionalName = regionalServiceNames[language]?.[service.id];
  const categoryCopy = ({ hi: hindiCategories, mr: marathiCategories } as Partial<Record<Language, Record<string, string>>>)[language] ?? regionalCategories[language];
  const category = categoryCopy?.[service.category] ?? service.category;
  const localized = {
    ...service,
    name: copy?.name ?? regionalName ?? service.name,
    department: copy?.department ?? service.department,
    description: copy?.description ?? regionalDescriptions[language]?.[service.category] ?? service.description,
    category
  };
  if (!("fields" in service) || !("document_requirements" in service) || !("required_profile_fields" in service)) return localized;
  const detail = service as unknown as GovernmentServiceDetail;
  return {
    ...localized,
    required_profile_fields: detail.required_profile_fields,
    fields: detail.fields.map((field) => {
      const optionCopy = ({ hi: hindiOptions, mr: marathiOptions } as Partial<Record<Language, Record<string, string>>>)[language] ?? commonRegionalOptions[language];
      const fieldCopy = ({ hi: hindiFields, mr: marathiFields } as Partial<Record<Language, Record<string, string>>>)[language] ?? regionalFields[language];
      return { ...field, label: fieldCopy?.[field.key] ?? field.label, option_labels: Object.fromEntries((field.options ?? []).map((option) => [option, optionCopy?.[option] ?? option])) };
    }),
    document_requirements: detail.document_requirements.map((document) => ({ ...document, label: (({ hi: hindiDocuments, mr: marathiDocuments } as Partial<Record<Language, Record<string, string>>>)[language] ?? regionalDocuments[language])?.[document.document_type] ?? document.label }))
  } as T;
}

export function localizeServiceName(serviceId: string, fallback: string, language: Language) {
  return ({ hi: hindiServices, mr: marathiServices } as Partial<Record<Language, Record<string, ServiceCopy>>>)[language]?.[serviceId]?.name ?? regionalServiceNames[language]?.[serviceId] ?? fallback;
}

export function localizeServiceOrbitName(serviceId: string, fallback: string, language: Language) {
  return ({ hi: hindiOrbitServiceNames, mr: marathiOrbitServiceNames } as Partial<Record<Language, Record<string, string>>>)[language]?.[serviceId] ?? localizeServiceName(serviceId, fallback, language);
}

export function localizeDepartment(serviceId: string, fallback: string, language: Language) {
  return ({ hi: hindiServices, mr: marathiServices } as Partial<Record<Language, Record<string, ServiceCopy>>>)[language]?.[serviceId]?.department ?? fallback;
}

export function localizeProfileField(field: string, language: Language) {
  return profileFieldsByLanguage[language]?.[field] ?? field.replaceAll("_", " ");
}

export function localizeDocumentType(type: string, fallback: string, language: Language) {
  return ({ hi: hindiDocuments, mr: marathiDocuments } as Partial<Record<Language, Record<string, string>>>)[language]?.[type] ?? regionalDocuments[language]?.[type] ?? fallback;
}
