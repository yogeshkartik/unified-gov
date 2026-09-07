import type { Language } from "@/src/i18n/languages";

type ServiceDiscoveryCopy = {
  browseServices: string;
  centralAndStateServices: string;
  stateGovernmentServices: string;
  chooseStateToExplore: string;
  clearSearch: string;
  searchResultsFor: string;
  matchingServices: string;
};

const copy: Record<Language, ServiceDiscoveryCopy> = {
  en: { browseServices: "Browse services", centralAndStateServices: "Central & State Services", stateGovernmentServices: "State Government Services", chooseStateToExplore: "Choose a state from “Browse services” to explore state services.", clearSearch: "Clear search", searchResultsFor: 'Search results for "{query}"', matchingServices: "{count} matching services" },
  hi: { browseServices: "सेवाएँ ब्राउज़ करें", centralAndStateServices: "केंद्र और राज्य सेवाएँ", stateGovernmentServices: "राज्य सरकार की सेवाएँ", chooseStateToExplore: "राज्य सेवाएँ देखने के लिए “सेवाएँ ब्राउज़ करें” से एक राज्य चुनें।", clearSearch: "खोज साफ़ करें", searchResultsFor: '"{query}" के लिए खोज परिणाम', matchingServices: "{count} मिलती-जुलती सेवाएँ" },
  mr: { browseServices: "सेवा ब्राउझ करा", centralAndStateServices: "केंद्र आणि राज्य सेवा", stateGovernmentServices: "राज्य सरकारी सेवा", chooseStateToExplore: "राज्य सेवा पाहण्यासाठी “सेवा ब्राउझ करा” मधून राज्य निवडा.", clearSearch: "शोध साफ करा", searchResultsFor: '"{query}" साठी शोध निकाल', matchingServices: "{count} जुळणाऱ्या सेवा" },
  kn: { browseServices: "ಸೇವೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ", centralAndStateServices: "ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸೇವೆಗಳು", stateGovernmentServices: "ರಾಜ್ಯ ಸರ್ಕಾರದ ಸೇವೆಗಳು", chooseStateToExplore: "ರಾಜ್ಯ ಸೇವೆಗಳನ್ನು ನೋಡಲು “ಸೇವೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ” ಯಿಂದ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", clearSearch: "ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ", searchResultsFor: '"{query}" ಗಾಗಿ ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು', matchingServices: "{count} ಹೊಂದಾಣಿಕೆಯ ಸೇವೆಗಳು" },
  ta: { browseServices: "சேவைகளை உலாவுக", centralAndStateServices: "மத்திய மற்றும் மாநில சேவைகள்", stateGovernmentServices: "மாநில அரசு சேவைகள்", chooseStateToExplore: "மாநில சேவைகளைப் பார்க்க “சேவைகளை உலாவுக” என்பதிலிருந்து ஒரு மாநிலத்தைத் தேர்ந்தெடுக்கவும்.", clearSearch: "தேடலை அழிக்கவும்", searchResultsFor: '"{query}" க்கான தேடல் முடிவுகள்', matchingServices: "{count} பொருந்தும் சேவைகள்" },
  te: { browseServices: "సేవలను బ్రౌజ్ చేయండి", centralAndStateServices: "కేంద్ర మరియు రాష్ట్ర సేవలు", stateGovernmentServices: "రాష్ట్ర ప్రభుత్వ సేవలు", chooseStateToExplore: "రాష్ట్ర సేవలను చూడటానికి “సేవలను బ్రౌజ్ చేయండి” నుండి రాష్ట్రాన్ని ఎంచుకోండి.", clearSearch: "శోధనను క్లియర్ చేయండి", searchResultsFor: '"{query}" కోసం శోధన ఫలితాలు', matchingServices: "{count} సరిపోలే సేవలు" },
  bn: { browseServices: "পরিষেবা ব্রাউজ করুন", centralAndStateServices: "কেন্দ্র ও রাজ্য পরিষেবা", stateGovernmentServices: "রাজ্য সরকারি পরিষেবা", chooseStateToExplore: "রাজ্য পরিষেবা দেখতে “পরিষেবা ব্রাউজ করুন” থেকে একটি রাজ্য বেছে নিন।", clearSearch: "অনুসন্ধান সাফ করুন", searchResultsFor: '"{query}"-এর জন্য অনুসন্ধানের ফলাফল', matchingServices: "{count}টি মিলে যাওয়া পরিষেবা" },
};

export function serviceDiscoveryText(language: Language, key: keyof ServiceDiscoveryCopy, values: Record<string, string | number> = {}): string {
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), copy[language][key]);
}
