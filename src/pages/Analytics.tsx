import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(145 80% 45%)",
  "hsl(210 90% 55%)",
  "hsl(35 95% 55%)",
  "hsl(0 75% 55%)",
  "hsl(220 15% 40%)",
];

interface Tournament {
  id: number;
  basicDetails?: { tournamentName?: string };
  tournamentName?: string;
}

interface Standing {
  position?: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm?: string[];
}

interface MatchData {
  matchId: number;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  status?: string;
  winnerId?: number | null;
}

interface GroupedMatches {
  completedMatches?: MatchData[];
  liveMatches?: MatchData[];
  upcomingMatches?: MatchData[];
  completedCount?: number;
  totalMatches?: number;
}

export default function Analytics() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [matchesGrouped, setMatchesGrouped] = useState<GroupedMatches | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tournaments
  useEffect(() => {
    api.get<any[]>("/api/tournament")
      .then((data) => {
        console.log("Tournaments loaded:", data?.length || 0);
        setTournaments(data || []);
        if (data && data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0].id);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error fetching tournaments:", e);
        setTournaments([]);
        setLoading(false);
      });
  }, []); // Only run once on mount

  // Fetch matches and standings for selected tournament
  useEffect(() => {
    if (!selectedTournament) return;

    console.log("Fetching data for tournament:", selectedTournament);

    // Fetch matches and group them client-side
    api.get<any[]>(`/api/tournament/${selectedTournament}/matches`)
      .then(async (matches) => {
        console.log("Matches data:", matches);
        const matchList = Array.isArray(matches) ? matches : [];
        
        // Enrich matches with scores from /api/match/{id}/score and normalize team names
        const enrichedMatches = await Promise.all(
          matchList.map(async (match) => {
            const matchId = match.matchId || match.id;
            // Normalize team names from nested objects
            const team1Name = match.team1Name || match.team1?.teamName || 'Team 1';
            const team2Name = match.team2Name || match.team2?.teamName || 'Team 2';
            let team1Score = match.team1Score ?? 0;
            let team2Score = match.team2Score ?? 0;
            
            try {
              const scoreData = await api.get<any>(`/api/match/${matchId}/score`);
              if (scoreData && scoreData.scoreState) {
                team1Score = scoreData.scoreState.scoreA ?? team1Score;
                team2Score = scoreData.scoreState.scoreB ?? team2Score;
              }
            } catch (e) {
              // Score not available, use existing scores
            }
            return {
              ...match,
              matchId,
              team1Name,
              team2Name,
              team1Score,
              team2Score,
            };
          })
        );
        
        // Group matches by status
        const completedMatches = enrichedMatches.filter(
          (m) => (m.status?.toUpperCase() === 'COMPLETED') || (m as any).matchComplete === true
        );
        const liveMatches = enrichedMatches.filter(
          (m) => m.status?.toUpperCase() === 'LIVE' || m.status?.toUpperCase() === 'IN_PROGRESS'
        );
        const upcomingMatches = enrichedMatches.filter(
          (m) => m.status?.toUpperCase() === 'SCHEDULED' || m.status?.toUpperCase() === 'UPCOMING' || m.status?.toUpperCase() === 'PENDING'
        );
        
        setMatchesGrouped({
          completedMatches,
          liveMatches,
          upcomingMatches,
          completedCount: completedMatches.length,
          totalMatches: enrichedMatches.length,
        });
      })
      .catch((e) => {
        console.error("Error fetching matches:", e);
        setMatchesGrouped(null);
      });

    // Fetch standings
    api.get<any[]>(`/api/tournament/${selectedTournament}/standings`)
      .then((data) => {
        console.log("Standings data:", data);
        // Normalize standings data from API
        const normalizedStandings: Standing[] = (Array.isArray(data) ? data : []).map((s, index) => ({
          position: index + 1,
          teamId: s.team?.id || s.teamId || index,
          teamName: s.team?.teamName || s.teamName || 'Unknown',
          played: s.matchesPlayed ?? s.played ?? 0,
          won: s.wins ?? s.won ?? 0,
          drawn: s.draws ?? s.drawn ?? 0,
          lost: s.losses ?? s.lost ?? 0,
          goalsFor: s.goalsFor ?? 0,
          goalsAgainst: s.goalsAgainst ?? 0,
          goalDifference: s.goalDifference ?? 0,
          points: s.points ?? 0,
          recentForm: s.recentForm || [],
        }));
        setStandings(normalizedStandings);
      })
      .catch((e) => {
        console.error("Error fetching standings:", e);
        setStandings([]);
      });
  }, [selectedTournament]);

  // Calculate total goals from completed matches
  const totalGoals = useMemo(() => {
    if (!matchesGrouped?.completedMatches) return 0;
    return matchesGrouped.completedMatches.reduce((sum, match) => {
      return sum + (match.team1Score || 0) + (match.team2Score || 0);
    }, 0);
  }, [matchesGrouped]);

  // Calculate average goals per match
  const avgGoalsPerMatch = useMemo(() => {
    const completed = matchesGrouped?.completedCount || matchesGrouped?.completedMatches?.length || 0;
    return completed > 0 ? (totalGoals / completed).toFixed(1) : "0.0";
  }, [totalGoals, matchesGrouped]);

  // Generate performance data from standings OR matches (for knockout tournaments)
  const performanceData = useMemo(() => {
    // If we have standings data, use it
    if (standings && standings.length > 0) {
      return standings.slice(0, 6).map((s) => ({
        name: s.teamName,
        wins: s.won || 0,
        losses: s.lost || 0,
        draws: s.drawn || 0,
      }));
    }
    
    // Fallback: Calculate from matches for knockout tournaments
    if (!matchesGrouped?.completedMatches || matchesGrouped.completedMatches.length === 0) return [];
    
    const teamStats: Record<string, { wins: number; losses: number; draws: number }> = {};
    
    matchesGrouped.completedMatches.forEach((match) => {
      const team1 = match.team1Name;
      const team2 = match.team2Name;
      
      if (!team1 || !team2) return;
      
      // Initialize teams if not exists
      if (!teamStats[team1]) teamStats[team1] = { wins: 0, losses: 0, draws: 0 };
      if (!teamStats[team2]) teamStats[team2] = { wins: 0, losses: 0, draws: 0 };
      
      const score1 = match.team1Score || 0;
      const score2 = match.team2Score || 0;
      
      if (score1 > score2) {
        teamStats[team1].wins++;
        teamStats[team2].losses++;
      } else if (score2 > score1) {
        teamStats[team2].wins++;
        teamStats[team1].losses++;
      } else {
        teamStats[team1].draws++;
        teamStats[team2].draws++;
      }
    });
    
    return Object.entries(teamStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 6);
  }, [standings, matchesGrouped]);

  // Generate top team performance from completed matches
  const topTeamPerformance = useMemo(() => {
    if (!matchesGrouped?.completedMatches || matchesGrouped.completedMatches.length === 0) return [];
    
    const teamGoals: Record<string, number> = {};
    matchesGrouped.completedMatches.forEach((match) => {
      if (match.team1Name) {
        teamGoals[match.team1Name] = (teamGoals[match.team1Name] || 0) + (match.team1Score || 0);
      }
      if (match.team2Name) {
        teamGoals[match.team2Name] = (teamGoals[match.team2Name] || 0) + (match.team2Score || 0);
      }
    });

    return Object.entries(teamGoals)
      .map(([name, goals]) => ({ name, goals }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [matchesGrouped]);

  // Generate points distribution from standings OR matches
  const pointsDistribution = useMemo(() => {
    // If we have standings data, use it
    if (standings && standings.length > 0) {
      return standings.slice(0, 5).map((s) => ({
        name: s.teamName,
        value: s.points || 0,
      }));
    }
    
    // Fallback: Use win count for knockout tournaments
    if (!matchesGrouped?.completedMatches || matchesGrouped.completedMatches.length === 0) return [];
    
    const teamWins: Record<string, number> = {};
    
    matchesGrouped.completedMatches.forEach((match) => {
      const team1 = match.team1Name;
      const team2 = match.team2Name;
      
      if (!team1 || !team2) return;
      
      if (!teamWins[team1]) teamWins[team1] = 0;
      if (!teamWins[team2]) teamWins[team2] = 0;
      
      const score1 = match.team1Score || 0;
      const score2 = match.team2Score || 0;
      
      if (score1 > score2) {
        teamWins[team1] += 3; // 3 points for win
      } else if (score2 > score1) {
        teamWins[team2] += 3;
      } else {
        teamWins[team1] += 1; // 1 point for draw
        teamWins[team2] += 1;
      }
    });
    
    return Object.entries(teamWins)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [standings, matchesGrouped]);

  // Generate recent form trends from standings OR matches
  const recentTrends = useMemo(() => {
    // If we have standings data with recentForm, use it
    if (standings && standings.length > 0 && standings.some(s => s.recentForm && s.recentForm.length > 0)) {
      return standings.slice(0, 5).map((s) => {
        const streak = (s.recentForm || []).slice(-5).join("") || "-----";
        const wins = (s.recentForm || []).filter((r) => r === "W").length;
        const form = wins >= 4 ? "excellent" : wins >= 3 ? "good" : "average";
        return { team: s.teamName, streak, form };
      });
    }
    
    // Fallback: Generate simple form from recent matches
    if (!matchesGrouped?.completedMatches || matchesGrouped.completedMatches.length === 0) return [];
    
    const teamForms: Record<string, string[]> = {};
    
    // Process matches in order
    matchesGrouped.completedMatches.forEach((match) => {
      const team1 = match.team1Name;
      const team2 = match.team2Name;
      
      if (!team1 || !team2) return;
      
      if (!teamForms[team1]) teamForms[team1] = [];
      if (!teamForms[team2]) teamForms[team2] = [];
      
      const score1 = match.team1Score || 0;
      const score2 = match.team2Score || 0;
      
      if (score1 > score2) {
        teamForms[team1].push("W");
        teamForms[team2].push("L");
      } else if (score2 > score1) {
        teamForms[team2].push("W");
        teamForms[team1].push("L");
      } else {
        teamForms[team1].push("D");
        teamForms[team2].push("D");
      }
    });
    
    return Object.entries(teamForms)
      .map(([team, form]) => {
        const streak = form.slice(-5).join("") || "-----";
        const wins = form.filter(r => r === "W").length;
        const formRating = wins >= 4 ? "excellent" : wins >= 3 ? "good" : "average";
        return { team, streak, form: formRating };
      })
      .slice(0, 5);
  }, [standings, matchesGrouped]);

  const completedMatches = matchesGrouped?.completedCount || matchesGrouped?.completedMatches?.length || 0;

  if (loading) {
    return (
      <DashboardLayout title="ANALYTICS" subtitle="Performance insights and statistics">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="ANALYTICS" subtitle="Performance insights and statistics">
      {/* Tournament Selector */}
      {tournaments.length > 0 ? (
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mr-3">Select Tournament:</label>
          <select
            className="rounded-md border border-border bg-card px-4 py-2 text-foreground"
            value={selectedTournament || ""}
            onChange={(e) => setSelectedTournament(Number(e.target.value))}
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.basicDetails?.tournamentName || t.tournamentName || `Tournament ${t.id}`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">No tournaments found. Create a tournament to see analytics.</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mb-6 md:mb-8 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground">Total Goals</p>
          <p className="font-display text-2xl md:text-4xl text-primary">{totalGoals}</p>
          <p className="mt-1 text-xs text-success">{completedMatches} completed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground">Avg Goals/Match</p>
          <p className="font-display text-2xl md:text-4xl text-accent">{avgGoalsPerMatch}</p>
          <p className="mt-1 text-xs text-muted-foreground hidden sm:block">From completed matches</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground">Total Teams</p>
          <p className="font-display text-2xl md:text-4xl text-warning">{standings.length}</p>
          <p className="mt-1 text-xs text-muted-foreground hidden sm:block">In standings</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <p className="text-xs md:text-sm text-muted-foreground">Total Matches</p>
          <p className="font-display text-2xl md:text-4xl text-success">{matchesGrouped?.totalMatches || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground hidden sm:block">All matches</p>
        </div>
      </div>

      {/* Standings/Points Table */}
      {standings && standings.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
            TOURNAMENT STANDINGS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pos</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">P</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">W</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">D</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">L</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">GF</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">GA</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">GD</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pts</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={standing.teamId}
                    className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                      index === 0 ? "bg-success/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${index === 0 ? "text-success" : "text-foreground"}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{standing.teamName}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{standing.played}</td>
                    <td className="px-4 py-3 text-center text-success">{standing.won}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{standing.drawn}</td>
                    <td className="px-4 py-3 text-center text-destructive">{standing.lost}</td>
                    <td className="px-4 py-3 text-center text-foreground">{standing.goalsFor}</td>
                    <td className="px-4 py-3 text-center text-foreground">{standing.goalsAgainst}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={standing.goalDifference >= 0 ? "text-success" : "text-destructive"}>
                        {standing.goalDifference > 0 ? "+" : ""}
                        {standing.goalDifference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-primary text-base">{standing.points}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {standing.recentForm && standing.recentForm.length > 0 ? (
                          standing.recentForm.slice(0, 5).map((result, i) => (
                            <span
                              key={i}
                              className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                                result === "W"
                                  ? "bg-success text-success-foreground"
                                  : result === "L"
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {result}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Win/Loss/Draw Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
            WIN / LOSS / DRAW TREND
          </h3>
          <div className="h-72">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145 80% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(145 80% 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLosses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 75% 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0 75% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(220 10% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 12%)",
                      border: "1px solid hsl(220 15% 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wins"
                    stroke="hsl(145 80% 45%)"
                    fillOpacity={1}
                    fill="url(#colorWins)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="losses"
                    stroke="hsl(0 75% 55%)"
                    fillOpacity={1}
                    fill="url(#colorLosses)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No standings data available. Please select a tournament with teams.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Team Performance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
            TOP TEAM PERFORMANCE
          </h3>
          <div className="h-72">
            {topTeamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTeamPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis type="number" stroke="hsl(220 10% 55%)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(220 10% 55%)" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 12%)",
                      border: "1px solid hsl(220 15% 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="goals" fill="hsl(145 80% 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No completed matches available. Goals will appear after matches are played.</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Points Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
            POINTS DISTRIBUTION
          </h3>
          <div className="h-72">
            {pointsDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pointsDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pointsDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 12%)",
                      border: "1px solid hsl(220 15% 20%)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No standings data available. Points will appear after teams earn them.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
            RECENT FORM
          </h3>
          <div className="space-y-4">
            {recentTrends.length > 0 ? (
              recentTrends.map((team, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{team.team}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {team.streak.split("").map((result, i) => (
                        <span
                          key={i}
                          className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                            result === "W"
                              ? "bg-success text-success-foreground"
                              : result === "L"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                    <Badge
                      variant={
                        team.form === "excellent"
                          ? "success"
                          : team.form === "good"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {team.form}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No form data available</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
