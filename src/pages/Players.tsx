import { Plus, Search, Filter, Star, TrendingUp, Loader2, Trophy, Target } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/hooks/use-admin-api";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const playersFallback = [
  {
    id: 1,
    name: "John Smith",
    number: 10,
    team: "Thunder FC",
    position: "Forward",
    goals: 15,
    assists: 8,
    matches: 17,
    rating: 8.5,
    nationality: "USA",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  },
  {
    id: 2,
    name: "Mike Johnson",
    number: 7,
    team: "Thunder FC",
    position: "Midfielder",
    goals: 8,
    assists: 12,
    matches: 16,
    rating: 8.2,
    nationality: "UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
  },
  {
    id: 3,
    name: "Chris Lee",
    number: 8,
    team: "Storm United",
    position: "Forward",
    goals: 14,
    assists: 6,
    matches: 17,
    rating: 8.4,
    nationality: "Canada",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
  },
  {
    id: 4,
    name: "David Wilson",
    number: 9,
    team: "Thunder FC",
    position: "Forward",
    goals: 12,
    assists: 4,
    matches: 15,
    rating: 7.9,
    nationality: "Australia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
  },
  {
    id: 5,
    name: "Alex Martinez",
    number: 23,
    team: "Storm United",
    position: "Defender",
    goals: 2,
    assists: 3,
    matches: 17,
    rating: 7.8,
    nationality: "Spain",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  },
  {
    id: 6,
    name: "Ryan Robinson",
    number: 3,
    team: "Storm United",
    position: "Goalkeeper",
    goals: 0,
    assists: 0,
    matches: 17,
    rating: 8.0,
    nationality: "Germany",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryan",
  },
];

