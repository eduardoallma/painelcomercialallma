import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meeting {
  id: string;
  scheduled_at: string;
  held_at: string | null;
  status: string;
}

interface MeetingsChartProps {
  meetings: Meeting[];
}

export default function MeetingsChart({ meetings }: MeetingsChartProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

  const data = days.map((day) => {
    const agendadas = meetings.filter((m) =>
      isSameDay(new Date(m.scheduled_at), day)
    ).length;
    const realizadas = meetings.filter(
      (m) =>
        isSameDay(new Date(m.scheduled_at), day) &&
        (m.status === "done" || m.held_at)
    ).length;

    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      agendadas,
      realizadas,
    };
  });

  return (
    <div className="animate-fade-in" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(215 14% 16%)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8B949E", fontSize: 11, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#8B949E", fontSize: 11, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161B22",
              border: "none",
              borderRadius: 8,
              color: "#E6EDF3",
              fontSize: 12,
              fontFamily: "Inter",
            }}
          />
          <Line
            type="monotone"
            dataKey="realizadas"
            stroke="#D4AF37"
            strokeWidth={2}
            dot={false}
            name="Realizadas"
          />
          <Line
            type="monotone"
            dataKey="agendadas"
            stroke="#8B949E"
            strokeWidth={2}
            dot={false}
            name="Agendadas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
