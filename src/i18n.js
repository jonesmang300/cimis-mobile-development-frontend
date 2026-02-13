import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  en: {
    translation: {
      settings: "Settings",
      account: "Account",
      groupSettings: "Group Settings",
      groupRoles: "Group Roles",
      loanProducts: "Loan Products",
      savingsProducts: "Savings Products",
      preferences: "Preferences",
      changeLanguage: "Change Language",
      logout: "Logout",
      userName: "",
      phoneNumber: "",
      role: "",
    },
  },
  ny: {
    translation: {
      settings: "Zikhazikiko",
      account: "Akaunti",
      groupSettings: "Zikhazikiko Za Gulu",
      groupRoles: "Maufulu a Gulu",
      loanProducts: "Zogulitsa Ngongole",
      savingsProducts: "Zogulitsa Kusunga Ndalama",
      preferences: "Zokonda",
      changeLanguage: "Sinthani Chilankhulo",
      logout: "Chokani",
      userName: "Uchizi Nyirongo",
      phoneNumber: "+265984227262",
      role: "Owerengera Ndalama",
    },
  },
};

// Initialize i18n
i18n
  .use(LanguageDetector) // Automatically detect the user's language
  .use(initReactI18next) // Bind with React
  .init({
    resources,
    fallbackLng: "en", // Fallback language
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
  });

export default i18n;
