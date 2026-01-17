import { useMemo } from "react";
import { Radio, CalendarDays, Users, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentMatchCard } from "@/components/dashboard/RecentMatchCard";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useLiveMatches, useUpcomingMatches, useUsers, useTournaments, useTeams, useMatches } from "@/hooks/use-admin-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  // Fetch real data from APIs
  const { data: dashStats, isLoading: statsLoading } = useDashboardStats();
  const { data: liveMatches, isLoading: liveLoading } = useLiveMatches();
  const { data: upcomingMatches, isLoading: upcomingLoading } = useUpcomingMatches();
  const { data: users } = useUsers();
  const { data: tournaments } = useTournaments();
  const { data: teams } = useTeams();
  const { data: allMatches } = useMatches();

  // Generate dynamic weekly chart data from real matches
  const chartData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData: { name: string; matches: number; completed: number }[] = [];
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      // Count matches for this day
      let matchCount = 0;
      let completedCount = 0;
      
      if (allMatches && Array.isArray(allMatches)) {
        allMatches.forEach((match: any) => {
          const matchDate = match.matchDate || match.startTime || '';
          if (matchDate.startsWith(dateStr)) {
            matchCount++;
            if (match.status === 'COMPLETED' || match.status === 'completed') {
              completedCount++;
            }
          }
        });
      }
      
      weekData.push({ name: dayName, matches: matchCount, completed: completedCount });
    }
    
    return weekData;
  }, [allMatches]);

  // Use actual stats from API
  const totalPlayers = dashStats?.totalPlayers || users?.length || 0;
  const totalTeams = teams?.length || 0;
  const activeTournaments = dashStats?.activeTournaments || tournaments?.filter(t => t.status === 'ACTIVE').length || 0;
  const liveMatchCount = dashStats?.liveMatches || liveMatches?.length || 0;
  const totalMatches = dashStats?.totalMatches || 0;
  const completedMatches = dashStats?.completedMatches || 0;
  const upcomingMatchCount = dashStats?.upcomingMatches || upcomingMatches?.length || 0;

  // Calculate completion rate
  const completionRate = totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : 0;

  // Format matches for display
  const recentMatchesData = [
    ...(liveMatches?.slice(0, 2).map(match => ({
      homeTeam: { name: match.teamAName || match.team1Name || 'Team A', score: match.scoreA || match.scoreTeam1 || match.team1Score || 0 },
      awayTeam: { name: match.teamBName || match.team2Name || 'Team B', score: match.scoreB || match.scoreTeam2 || match.team2Score || 0 },
      sport: match.sportType || match.sportName || 'Match',
      status: 'live' as const,
      time: 'Live',
      tournament: match.tournamentName || 'Match',
    })) || []),
    ...(upcomingMatches?.slice(0, 2).map(match => ({
      homeTeam: { name: match.teamAName || match.team1Name || 'Team A', score: 0 },
      awayTeam: { name: match.teamBName || match.team2Name || 'Team B', score: 0 },
      sport: match.sportType || match.sportName || 'Match',
      status: 'upcoming' as const,
      time: match.startTime ? new Date(match.startTime).toLocaleString() : 'TBD',
      tournament: match.tournamentName || 'Match',
    })) || [])
  ];

  return (
    <DashboardLayout title="DASHBOARD" subtitle="Welcome back, Admin">
      {/* Current Live Match */}
      {!liveLoading && liveMatches && liveMatches.length > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-lg animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive"></span>
                </span>
                <h2 className="font-display text-xl tracking-wide text-foreground">
                  LIVE NOW
                </h2>
              </div>
              <Badge variant="live" className="text-xs px-3 py-1">
                {liveMatches[0].sportType || liveMatches[0].sportName || 'Match'}
              </Badge>
            </div>
            <a
              href="/live-scoring"
              className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
            >
              Go to Live Scoring →
            </a>
          </div>
          <div className="flex items-center justify-between gap-8">
            {/* Team 1 */}
            <div className="flex flex-1 items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-2xl font-bold">
                {(liveMatches[0].teamAName || liveMatches[0].team1Name || 'A').charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg tracking-wide text-foreground">
                  {(liveMatches[0].teamAName || liveMatches[0].team1Name || 'Team A').toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">Home</p>
              </div>
            </div>
            {/* Score */}
            <div className="flex items-center gap-4 px-6">
              <span className="font-display text-5xl tracking-wider text-foreground animate-pulse">
                {liveMatches[0].scoreA ?? liveMatches[0].scoreTeam1 ?? liveMatches[0].team1Score ?? 0}
              </span>
              <span className="font-display text-3xl text-muted-foreground">:</span>
              <span className="font-display text-5xl tracking-wider text-foreground animate-pulse">
                {liveMatches[0].scoreB ?? liveMatches[0].scoreTeam2 ?? liveMatches[0].team2Score ?? 0}
              </span>
            </div>
            {/* Team 2 */}
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-1 text-right">
                <h3 className="font-display text-lg tracking-wide text-foreground">
                  {(liveMatches[0].teamBName || liveMatches[0].team2Name || 'Team B').toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">Away</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-2xl font-bold">
                {(liveMatches[0].teamBName || liveMatches[0].team2Name || 'B').charAt(0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Live Matches"
          value={statsLoading ? "..." : String(liveMatchCount)}
          icon={Radio}
          iconColor="destructive"
          live={!statsLoading && liveMatchCount > 0}
        />
        <StatCard
          title="Upcoming Matches"
          value={statsLoading ? "..." : String(upcomingMatchCount)}
          change={upcomingMatchCount > 0 ? `${upcomingMatchCount} scheduled` : undefined}
          changeType="neutral"
          icon={CalendarDays}
          iconColor="primary"
        />
        <StatCard
          title="Total Players"
          value={String(totalPlayers)}
          change={totalPlayers > 0 ? `${totalPlayers} registered` : undefined}
          changeType="positive"
          icon={Users}
          iconColor="accent"
        />
        <StatCard
          title="Active Tournaments"
          value={String(activeTournaments)}
          change={activeTournaments > 0 ? `${activeTournaments} ongoing` : undefined}
          changeType="neutral"
          icon={Trophy}
          iconColor="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl tracking-wide text-foreground">
                  WEEKLY OVERVIEW
                </h2>
                <p className="text-sm text-muted-foreground">
                  Match activity and viewer engagement
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Total Matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145 80% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(145 80% 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210 90% 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210 90% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(220 10% 55%)"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 12%)",
                      border: "1px solid hsl(220 15% 20%)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(220 15% 95%)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="matches"
                    stroke="hsl(145 80% 45%)"
                    fillOpacity={1}
                    fill="url(#colorMatches)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(210 90% 55%)"
                    fillOpacity={1}
                    fill="url(#colorViewers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
              PERFORMANCE
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Match Completion Rate</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{completionRate}%</span>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${completionRate}%` }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Total Matches</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{totalMatches}</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full gradient-accent" style={{ width: `${Math.min(100, totalMatches > 0 ? 100 : 0)}%` }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Completed Matches</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{completedMatches}</span>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full gradient-warm" style={{ width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%` }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Total Teams</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{totalTeams}</span>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, totalTeams > 0 ? Math.min(totalTeams * 5, 100) : 0)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            RECENT MATCHES
          </h2>
          <a
            href="/matches"
            className="text-sm text-primary hover:text-primary/80 hover:underline"
          >
            View all matches →
          </a>
        </div>
        {(liveLoading || upcomingLoading) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recentMatchesData.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recentMatchesData.map((match, index) => (
              <RecentMatchCard key={index} {...match} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No matches available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
