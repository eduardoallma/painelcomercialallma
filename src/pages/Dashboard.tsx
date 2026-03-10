import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import MeetingsChart from "@/components/MeetingsChart";

interface Meeting {
  id: string;
  scheduled_at: string;
  held_at: string | null;
  status: string;
}

export default function Dashboard() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMeetings = async () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data } = await supabase
        .from("meetings")
        .select("id, scheduled_at, held_at, status")
        .eq("owner_id", user.id)
        .gte("scheduled_at", fourteenDaysAgo.toISOString())
        .order("scheduled_at", { ascending: true });

      setMeetings(data ?? []);
      setLoading(false);
    };

    fetchMeetings();
  }, [user]);

  // Last 7 days stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMeetings = meetings.filter(
    (m) => new Date(m.scheduled_at) >= sevenDaysAgo
  );
  const scheduled = recentMeetings.length;
  const done = recentMeetings.filter(
    (m) => m.status === "done" || m.held_at
  ).length;
  const showRate = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

  const isEmpty = !loading && meetings.length === 0;

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Visão geral das suas reuniões"
        onMenuClick={onMenuClick}
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-5 h-24" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            title="Nenhuma reunião encontrada"
            description="Cadastre sua primeira reunião para começar a acompanhar seus resultados."
            action={{ label: "Cadastrar primeira reunião", onClick: () => {} }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Agendadas (7d)" value={scheduled} />
              <StatCard label="Realizadas (7d)" value={done} />
              <StatCard label="Taxa de show" value={showRate} suffix="%" />
            </div>

            <div className="bg-card rounded-lg p-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-4">
                Agendadas vs Realizadas — últimos 14 dias
              </h3>
              <MeetingsChart meetings={meetings} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
