import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
    const { lang, setLang } = useLanguage();

    const toggleLanguage = () => {
        const newLang = lang === 'zh' ? 'en' : 'zh';
        setLang(newLang);
        localStorage.setItem('preferred-language', newLang);
    };

    return (
        <motion.button
            onClick={toggleLanguage}
            className="relative flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                {lang === 'zh' ? '🇹🇼 中文' : '🇺🇸 EN'}
            </span>
            <motion.div
                className="w-10 h-5 bg-slate-700 rounded-full relative"
                animate={{ backgroundColor: lang === 'zh' ? '#1e293b' : '#38bdf8' }}
            >
                <motion.div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg"
                    animate={{ left: lang === 'zh' ? '2px' : '22px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </motion.div>
        </motion.button>
    );
};

export default LanguageToggle;
