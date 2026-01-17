import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PlayerData {
  id: number;
  name: string;
  username: string;
  state: string;
  preferredSport: string;
  totalPoints: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  badges?: { id: number; name: string; tier?: string }[];
}

export default function PlayerLeaderboard() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Fetch users using api service
      const users = await api.get<any[]>("/api/users");
      
      // Helper to get sport ID (default to Tennis=1 for stats)
      const getSportId = (sport: string) => {
        const sportMap: Record<string, number> = { 'Tennis': 1, 'Badminton': 2, 'Football': 3, 'Pickleball': 4 };
        return sportMap[sport] || 1;
      };

      // Process each user with their stats from the stats API
      const playersWithStats = await Promise.all(
        users.map(async (user: any) => {
          try {
            const sportId = getSportId(user.preferredSport || 'Tennis');
            
            // Fetch actual stats from the calculate endpoint
            let stats: any = null;
            try {
              stats = await api.get(`/api/stats/player/${user.id}/sport/${sportId}/calculate`);
            } catch (e) {
              // Try alternate endpoint
              try {
                stats = await api.get(`/api/stats/player/${user.id}/sport/${sportId}`);
              } catch (e2) {
                console.warn(`No stats for player ${user.id}`);
              }
            }
            
            const matchesPlayed = stats?.matchesPlayed || 0;
            const matchesWon = stats?.matchesWon || 0;
            const matchesLost = stats?.matchesLost || 0;
            const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
            const totalPoints = stats?.totalPoints || (matchesWon * 3);

            // Fetch player badges using api service
            let playerBadges: any[] = [];
            try {
              console.log(`Fetching badges for player ${user.id}...`);
              const badgeData = await api.get<any[]>(`/api/v1/badges/player/${user.id}`);
              // Map the PlayerBadgeDTO to simple badge objects
              playerBadges = (badgeData || []).map((pb: any) => ({
                id: pb.badge?.id || pb.id,
                name: pb.badge?.name || pb.name,
                tier: pb.badge?.tier || pb.tier,
                pointsReward: pb.badge?.pointsReward || pb.pointsReward,
                earnedAt: pb.earnedAt
              }));
              console.log(`Player ${user.id} badges:`, playerBadges);
            } catch (err) {
              console.error(`Error fetching badges for player ${user.id}:`, err);
            }

            return {
              id: user.id,
              name: user.name,
              username: user.username || user.name,
              state: user.state || "Unknown",
              preferredSport: user.preferredSport || "None",
              totalPoints,
              matchesPlayed,
              matchesWon,
              matchesLost,
              winRate,
              badges: playerBadges,
            };
          } catch (error) {
            console.error(`Error processing user ${user.id}:`, error);
            return {
              id: user.id,
              name: user.name,
              username: user.username || user.name,
              state: user.state || "Unknown",
              preferredSport: user.preferredSport || "None",
              totalPoints: 0,
              matchesPlayed: 0,
              matchesWon: 0,
              matchesLost: 0,
              winRate: 0,
              badges: [],
            };
          }
        })
      );

      // Sort by total points
      playersWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

      setPlayers(playersWithStats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching players:", error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Rank", "Name", "State", "Sport", "Points", "Matches", "Won", "Lost", "Win Rate %"];
    const rows = players.map((player, index) => [
      index + 1,
      player.name,
      player.state,
      player.preferredSport,
      player.totalPoints,
      player.matchesPlayed,
      player.matchesWon,
      player.matchesLost,
      player.winRate,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `player_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout title="Player Leaderboard" subtitle="Top performing players">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Player Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Top performing players across all sports
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        {/* Top 3 Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {players.slice(0, 3).map((player, index) => (
            <Card key={player.id} className={index === 0 ? "border-yellow-500 border-2" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                    {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                    {index === 2 && <Award className="h-6 w-6 text-orange-600" />}
                    <CardTitle className="text-lg">#{index + 1}</CardTitle>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {player.totalPoints} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{player.name}</p>
                  <p className="text-sm text-muted-foreground">{player.state}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                    <div>
                      <p className="text-muted-foreground">Matches</p>
                      <p className="font-semibold">{player.matchesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-semibold text-green-600">{player.winRate}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Leaderboard</CardTitle>
            <CardDescription>All players ranked by total points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Lost</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Loading players...
                      </TableCell>
                    </TableRow>
                  ) : players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        No players found
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((player, index) => (
                      <TableRow key={player.id} className={index < 3 ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                            #{index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">@{player.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{player.state}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.preferredSport}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {!player.badges ? (
                              <span className="text-xs text-muted-foreground">Loading...</span>
                            ) : player.badges.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No badges</span>
                            ) : (
                              <>
                                {player.badges.slice(0, 3).map((b: any) => {
                                  // Color badges by tier
                                  const tierColors: Record<string, string> = {
                                    'BRONZE': 'bg-orange-100 text-orange-800 border-orange-300',
                                    'SILVER': 'bg-gray-100 text-gray-800 border-gray-300',
                                    'GOLD': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                                    'PLATINUM': 'bg-cyan-100 text-cyan-800 border-cyan-300',
                                    'DIAMOND': 'bg-blue-100 text-blue-800 border-blue-300'
                                  };
                                  const colorClass = tierColors[b.tier] || 'bg-gray-100 text-gray-800';
                                  
                                  return (
                                    <Badge 
                                      key={b.id} 
                                      variant="outline" 
                                      className={`text-xs ${colorClass}`}
                                      title={`${b.name} (${b.tier}) - ${b.pointsReward} points`}
                                    >
                                      {b.name}
                                    </Badge>
                                  );
                                })}
                                {player.badges.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{player.badges.length - 3} more
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {player.totalPoints}
                        </TableCell>
                        <TableCell className="text-right">{player.matchesPlayed}</TableCell>
                        <TableCell className="text-right text-green-600">{player.matchesWon}</TableCell>
                        <TableCell className="text-right text-red-600">{player.matchesLost}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={player.winRate >= 60 ? "default" : "secondary"}>
                            {player.winRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
