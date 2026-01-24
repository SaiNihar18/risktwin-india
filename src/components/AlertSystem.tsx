import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Alert } from '@/types/risk';
import { format } from 'date-fns';

interface AlertSystemProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

const AlertCard = ({ 
  alert, 
  onDismiss 
}: { 
  alert: Alert; 
  onDismiss?: () => void;
}) => {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'danger':
        return {
          bg: 'bg-gradient-to-r from-risk-high/20 to-risk-high/10',
          border: 'border-risk-high/50',
          icon: <AlertTriangle className="w-5 h-5 text-risk-high" />,
          titleColor: 'text-risk-high',
        };
      case 'severe':
        return {
          bg: 'bg-gradient-to-r from-alert-severe/20 to-alert-severe/10',
          border: 'border-alert-severe/50',
          icon: <AlertCircle className="w-5 h-5 text-alert-severe" />,
          titleColor: 'text-alert-severe',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-alert-warning/20 to-alert-warning/10',
          border: 'border-alert-warning/50',
          icon: <AlertTriangle className="w-5 h-5 text-alert-warning" />,
          titleColor: 'text-alert-warning',
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-alert-info/20 to-alert-info/10',
          border: 'border-alert-info/50',
          icon: <Info className="w-5 h-5 text-alert-info" />,
          titleColor: 'text-alert-info',
        };
    }
  };

  const styles = getAlertStyles();
  const isPulsing = alert.type === 'danger' || alert.type === 'severe';

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-4 border
        ${styles.bg} ${styles.border}
        ${isPulsing ? 'pulse-alert' : ''}
        transition-all duration-300 slide-in-right
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${styles.titleColor}`}>
              {alert.title}
            </h3>
            <span className="text-xs text-muted-foreground">
              {format(alert.timestamp, 'HH:mm')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {alert.message}
          </p>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-white/10"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Animated border for severe alerts */}
      {isPulsing && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute inset-0 border-2 ${styles.border} rounded-xl animate-ping opacity-30`} />
        </div>
      )}
    </div>
  );
};

const AlertSystem = ({ alerts, onDismiss }: AlertSystemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));
  const criticalAlerts = activeAlerts.filter(a => a.type === 'danger' || a.type === 'severe');
  const otherAlerts = activeAlerts.filter(a => a.type !== 'danger' && a.type !== 'severe');

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-primary" />
            {criticalAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-risk-high rounded-full animate-pulse" />
            )}
          </div>
          <h2 className="font-semibold">Active Alerts</h2>
          <span className="text-sm text-muted-foreground">
            ({activeAlerts.length})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <span className="text-xs bg-risk-high/20 text-risk-high px-2 py-1 rounded-full font-medium">
              {criticalAlerts.length} Critical
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Alerts List */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Critical Alerts First */}
          {criticalAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onDismiss={() => handleDismiss(alert.id)}
            />
          ))}
          
          {/* Other Alerts */}
          {otherAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onDismiss={() => handleDismiss(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertSystem;
