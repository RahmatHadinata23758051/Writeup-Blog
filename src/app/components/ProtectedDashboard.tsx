import { useState, useEffect } from 'react';
import { BsShield, BsEye, BsEyeSlash } from 'react-icons/bs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DashboardPage } from './pages/DashboardPage';

interface ProtectedDashboardProps {
  onBack: () => void;
}

const DASHBOARD_PASSWORD = (import.meta as any).env.VITE_DASHBOARD_PASSWORD || 'rblx-labs-2024';

export function ProtectedDashboard({ onBack }: ProtectedDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('dashboard-auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('dashboard-auth', 'true');
      setPassword('');
      setError('');
    } else {
      setError('Password salah!');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dashboard-auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center py-12">
        <div className="mx-auto w-full max-w-sm px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-yellow-600/30 bg-yellow-950/20">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <BsShield className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-center text-2xl">Dashboard Terlindungi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground mb-6">
                Akses dashboard hanya untuk admin. Masukkan password untuk melanjutkan.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <BsEyeSlash className="h-4 w-4" />
                    ) : (
                      <BsEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-950/30 border border-red-600/30 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleLogin}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Masuk
              </Button>

              <Button
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-950/20"
        >
          Logout
        </Button>
      </div>
      <DashboardPage onBack={onBack} />
    </div>
  );
}
