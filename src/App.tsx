import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { TermsModal } from './components/TermsModal';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ShipPage } from './pages/ShipPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { translations } from './translations';

type Page = 'home' | 'ship' | 'confirmation' | 'maintenance';

const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [activePage, setActivePage] = useState<Page>('home');
  const [isSuspended, setIsSuspended] = useState<boolean | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [shipmentResponse, setShipmentResponse] = useState<any>(null);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.production_mode === false) {
          setIsSuspended(true);
          setActivePage('maintenance');
        } else {
          setIsSuspended(false);
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
        setIsSuspended(false);
      }
    };
    checkConfig();
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('isRefreshed')) {
      sessionStorage.setItem('isRefreshed', 'true');
      window.location.reload();
    }
  }, []);

  // Browser navigation / close / refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activePage === 'ship') {
        const msg = t('leaveSiteBody' as any) || "Changes you made may not be saved.";
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activePage, language, t]);

  const confirmNavigation = () => {
    if (activePage === 'ship') {
      return window.confirm(t('leaveSiteBody' as any) || "Changes you made may not be saved.");
    }
    return true;
  };

  const handleStartShipment = () => {
    setActivePage('ship');
  };

  const handleClearShipper = () => {
    if (window.confirm(translations[language].clearHistoryConfirm)) {
      localStorage.removeItem('shipperData');
      window.location.reload();
    }
  };

  const handleFinishShipment = (response: any) => {
    setShipmentResponse(response);
    setActivePage('confirmation');
  };

  const handleNavigateHome = () => {
    if (confirmNavigation()) {
      setActivePage('home');
    }
  };

  const renderPage = () => {
    if (isSuspended === null) {
      return (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dhl-red"></div>
        </div>
      );
    }

    if (isSuspended) {
      return <MaintenancePage />;
    }

    switch (activePage) {
      case 'ship':
        return <ShipPage onFinish={handleFinishShipment} onBack={() => handleNavigateHome()} />;
      case 'confirmation':
        return <ConfirmationPage response={shipmentResponse} onNewShipment={() => setActivePage('ship')} onBackHome={() => handleNavigateHome()} />;
      case 'maintenance':
        return <MaintenancePage />;
      default:
        return (
          <Hero 
            onOpenTerms={() => setIsTermsModalOpen(true)} 
            consentAccepted={consentAccepted}
            onToggleConsent={setConsentAccepted}
            onStartShipment={handleStartShipment}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-[-1] bg-cover bg-center blur-xl opacity-70 scale-100" style={{ backgroundImage: "url('/SBS_Background.jpg')" }} />
      <div className="fixed inset-0 z-[-1] bg-white/60 dark:bg-gray-200/95 pointer-events-none" />
      <div className="flex flex-col min-h-screen font-sans selection:bg-dhl-yellow selection:text-dhl-red">
        <Header onNavigateHome={() => handleNavigateHome()} onClearShipper={handleClearShipper} />
        
        <main className="flex-grow container mx-auto px-6 py-6 md:py-12 lg:px-20 max-w-7xl">
          {renderPage()}
        </main>

        <Footer />

        <TermsModal 
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={() => {
            setConsentAccepted(true);
            setIsTermsModalOpen(false);
            sessionStorage.setItem('termsAccepted', 'true');
          }}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
