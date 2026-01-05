import { BsList, BsX, BsLightningCharge } from 'react-icons/bs';
import { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', page: 'home' },
    { name: 'Write-Ups', page: 'writeups' },
    { name: 'About', page: 'about' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-transparent backdrop-blur supports-[backdrop-filter]:bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <BsLightningCharge className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-mono">RBLX-Labs Segfault</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentPage === item.page
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </button>
            ))}
            <button
              onClick={() => onNavigate('dashboard')}
              className={`ml-2 px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                currentPage === 'dashboard'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <BsLightningCharge className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-2 text-foreground hover:bg-accent"
          >
            {mobileMenuOpen ? (
              <BsX className="h-6 w-6" />
            ) : (
              <BsList className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`block w-full rounded-md px-3 py-2 text-left transition-colors flex items-center gap-2 ${
                currentPage === 'dashboard'
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <BsLightningCharge className="h-4 w-4" />
              Dashboard
            </button>
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${
                  currentPage === item.page
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}