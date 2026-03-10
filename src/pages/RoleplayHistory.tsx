import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import BANTEvaluation from "@/components/roleplay/BANTEvaluation";

interface Session {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  score: number | null;
  bant_feedback: string | null;
  created_at: string;
}

export default function RoleplayHistory() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("roleplay_sessions")
      .select("id, title, messages, score, bant_feedback, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSessions((data as unknown as Session[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const bantResult = selected?.bant_feedback
    ? (() => {
        try {
          const evaluation = JSON.parse(selected.bant_feedback);
          return { score: selected.score ?? 0, evaluation };
        } catch {
          return null;
        }
      })()
    : null;

  if (selected) {
    return (
      <>
        <Topbar title="Histórico" description={selected.title} onMenuClick={onMenuClick} />
        <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4 gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="self-start">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          {bantResult && <BANTEvaluation result={bantResult} />}

          <ScrollArea className="flex-1">
            <div className="space-y-4 pb-4">
              {selected.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground"
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
            </div>
          </ScrollArea>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Histórico" description="Sessões de roleplay anteriores" onMenuClick={onMenuClick} />
      <div className="px-6 lg:px-8 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma sessão de roleplay salva.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelected(s)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    {" · "}
                    {(s.messages?.length ?? 0)} mensagens
                  </p>
                </div>
                {s.score !== null && (
                  <span className={`text-lg font-bold ${
                    s.score >= 8 ? "text-green-400" : s.score >= 5 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {s.score}/10
                  </span>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
