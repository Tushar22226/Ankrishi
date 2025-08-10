import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Define available languages
export type Language = 'English' | 'Hindi' | 'Marathi' | 'Bengali' | 'Tamil';

// Define translations
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Basic translations for demonstration
const translations: Translations = {
  English: {
    // Navigation
    home: 'Home',
    marketplace: 'Marketplace',
    learning: 'Learning',
    settings: 'Settings',

    // Common
    profile: 'Profile',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',

    // Settings
    darkMode: 'Dark Mode',
    language: 'Language',
    notifications: 'Notifications',
    locationServices: 'Location Services',
    helpSupport: 'Help & Support',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    about: 'About',

    // Profile
    editProfile: 'Edit Profile',
    name: 'Name',
    username: 'Username',
    email: 'Email',
    phoneNumber: 'Phone Number',
    age: 'Age',

    // Marketplace
    products: 'Products',
    services: 'Services',
    addProduct: 'Add Product',
    price: 'Price',
    quantity: 'Quantity',
    category: 'Category',
    description: 'Description',

    // Weather
    weather: 'Weather',
    forecast: 'Forecast',
    temperature: 'Temperature',
    humidity: 'Humidity',
    wind: 'Wind',

    // AI
    recommendations: 'Recommendations',
    cropPrediction: 'Crop Prediction',
    marketTrends: 'Market Trends',
  },
  Hindi: {
    // Navigation
    home: 'होम',
    marketplace: 'बाज़ार',
    learning: 'शिक्षा',
    settings: 'सेटिंग्स',

    // Common
    profile: 'प्रोफाइल',
    logout: 'लॉग आउट',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',

    // Settings
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    locationServices: 'स्थान सेवाएं',
    helpSupport: 'सहायता और समर्थन',
    termsConditions: 'नियम और शर्तें',
    privacyPolicy: 'गोपनीयता नीति',
    about: 'के बारे में',

    // Profile
    editProfile: 'प्रोफ़ाइल संपादित करें',
    name: 'नाम',
    username: 'उपयोगकर्ता नाम',
    email: 'ईमेल',
    phoneNumber: 'फ़ोन नंबर',
    age: 'आयु',

    // Marketplace
    products: 'उत्पाद',
    services: 'सेवाएं',
    addProduct: 'उत्पाद जोड़ें',
    price: 'कीमत',
    quantity: 'मात्रा',
    category: 'श्रेणी',
    description: 'विवरण',

    // Weather
    weather: 'मौसम',
    forecast: 'पूर्वानुमान',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    wind: 'हवा',

    // AI
    recommendations: 'सिफारिशें',
    cropPrediction: 'फसल भविष्यवाणी',
    marketTrends: 'बाजार के रुझान',
  },
  Marathi: {
    // Navigation
    home: 'मुख्यपृष्ठ',
    marketplace: 'बाजारपेठ',
    learning: 'शिक्षण',
    settings: 'सेटिंग्ज',

    // Common
    profile: 'प्रोफाइल',
    logout: 'लॉग आउट',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    edit: 'संपादित करा',

    // Settings
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    notifications: 'सूचना',
    locationServices: 'स्थान सेवा',
    helpSupport: 'मदत आणि समर्थन',
    termsConditions: 'अटी आणि शर्ती',
    privacyPolicy: 'गोपनीयता धोरण',
    about: 'बद्दल',

    // Profile
    editProfile: 'प्रोफाइल संपादित करा',
    name: 'नाव',
    username: 'वापरकर्तानाव',
    email: 'ईमेल',
    phoneNumber: 'फोन नंबर',
    age: 'वय',

    // Marketplace
    products: 'उत्पादने',
    services: 'सेवा',
    addProduct: 'उत्पादन जोडा',
    price: 'किंमत',
    quantity: 'प्रमाण',
    category: 'वर्ग',
    description: 'वर्णन',

    // Weather
    weather: 'हवामान',
    forecast: 'अंदाज',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    wind: 'वारा',

    // AI
    recommendations: 'शिफारसी',
    cropPrediction: 'पीक भविष्यवाणी',
    marketTrends: 'बाजारातील कल',
  },
  Bengali: {
    // Navigation
    home: 'হোম',
    marketplace: 'বাজার',
    learning: 'শিক্ষা',
    settings: 'সেটিংস',

    // Common
    profile: 'প্রোফাইল',
    logout: 'লগ আউট',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল করুন',
    delete: 'মুছুন',
    edit: 'সম্পাদনা করুন',

    // Settings
    darkMode: 'ডার্ক মোড',
    language: 'ভাষা',
    notifications: 'বিজ্ঞপ্তি',
    locationServices: 'অবস্থান পরিষেবা',
    helpSupport: 'সাহায্য ও সমর্থন',
    termsConditions: 'শর্তাবলী',
    privacyPolicy: 'গোপনীয়তা নীতি',
    about: 'সম্পর্কে',

    // Profile
    editProfile: 'প্রোফাইল সম্পাদনা করুন',
    name: 'নাম',
    username: 'ব্যবহারকারীর নাম',
    email: 'ইমেইল',
    phoneNumber: 'ফোন নম্বর',
    age: 'বয়স',

    // Marketplace
    products: 'পণ্য',
    services: 'সেবা',
    addProduct: 'পণ্য যোগ করুন',
    price: 'মূল্য',
    quantity: 'পরিমাণ',
    category: 'বিভাগ',
    description: 'বিবরণ',

    // Weather
    weather: 'আবহাওয়া',
    forecast: 'পূর্বাভাস',
    temperature: 'তাপমাত্রা',
    humidity: 'আর্দ্রতা',
    wind: 'বাতাস',

    // AI
    recommendations: 'সুপারিশ',
    cropPrediction: 'ফসল পূর্বাভাস',
    marketTrends: 'বাজারের প্রবণতা',
  },
  Tamil: {
    // Navigation
    home: 'முகப்பு',
    marketplace: 'சந்தை',
    learning: 'கற்றல்',
    settings: 'அமைப்புகள்',

    // Common
    profile: 'சுயவிவரம்',
    logout: 'வெளியேறு',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    delete: 'நீக்கு',
    edit: 'திருத்து',

    // Settings
    darkMode: 'இருள் பயன்முறை',
    language: 'மொழி',
    notifications: 'அறிவிப்புகள்',
    locationServices: 'இருப்பிட சேவைகள்',
    helpSupport: 'உதவி & ஆதரவு',
    termsConditions: 'விதிமுறைகள் & நிபந்தனைகள்',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    about: 'பற்றி',

    // Profile
    editProfile: 'சுயவிவரத்தைத் திருத்து',
    name: 'பெயர்',
    username: 'பயனர்பெயர்',
    email: 'மின்னஞ்சல்',
    phoneNumber: 'தொலைபேசி எண்',
    age: 'வயது',

    // Marketplace
    products: 'பொருட்கள்',
    services: 'சேவைகள்',
    addProduct: 'பொருள் சேர்',
    price: 'விலை',
    quantity: 'அளவு',
    category: 'வகை',
    description: 'விளக்கம்',

    // Weather
    weather: 'வானிலை',
    forecast: 'முன்னறிவிப்பு',
    temperature: 'வெப்பநிலை',
    humidity: 'ஈரப்பதம்',
    wind: 'காற்று',

    // AI
    recommendations: 'பரிந்துரைகள்',
    cropPrediction: 'பயிர் முன்னறிவிப்பு',
    marketTrends: 'சந்தை போக்குகள்',
  },
};

// Define RTL languages
const RTL_LANGUAGES: Language[] = [];

// Language context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
  availableLanguages: Language[];
}

// Create the language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('English');
  const availableLanguages: Language[] = ['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil'];

  // Load language preference from AsyncStorage
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem('language');
        if (storedPreference !== null && isValidLanguage(storedPreference)) {
          setLanguageState(storedPreference as Language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();
  }, []);

  // Update RTL layout direction when language changes
  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(language);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // In a real app, you might want to reload the app here
      // to ensure all components respect the new direction
    }
  }, [language]);

  // Check if language is valid
  const isValidLanguage = (lang: string): boolean => {
    return availableLanguages.includes(lang as Language);
  };

  // Set language
  const setLanguage = async (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      await AsyncStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translate function
  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }

    // Fallback to English
    if (translations.English && translations.English[key]) {
      return translations.English[key];
    }

    // Return key if translation not found
    return key;
  };

  const isRTL = RTL_LANGUAGES.includes(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    availableLanguages,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
