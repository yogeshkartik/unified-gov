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

type RecommendationCopy = {
  recommended: string;
  centralServices: string;
  stateServices: string;
  recommendedForYou: string;
  recommendationsDescription: string;
  GENERAL_RELEVANCE: string;
  PERMANENT_STATE_MATCH: string;
  EDUCATION_STAGE_MATCH: string;
  AGE_RELEVANCE: string;
  EMPLOYMENT_STATUS_MATCH: string;
  OCCUPATION_MATCH: string;
  viewDetails: string;
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

const recommendationCopy: Record<Language, RecommendationCopy> = {
  en: { recommended: "Recommended", centralServices: "Central Services", stateServices: "State Services", recommendedForYou: "Recommended for You", recommendationsDescription: "Services selected from your profile, education and permanent state.", GENERAL_RELEVANCE: "Useful government service to explore", PERMANENT_STATE_MATCH: "Matches your permanent state", EDUCATION_STAGE_MATCH: "Relevant to your education stage", AGE_RELEVANCE: "Relevant to your life stage", EMPLOYMENT_STATUS_MATCH: "Relevant to your work status", OCCUPATION_MATCH: "Relevant to your occupation", viewDetails: "View details" },
  hi: { recommended: "अनुशंसित", centralServices: "केंद्र सेवाएँ", stateServices: "राज्य सेवाएँ", recommendedForYou: "आपके लिए अनुशंसित", recommendationsDescription: "आपकी प्रोफ़ाइल, शिक्षा और स्थायी राज्य के आधार पर चुनी गई सेवाएँ।", GENERAL_RELEVANCE: "उपयोगी सरकारी सेवा", PERMANENT_STATE_MATCH: "आपके स्थायी राज्य से मेल खाती है", EDUCATION_STAGE_MATCH: "आपकी शिक्षा अवस्था के लिए प्रासंगिक", AGE_RELEVANCE: "आपकी जीवन अवस्था के लिए प्रासंगिक", EMPLOYMENT_STATUS_MATCH: "आपकी कार्य स्थिति के लिए प्रासंगिक", OCCUPATION_MATCH: "आपके व्यवसाय के लिए प्रासंगिक", viewDetails: "विवरण देखें" },
  mr: { recommended: "शिफारस केलेले", centralServices: "केंद्र सेवा", stateServices: "राज्य सेवा", recommendedForYou: "तुमच्यासाठी शिफारस केलेले", recommendationsDescription: "तुमच्या प्रोफाइल, शिक्षण आणि कायमच्या राज्यावरून निवडलेल्या सेवा.", GENERAL_RELEVANCE: "उपयुक्त सरकारी सेवा", PERMANENT_STATE_MATCH: "तुमच्या कायमच्या राज्याशी जुळते", EDUCATION_STAGE_MATCH: "तुमच्या शिक्षणाच्या टप्प्यासाठी संबंधित", AGE_RELEVANCE: "तुमच्या जीवनाच्या टप्प्यासाठी संबंधित", EMPLOYMENT_STATUS_MATCH: "तुमच्या कामाच्या स्थितीसाठी संबंधित", OCCUPATION_MATCH: "तुमच्या व्यवसायासाठी संबंधित", viewDetails: "तपशील पहा" },
  kn: { recommended: "ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ", centralServices: "ಕೇಂದ್ರ ಸೇವೆಗಳು", stateServices: "ರಾಜ್ಯ ಸೇವೆಗಳು", recommendedForYou: "ನಿಮಗಾಗಿ ಶಿಫಾರಸುಗಳು", recommendationsDescription: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್, ಶಿಕ್ಷಣ ಮತ್ತು ಶಾಶ್ವತ ರಾಜ್ಯದ ಆಧಾರದ ಸೇವೆಗಳು.", GENERAL_RELEVANCE: "ಉಪಯುಕ್ತ ಸರ್ಕಾರಿ ಸೇವೆ", PERMANENT_STATE_MATCH: "ನಿಮ್ಮ ಶಾಶ್ವತ ರಾಜ್ಯಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ", EDUCATION_STAGE_MATCH: "ನಿಮ್ಮ ಶಿಕ್ಷಣ ಹಂತಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ", AGE_RELEVANCE: "ನಿಮ್ಮ ಜೀವನ ಹಂತಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ", EMPLOYMENT_STATUS_MATCH: "ನಿಮ್ಮ ಕೆಲಸದ ಸ್ಥಿತಿಗೆ ಸಂಬಂಧಿಸಿದೆ", OCCUPATION_MATCH: "ನಿಮ್ಮ ಉದ್ಯೋಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ", viewDetails: "ವಿವರಗಳನ್ನು ನೋಡಿ" },
  ta: { recommended: "பரிந்துரைக்கப்பட்டது", centralServices: "மத்திய சேவைகள்", stateServices: "மாநில சேவைகள்", recommendedForYou: "உங்களுக்கான பரிந்துரைகள்", recommendationsDescription: "உங்கள் சுயவிவரம், கல்வி மற்றும் நிரந்தர மாநிலத்தின் அடிப்படையிலான சேவைகள்.", GENERAL_RELEVANCE: "பயனுள்ள அரசு சேவை", PERMANENT_STATE_MATCH: "உங்கள் நிரந்தர மாநிலத்துடன் பொருந்துகிறது", EDUCATION_STAGE_MATCH: "உங்கள் கல்வி நிலைக்கு பொருத்தமானது", AGE_RELEVANCE: "உங்கள் வாழ்க்கை நிலைக்கு பொருத்தமானது", EMPLOYMENT_STATUS_MATCH: "உங்கள் பணிநிலைக்கு பொருத்தமானது", OCCUPATION_MATCH: "உங்கள் தொழிலுக்கு பொருத்தமானது", viewDetails: "விவரங்களைக் காண்க" },
  te: { recommended: "సిఫార్సు చేయబడింది", centralServices: "కేంద్ర సేవలు", stateServices: "రాష్ట్ర సేవలు", recommendedForYou: "మీ కోసం సిఫార్సులు", recommendationsDescription: "మీ ప్రొఫైల్, విద్య మరియు శాశ్వత రాష్ట్రం ఆధారంగా ఎంపిక చేసిన సేవలు.", GENERAL_RELEVANCE: "ఉపయోగకరమైన ప్రభుత్వ సేవ", PERMANENT_STATE_MATCH: "మీ శాశ్వత రాష్ట్రానికి సరిపోతుంది", EDUCATION_STAGE_MATCH: "మీ విద్యా దశకు సంబంధించినది", AGE_RELEVANCE: "మీ జీవిత దశకు సంబంధించినది", EMPLOYMENT_STATUS_MATCH: "మీ పని స్థితికి సంబంధించినది", OCCUPATION_MATCH: "మీ వృత్తికి సంబంధించినది", viewDetails: "వివరాలు చూడండి" },
  bn: { recommended: "প্রস্তাবিত", centralServices: "কেন্দ্রীয় পরিষেবা", stateServices: "রাজ্য পরিষেবা", recommendedForYou: "আপনার জন্য প্রস্তাবিত", recommendationsDescription: "আপনার প্রোফাইল, শিক্ষা ও স্থায়ী রাজ্যের ভিত্তিতে নির্বাচিত পরিষেবা।", GENERAL_RELEVANCE: "উপযোগী সরকারি পরিষেবা", PERMANENT_STATE_MATCH: "আপনার স্থায়ী রাজ্যের সঙ্গে মেলে", EDUCATION_STAGE_MATCH: "আপনার শিক্ষার স্তরের জন্য প্রাসঙ্গিক", AGE_RELEVANCE: "আপনার জীবনের স্তরের জন্য প্রাসঙ্গিক", EMPLOYMENT_STATUS_MATCH: "আপনার কর্মস্থিতির জন্য প্রাসঙ্গিক", OCCUPATION_MATCH: "আপনার পেশার জন্য প্রাসঙ্গিক", viewDetails: "বিস্তারিত দেখুন" },
};

export function serviceDiscoveryText(language: Language, key: keyof ServiceDiscoveryCopy | keyof ServiceResultsPresentationCopy | keyof SearchRelevanceCopy | keyof RecommendationCopy, values: Record<string, string | number> = {}): string {
  const message = key in copy[language]
    ? copy[language][key as keyof ServiceDiscoveryCopy]
    : key in presentationCopy[language]
      ? presentationCopy[language][key as keyof ServiceResultsPresentationCopy]
      : key in relevanceCopy[language]
        ? relevanceCopy[language][key as keyof SearchRelevanceCopy]
        : recommendationCopy[language][key as keyof RecommendationCopy];
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), message);
}
