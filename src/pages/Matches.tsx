import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Eye, Pencil, Play, MoreHorizontal, Loader2, X, StopCircle, Minus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMatches } from "@/hooks/use-admin-api";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const matchesDataFallback = [
  {
    id: 1,
    name: "Thunder FC vs Storm United",
    sport: "Football",
    homeTeam: "Thunder FC",
    awayTeam: "Storm United",
    status: "live",
    startTime: "2024-01-15 14:00",
    score: "2 - 1",
    tournament: "Premier League",
  },
  {
    id: 2,
    name: "Hawks vs Eagles",
    sport: "Basketball",
    homeTeam: "Hawks",
    awayTeam: "Eagles",
    status: "live",
    startTime: "2024-01-15 15:30",
    score: "87 - 92",
    tournament: "National Championship",
  },
  {
    id: 3,
    name: "Titans vs Warriors",
    sport: "Football",
    homeTeam: "Titans",
    awayTeam: "Warriors",
    status: "upcoming",
    startTime: "2024-01-16 18:00",
    score: "- vs -",
    tournament: "Cup Semi-Final",
  },
  {
    id: 4,
    name: "Lions vs Bears",
    sport: "Football",
    homeTeam: "Lions",
    awayTeam: "Bears",
    status: "completed",
    startTime: "2024-01-14 16:00",
    score: "3 - 1",
    tournament: "Premier League",
  },
  {
    id: 5,
    name: "Sharks vs Dolphins",
    sport: "Hockey",
    homeTeam: "Sharks",
    awayTeam: "Dolphins",
    status: "upcoming",
    startTime: "2024-01-17 20:00",
    score: "- vs -",
    tournament: "Winter Cup",
  },
  {
    id: 6,
    name: "Panthers vs Wolves",
    sport: "Football",
    homeTeam: "Panthers",
    awayTeam: "Wolves",
    status: "completed",
    startTime: "2024-01-13 14:30",
    score: "0 - 2",
    tournament: "Premier League",
  },
  {
    id: 7,
    name: "Falcons vs Ravens",
    sport: "Basketball",
    homeTeam: "Falcons",
    awayTeam: "Ravens",
    status: "upcoming",
    startTime: "2024-01-18 19:00",
    score: "- vs -",
    tournament: "National Championship",
  },
];

