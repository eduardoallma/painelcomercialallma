import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Trash2, ChevronLeft, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import MethodologyEvaluation from "@/components/roleplay/MethodologyEvaluation";

export interface HistorySession {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  score: number | null;
  bant_feedback: string | null;
  methodology: string | null;
  created_at: string;
}

interface Props {
  sessions: HistorySession[];
  loading: boolean;
  onDeleted: (id: string) => void;
  onEvaluate?: (session: HistorySession) => void;
  evaluatingId?: string | null;
}

export default function SessionHistory({ sessions, loading, onDeleted, onEvaluate, evaluatingId }: Props) {
  const [selected, setSelected] = useState<HistorySession | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("roleplay_sessions").delete().eq("id", id);
    onDeleted(id);
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  const evalResult = selected?.bant_feedback
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
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background pb-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar ao histórico
          </Button>
          {selected.score === null && onEvaluate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEvaluate(selected)}
              disabled={evaluatingId === selected.id}
            >
              {evaluatingId === selected.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Star className="h-4 w-4 mr-1" />
              )}
              Avaliar
            </Button>
          )}
        </div>

        <p className="text-sm font-medium text-foreground">{selected.title}</p>

        {showEvaluation && evalResult && (
          <MethodologyEvaluation
            result={evalResult}
            methodology={(selected.methodology as "bant" | "spin" | "gpct") || "bant"}
            onClose={() => setShowEvaluation(false)}
          />
        )}

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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">Nenhuma sessão salva.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {sessions.map((s) => (
        <Card
          key={s.id}
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => { setSelected(s); setShowEvaluation(true); }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(s.created_at).toLocaleDateString("pt-BR")}
              {" · "}
              {(s.messages?.length ?? 0)} mensagens
            </p>
          </div>

          <div className="flex items-center gap-3 ml-3">
            {s.score !== null && (
              <span className={`text-lg font-bold ${
                s.score >= 8 ? "text-green-400" : s.score >= 5 ? "text-yellow-400" : "text-red-400"
              }`}>
                {s.score}/10
              </span>
            )}

            {s.score === null && onEvaluate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={(e) => { e.stopPropagation(); onEvaluate(s); }}
                disabled={evaluatingId === s.id}
              >
                {evaluatingId === s.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                  disabled={deleting === s.id}
                >
                  {deleting === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. A sessão e sua avaliação serão removidas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(s.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ))}
    </div>
  );
}
