import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

const links = [
  { to: "/dashboard", label: "Painel" },
  { to: "/calculator", label: "Calculadora" },
  { to: "/roleplay", label: "Roleplay" },
  { to: "/roleplay/history", label: "Histórico" },
  { to: "/playbooks", label: "Playbooks" },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { signOut, profile } = useAuth();

  return (
    <aside className="flex flex-col h-full bg-background px-6 py-8">
      <div className="mb-12">
        <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
          Allma
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Painel Comercial</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        {profile?.name && (
          <p className="text-xs text-muted-foreground mb-3 truncate">
            {profile.name}
          </p>
        )}
        <button
          onClick={signOut}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
