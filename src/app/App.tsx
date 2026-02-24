import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AnimatedBackground } from './components/AnimatedBackground';
import { HomePage } from './components/pages/HomePage';
import { WriteUpsPage } from './components/pages/WriteUpsPage';
import { WriteUpDetailPage } from './components/pages/WriteUpDetailPage';
import { AboutPage } from './components/pages/AboutPage';
import { FormulaDemoPage } from './components/pages/FormulaDemoPage';
import { ProtectedDashboard } from './components/ProtectedDashboard';
import { useSEO } from './hooks/useSEO';

type Page = 'home' | 'writeups' | 'writeup-detail' | 'about' | 'formula-demo' | 'dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedWriteUpId, setSelectedWriteUpId] = useState<string | null>(null);

  // Add dark class to html element on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Update SEO meta tags based on current page
  useEffect(() => {
    switch (currentPage) {
      case 'home':
        useSEO(undefined, 'home');
        break;
      case 'writeups':
        useSEO(undefined, 'writeups');
        break;
      case 'about':
        useSEO(undefined, 'about');
        break;
      case 'formula-demo':
        useSEO({
          title: 'Formula Demo - Interactive Mathematical Visualization',
          description: 'Interactive formula demonstration page showcasing KaTeX mathematical rendering and visualization.',
          type: 'website',
        });
        break;
      case 'dashboard':
      case 'writeup-detail':
        // Will be handled by respective page components
        break;
    }
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWriteUp = (id: string) => {
    setSelectedWriteUpId(id);
    setCurrentPage('writeup-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToWriteUps = () => {
    setCurrentPage('writeups');
    setSelectedWriteUpId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onNavigate={handleNavigate}
            onSelectWriteUp={handleSelectWriteUp}
          />
        );
      case 'writeups':
        return <WriteUpsPage onSelectWriteUp={handleSelectWriteUp} />;
      case 'writeup-detail':
        return selectedWriteUpId ? (
          <WriteUpDetailPage
            writeupId={selectedWriteUpId}
            onBack={handleBackToWriteUps}
          />
        ) : null;
      case 'about':
        return <AboutPage />;
      case 'formula-demo':
        return <FormulaDemoPage />;
      case 'dashboard':
        return (
          <ProtectedDashboard
            onBack={() => handleNavigate('home')}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            onSelectWriteUp={handleSelectWriteUp}
          />
        );
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative flex min-h-screen flex-col">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1">{renderPage()}</main>
        <Footer />
      </div>
    </>
  );
}
