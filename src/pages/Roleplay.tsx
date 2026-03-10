import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Send, Trash2, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface PlaybookOption {
  id: string;
  title: string;
}

export default function Roleplay() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playbooks, setPlaybooks] = useState<PlaybookOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            playbook_ids: selectedIds,
          }),
        }
      );

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

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
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

  return (
    <>
      <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />

      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4 gap-4">
        {/* Playbook selector */}
        {playbooks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground mt-1" />
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
          </div>
        )}

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
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
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
