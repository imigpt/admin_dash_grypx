import React, { useState } from "react";
import { Plus, Trophy, Calendar, Users, ChevronRight, Loader2, Eye, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournaments } from "@/hooks/use-admin-api";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tournamentsFallback = [
  {
    id: 1,
    name: "Premier League 2024",
    sport: "Football",
    status: "active",
    teams: 20,
    matches: 380,
    startDate: "2024-01-01",
    endDate: "2024-05-31",
    currentRound: "Week 18",
  },
  {
    id: 2,
    name: "National Championship",
    sport: "Basketball",
    status: "active",
    teams: 16,
    matches: 120,
    startDate: "2024-01-15",
    endDate: "2024-04-30",
    currentRound: "Quarter Finals",
  },
  {
    id: 3,
    name: "Winter Cup",
    sport: "Hockey",
    status: "upcoming",
    teams: 12,
    matches: 66,
    startDate: "2024-02-01",
    endDate: "2024-03-15",
    currentRound: "Not Started",
  },
  {
    id: 4,
    name: "Summer League",
    sport: "Football",
    status: "completed",
    teams: 8,
    matches: 28,
    startDate: "2023-06-01",
    endDate: "2023-08-31",
    currentRound: "Completed",
  },
];

const pointsTable = [
  { pos: 1, team: "Thunder FC", played: 17, won: 13, drawn: 3, lost: 1, gd: 28, points: 42 },
  { pos: 2, team: "Storm United", played: 17, won: 12, drawn: 4, lost: 1, gd: 24, points: 40 },
  { pos: 3, team: "Lions", played: 17, won: 11, drawn: 3, lost: 3, gd: 18, points: 36 },
  { pos: 4, team: "Warriors", played: 17, won: 10, drawn: 4, lost: 3, gd: 15, points: 34 },
  { pos: 5, team: "Eagles", played: 17, won: 9, drawn: 5, lost: 3, gd: 12, points: 32 },
];

const fixtures = [
  { home: "Thunder FC", away: "Lions", date: "Jan 20, 2024", time: "15:00" },
  { home: "Storm United", away: "Warriors", date: "Jan 20, 2024", time: "17:30" },
  { home: "Eagles", away: "Panthers", date: "Jan 21, 2024", time: "14:00" },
  { home: "Bears", away: "Wolves", date: "Jan 21, 2024", time: "16:30" },
];

