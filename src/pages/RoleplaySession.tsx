import { useEffect, useRef, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Send, Trash2, Loader2, BookOpen, Star, Plus, ArrowLeft, User, Building2, Target, TrendingUp, AlertCircle, Clock, Briefcase } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import ReactMarkdown from "react-markdown";
import MethodologyEvaluation from "@/components/roleplay/MethodologyEvaluation";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface PlaybookOption {
  id: string;
  title: string;
}

type RoleType = "sdr" | "closer";
type Methodology = "bant" | "spin" | "gpct";

interface EvalResult {
  score: number;
  evaluation: Record<string, any>;
  methodology?: Methodology;
}

interface ProspectInfo {
  name: string;
  company: string;
  role: string;
  segment: string;
  trafficInvestment: string;
  trafficResult: string;
  mainChallenge: string;
  position?: string;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RoleplaySession() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playbooks, setPlaybooks] = useState<PlaybookOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [prospectInfo, setProspectInfo] = useState<ProspectInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Timer
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Role/methodology — SDR+BANT auto-selected
  const roleType: RoleType = "sdr";
  const methodology: Methodology = "bant";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("playbooks")
      .select("id, title")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPlaybooks(data ?? []));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStartTime]);

  const togglePlaybook = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const buildTitle = (score?: number | null) => {
    const methodLabel = methodology.toUpperCase();
    const scoreStr = score != null ? `${score}/10` : "—";
    if (prospectInfo) {
      return `${prospectInfo.name} (${prospectInfo.company}) · ${methodLabel} · ${scoreStr}`;
    }
    return `Sessão · ${methodLabel} · ${scoreStr}`;
  };

  const saveSession = async (msgs: Msg[]) => {
    if (!user || msgs.length < 2) return null;
    const title = buildTitle();
    const duration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : null;

    if (sessionId) {
      await supabase
        .from("roleplay_sessions")
        .update({ messages: JSON.parse(JSON.stringify(msgs)), title, duration_seconds: duration })
        .eq("id", sessionId);
      return sessionId;
    }

    const { data, error } = await supabase
      .from("roleplay_sessions")
      .insert([{
        owner_id: user.id,
        title,
        messages: JSON.parse(JSON.stringify(msgs)),
        playbook_ids: selectedIds,
        role_type: roleType,
        methodology,
        duration_seconds: duration,
      }])
      .select("id")
      .single();

    if (error || !data) {
      console.error("Save session error:", error);
      return null;
    }
    setSessionId(data.id);
    return data.id;
  };

  const evaluateSession = async () => {
    if (!user || messages.length < 2) return;
    setIsEvaluating(true);
    try {
      const sid = await saveSession(messages);
      if (!sid) throw new Error("Falha ao salvar sessão");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-roleplay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ session_id: sid }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const result: EvalResult = await resp.json();
      setEvalResult(result);

      const methodLabel = methodology.toUpperCase();
      const scoreStr = `${result.score}/10`;
      const updatedTitle = prospectInfo
        ? `${prospectInfo.name} (${prospectInfo.company}) · ${methodLabel} · ${scoreStr}`
        : `Sessão · ${methodLabel} · ${scoreStr}`;
      await supabase.from("roleplay_sessions").update({ title: updatedTitle }).eq("id", sid);

      toast({ title: `Avaliação concluída: ${result.score}/10` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro na avaliação", description: e.message, variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(null);
    setEvalResult(null);
    setInput("");
    setProspectInfo(null);
    setSessionStartTime(null);
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          playbook_ids: selectedIds,
          role_type: roleType,
          methodology,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const content = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.meta) {
              setProspectInfo({
                name: parsed.meta.prospect_name,
                company: parsed.meta.prospect_company,
                role: parsed.meta.prospect_role,
                segment: parsed.meta.segment,
                trafficInvestment: parsed.meta.trafficInvestment,
                trafficResult: parsed.meta.trafficResult,
                mainChallenge: parsed.meta.mainChallenge,
                position: parsed.meta.position,
              });
              continue;
            }
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (const raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.meta) continue;
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }

      const finalMessages = [...allMessages, { role: "assistant" as const, content: assistantSoFar }];
      void saveSession(finalMessages);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro no chat", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const methodologyLabel = methodology.toUpperCase();

  return (
    <>
      <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />

      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4 gap-4">
        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/roleplay")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            SDR · {methodologyLabel}
          </span>

          {sessionStartTime && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              {formatTimer(elapsedSeconds)}
            </span>
          )}

          {playbooks.length > 0 && (
            <>
              <BookOpen className="h-4 w-4 text-muted-foreground ml-2" />
              {playbooks.map((pb) => (
                <button
                  key={pb.id}
                  onClick={() => togglePlaybook(pb.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedIds.includes(pb.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {pb.title}
                </button>
              ))}
            </>
          )}

          <div className="ml-auto flex gap-2">
            {messages.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={startNewSession}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Sessão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={evaluateSession}
                  disabled={isEvaluating || messages.length < 2}
                >
                  {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                  Avaliar {methodologyLabel}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Lead Info HoverCard */}
        {prospectInfo && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-yellow-500/50 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                <User className="h-3 w-3" />
                {prospectInfo.name} · {prospectInfo.company}
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 border-yellow-500/50 bg-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{prospectInfo.name}</h4>
                    <p className="text-xs text-yellow-500">{prospectInfo.role}</p>
                  </div>
                </div>
                {prospectInfo.position && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Briefcase className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Cargo: {prospectInfo.position}</span>
                  </div>
                )}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{prospectInfo.company} · {prospectInfo.segment}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Investimento: {prospectInfo.trafficInvestment}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Resultado: {prospectInfo.trafficResult}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      {prospectInfo.mainChallenge === "Todas as opções acima" ? (
                        <div className="space-y-1">
                          <span className="font-medium text-yellow-500">Desafios:</span>
                          <ul className="list-disc list-inside space-y-0.5 pl-1">
                            <li>Dependência de indicações para fechar novas vendas</li>
                            <li>Falta de previsibilidade</li>
                            <li>Receio de investir mais em Tráfego, sem segurança de resultados</li>
                            <li>Dificuldade em contratar e reter um Time de Marketing qualificado</li>
                          </ul>
                        </div>
                      ) : (
                        <span>Desafio: {prospectInfo.mainChallenge}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {/* Evaluation Result */}
        {evalResult && <MethodologyEvaluation result={evalResult} methodology={methodology} />}

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">
                  Selecione playbooks acima e inicie uma conversa de roleplay.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 items-end">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([])}
              className="text-muted-foreground flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button onClick={send} disabled={!input.trim() || isLoading} size="icon" className="flex-shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}
