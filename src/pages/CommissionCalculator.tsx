import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function getMultiplier(pct: number): { multiplier: number; label: string; color: string } {
  if (pct <= 0.70) return { multiplier: 0, label: "Sem comissão", color: "text-destructive" };
  if (pct <= 0.85) return { multiplier: 0.5, label: "x0,5 — Metade", color: "text-orange-500" };
  if (pct <= 0.99) return { multiplier: 0.7, label: "x0,7 — Quase lá", color: "text-yellow-500" };
  if (pct <= 1.19) return { multiplier: 1, label: "x1 — Meta batida", color: "text-primary" };
  return { multiplier: 2, label: "x2 — Acelerador", color: "text-emerald-500" };
}

function fmtCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

/* ─── SDR ─── */
const SDR_FIXED = 3000;
const SDR_VARIABLE = 2000;

function SDRCalculator() {
  const [r1sRealizados, setR1sRealizados] = useState("");
  const [mqls, setMqls] = useState("");
  const [r1sAgendados, setR1sAgendados] = useState("");

  const r1sNum = parseFloat(r1sRealizados) || 0;
  const mqlsNum = parseFloat(mqls) || 0;
  const r1sAgNum = parseFloat(r1sAgendados) || 0;

  // Critério 1: R1s Realizados — meta 50
  const r1Pct = r1sNum / 50;
  const r1Mult = getMultiplier(r1Pct);
  const r1Base = 1400;
  const r1Commission = r1Base * r1Mult.multiplier;

  // Critério 2: Taxa MQL→R1 Agendado — meta 50%
  const conversionRate = mqlsNum > 0 ? r1sAgNum / mqlsNum : 0;
  const convPct = conversionRate / 0.5; // meta é 50%
  const convMult = getMultiplier(convPct);
  const convBase = 600;
  const convCommission = convBase * convMult.multiplier;

  const totalVariable = r1Commission + convCommission;
  const totalEarnings = SDR_FIXED + totalVariable;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Preencha seus números</CardTitle>
          <p className="text-xs text-muted-foreground">Fixo: {fmtCurrency(SDR_FIXED)} | Variável alvo: {fmtCurrency(SDR_VARIABLE)} | OTE: {fmtCurrency(SDR_FIXED + SDR_VARIABLE)}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">R1s Realizados no mês</label>
            <p className="text-xs text-muted-foreground">Meta: 50 | Peso: 70% (base {fmtCurrency(r1Base)})</p>
            <Input type="number" min={0} placeholder="0" value={r1sRealizados} onChange={(e) => setR1sRealizados(e.target.value)} className="max-w-[200px]" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Taxa MQL → R1 Agendado</label>
            <p className="text-xs text-muted-foreground">Meta: 50% de conversão | Peso: 30% (base {fmtCurrency(convBase)})</p>
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">MQLs recebidos</span>
                <Input type="number" min={0} placeholder="0" value={mqls} onChange={(e) => setMqls(e.target.value)} className="max-w-[140px]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">R1s agendados</span>
                <Input type="number" min={0} placeholder="0" value={r1sAgendados} onChange={(e) => setR1sAgendados(e.target.value)} className="max-w-[140px]" />
              </div>
              {mqlsNum > 0 && (
                <span className="text-sm font-medium text-foreground mt-4">= {(conversionRate * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CriterionCard
          title="R1s Realizados"
          achieved={r1sNum}
          target={50}
          unit=""
          pct={r1Pct}
          mult={r1Mult}
          base={r1Base}
          commission={r1Commission}
        />
        <CriterionCard
          title="Taxa MQL → R1"
          achieved={mqlsNum > 0 ? conversionRate * 100 : 0}
          target={50}
          unit="%"
          pct={convPct}
          mult={convMult}
          base={convBase}
          commission={convCommission}
        />
      </div>

      <TotalCard fixed={SDR_FIXED} variable={totalVariable} total={totalEarnings} oteMax={7000} />
    </div>
  );
}

/* ─── CLOSER ─── */
const CLOSER_FIXED = 5000;
const CLOSER_VARIABLE = 5000;

function CloserCalculator() {
  const [mrrAdded, setMrrAdded] = useState("");
  const [r2sRealizadas, setR2sRealizadas] = useState("");
  const [vendasFechadas, setVendasFechadas] = useState("");
  const [ticketMedio, setTicketMedio] = useState("");

  const mrrNum = parseFloat(mrrAdded) || 0;
  const r2sNum = parseFloat(r2sRealizadas) || 0;
  const vendasNum = parseFloat(vendasFechadas) || 0;
  const ticketNum = parseFloat(ticketMedio) || 0;

  // Critério 1: MRR Adicionado — meta R$30.000
  const mrrPct = mrrNum / 30000;
  const mrrMult = getMultiplier(mrrPct);
  const mrrBase = 3000;
  const mrrCommission = mrrBase * mrrMult.multiplier;

  // Critério 2: Taxa R2→Venda — meta 30%
  const r2Rate = r2sNum > 0 ? vendasNum / r2sNum : 0;
  const r2Pct = r2Rate / 0.3;
  const r2Mult = getMultiplier(r2Pct);
  const r2Base = 1000;
  const r2Commission = r2Base * r2Mult.multiplier;

  // Critério 3: Ticket Médio Gate — binário
  const ticketGate = ticketNum >= 3000;
  const ticketBase = 1000;
  const ticketCommission = ticketGate ? ticketBase : 0;

  const totalVariable = mrrCommission + r2Commission + ticketCommission;
  const totalEarnings = CLOSER_FIXED + totalVariable;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Preencha seus números</CardTitle>
          <p className="text-xs text-muted-foreground">Fixo: {fmtCurrency(CLOSER_FIXED)} | Variável alvo: {fmtCurrency(CLOSER_VARIABLE)} | OTE: {fmtCurrency(CLOSER_FIXED + CLOSER_VARIABLE)}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">MRR Adicionado no mês (R$)</label>
            <p className="text-xs text-muted-foreground">Meta: {fmtCurrency(30000)} | Peso: 60% (base {fmtCurrency(mrrBase)})</p>
            <Input type="number" min={0} placeholder="0" value={mrrAdded} onChange={(e) => setMrrAdded(e.target.value)} className="max-w-[200px]" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Taxa R2 → Venda</label>
            <p className="text-xs text-muted-foreground">Meta: 30% de conversão | Peso: 20% (base {fmtCurrency(r2Base)})</p>
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">R2s realizadas</span>
                <Input type="number" min={0} placeholder="0" value={r2sRealizadas} onChange={(e) => setR2sRealizadas(e.target.value)} className="max-w-[140px]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground">Vendas fechadas</span>
                <Input type="number" min={0} placeholder="0" value={vendasFechadas} onChange={(e) => setVendasFechadas(e.target.value)} className="max-w-[140px]" />
              </div>
              {r2sNum > 0 && (
                <span className="text-sm font-medium text-foreground mt-4">= {(r2Rate * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Ticket Médio do mês (R$)</label>
            <p className="text-xs text-muted-foreground">Gate: ≥ {fmtCurrency(3000)} para liberar | Peso: 20% (base {fmtCurrency(ticketBase)})</p>
            <Input type="number" min={0} placeholder="0" value={ticketMedio} onChange={(e) => setTicketMedio(e.target.value)} className="max-w-[200px]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CriterionCard
          title="MRR Adicionado"
          achieved={mrrNum}
          target={30000}
          unit="R$"
          pct={mrrPct}
          mult={mrrMult}
          base={mrrBase}
          commission={mrrCommission}
          isCurrency
        />
        <CriterionCard
          title="Taxa R2 → Venda"
          achieved={r2sNum > 0 ? r2Rate * 100 : 0}
          target={30}
          unit="%"
          pct={r2Pct}
          mult={r2Mult}
          base={r2Base}
          commission={r2Commission}
        />
        <GateCard
          title="Ticket Médio (Gate)"
          value={ticketNum}
          threshold={3000}
          passed={ticketGate}
          base={ticketBase}
          commission={ticketCommission}
        />
      </div>

      <TotalCard fixed={CLOSER_FIXED} variable={totalVariable} total={totalEarnings} oteMax={15000} />
    </div>
  );
}

/* ─── Currency mask helpers ─── */

function parseCurrencyInput(raw: string): number {
  // Remove tudo exceto dígitos
  const digits = raw.replace(/\D/g, "");
  return parseInt(digits, 10) || 0;
}

function formatCurrencyInput(cents: number): string {
  if (cents === 0) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── SDR & Closer (Simple) ─── */

function SDRCloserSimple() {
  const [sdrCents, setSdrCents] = useState(0);
  const [closerCents, setCloserCents] = useState(0);

  const sdrMrrNum = sdrCents / 100;
  const closerMrrNum = closerCents / 100;

  const sdrCommission = sdrMrrNum * 0.10;
  const closerCommission = closerMrrNum * 0.25;

  const handleChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseCurrencyInput(e.target.value));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">SDR — 10% do MRR</CardTitle>
            <p className="text-xs text-muted-foreground">Comissão de 10% sobre o MRR adicionado</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">MRR Adicionado</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={sdrCents ? `R$ ${formatCurrencyInput(sdrCents)}` : ""}
                onChange={handleChange(setSdrCents)}
                className="max-w-[220px]"
              />
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Comissão</span>
              <span className="font-display text-2xl font-bold text-primary">{fmtCurrency(sdrCommission)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Closer — 25% do MRR</CardTitle>
            <p className="text-xs text-muted-foreground">Comissão de 25% sobre o MRR adicionado</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">MRR Adicionado</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={closerCents ? `R$ ${formatCurrencyInput(closerCents)}` : ""}
                onChange={handleChange(setCloserCents)}
                className="max-w-[220px]"
              />
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Comissão</span>
              <span className="font-display text-2xl font-bold text-primary">{fmtCurrency(closerCommission)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Shared components ─── */

function CriterionCard({ title, achieved, target, unit, pct, mult, base, commission, isCurrency }: {
  title: string; achieved: number; target: number; unit: string; pct: number;
  mult: { multiplier: number; label: string; color: string }; base: number; commission: number; isCurrency?: boolean;
}) {
  const achievedDisplay = isCurrency ? fmtCurrency(achieved) : `${achieved.toFixed(unit === "%" ? 1 : 0)}${unit}`;
  const targetDisplay = isCurrency ? fmtCurrency(target) : `${target}${unit}`;

  return (
    <Card className="bg-card">
      <CardContent className="pt-5 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold text-foreground">{achievedDisplay}</span>
          <span className="text-xs text-muted-foreground">meta {targetDisplay}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Atingimento: {fmtPct(pct)}</span>
          <Badge variant="outline" className={mult.color}>{mult.label}</Badge>
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Base {fmtCurrency(base)} × {mult.multiplier}</span>
          <span className="font-display text-lg font-bold text-foreground">{fmtCurrency(commission)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GateCard({ title, value, threshold, passed, base, commission }: {
  title: string; value: number; threshold: number; passed: boolean; base: number; commission: number;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="pt-5 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold text-foreground">{fmtCurrency(value)}</span>
          <span className="text-xs text-muted-foreground">gate ≥ {fmtCurrency(threshold)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={passed ? "default" : "destructive"}>
            {passed ? "✓ Liberado" : "✗ Bloqueado"}
          </Badge>
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Base {fmtCurrency(base)}</span>
          <span className="font-display text-lg font-bold text-foreground">{fmtCurrency(commission)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TotalCard({ fixed, variable, total, oteMax }: { fixed: number; variable: number; total: number; oteMax: number }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Fixo</p>
            <p className="font-display text-xl font-bold text-foreground">{fmtCurrency(fixed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Variável</p>
            <p className="font-display text-xl font-bold text-foreground">{fmtCurrency(variable)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</p>
            <p className="font-display text-2xl font-bold text-primary">{fmtCurrency(total)}</p>
            <p className="text-[10px] text-muted-foreground">máx. {fmtCurrency(oteMax)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ADMIN_EMAIL = "eduardo@allmamarketing.com.br";

export default function CommissionCalculator() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <Topbar title="Calculadora de Comissão" description="Simule seus ganhos com base no modelo OTE" onMenuClick={onMenuClick} />
      <div className="p-6 lg:p-8 max-w-5xl space-y-6">
        <Tabs defaultValue="sdr-closer">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="sdr-closer" className="flex-1">SDR & Closer</TabsTrigger>
            <TabsTrigger value="sdr" className="flex-1 opacity-50 pointer-events-none" disabled>
              SDR 🔒
            </TabsTrigger>
            <TabsTrigger value="closer" className="flex-1 opacity-50 pointer-events-none" disabled>
              Closer 🔒
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sdr-closer" className="mt-6">
            <SDRCloserSimple />
          </TabsContent>
          <TabsContent value="sdr" className="mt-6">
            <SDRCalculator />
          </TabsContent>
          <TabsContent value="closer" className="mt-6">
            <CloserCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
