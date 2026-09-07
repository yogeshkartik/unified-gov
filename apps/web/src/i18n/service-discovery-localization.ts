import type { Language } from "@/src/i18n/languages";

type ServiceDiscoveryCopy = {
  basedOnCurrentAddress: string;
  searchResultsAcrossIndia: string;
  showingMatchesAcrossSupportedStates: string;
  stateSpecificService: string;
  availableIn: string;
  chooseStateFor: string;
};

type ServiceResultsPresentationCopy = {
  servicesAvailableAcrossIndia: string;
  showCentralServices: string;
  hideCentralServices: string;
  stateSearchMatches: string;
  centralSearchMatches: string;
  searchResultsFor: string;
  matchingServices: string;
};

type SearchRelevanceCopy = {
  clearSearch: string;
  recommendedForCurrentAddress: string;
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

const presentationCopy: Record<Language, ServiceResultsPresentationCopy> = {
  en: { servicesAvailableAcrossIndia: "{count} services available across India", showCentralServices: "Show Central Services", hideCentralServices: "Hide Central Services", stateSearchMatches: "Selected state matches", centralSearchMatches: "Central Government matches", searchResultsFor: 'Search results for "{query}"', matchingServices: "{count} matching services" },
  hi: { servicesAvailableAcrossIndia: "भारत भर में {count} सेवाएँ उपलब्ध हैं", showCentralServices: "केंद्र सरकार की सेवाएँ दिखाएँ", hideCentralServices: "केंद्र सरकार की सेवाएँ छिपाएँ", stateSearchMatches: "चयनित राज्य के मिलान", centralSearchMatches: "केंद्र सरकार के मिलान", searchResultsFor: '"{query}" के लिए खोज परिणाम', matchingServices: "{count} मिलती-जुलती सेवाएँ" },
  mr: { servicesAvailableAcrossIndia: "संपूर्ण भारतात {count} सेवा उपलब्ध आहेत", showCentralServices: "केंद्र सरकारच्या सेवा दाखवा", hideCentralServices: "केंद्र सरकारच्या सेवा लपवा", stateSearchMatches: "निवडलेल्या राज्यातील जुळणाऱ्या सेवा", centralSearchMatches: "केंद्र सरकारच्या जुळणाऱ्या सेवा", searchResultsFor: '"{query}" साठी शोध निकाल', matchingServices: "{count} जुळणाऱ्या सेवा" },
  kn: { servicesAvailableAcrossIndia: "ಭಾರತದಾದ್ಯಂತ {count} ಸೇವೆಗಳು ಲಭ್ಯವಿವೆ", showCentralServices: "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಸೇವೆಗಳನ್ನು ತೋರಿಸಿ", hideCentralServices: "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಸೇವೆಗಳನ್ನು ಮರೆಮಾಡಿ", stateSearchMatches: "ಆಯ್ಕೆಮಾಡಿದ ರಾಜ್ಯದ ಹೊಂದಾಣಿಕೆಗಳು", centralSearchMatches: "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಹೊಂದಾಣಿಕೆಗಳು", searchResultsFor: '"{query}" ಗಾಗಿ ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು', matchingServices: "{count} ಹೊಂದಾಣಿಕೆಯ ಸೇವೆಗಳು" },
  ta: { servicesAvailableAcrossIndia: "இந்தியா முழுவதும் {count} சேவைகள் கிடைக்கின்றன", showCentralServices: "மத்திய அரசு சேவைகளைக் காட்டு", hideCentralServices: "மத்திய அரசு சேவைகளை மறை", stateSearchMatches: "தேர்ந்தெடுக்கப்பட்ட மாநிலப் பொருத்தங்கள்", centralSearchMatches: "மத்திய அரசு பொருத்தங்கள்", searchResultsFor: '"{query}" க்கான தேடல் முடிவுகள்', matchingServices: "{count} பொருந்தும் சேவைகள்" },
  te: { servicesAvailableAcrossIndia: "భారతదేశవ్యాప్తంగా {count} సేవలు అందుబాటులో ఉన్నాయి", showCentralServices: "కేంద్ర ప్రభుత్వ సేవలను చూపండి", hideCentralServices: "కేంద్ర ప్రభుత్వ సేవలను దాచండి", stateSearchMatches: "ఎంచుకున్న రాష్ట్రంలోని సరిపోలికలు", centralSearchMatches: "కేంద్ర ప్రభుత్వ సరిపోలికలు", searchResultsFor: '"{query}" కోసం శోధన ఫలితాలు', matchingServices: "{count} సరిపోలే సేవలు" },
  bn: { servicesAvailableAcrossIndia: "সারা ভারতে {count}টি পরিষেবা উপলব্ধ", showCentralServices: "কেন্দ্রীয় সরকারের পরিষেবা দেখান", hideCentralServices: "কেন্দ্রীয় সরকারের পরিষেবা লুকান", stateSearchMatches: "নির্বাচিত রাজ্যের মিল", centralSearchMatches: "কেন্দ্রীয় সরকারের মিল", searchResultsFor: '"{query}"-এর জন্য অনুসন্ধানের ফলাফল', matchingServices: "{count}টি মিলে যাওয়া পরিষেবা" },
};

const relevanceCopy: Record<Language, SearchRelevanceCopy> = {
  en: { clearSearch: "Clear search", recommendedForCurrentAddress: "Recommended for your current address: {state}" },
  hi: { clearSearch: "खोज साफ़ करें", recommendedForCurrentAddress: "आपके वर्तमान पते के लिए अनुशंसित: {state}" },
  mr: { clearSearch: "शोध साफ करा", recommendedForCurrentAddress: "तुमच्या सध्याच्या पत्त्यासाठी शिफारस केलेले: {state}" },
  kn: { clearSearch: "ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ", recommendedForCurrentAddress: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿಳಾಸಕ್ಕಾಗಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ: {state}" },
  ta: { clearSearch: "தேடலை அழிக்கவும்", recommendedForCurrentAddress: "உங்கள் தற்போதைய முகவருக்கு பரிந்துரைக்கப்பட்டது: {state}" },
  te: { clearSearch: "శోధనను క్లియర్ చేయండి", recommendedForCurrentAddress: "మీ ప్రస్తుత చిరునామాకు సిఫార్సు చేయబడింది: {state}" },
  bn: { clearSearch: "অনুসন্ধান সাফ করুন", recommendedForCurrentAddress: "আপনার বর্তমান ঠিকানার জন্য সুপারিশকৃত: {state}" },
};

export function serviceDiscoveryText(language: Language, key: keyof ServiceDiscoveryCopy | keyof ServiceResultsPresentationCopy | keyof SearchRelevanceCopy, values: Record<string, string | number> = {}): string {
  const message = key in copy[language]
    ? copy[language][key as keyof ServiceDiscoveryCopy]
    : key in presentationCopy[language]
      ? presentationCopy[language][key as keyof ServiceResultsPresentationCopy]
      : relevanceCopy[language][key as keyof SearchRelevanceCopy];
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), message);
}
