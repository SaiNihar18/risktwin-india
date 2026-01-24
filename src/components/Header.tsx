import { Shield, Activity, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  demoMode: boolean;
  onDemoModeChange: (enabled: boolean) => void;
}

const Header = ({ demoMode, onDemoModeChange }: HeaderProps) => {
  return (
    <header className="header-gradient border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-risk-low rounded-full border-2 border-background animate-pulse" />
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

          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2 border border-border/50">
            <Label 
              htmlFor="demo-mode" 
              className="text-sm font-medium cursor-pointer"
            >
              Demo Mode
            </Label>
            <Switch
              id="demo-mode"
              checked={demoMode}
              onCheckedChange={onDemoModeChange}
              className="data-[state=checked]:bg-primary"
            />
            {demoMode && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                ON
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
