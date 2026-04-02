import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import SessionHistory, { type HistorySession } from "@/components/roleplay/SessionHistory";

export default function Roleplay() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [evaluatingHistoryId, setEvaluatingHistoryId] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    if (!user) return;
    supabase
      .from("roleplay_sessions")
      .select("id, title, messages, score, bant_feedback, methodology, created_at, duration_seconds")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHistorySessions((data as unknown as HistorySession[]) ?? []);
        setHistoryLoading(false);
      });
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const evaluateHistorySession = async (session: HistorySession) => {
    if (!user) return;
    setEvaluatingHistoryId(session.id);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error("Sessão expirada");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-roleplay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ session_id: session.id }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const result = await resp.json();
      toast({ title: `Avaliação concluída: ${result.score}/10` });
      loadHistory();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro na avaliação", description: e.message, variant: "destructive" });
    } finally {
      setEvaluatingHistoryId(null);
    }
  };

  return (
    <>
      <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />

      <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Histórico de sessões</h2>
          <Button onClick={() => navigate("/roleplay/session")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Treinamento
          </Button>
        </div>

        <SessionHistory
          sessions={historySessions}
          loading={historyLoading}
          onDeleted={(id) => setHistorySessions((prev) => prev.filter((s) => s.id !== id))}
          onEvaluate={evaluateHistorySession}
          evaluatingId={evaluatingHistoryId}
        />
      </div>
    </>
  );
}