export default function Tournaments() {
  const { data: tournamentsData, isLoading, refetch } = useTournaments();
  const { toast } = useToast();
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [tournamentMatches, setTournamentMatches] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  
  // Create tournament form
  const [newTournament, setNewTournament] = useState({
    tournamentName: "",
    sport: "Tennis",
    type: "KNOCKOUT",
    startDate: "",
    endDate: "",
    groundName: "",
    groundAddress: "",
    maxTeams: 8,
  });
  
  const handleCreateTournament = async () => {
    if (!newTournament.tournamentName || !newTournament.startDate) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post('/api/tournament', {
        basicDetails: {
          tournamentName: newTournament.tournamentName,
          startDate: newTournament.startDate,
          endDate: newTournament.endDate || newTournament.startDate,
          groundName: newTournament.groundName,
          groundAddress: newTournament.groundAddress,
        },
        sport: newTournament.sport,
        type: newTournament.type,
        maxTeams: newTournament.maxTeams,
        status: "UPCOMING",
      });
      toast({ title: "Success", description: "Tournament created successfully" });
      setIsCreateDialogOpen(false);
      setNewTournament({
        tournamentName: "", sport: "Tennis", type: "KNOCKOUT",
        startDate: "", endDate: "", groundName: "", groundAddress: "", maxTeams: 8
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create tournament", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleViewDetails = async (tournament: any) => {
    setSelectedTournament(tournament);
    setIsViewDialogOpen(true);
    setLoadingMatches(true);
    
    try {
      const matches = await api.get<any[]>(`/api/tournament/${tournament.id}/matches`);
      setTournamentMatches(Array.isArray(matches) ? matches : []);
    } catch (error) {
      console.error("Error fetching tournament matches:", error);
      setTournamentMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };
  
  // Map backend tournament structure to frontend format
  const tournaments = React.useMemo(() => {
    if (!tournamentsData) return tournamentsFallback;
    
    return tournamentsData.map((t: any) => ({
      id: t.id,
      name: t.basicDetails?.tournamentName || t.name || 'Unnamed Tournament',
      sport: t.sport,
      status: t.status?.toLowerCase() || 'upcoming',
      teams: t.totalTeams || t.teams?.length || 0,
      matches: 0, // This would need a separate endpoint
      startDate: t.basicDetails?.startDate || t.startDate || '',
      endDate: t.basicDetails?.endDate || t.endDate || '',
      currentRound: t.currentRound || 'Not Started',
      type: t.type,
      venue: t.venueName || t.basicDetails?.groundName || '',
    }));
  }, [tournamentsData]);

  if (isLoading) {
    return (
      <DashboardLayout title="TOURNAMENTS" subtitle="Manage tournaments and leagues">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="TOURNAMENTS" subtitle="Manage tournaments and leagues">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant="default" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
            {tournaments.filter((t: any) => t.status === "active").length} Active
          </Badge>
          <Badge variant="upcoming" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
            {tournaments.filter((t: any) => t.status === "upcoming").length} Upcoming
          </Badge>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      {/* Tournament Cards */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {tournaments.map((tournament: any) => (
          <div
            key={tournament.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          >
            <div className="absolute inset-0 gradient-hero opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            
            <div className="relative">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <Badge
                  variant={
                    tournament.status === "active"
                      ? "success"
                      : tournament.status === "upcoming"
                      ? "upcoming"
                      : "secondary"
                  }
                >
                  {tournament.status.toUpperCase()}
                </Badge>
              </div>

              <h3 className="mb-1 font-display text-lg tracking-wide text-foreground">
                {tournament.name}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">{tournament.sport}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Teams</span>
                  <span className="font-medium text-foreground">{tournament.teams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Matches</span>
                  <span className="font-medium text-foreground">{tournament.matches}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-medium text-primary">{tournament.currentRound}</span>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="mt-4 w-full justify-between" 
                size="sm"
                onClick={() => handleViewDetails(tournament)}
              >
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View */}
      <div className="rounded-xl border border-border bg-card">
        <Tabs defaultValue="table" className="w-full">
          <div className="border-b border-border px-6 pt-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="table">Points Table</TabsTrigger>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="table" className="p-6">
            <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
              PREMIER LEAGUE 2024
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4">Pos</th>
                    <th className="pb-3 pr-4">Team</th>
                    <th className="pb-3 pr-4 text-center">P</th>
                    <th className="pb-3 pr-4 text-center">W</th>
                    <th className="pb-3 pr-4 text-center">D</th>
                    <th className="pb-3 pr-4 text-center">L</th>
                    <th className="pb-3 pr-4 text-center">GD</th>
                    <th className="pb-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((team, index) => (
                    <tr
                      key={team.team}
                      className={`border-b border-border/50 ${
                        index < 4 ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <span className={`font-display text-lg ${
                          index === 0 ? "text-primary" : "text-foreground"
                        }`}>
                          {team.pos}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-sm font-bold">
                            {team.team.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{team.team}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center text-muted-foreground">{team.played}</td>
                      <td className="py-3 pr-4 text-center text-success">{team.won}</td>
                      <td className="py-3 pr-4 text-center text-muted-foreground">{team.drawn}</td>
                      <td className="py-3 pr-4 text-center text-destructive">{team.lost}</td>
                      <td className="py-3 pr-4 text-center text-muted-foreground">
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-display text-lg text-foreground">{team.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="fixtures" className="p-6">
            <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
              UPCOMING FIXTURES
            </h3>
            <div className="space-y-3">
              {fixtures.map((fixture, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-foreground">{fixture.home}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium text-foreground">{fixture.away}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {fixture.date}
                    </div>
                    <Badge variant="outline">{fixture.time}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bracket" className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Trophy className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg">Tournament bracket view</p>
              <p className="text-sm">Available for knockout tournaments</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Tournament Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new tournament
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Tournament Name *</Label>
              <Input 
                placeholder="Enter tournament name"
                value={newTournament.tournamentName}
                onChange={(e) => setNewTournament({...newTournament, tournamentName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Sport</Label>
                <Select 
                  value={newTournament.sport}
                  onValueChange={(val) => setNewTournament({...newTournament, sport: val})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Badminton">Badminton</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Pickleball">Pickleball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select 
                  value={newTournament.type}
                  onValueChange={(val) => setNewTournament({...newTournament, type: val})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                    <SelectItem value="LEAGUE">League</SelectItem>
                    <SelectItem value="GROUP_KNOCKOUT">Group + Knockout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input 
                  type="date"
                  value={newTournament.startDate}
                  onChange={(e) => setNewTournament({...newTournament, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input 
                  type="date"
                  value={newTournament.endDate}
                  onChange={(e) => setNewTournament({...newTournament, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Venue Name</Label>
              <Input 
                placeholder="Enter venue name"
                value={newTournament.groundName}
                onChange={(e) => setNewTournament({...newTournament, groundName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Max Teams</Label>
              <Input 
                type="number"
                min={2}
                max={128}
                value={newTournament.maxTeams}
                onChange={(e) => setNewTournament({...newTournament, maxTeams: parseInt(e.target.value) || 8})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTournament} disabled={isCreating}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Tournament"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tournament Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {selectedTournament?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTournament?.sport} • {selectedTournament?.type}
            </DialogDescription>
          </DialogHeader>
          {selectedTournament && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedTournament.status === 'active' ? 'success' : 'upcoming'} className="mt-1">
                    {selectedTournament.status?.toUpperCase()}
                  </Badge>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Label className="text-muted-foreground">Teams</Label>
                  <p className="font-display text-2xl">{selectedTournament.teams}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{selectedTournament.startDate || 'TBD'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{selectedTournament.endDate || 'TBD'}</p>
                </div>
              </div>
              {selectedTournament.venue && (
                <div>
                  <Label className="text-muted-foreground">Venue</Label>
                  <p className="font-medium">{selectedTournament.venue}</p>
                </div>
              )}
              
              {/* Tournament Matches */}
              <div className="border-t pt-4">
                <h4 className="font-display text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Matches ({tournamentMatches.length})
                </h4>
                {loadingMatches ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : tournamentMatches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No matches scheduled yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tournamentMatches.map((match: any) => (
                      <div key={match.matchId || match.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.team1Name || match.team1?.name || match.team1?.teamName || match.homeTeam || 'TBD'}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium">{match.team2Name || match.team2?.name || match.team2?.teamName || match.awayTeam || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={match.status === 'COMPLETED' ? 'success' : match.status === 'LIVE' ? 'live' : 'outline'}>
                            {match.status}
                          </Badge>
                          {match.status === 'COMPLETED' && (
                            <span className="font-display">{match.team1Score || 0} - {match.team2Score || 0}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