export default function Matches() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [matchScores, setMatchScores] = useState<Record<number, any>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLiveScoringOpen, setIsLiveScoringOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: matches, isLoading, refetch } = useMatches();
  const matchesData = matches || matchesDataFallback;

  // Function to refresh score for a specific match
  const refreshMatchScore = async (matchId: number) => {
    try {
      const data = await api.get<any>(`http://34.131.156.94:8080/api/match-scoring/match/${matchId}/score`);
      if (data) {
        let scoreA = 0;
        let scoreB = 0;
        let winner = null;
        
        if (data.team1SetsWon !== undefined) {
          scoreA = data.team1SetsWon;
          scoreB = data.team2SetsWon;
        } else {
          scoreA = data.team1Score ?? 0;
          scoreB = data.team2Score ?? 0;
        }
        
        if (data.status === 'COMPLETED') {
          if (scoreA > scoreB) {
            winner = { id: data.team1Id, name: data.team1Name };
          } else if (scoreB > scoreA) {
            winner = { id: data.team2Id, name: data.team2Name };
          }
        }
        
        setMatchScores(prev => ({
          ...prev,
          [matchId]: {
            matchId,
            score: `${scoreA} - ${scoreB}`,
            scoreA,
            scoreB,
            team1SetsWon: data.team1SetsWon,
            team2SetsWon: data.team2SetsWon,
            team1Score: data.team1Score,
            team2Score: data.team2Score,
            winner,
            sport: data.sport,
          }
        }));
      }
    } catch (error) {
      console.warn(`Failed to refresh score for match ${matchId}:`, error);
    }
  };

  const [newMatch, setNewMatch] = useState({
    matchTitle: "",
    sportId: 1, // Tennis
    sport: "Tennis",
    matchFormat: "singles",
    matchType: "friendly",
    matchDate: "",
    matchTime: "",
    durationMinutes: 60,
    privacy: "public",
    team1Id: null as number | null,
    team2Id: null as number | null,
    description: "",
    settings: {
      substitution: false,
      extraTime: false,
      autoStartTimer: true,
      manualScoring: false,
      announcePoints: true,
      openSlots: false,
    },
    rules: {
      sets: "best_of_3",
      points: 6,
      advantage: true,
      tiebreak: true,
    }
  });

  const handleCreateMatch = async () => {
    if (!newMatch.matchTitle || !newMatch.team1Id || !newMatch.team2Id) {
      toast({
        title: "Error",
        description: "Please fill in Match Title and select both teams",
        variant: "destructive",
      });
      return;
    }

    if (!newMatch.matchDate || !newMatch.matchTime) {
      toast({
        title: "Error",
        description: "Please select match date and time",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/api/match/start', newMatch);
      toast({
        title: "Success",
        description: "Match created successfully!",
      });
      setIsCreateDialogOpen(false);
      setNewMatch({
        matchTitle: "",
        sportId: 1,
        sport: "Tennis",
        matchFormat: "singles",
        matchType: "friendly",
        matchDate: "",
        matchTime: "",
        durationMinutes: 60,
        privacy: "public",
        team1Id: null,
        team2Id: null,
        description: "",
        settings: {
          substitution: false,
          extraTime: false,
          autoStartTimer: true,
          manualScoring: false,
          announcePoints: true,
          openSlots: false,
        },
        rules: {
          sets: "best_of_3",
          points: 6,
          advantage: true,
          tiebreak: true,
        }
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create match",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Format match data from backend to match component expectations
  const formattedMatches = useMemo(() => {
    return matchesData.map((match: any) => ({
      ...match,
      id: match.matchId || match.id,
      name: match.matchTitle || `${match.team1Name} vs ${match.team2Name}`,
      homeTeam: match.team1Name,
      awayTeam: match.team2Name,
      startTime: match.matchDate && match.matchTime 
        ? `${match.matchDate} ${match.matchTime}`
        : match.matchDate || 'TBD',
      sport: match.sport,
      status: match.status?.toLowerCase() === 'live' ? 'live' 
            : match.status?.toLowerCase() === 'upcoming' ? 'upcoming'
            : match.status?.toLowerCase() === 'scheduled' ? 'upcoming'
            : 'completed',
      score: matchScores[match.matchId || match.id]?.score || 
             (match.status?.toLowerCase() === 'upcoming' ? '- vs -' : '0 - 0'),
      tournament: match.tournamentName || match.matchType || 'Friendly',
    }));
  }, [matchesData, matchScores]);

  // Fetch detailed match data including scores for all matches
  useEffect(() => {
    const fetchScores = async () => {
      const scores: Record<number, any> = {};
      
      // Batch fetch detailed match data in parallel
      const batchSize = 10;
      for (let i = 0; i < matchesData.length; i += batchSize) {
        const batch = matchesData.slice(i, i + batchSize);
        const scorePromises = batch.map(async (match: any) => {
          const matchId = match.matchId || match.id;
          try {
            const response = await fetch(`http://34.131.156.94:8080/api/match/${matchId}`);
            if (response.ok) {
              const data = await response.json();
              
              // Determine score display based on sport category
              const isRacketSport = ['Tennis', 'Badminton', 'Pickleball'].includes(data.sport);
              
              let scoreDisplay = '- vs -';
              let scoreA = 0;
              let scoreB = 0;
              let winner = null;
              
              if (data.status === 'COMPLETED' || data.status === 'LIVE') {
                if (isRacketSport) {
                  // For racket sports, show sets won
                  const team1Sets = data.team1SetsWon ?? 0;
                  const team2Sets = data.team2SetsWon ?? 0;
                  scoreDisplay = `${team1Sets} - ${team2Sets}`;
                  scoreA = team1Sets;
                  scoreB = team2Sets;
                  
                  // Determine winner based on sets
                  if (data.status === 'COMPLETED') {
                    if (team1Sets > team2Sets) {
                      winner = { id: data.team1Id, name: data.team1Name };
                    } else if (team2Sets > team1Sets) {
                      winner = { id: data.team2Id, name: data.team2Name };
                    }
                  }
                } else {
                  // For football/other sports, show goals/points
                  scoreA = data.team1Score ?? 0;
                  scoreB = data.team2Score ?? 0;
                  scoreDisplay = `${scoreA} - ${scoreB}`;
                  
                  // Determine winner based on score
                  if (data.status === 'COMPLETED') {
                    if (scoreA > scoreB) {
                      winner = { id: data.team1Id, name: data.team1Name };
                    } else if (scoreB > scoreA) {
                      winner = { id: data.team2Id, name: data.team2Name };
                    }
                  }
                }
              }
              
              return {
                matchId,
                score: scoreDisplay,
                scoreA,
                scoreB,
                team1SetsWon: data.team1SetsWon,
                team2SetsWon: data.team2SetsWon,
                team1Score: data.team1Score,
                team2Score: data.team2Score,
                winner,
                sport: data.sport,
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch score for match ${matchId}:`, error);
          }
          return null;
        });
        
        const batchResults = await Promise.all(scorePromises);
        batchResults.forEach(result => {
          if (result) {
            scores[result.matchId] = result;
          }
        });
      }
      
      setMatchScores(scores);
    };

    if (matchesData && matchesData.length > 0) {
      fetchScores();
      
      // Refresh scores for live matches every 10 seconds
      const interval = setInterval(() => {
        const liveMatches = matchesData.filter((m: any) => 
          m.status?.toLowerCase() === 'live'
        );
        if (liveMatches.length > 0) {
          fetchScores();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [matchesData]);

  const filteredMatches = formattedMatches.filter((match: any) => {
    const matchesSearch = match.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.sport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.tournament?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.homeTeam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <DashboardLayout title="MATCHES" subtitle="Manage all matches">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="MATCHES" subtitle="Manage all matches">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search matches, sports, tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Match
        </Button>
      </div>

      {/* Matches Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Match</TableHead>
              <TableHead className="text-muted-foreground">Sport</TableHead>
              <TableHead className="text-muted-foreground">Teams</TableHead>
              <TableHead className="text-muted-foreground">Score</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Start Time</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMatches.map((match) => (
              <TableRow key={match.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{match.name}</p>
                    <p className="text-xs text-muted-foreground">{match.tournament}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{match.sport}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{match.homeTeam}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-sm">{match.awayTeam}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className={`font-display text-lg tracking-wider ${
                      match.status === "live" ? "text-primary" : "text-foreground"
                    }`}>
                      {match.score}
                    </span>
                    {matchScores[match.id]?.winner && match.status === "completed" && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          🏆 {matchScores[match.id].winner.name}
                        </span>
                      </div>
                    )}
                    {match.status === "completed" && !matchScores[match.id]?.winner && matchScores[match.id]?.scoreA === matchScores[match.id]?.scoreB && (
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        Draw
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={match.status as "live" | "upcoming" | "completed"}>
                    {match.status === "live" && (
                      <span className="mr-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
                    )}
                    {match.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {match.startTime}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => {
                        setSelectedMatch(match);
                        setIsViewDialogOpen(true);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => {
                        setSelectedMatch(match);
                        setIsEditDialogOpen(true);
                      }}
                      title="Edit Match"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(match.status === "upcoming" || match.status === "live") && (
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="text-primary"
                        onClick={() => {
                          setSelectedMatch(match);
                          setIsLiveScoringOpen(true);
                        }}
                        title={match.status === "live" ? "Live Scoring" : "Start Match"}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedMatch(match);
                          setIsViewDialogOpen(true);
                        }}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedMatch(match);
                          setIsEditDialogOpen(true);
                        }}>Edit Match</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedMatch(match);
                          setIsLiveScoringOpen(true);
                        }}>Live Scoring</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to cancel the match: ${match.name}?`)) {
                              try {
                                await api.post(`/api/match/${match.id}/abandon`, { reason: 'Cancelled by admin' });
                                toast({ title: "Success", description: "Match cancelled successfully" });
                                refetch();
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message || "Failed to cancel match", variant: "destructive" });
                              }
                            }
                          }}
                        >
                          Cancel Match
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="font-display text-2xl text-foreground">{formattedMatches.length}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Live</p>
            <p className="font-display text-2xl text-destructive">
              {formattedMatches.filter(m => m.status === "live").length}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="font-display text-2xl text-accent">
              {formattedMatches.filter(m => m.status === "upcoming").length}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-display text-2xl text-muted-foreground">
              {formattedMatches.filter(m => m.status === "completed").length}
            </p>
          </div>
        </div>
      </div>

      {/* Create Match Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Match</DialogTitle>
            <DialogDescription>
              Set up a new match with teams, schedule, and rules.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Match Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Match Title *</Label>
              <Input
                id="title"
                value={newMatch.matchTitle}
                onChange={(e) => setNewMatch({...newMatch, matchTitle: e.target.value})}
                placeholder="e.g., Team A vs Team B"
              />
            </div>

            {/* Sport Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sport">Sport *</Label>
                <Select 
                  value={newMatch.sport} 
                  onValueChange={(value) => {
                    const sportMap: Record<string, number> = { Tennis: 1, Badminton: 2, Football: 3, Pickleball: 4 };
                    setNewMatch({...newMatch, sport: value, sportId: sportMap[value] || 1});
                  }}
                >
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

              <div className="grid gap-2">
                <Label htmlFor="format">Match Format</Label>
                <Select value={newMatch.matchFormat} onValueChange={(value) => setNewMatch({...newMatch, matchFormat: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                    <SelectItem value="1v1">1v1</SelectItem>
                    <SelectItem value="2v2">2v2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="team1">Team 1 ID *</Label>
                <Input
                  id="team1"
                  type="number"
                  value={newMatch.team1Id || ""}
                  onChange={(e) => setNewMatch({...newMatch, team1Id: parseInt(e.target.value) || null})}
                  placeholder="Enter Team 1 ID"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team2">Team 2 ID *</Label>
                <Input
                  id="team2"
                  type="number"
                  value={newMatch.team2Id || ""}
                  onChange={(e) => setNewMatch({...newMatch, team2Id: parseInt(e.target.value) || null})}
                  placeholder="Enter Team 2 ID"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Match Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newMatch.matchDate}
                  onChange={(e) => setNewMatch({...newMatch, matchDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Match Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={newMatch.matchTime}
                  onChange={(e) => setNewMatch({...newMatch, matchTime: e.target.value})}
                />
              </div>
            </div>

            {/* Duration & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newMatch.durationMinutes}
                  onChange={(e) => setNewMatch({...newMatch, durationMinutes: parseInt(e.target.value) || 60})}
                  placeholder="60"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Match Type</Label>
                <Select value={newMatch.matchType} onValueChange={(value) => setNewMatch({...newMatch, matchType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="tournament">Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newMatch.description}
                onChange={(e) => setNewMatch({...newMatch, description: e.target.value})}
                placeholder="Optional match description"
                rows={3}
              />
            </div>

            {/* Match Settings */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-semibold text-sm">Match Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoTimer" className="text-sm">Auto Start Timer</Label>
                  <Switch
                    id="autoTimer"
                    checked={newMatch.settings.autoStartTimer}
                    onCheckedChange={(checked) => setNewMatch({...newMatch, settings: {...newMatch.settings, autoStartTimer: checked}})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="announcePoints" className="text-sm">Announce Points</Label>
                  <Switch
                    id="announcePoints"
                    checked={newMatch.settings.announcePoints}
                    onCheckedChange={(checked) => setNewMatch({...newMatch, settings: {...newMatch.settings, announcePoints: checked}})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manualScoring" className="text-sm">Manual Scoring</Label>
                  <Switch
                    id="manualScoring"
                    checked={newMatch.settings.manualScoring}
                    onCheckedChange={(checked) => setNewMatch({...newMatch, settings: {...newMatch.settings, manualScoring: checked}})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="openSlots" className="text-sm">Open Slots</Label>
                  <Switch
                    id="openSlots"
                    checked={newMatch.settings.openSlots}
                    onCheckedChange={(checked) => setNewMatch({...newMatch, settings: {...newMatch.settings, openSlots: checked}})}
                  />
                </div>
              </div>
            </div>

            {/* Match Rules (for Tennis/Racket Sports) */}
            {(newMatch.sport === "Tennis" || newMatch.sport === "Badminton" || newMatch.sport === "Pickleball") && (
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-semibold text-sm">Match Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sets">Sets</Label>
                    <Select value={newMatch.rules.sets} onValueChange={(value) => setNewMatch({...newMatch, rules: {...newMatch.rules, sets: value}})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best_of_3">Best of 3</SelectItem>
                        <SelectItem value="best_of_5">Best of 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="points">Points per Set</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newMatch.rules.points}
                      onChange={(e) => setNewMatch({...newMatch, rules: {...newMatch.rules, points: parseInt(e.target.value) || 6}})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="advantage" className="text-sm">Advantage</Label>
                    <Switch
                      id="advantage"
                      checked={newMatch.rules.advantage}
                      onCheckedChange={(checked) => setNewMatch({...newMatch, rules: {...newMatch.rules, advantage: checked}})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tiebreak" className="text-sm">Tiebreak</Label>
                    <Switch
                      id="tiebreak"
                      checked={newMatch.rules.tiebreak}
                      onCheckedChange={(checked) => setNewMatch({...newMatch, rules: {...newMatch.rules, tiebreak: checked}})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMatch} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Match Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              {selectedMatch?.name || 'Match Information'}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Sport</Label>
                  <p className="font-medium">{selectedMatch.sport}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedMatch.status}>{selectedMatch.status?.toUpperCase()}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Home Team</Label>
                  <p className="font-medium">{selectedMatch.homeTeam}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Away Team</Label>
                  <p className="font-medium">{selectedMatch.awayTeam}</p>
                </div>
              </div>
              <div className="text-center py-4 bg-secondary/50 rounded-lg">
                <Label className="text-muted-foreground">Score</Label>
                <p className="font-display text-4xl">{selectedMatch.score}</p>
                {matchScores[selectedMatch.id]?.winner && (
                  <p className="text-sm text-green-600 mt-2">
                    🏆 Winner: {matchScores[selectedMatch.id].winner.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tournament</Label>
                  <p className="font-medium">{selectedMatch.tournament || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Time</Label>
                  <p className="font-medium">{selectedMatch.startTime}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedMatch?.status === 'live' && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                setIsLiveScoringOpen(true);
              }}>
                Go to Live Scoring
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>
              Update match details for {selectedMatch?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Match Title</Label>
                <Input 
                  defaultValue={selectedMatch.name}
                  onChange={(e) => setSelectedMatch({...selectedMatch, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input 
                    type="date"
                    defaultValue={selectedMatch.startTime?.split(' ')[0]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input 
                    type="time"
                    defaultValue={selectedMatch.startTime?.split(' ')[1]}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              try {
                await api.put(`/api/match/${selectedMatch?.id}`, selectedMatch);
                toast({ title: "Success", description: "Match updated successfully" });
                setIsEditDialogOpen(false);
                refetch();
              } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Scoring Dialog - Sport-specific UI */}
      <Dialog open={isLiveScoringOpen} onOpenChange={setIsLiveScoringOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Live Scoring</DialogTitle>
            <DialogDescription>
              {selectedMatch?.name} - {selectedMatch?.sport}
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-6">
                <div className="text-center flex-1">
                  <p className="font-medium text-lg">{selectedMatch.homeTeam}</p>
                  <p className="font-display text-5xl my-2">{matchScores[selectedMatch.id]?.scoreA || 0}</p>
                </div>
                <div className="text-2xl text-muted-foreground">vs</div>
                <div className="text-center flex-1">
                  <p className="font-medium text-lg">{selectedMatch.awayTeam}</p>
                  <p className="font-display text-5xl my-2">{matchScores[selectedMatch.id]?.scoreB || 0}</p>
                </div>
              </div>

              {/* Sport-specific scoring controls */}
              {['Tennis', 'Badminton', 'Pickleball'].includes(selectedMatch.sport) ? (
                // Racket Sports - Points and Sets only
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-4">Racket Sport Scoring</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-center block">{selectedMatch.homeTeam}</Label>
                      <Button 
                        className="w-full h-16 text-xl"
                        onClick={async () => {
                          try {
                            await api.post(`/api/match-scoring/match/${selectedMatch.id}/point`, { teamId: selectedMatch.team1Id || 1 });
                            toast({ title: "Point Added", description: `Point to ${selectedMatch.homeTeam}` });
                            await refreshMatchScore(selectedMatch.id);
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          }
                        }}
                      >
                        + Point
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-center block">{selectedMatch.awayTeam}</Label>
                      <Button 
                        className="w-full h-16 text-xl"
                        onClick={async () => {
                          try {
                            await api.post(`/api/match-scoring/match/${selectedMatch.id}/point`, { teamId: selectedMatch.team2Id || 2 });
                            toast({ title: "Point Added", description: `Point to ${selectedMatch.awayTeam}` });
                            await refreshMatchScore(selectedMatch.id);
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          }
                        }}
                      >
                        + Point
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Football - Goals, Yellow/Red Cards, Substitutions
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-4">Football Scoring</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-center block">{selectedMatch.homeTeam}</Label>
                      <Button 
                        className="w-full h-12"
                        onClick={async () => {
                          try {
                            await api.post(`/api/match-scoring/match/${selectedMatch.id}/goal`, { teamId: selectedMatch.team1Id || 1 });
                            toast({ title: "Goal!", description: `Goal for ${selectedMatch.homeTeam}` });
                            await refreshMatchScore(selectedMatch.id);
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          }
                        }}
                      >
                        ⚽ Goal
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-yellow-600">
                          🟨 Yellow
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-red-600">
                          🟥 Red
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-center block">{selectedMatch.awayTeam}</Label>
                      <Button 
                        className="w-full h-12"
                        onClick={async () => {
                          try {
                            await api.post(`/api/match-scoring/match/${selectedMatch.id}/goal`, { teamId: selectedMatch.team2Id || 2 });
                            toast({ title: "Goal!", description: `Goal for ${selectedMatch.awayTeam}` });
                            await refreshMatchScore(selectedMatch.id);
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          }
                        }}
                      >
                        ⚽ Goal
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-yellow-600">
                          🟨 Yellow
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-red-600">
                          🟥 Red
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLiveScoringOpen(false)}>
              Close
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (confirm('Are you sure you want to end this match?')) {
                  try {
                    await api.post(`/api/match-scoring/match/${selectedMatch?.id}/complete`, {});
                    toast({ title: "Success", description: "Match completed" });
                    setIsLiveScoringOpen(false);
                    refetch();
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }
              }}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              End Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
