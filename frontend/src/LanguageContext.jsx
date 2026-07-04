import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English');

  const translate = (key) => {
    const translations = {
      'English': {
        'nav.dashboard': 'Dashboard',
        'nav.incidents': 'Incidents',
        'nav.textScan': 'Text Scan',
        'nav.urlScan': 'URL Scan',
        'nav.screenshot': 'Screenshot',
        'nav.quiz': 'Quiz',
        'nav.api': 'API',
        'nav.guide': 'Guide',
        'nav.settings': 'Settings',
        'nav.admin': 'Admin',
        'nav.signup': 'Sign Up',
        'nav.login': 'Log In',
        'nav.signout': 'Sign Out',
        'nav.subscribe': 'Subscribe Updates',
        'nav.search': 'Search',
        'hero.title': 'Advancing Cybersecurity Education and Threat Intelligence',
        'hero.subtitle': 'We believe robust cybersecurity intelligence is the key to solving modern digital threats. Our goal is to empower organizations as they prepare to succeed in the cyber landscape of tomorrow.',
        'hero.signup': 'Sign up for Platform Access',
        'hero.login': 'Log In'
      },
      'Spanish': {
        'nav.dashboard': 'Panel',
        'nav.incidents': 'Incidentes',
        'nav.textScan': 'Escanear Texto',
        'nav.urlScan': 'Escanear URL',
        'nav.screenshot': 'Captura',
        'nav.quiz': 'Cuestionario',
        'nav.api': 'API',
        'nav.guide': 'Guía',
        'nav.settings': 'Ajustes',
        'nav.admin': 'Admin',
        'nav.signup': 'Registrarse',
        'nav.login': 'Iniciar Sesión',
        'nav.signout': 'Cerrar Sesión',
        'nav.subscribe': 'Suscribirse a Actualizaciones',
        'nav.search': 'Buscar',
        'hero.title': 'Avanzando en la Educación sobre Ciberseguridad e Inteligencia de Amenazas',
        'hero.subtitle': 'Creemos que una inteligencia de ciberseguridad robusta es la clave para resolver las amenazas digitales modernas. Nuestro objetivo es empoderar a las organizaciones mientras se preparan para triunfar en el panorama cibernético del mañana.',
        'hero.signup': 'Registrarse para Acceso a la Plataforma',
        'hero.login': 'Iniciar Sesión'
      },
      'French': {
        'nav.dashboard': 'Tableau de bord',
        'nav.incidents': 'Incidents',
        'nav.textScan': 'Analyse de texte',
        'nav.urlScan': 'Analyse d\'URL',
        'nav.screenshot': 'Capture d\'écran',
        'nav.quiz': 'Quiz',
        'nav.api': 'API',
        'nav.guide': 'Guide',
        'nav.settings': 'Paramètres',
        'nav.admin': 'Admin',
        'nav.signup': 'S\'inscrire',
        'nav.login': 'Se Connecter',
        'nav.signout': 'Se Déconnecter',
        'nav.subscribe': 'S\'abonner aux mises à jour',
        'nav.search': 'Recherche',
        'hero.title': 'Faire progresser l\'éducation à la cybersécurité et le renseignement sur les menaces',
        'hero.subtitle': 'Nous pensons qu\'un renseignement robuste en cybersécurité est la clé pour résoudre les menaces numériques modernes. Notre objectif est de responsabiliser les organisations alors qu\'elles se préparent à réussir dans le paysage cybernétique de demain.',
        'hero.signup': 'S\'inscrire pour l\'accès à la plateforme',
        'hero.login': 'Se Connecter'
      },
      'German': {
        'nav.dashboard': 'Dashboard',
        'nav.incidents': 'Vorfälle',
        'nav.textScan': 'Textscan',
        'nav.urlScan': 'URL-Scan',
        'nav.screenshot': 'Screenshot',
        'nav.quiz': 'Quiz',
        'nav.api': 'API',
        'nav.guide': 'Handbuch',
        'nav.settings': 'Einstellungen',
        'nav.admin': 'Admin',
        'nav.signup': 'Registrieren',
        'nav.login': 'Anmelden',
        'nav.signout': 'Abmelden',
        'nav.subscribe': 'Updates abonnieren',
        'nav.search': 'Suche',
        'hero.title': 'Förderung von Cybersicherheitsbildung und Bedrohungsinformationen',
        'hero.subtitle': 'Wir glauben, dass robuste Cybersicherheitsinformationen der Schlüssel zur Lösung moderner digitaler Bedrohungen sind. Unser Ziel ist es, Organisationen dabei zu unterstützen, sich auf eine erfolgreiche Zukunft in der Cyberlandschaft vorzubereiten.',
        'hero.signup': 'Registrieren Sie sich für den Plattformzugang',
        'hero.login': 'Anmelden'
      },
      'Hindi': {
        'nav.dashboard': 'डैशबोर्ड',
        'nav.incidents': 'घटनाएँ',
        'nav.textScan': 'टेक्स्ट स्कैन',
        'nav.urlScan': 'URL स्कैन',
        'nav.screenshot': 'स्क्रीनशॉट',
        'nav.quiz': 'क्विज़',
        'nav.api': 'एपीआई',
        'nav.guide': 'मार्गदर्शिका',
        'nav.settings': 'सेटिंग्स',
        'nav.admin': 'व्यवस्थापक',
        'nav.signup': 'साइन अप करें',
        'nav.login': 'लॉग इन करें',
        'nav.signout': 'साइन आउट',
        'nav.subscribe': 'अपडेट के लिए सदस्यता लें',
        'nav.search': 'खोजें',
        'hero.title': 'साइबर सुरक्षा शिक्षा और थ्रेट इंटेलिजेंस को आगे बढ़ाना',
        'hero.subtitle': 'हमारा मानना है कि मजबूत साइबर सुरक्षा बुद्धिमत्ता आधुनिक डिजिटल खतरों को सुलझाने की कुंजी है। हमारा लक्ष्य संगठनों को कल के साइबर परिदृश्य में सफल होने के लिए तैयार करना है।',
        'hero.signup': 'प्लेटफ़ॉर्म एक्सेस के लिए साइन अप करें',
        'hero.login': 'लॉग इन करें'
      },
      'Bengali': {
        'nav.dashboard': 'ড্যাশবোর্ড',
        'nav.incidents': 'ঘটনাসমূহ',
        'nav.textScan': 'টেক্সট স্ক্যান',
        'nav.urlScan': 'ইউআরএল স্ক্যান',
        'nav.screenshot': 'স্ক্রিনশট',
        'nav.quiz': 'কুইজ',
        'nav.api': 'এপিআই',
        'nav.guide': 'নির্দেশিকা',
        'nav.settings': 'সেটিংস',
        'nav.admin': 'অ্যাডমিন',
        'nav.signup': 'সাইন আপ',
        'nav.login': 'লগ ইন',
        'nav.signout': 'সাইন আউট',
        'nav.subscribe': 'আপডেট সাবস্ক্রাইব করুন',
        'nav.search': 'অনুসন্ধান করুন',
        'hero.title': 'সাইবার নিরাপত্তা শিক্ষা এবং থ্রেট ইন্টেলিজেন্স অগ্রসর করা',
        'hero.subtitle': 'আমরা বিশ্বাস করি যে শক্তিশালী সাইবার সিকিউরিটি বুদ্ধিমত্তা আধুনিক ডিজিটাল হুমকি সমাধানের মূল চাবিকাঠি। আমাদের লক্ষ্য হ\'ল সংস্থাগুলিকে আগামীকালের সাইবার ল্যান্ডস্কেপে সফল হওয়ার জন্য প্রস্তুত করা।',
        'hero.signup': 'প্ল্যাটফর্ম অ্যাক্সেসের জন্য সাইন আপ করুন',
        'hero.login': 'লগ ইন'
      },
      'Telugu': {
        'nav.dashboard': 'డాష్‌బోర్డ్',
        'nav.incidents': 'సంఘటనలు',
        'nav.textScan': 'టెక్స్ట్ స్కాన్',
        'nav.urlScan': 'URL స్కాన్',
        'nav.screenshot': 'స్క్రీన్‌షాట్',
        'nav.quiz': 'క్విజ్',
        'nav.api': 'API',
        'nav.guide': 'గైడ్',
        'nav.settings': 'సెట్టింగులు',
        'nav.admin': 'అడ్మిన్',
        'nav.signup': 'సైన్ అప్',
        'nav.login': 'లాగిన్',
        'nav.signout': 'సైన్ అవుట్',
        'nav.subscribe': 'నవీకరణలకు సభ్యత్వాన్ని పొందండి',
        'nav.search': 'శోధన',
        'hero.title': 'సైబర్‌ సెక్యూరిటీ విద్య మరియు ముప్పు ఇంటెలిజెన్స్ అభివృద్ధి',
        'hero.subtitle': 'ఆధునిక డిజిటల్ బెదిరింపులను పరిష్కరించడానికి బలమైన సైబర్‌ సెక్యూరిటీ ఇంటెలిజెన్స్ కీలకమని మేము నమ్ముతున్నాము. రేపటి సైబర్ ప్రపంచంలో విజయవంతం కావడానికి సంస్థలను సిద్ధం చేయడమే మా లక్ష్యం.',
        'hero.signup': 'ప్లాట్‌ఫారమ్ యాక్సెస్ కోసం సైన్ అప్ చేయండి',
        'hero.login': 'లాగిన్ చేయండి'
      }
    };
    
    return translations[language]?.[key] || translations['English'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};
