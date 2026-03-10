import { useOutletContext } from "react-router-dom";
import Topbar from "@/components/layout/Topbar";

const pages: Record<string, { title: string; description: string }> = {
  calculator: { title: "Calculator", description: "Calculadora comercial" },
  roleplay: { title: "Roleplay", description: "Simulação de vendas" },
  playbooks: { title: "Playbooks", description: "Guias e processos" },
};

export default function Placeholder({ page }: { page: string }) {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const info = pages[page] ?? { title: page, description: "" };

  return (
    <>
      <Topbar title={info.title} description={info.description} onMenuClick={onMenuClick} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-lg text-muted-foreground">Em breve</p>
        </div>
      </div>
    </>
  );
}
