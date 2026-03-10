import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STAGES = [
  { key: "leads", label: "Leads" },
  { key: "mqls", label: "MQLs (Qualificados)" },
  { key: "r1Scheduled", label: "Alinhamentos (R1) Agendados" },
  { key: "r1Held", label: "Alinhamentos (R1) Realizados" },
  { key: "r2Scheduled", label: "Propostas (R2) Agendadas" },
  { key: "r2Held", label: "Propostas (R2) Realizadas" },
  { key: "contracts", label: "Contratos" },
  { key: "sales", label: "Vendas" },
  { key: "ticket", label: "Ticket Médio (R$)" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const RATES: Record<string, number> = {
  mqls: 0.4,
  r1Scheduled: 0.5,
  r1Held: 0.8,
  r2Scheduled: 0.75,
  r2Held: 0.95,
  contracts: 0.3,
  sales: 0.9,
};

const DEFAULT_TICKET = 3000;

function fmt(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

function fmtCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export default function Calculator() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();

  const [values, setValues] = useState<Record<StageKey, string>>({
    leads: "",
    mqls: "",
    r1Scheduled: "",
    r1Held: "",
    r2Scheduled: "",
    r2Held: "",
    contracts: "",
    sales: "",
    ticket: "",
  });

  const set = (key: StageKey, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const num = (key: StageKey) => {
    const n = parseFloat(values[key]);
    return isNaN(n) ? 0 : n;
  };

  const ref = useMemo(() => {
    const leads = num("leads");
    const mqls = leads * RATES.mqls;
    const r1Scheduled = mqls * RATES.r1Scheduled;
    const r1Held = r1Scheduled * RATES.r1Held;
    const r2Scheduled = r1Held * RATES.r2Scheduled;
    const r2Held = r2Scheduled * RATES.r2Held;
    const contracts = r2Held * RATES.contracts;
    const sales = contracts * RATES.sales;
    return {
      leads,
      mqls,
      r1Scheduled,
      r1Held,
      r2Scheduled,
      r2Held,
      contracts,
      sales,
      ticket: DEFAULT_TICKET,
    };
  }, [values.leads]);

  const simSales = num("sales");
  const simTicket = num("ticket") || 0;
  const simMRR = simSales * simTicket;
  const simLTV = simMRR * 6;

  const refMRR = ref.sales * DEFAULT_TICKET;
  const refLTV = refMRR * 6;

  return (
    <>
      <Topbar title="Calculadora" description="Calculadora comercial" onMenuClick={onMenuClick} />

      <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
        {/* Funnel inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — User simulation */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sua Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {STAGES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground w-56 flex-shrink-0">{label}</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={values[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="max-w-[140px]"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right — Allma reference */}
          <Card className="border-dashed opacity-90">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Referência Allma</CardTitle>
              <p className="text-xs text-muted-foreground">Calculado a partir dos seus Leads</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {STAGES.map(({ key, label }) => {
                const val = key === "ticket" ? fmtCurrency(ref.ticket) : fmt(ref[key]);
                const rate = RATES[key];
                const pct = rate && key !== "leads" ? `(${(rate * 100).toFixed(0)}%)` : "";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-56 flex-shrink-0">
                      {label} {pct && <span className="text-xs opacity-60">{pct}</span>}
                    </span>
                    <span className="text-sm font-medium text-foreground">{val}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Output cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <OutputCard
            label="Clientes"
            sim={fmt(simSales)}
            ref_={fmt(ref.sales)}
          />
          <OutputCard
            label="MRR"
            sim={fmtCurrency(simMRR)}
            ref_={fmtCurrency(refMRR)}
          />
          <OutputCard
            label="Receita LTV"
            sim={fmtCurrency(simLTV)}
            ref_={fmtCurrency(refLTV)}
            subtitle="MRR × 6 meses"
          />
        </div>
      </div>
    </>
  );
}

function OutputCard({ label, sim, ref_, subtitle }: { label: string; sim: string; ref_: string; subtitle?: string }) {
  return (
    <div className="bg-card rounded-lg p-5 animate-fade-in">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mb-2">{subtitle}</p>}
      <p className="font-display text-2xl font-bold text-foreground">{sim}</p>
      <p className="text-xs text-muted-foreground mt-1">Ref. Allma: {ref_}</p>
    </div>
  );
}
