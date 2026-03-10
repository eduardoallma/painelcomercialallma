import { useOutletContext } from "react-router-dom";
import Topbar from "@/components/layout/Topbar";

export default function CommissionCalculator() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();

  return (
    <>
      <Topbar title="Calculadora de Comissão" description="Cálculo de comissões" onMenuClick={onMenuClick} />
      <div className="flex-1 flex items-center justify-center">
        <p className="font-display text-lg text-muted-foreground">Em breve</p>
      </div>
    </>
  );
}
