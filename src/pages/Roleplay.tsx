import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "@/components/layout/Topbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SendHorizonal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SCENARIOS: Record<string, { label: string; prompt: string }> = {
  default: {
    label: "Cliente genérico",
    prompt: `Você é um cliente em potencial. O vendedor está tentando te vender um produto ou serviço.
Seja realista: faça objeções comuns, peça mais informações, simule dúvidas sobre preço e qualidade.
Responda de forma natural, como um cliente real responderia.
Se o vendedor for persuasivo e profissional, demonstre interesse crescente.
Responda sempre em português brasileiro.`,
  },
  price_objection: {
    label: "Objeção de preço",
    prompt: `Você é um cliente interessado no produto, mas muito sensível a preço.
Sempre questione se está caro, peça desconto, compare com concorrentes.
Se o vendedor justificar bem o valor, considere a compra.
Responda sempre em português brasileiro.`,
  },
  cold_call: {
    label: "Cold call (ligação fria)",
    prompt: `Você é um profissional ocupado que recebeu uma ligação não esperada de um vendedor.
Inicialmente está impaciente e sem interesse. Seja resistente mas não rude.
Se o vendedor demonstrar valor rapidamente, dê atenção por mais tempo.
Responda sempre em português brasileiro.`,
  },
  decision_maker: {
    label: "Decisor corporativo",
    prompt: `Você é um diretor de empresa avaliando uma solução B2B.
Faz perguntas sobre ROI, integração com sistemas, suporte, SLA e cases de sucesso.
Tome decisões racionais baseadas em dados e resultados.
Responda sempre em português brasileiro.`,
  },
};

export default function Roleplay() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState("default");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("roleplay-chat", {
        body: {
          messages: newMessages,
          scenario: SCENARIOS[scenario]?.prompt,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com a IA");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      <Topbar title="Roleplay" description="Simulação de vendas com IA" onMenuClick={onMenuClick} />

      <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
        {/* Controls */}
        <div className="flex items-center gap-3">
          <Select value={scenario} onValueChange={(v) => { setScenario(v); reset(); }}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Cenário" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCENARIOS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            Modelo: claude-sonnet-4-6
          </span>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
              <div>
                <p className="font-medium mb-1">Pronto para praticar</p>
                <p>Comece a conversa como se estivesse em uma ligação ou reunião de vendas.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-background border"
              )}
            >
              <p className="text-xs font-medium opacity-60 mb-1">
                {msg.role === "user" ? "Você (Vendedor)" : "Cliente (IA)"}
              </p>
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="self-start bg-background border rounded-lg px-4 py-2.5 text-sm text-muted-foreground">
              <p className="text-xs font-medium opacity-60 mb-1">Cliente (IA)</p>
              Digitando...
            </div>
          )}

          {error && (
            <div className="self-center bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua abordagem de vendas... (Enter para enviar)"
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" className="h-auto">
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
