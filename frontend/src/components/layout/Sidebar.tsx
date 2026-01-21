import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  BarChart3, 
  Shield, 
  Settings,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    label: 'Live Feed', 
    path: '/', 
    icon: Radio,
    description: 'Real-time attack monitoring'
  },
  { 
    label: 'Analytics', 
    path: '/analytics', 
    icon: BarChart3,
    description: 'Threat insights & trends'
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">HoneyGuard</h1>
            <p className="text-xs text-muted-foreground">Intelligent Honeypot</p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs text-muted-foreground">System Active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  isActive && "bg-sidebar-accent text-primary"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {item.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span className="text-xs">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
