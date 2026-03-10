import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BANTResult {
  score: number;
  evaluation: {
    summary: string;
    budget: { score: number; feedback: string };
    authority: { score: number; feedback: string };
    need: { score: number; feedback: string };
    timeline: { score: number; feedback: string };
    improvements: string[];
  };
}

const pillars = [
  { key: "budget" as const, label: "Budget", emoji: "💰" },
  { key: "authority" as const, label: "Authority", emoji: "👤" },
  { key: "need" as const, label: "Need", emoji: "🎯" },
  { key: "timeline" as const, label: "Timeline", emoji: "⏰" },
];

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}

export default function BANTEvaluation({ result }: { result: BANTResult }) {
  const { score, evaluation } = result;

  return (
    <Card className="p-5 space-y-4 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Avaliação BANT</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">{evaluation.summary}</p>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pillars.map(({ key, label, emoji }) => {
          const pillar = evaluation[key];
          return (
            <div key={key} className="space-y-1.5 bg-background rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {emoji} {label}
                </span>
                <span className={`text-xs font-bold ${scoreColor(pillar.score)}`}>
                  {pillar.score}/10
                </span>
              </div>
              <Progress value={pillar.score * 10} className="h-1.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{pillar.feedback}</p>
            </div>
          );
        })}
      </div>

      {/* Improvements */}
      {evaluation.improvements?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Sugestões de melhoria</h4>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.improvements.map((imp, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {imp}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
