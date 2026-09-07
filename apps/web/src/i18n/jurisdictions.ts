import type { Language } from "@/src/i18n/languages";

export const serviceJurisdictions = [
  { code: "IN", names: { en: "All India", hi: "अखिल भारतीय", mr: "संपूर्ण भारत", kn: "ಅಖಿಲ ಭಾರತ", ta: "அகில இந்தியா", te: "అఖిల భారతదేశం", bn: "সারা ভারত" } },
  { code: "BR", names: { en: "Bihar", hi: "बिहार", mr: "बिहार", kn: "ಬಿಹಾರ", ta: "பீகார்", te: "బీహార్", bn: "বিহার" } },
  { code: "KA", names: { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक", kn: "ಕರ್ನಾಟಕ", ta: "கர்நாடகா", te: "కర్ణాటక", bn: "কর্ণাটক" } },
  { code: "MH", names: { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र", kn: "ಮಹಾರಾಷ್ಟ್ರ", ta: "மகாராஷ்டிரா", te: "మహారాష్ట్ర", bn: "মহারাষ্ট্র" } },
  { code: "TN", names: { en: "Tamil Nadu", hi: "तमिलनाडु", mr: "तमिळनाडू", kn: "ತಮಿಳುನಾಡು", ta: "தமிழ்நாடு", te: "తమిళనాడు", bn: "তামিলনাড়ু" } },
  { code: "UP", names: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश", kn: "ಉತ್ತರ ಪ್ರದೇಶ", ta: "உத்தரப் பிரதேசம்", te: "ఉత్తర ప్రదేశ్", bn: "উত্তর প্রদেশ" } },
  { code: "WB", names: { en: "West Bengal", hi: "पश्चिम बंगाल", mr: "पश्चिम बंगाल", kn: "ಪಶ್ಚಿಮ ಬಂಗಾಳ", ta: "மேற்கு வங்காளம்", te: "పశ్చిమ బెంగాల్", bn: "পশ্চিমবঙ্গ" } },
] as const;

export type ServiceJurisdictionCode = (typeof serviceJurisdictions)[number]["code"];

export function jurisdictionName(code: string, language: Language) {
  const jurisdiction = serviceJurisdictions.find((item) => item.code === code);
  return jurisdiction?.names[language] ?? code;
}