interface PlayerStats {
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  matchesDrawn?: number;
  winRate?: number;
  totalPoints?: number;
  totalGoals?: number;
  totalAssists?: number;
  goals?: number;
  assists?: number;
  totalMatches?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

function getSportIdByName(sportName: string): number {
  const sportMap: { [key: string]: number } = {
    'Tennis': 1,
    'Badminton': 2,
    'Football': 3,
    'Pickleball': 4,
  };
  return sportMap[sportName] || 1; // Default to Tennis
}

export default function Players() {
  const { data: usersData, isLoading, refetch } = useUsers();
  const [playerStats, setPlayerStats] = useState<{ [key: string]: PlayerStats }>({});
  const [playerBadges, setPlayerBadges] = useState<{ [key: string]: any[] }>({});
  const [selectedSport, setSelectedSport] = useState<string>('Tennis');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    emailId: "",
    mobileNumber: "",
    password: "",
    gender: "Male",
    country: "India",
    dob: "",
    preferredSport: "Tennis",
    preferredPosition: "",
  });
  
  const handleCreatePlayer = async () => {
    if (!newPlayer.name || !newPlayer.emailId || !newPlayer.password) {
      toast({
        title: "Error",
        description: "Please fill in required fields (Name, Email, Password)",
        variant: "destructive",
      });
      return;
    }
    
    if (newPlayer.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post('/api/auth/register', newPlayer);
      toast({
        title: "Success",
        description: "Player created successfully!",
      });
      setIsAddDialogOpen(false);
      setNewPlayer({
        name: "",
        emailId: "",
        mobileNumber: "",
        password: "",
        gender: "Male",
        country: "India",
        dob: "",
        preferredSport: "Tennis",
        preferredPosition: "",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create player",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Fetch stats for all players when they load
  useEffect(() => {
    if (!usersData || usersData.length === 0) return;
    
    const fetchAllStats = async () => {
      console.log(`[Players] Fetching player stats from all sports...`);
      
      try {
        // Fetch leaderboard for ALL sports and aggregate
        const sportIds = [1, 2, 3, 4]; // Tennis, Badminton, Football, Pickleball
        const statsMap: { [key: string]: PlayerStats } = {};
        
        for (const sportId of sportIds) {
          try {
            const leaderboard = await api.get<any[]>(`/api/stats/player/leaderboard/${sportId}`);
            console.log(`[Players] Sport ${sportId} leaderboard:`, leaderboard?.length || 0, 'players');
            
            (leaderboard || []).forEach((player: any) => {
              const playerId = String(player.playerId);
              
              if (!statsMap[playerId]) {
                statsMap[playerId] = {
                  matchesPlayed: 0,
                  matchesWon: 0,
                  matchesLost: 0,
                  matchesDrawn: 0,
                  winRate: 0,
                  totalPoints: 0,
                  goals: 0,
                  assists: 0,
                };
              }
              
              // Aggregate stats across all sports
              statsMap[playerId].matchesPlayed! += player.matchesPlayed || 0;
              statsMap[playerId].matchesWon! += player.matchesWon || 0;
              statsMap[playerId].matchesLost! += player.matchesLost || 0;
              statsMap[playerId].matchesDrawn! += player.matchesDrawn || 0;
              statsMap[playerId].totalPoints! += player.totalPoints || 0;
              statsMap[playerId].goals! += player.totalGoals || 0;
              statsMap[playerId].assists! += player.totalAssists || 0;
            });
          } catch (e) {
            console.warn(`[Players] Failed to fetch leaderboard for sport ${sportId}`);
          }
        }
        
        // Calculate overall win rate
        Object.keys(statsMap).forEach((playerId) => {
          const s = statsMap[playerId];
          if (s.matchesPlayed && s.matchesPlayed > 0) {
            s.winRate = Math.round((s.matchesWon! / s.matchesPlayed) * 100);
          }
        });
        
        console.log('[Players] Final aggregated statsMap:', statsMap);
        setPlayerStats(statsMap);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
      
      // Fetch badges for each player
      try {
        const badgePromises = usersData.map(async (user: any) => {
          try {
            const resp = await api.get(`/api/v1/badges/player/${user.id}`) as any;
            return { userId: user.id, badges: Array.isArray(resp) ? resp : [] };
          } catch (e) {
            return { userId: user.id, badges: [] };
          }
        });

        const badgeResults = await Promise.all(badgePromises);
        const badgeMap: { [key: string]: any[] } = {};
        badgeResults.forEach(r => {
          badgeMap[r.userId] = r.badges || [];
        });
        setPlayerBadges(badgeMap);
      } catch (e) {
        console.error('Failed to fetch player badges', e);
      }
    };
    
    fetchAllStats();
  }, [usersData]); // Removed selectedSport - now fetching all sports
  
  const mappedPlayers = useMemo(() => {
    if (!usersData) return [];
    
    console.log('[Players] Mapping players with stats. Total users:', usersData.length);
    console.log('[Players] Available stats keys:', Object.keys(playerStats));
    
    return usersData.map((user: any) => {
      // Use string key for consistent lookup
      const userId = String(user.id);
      const stats = playerStats[userId];
      console.log(`[Players] User ${userId} (${user.name}):`, stats ? `${stats.matchesPlayed} matches` : 'NO STATS');
    const badges = playerBadges[user.id] || [];
      
      // Calculate win rate as percentage if winRate is a decimal (0-1) or use as-is if already percentage
      const winRateValue = stats?.winRate 
        ? (typeof stats.winRate === 'number' && stats.winRate <= 1 
            ? stats.winRate * 100 
            : Number(stats.winRate))
        : 0;
      
      return {
        id: user.id,
        name: user.name || user.username || user.email,
        email: user.mobileNumber || user.email || 'N/A',
        role: user.role || 'PLAYER',
        avatar: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        number: user.jerseyNumber || user.id % 100,
        team: user.teamName || 'Unassigned',
        matchesPlayed: stats?.matchesPlayed || 0,
        matchesWon: stats?.matchesWon || 0,
        matchesLost: stats?.matchesLost || 0,
        matchesDrawn: stats?.matchesDrawn || 0,
        winRate: winRateValue,
        totalPoints: stats?.totalPoints || 0,
        totalGoals: stats?.goals || 0,
        totalAssists: stats?.assists || 0,
        rating: winRateValue > 0 ? (winRateValue / 10).toFixed(1) : '0.0',
        badges,
      };
    })
    // Sort players: top scorer first, then by total points, then by win rate
    .sort((a, b) => {
      // First, sort by total goals (top scorer first)
      if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
      // Then by total points
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      // Then by win rate
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      // Then by matches won
      return b.matchesWon - a.matchesWon;
    });
  }, [usersData, playerStats, playerBadges]);
  
  const players = mappedPlayers.length > 0 ? mappedPlayers : playersFallback;

  if (isLoading) {
    return (
      <DashboardLayout title="PLAYERS" subtitle="Manage all players">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="PLAYERS" subtitle="Manage all players">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              className="pl-10"
            />
          </div>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tennis">Tennis</SelectItem>
              <SelectItem value="Badminton">Badminton</SelectItem>
              <SelectItem value="Football">Football</SelectItem>
              <SelectItem value="Pickleball">Pickleball</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Players Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player: any) => (
          <div
            key={player.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-display text-lg">
                      {player.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                    {player.number}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.team}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1">
                <Star className="h-3 w-3 text-warning" fill="currentColor" />
                <span className="text-sm font-semibold text-warning">{player.rating}</span>
              </div>
            </div>

            {/* Role & Email */}
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline">{player.role || 'Player'}</Badge>
              <Badge variant="secondary" className="max-w-[150px] truncate">{player.email}</Badge>
            </div>

            {/* Badges earned */}
            {player.badges && player.badges.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {player.badges.map((b: any) => (
                  <Badge key={b.id} variant="outline" className="text-xs">{b.name}</Badge>
                ))}
              </div>
            )}

            {/* Stats - Wins, Losses, Matches */}
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-secondary/50 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-success" />
                  <p className="font-display text-2xl text-success">{player.matchesWon}</p>
                </div>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4 text-destructive" />
                  <p className="font-display text-2xl text-destructive">{player.matchesLost}</p>
                </div>
                <p className="text-xs text-muted-foreground">Losses</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-foreground">{player.matchesPlayed}</p>
                <p className="text-xs text-muted-foreground">Matches</p>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Win Rate: <span className="font-semibold text-primary">{player.winRate.toFixed(1)}%</span></span>
              {selectedSport === 'Football' ? (
                <span>Goals: <span className="font-semibold">{player.totalGoals}</span></span>
              ) : (
                <span>Points: <span className="font-semibold">{player.totalPoints}</span></span>
              )}
            </div>

            {/* Performance Indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {player.winRate >= 50 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-success">Good form</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-muted-foreground rotate-180" />
                    <span className="text-muted-foreground">Needs improvement</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm">
                View Profile
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Player Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Create a new player account. They can login with their email and password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                placeholder="Enter player name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newPlayer.emailId}
                onChange={(e) => setNewPlayer({...newPlayer, emailId: e.target.value})}
                placeholder="player@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={newPlayer.mobileNumber}
                onChange={(e) => setNewPlayer({...newPlayer, mobileNumber: e.target.value})}
                placeholder="9876543210"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newPlayer.password}
                onChange={(e) => setNewPlayer({...newPlayer, password: e.target.value})}
                placeholder="Minimum 6 characters"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={newPlayer.gender} onValueChange={(value) => setNewPlayer({...newPlayer, gender: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newPlayer.dob}
                  onChange={(e) => setNewPlayer({...newPlayer, dob: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sport">Preferred Sport</Label>
              <Select value={newPlayer.preferredSport} onValueChange={(value) => setNewPlayer({...newPlayer, preferredSport: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tennis">Tennis</SelectItem>
                  <SelectItem value="Badminton">Badminton</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlayer} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Player"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
