import { Shield, Activity, Radio, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header-gradient border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-risk-low rounded-full border-2 border-card animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                RiskTwin
                <span className="text-primary">India</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Multi-Risk Digital Twin Platform
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-risk-low animate-pulse" />
              <span className="text-muted-foreground">System</span>
              <span className="text-risk-low font-medium">Operational</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Data Feed</span>
              <span className="text-primary font-medium">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border-border bg-card hover:bg-secondary transition-all duration-300"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-primary transition-transform duration-300 hover:-rotate-12" />
              )}
            </Button>

            {/* Removed demo mode UI - application now runs in Live Mode */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
