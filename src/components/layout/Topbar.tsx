import { Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  description?: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, description, onMenuClick }: TopbarProps) {
  return (
    <header className="h-16 flex items-center gap-4 px-6 lg:px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
