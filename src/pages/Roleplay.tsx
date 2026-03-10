import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Send, Trash2, Loader2, BookOpen, Star, Plus, ArrowLeft } from "lucide-react";
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

export default function Roleplay() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playbooks, setPlaybooks] = useState<PlaybookOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [prospectInfo, setProspectInfo] = useState<{ name: string; company: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Role/methodology selection
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [selectionStep, setSelectionStep] = useState<"role" | "methodology" | "ready">("role");

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

  const togglePlaybook = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRoleSelect = (role: RoleType) => {
    setRoleType(role);
    if (role === "sdr") {
      setMethodology("bant");
      setSelectionStep("ready");
    } else {
      setSelectionStep("methodology");
    }
  };

  const handleMethodologySelect = (m: Methodology) => {
    setMethodology(m);
    setSelectionStep("ready");
  };

  const buildTitle = (score?: number | null) => {
    const methodLabel = methodology?.toUpperCase() || "BANT";
    const scoreStr = score != null ? `${score}/10` : "—";
    if (prospectInfo) {
      return `${prospectInfo.name} (${prospectInfo.company}) · ${methodLabel} · ${scoreStr}`;
    }
    return `Sessão · ${methodLabel} · ${scoreStr}`;
  };

  const saveSession = async (msgs: Msg[]) => {
    if (!user || msgs.length < 2) return null;

    const title = buildTitle();

    if (sessionId) {
      await supabase
        .from("roleplay_sessions")
        .update({ messages: JSON.parse(JSON.stringify(msgs)), title })
        .eq("id", sessionId);
      return sessionId;
    }

    const { data, error } = await supabase
      .from("roleplay_sessions")
      .insert([
        {
          owner_id: user.id,
          title,
          messages: JSON.parse(JSON.stringify(msgs)),
          playbook_ids: selectedIds,
          role_type: roleType,
          methodology: methodology,
        },
      ])
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
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
    setRoleType(null);
    setMethodology(null);
    setSelectionStep("role");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
          methodology: methodology,
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

  const methodologyLabel = methodology?.toUpperCase() || "BANT";

  // Selection screen
  if (selectionStep !== "ready") {
    return (
      <>
        <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6">
            {selectionStep === "role" && (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Escolha o tipo de simulação</h2>
                  <p className="text-sm text-muted-foreground">Selecione seu papel na simulação de vendas</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Card
                    className="p-5 cursor-pointer hover:border-primary transition-colors border-2"
                    onClick={() => handleRoleSelect("sdr")}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">📞 Pré-vendas (SDR)</h3>
                      <p className="text-sm text-muted-foreground">Qualificação de leads usando a metodologia BANT</p>
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1">
                        BANT
                      </span>
                    </div>
                  </Card>
                  <Card
                    className="p-5 cursor-pointer hover:border-primary transition-colors border-2"
                    onClick={() => handleRoleSelect("closer")}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">🤝 Vendas (Closer)</h3>
                      <p className="text-sm text-muted-foreground">Fechamento de negócios com cliente já qualificado</p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          SPIN
                        </span>
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          GPCT
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {selectionStep === "methodology" && (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Escolha a metodologia</h2>
                  <p className="text-sm text-muted-foreground">Qual framework de vendas deseja praticar?</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Card
                    className="p-5 cursor-pointer hover:border-primary transition-colors border-2"
                    onClick={() => handleMethodologySelect("spin")}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">🔄 SPIN Selling</h3>
                      <p className="text-sm text-muted-foreground">Situation → Problem → Implication → Need-Payoff</p>
                    </div>
                  </Card>
                  <Card
                    className="p-5 cursor-pointer hover:border-primary transition-colors border-2"
                    onClick={() => handleMethodologySelect("gpct")}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">🎯 GPCT</h3>
                      <p className="text-sm text-muted-foreground">Goals → Plans → Challenges → Timeline</p>
                    </div>
                  </Card>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoleType(null);
                    setSelectionStep("role");
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />

      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4 gap-4">
        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {roleType === "sdr" ? "SDR" : "Closer"} · {methodologyLabel}
          </span>

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

        {/* Evaluation Result */}
        {evalResult && <MethodologyEvaluation result={evalResult} methodology={methodology || "bant"} />}

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
