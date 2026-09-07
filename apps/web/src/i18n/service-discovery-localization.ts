import type { Language } from "@/src/i18n/languages";

type ServiceDiscoveryCopy = {
  basedOnCurrentAddress: string;
  searchResultsAcrossIndia: string;
  showingMatchesAcrossSupportedStates: string;
  stateSpecificService: string;
  availableIn: string;
  chooseStateFor: string;
};

const copy: Record<Language, ServiceDiscoveryCopy> = {
  en: { basedOnCurrentAddress: "Based on your current address", searchResultsAcrossIndia: "Search results across India", showingMatchesAcrossSupportedStates: "Showing matches across supported states", stateSpecificService: "State-specific service", availableIn: "Available in {count} supported states", chooseStateFor: "Choose {state} for {service}" },
  hi: { basedOnCurrentAddress: "आपके वर्तमान पते के आधार पर", searchResultsAcrossIndia: "भारत भर में खोज परिणाम", showingMatchesAcrossSupportedStates: "समर्थित राज्यों में मिलान दिखाए जा रहे हैं", stateSpecificService: "राज्य-विशिष्ट सेवा", availableIn: "{count} समर्थित राज्यों में उपलब्ध", chooseStateFor: "{service} के लिए {state} चुनें" },
  mr: { basedOnCurrentAddress: "तुमच्या सध्याच्या पत्त्यावर आधारित", searchResultsAcrossIndia: "संपूर्ण भारतातील शोध निकाल", showingMatchesAcrossSupportedStates: "समर्थित राज्यांमधील जुळणाऱ्या सेवा दाखवत आहोत", stateSpecificService: "राज्य-विशिष्ट सेवा", availableIn: "{count} समर्थित राज्यांमध्ये उपलब्ध", chooseStateFor: "{service} साठी {state} निवडा" },
  kn: { basedOnCurrentAddress: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿಳಾಸದ ಆಧಾರದ ಮೇಲೆ", searchResultsAcrossIndia: "ಭಾರತದಾದ್ಯಂತ ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು", showingMatchesAcrossSupportedStates: "ಬೆಂಬಲಿತ ರಾಜ್ಯಗಳಲ್ಲಿನ ಹೊಂದಾಣಿಕೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ", stateSpecificService: "ರಾಜ್ಯ-ನಿರ್ದಿಷ್ಟ ಸೇವೆ", availableIn: "{count} ಬೆಂಬಲಿತ ರಾಜ್ಯಗಳಲ್ಲಿ ಲಭ್ಯ", chooseStateFor: "{service} ಗಾಗಿ {state} ಆಯ್ಕೆಮಾಡಿ" },
  ta: { basedOnCurrentAddress: "உங்கள் தற்போதைய முகவரியின் அடிப்படையில்", searchResultsAcrossIndia: "இந்தியா முழுவதும் தேடல் முடிவுகள்", showingMatchesAcrossSupportedStates: "ஆதரிக்கப்படும் மாநிலங்களில் பொருத்தங்கள் காட்டப்படுகின்றன", stateSpecificService: "மாநில-குறிப்பிட்ட சேவை", availableIn: "{count} ஆதரிக்கப்படும் மாநிலங்களில் கிடைக்கும்", chooseStateFor: "{service} க்காக {state} ஐத் தேர்ந்தெடுக்கவும்" },
  te: { basedOnCurrentAddress: "మీ ప్రస్తుత చిరునామా ఆధారంగా", searchResultsAcrossIndia: "భారతదేశవ్యాప్తంగా శోధన ఫలితాలు", showingMatchesAcrossSupportedStates: "మద్దతు ఉన్న రాష్ట్రాల్లో సరిపోలికలను చూపుతోంది", stateSpecificService: "రాష్ట్ర-నిర్దిష్ట సేవ", availableIn: "{count} మద్దతు ఉన్న రాష్ట్రాల్లో అందుబాటులో ఉంది", chooseStateFor: "{service} కోసం {state} ఎంచుకోండి" },
  bn: { basedOnCurrentAddress: "আপনার বর্তমান ঠিকানার ভিত্তিতে", searchResultsAcrossIndia: "সারা ভারত জুড়ে অনুসন্ধানের ফলাফল", showingMatchesAcrossSupportedStates: "সমর্থিত রাজ্যগুলিতে মিল দেখানো হচ্ছে", stateSpecificService: "রাজ্য-নির্দিষ্ট পরিষেবা", availableIn: "{count} সমর্থিত রাজ্যে উপলব্ধ", chooseStateFor: "{service}-এর জন্য {state} বেছে নিন" },
};

export function serviceDiscoveryText(language: Language, key: keyof ServiceDiscoveryCopy, values: Record<string, string | number> = {}): string {
  return Object.entries(values).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, String(value)), copy[language][key]);
}
