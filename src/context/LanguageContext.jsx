import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        // Initialize from localStorage or browser language
        const stored = localStorage.getItem('preferred-language');
        if (stored && (stored === 'zh' || stored === 'en')) {
            return stored;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('zh') ? 'zh' : 'en';
    });

    useEffect(() => {
        // Persist language preference
        localStorage.setItem('preferred-language', lang);
    }, [lang]);

    const t = useMemo(() => {
        return (key) => {
            const keys = key.split('.');
            let result = translations[lang];
            for (const k of keys) {
                if (result[k]) {
                    result = result[k];
                } else {
                    return key; // Return the key if not found
                }
            }
            return result;
        };
    }, [lang]);

    const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
