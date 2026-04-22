import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const MaintenancePage: React.FC = () => {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(10);
  const redirectUrl = 'https://mydhl.express.dhl/th/en/home.html#/getQuoteTab';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-lg w-full border border-white/20">
        <div className="mb-6">
          <img 
            src="/Server.jpg" 
            alt="Service Status" 
            className="mx-auto h-32 w-auto drop-shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-3xl font-bold text-dhl-red mb-4">
          {t('backToNormalTitle' as any)}
        </h1>
        
        <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">
          {t('backToNormalBody1' as any)} <span className="font-bold text-dhl-red text-2xl">{countdown}</span> {t('backToNormalBody2' as any)}
        </p>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('backToNormalBody3' as any)}
          </p>
          <a 
            href={redirectUrl} 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors underline decoration-2 underline-offset-4"
          >
            MyDHL+
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
};
