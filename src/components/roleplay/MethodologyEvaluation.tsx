import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PillarResult {
  score: number;
  feedback: string;
}

interface EvaluationResult {
  score: number;
  evaluation: Record<string, any>;
}

type Methodology = "bant" | "spin" | "gpct";

const methodologyPillars: Record<Methodology, { key: string; label: string; emoji: string }[]> = {
  bant: [
    { key: "budget", label: "Budget", emoji: "💰" },
    { key: "authority", label: "Authority", emoji: "👤" },
    { key: "need", label: "Need", emoji: "🎯" },
    { key: "timeline", label: "Timeline", emoji: "⏰" },
  ],
  spin: [
    { key: "situation", label: "Situation", emoji: "📋" },
    { key: "problem", label: "Problem", emoji: "⚠️" },
    { key: "implication", label: "Implication", emoji: "💡" },
    { key: "need_payoff", label: "Need-Payoff", emoji: "🎯" },
  ],
  gpct: [
    { key: "goals", label: "Goals", emoji: "🏆" },
    { key: "plans", label: "Plans", emoji: "📝" },
    { key: "challenges", label: "Challenges", emoji: "⚡" },
    { key: "timeline", label: "Timeline", emoji: "⏰" },
  ],
};

const methodologyLabels: Record<Methodology, string> = {
  bant: "BANT",
  spin: "SPIN",
  gpct: "GPCT",
};

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}

export default function MethodologyEvaluation({
  result,
  methodology = "bant",
}: {
  result: EvaluationResult;
  methodology?: Methodology;
}) {
  const { score, evaluation } = result;
  const pillars = methodologyPillars[methodology] || methodologyPillars.bant;
  const label = methodologyLabels[methodology] || "BANT";

  return (
    <Card className="p-5 space-y-4 bg-card border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Avaliação {label}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{evaluation.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pillars.map(({ key, label: pillarLabel, emoji }) => {
          const pillar = evaluation[key] as PillarResult | undefined;
          if (!pillar) return null;
          return (
            <div key={key} className="space-y-1.5 bg-background rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {emoji} {pillarLabel}
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
