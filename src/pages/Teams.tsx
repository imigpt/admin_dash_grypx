import { useState, useEffect } from "react";
import { Plus, Search, Users, Trophy, Calendar, Edit, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTeams, useDeleteTeam } from "@/hooks/use-admin-api";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSports, useCreateTeam, useUpdateTeam } from "@/hooks/use-admin-api";

interface TeamFormData {
  name: string;
  sportId: number | null;
  logoUrl?: string;
}

export default function Teams() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  const [teamStats, setTeamStats] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    sportId: null,
    logoUrl: "",
  });

  const { data: teams, isLoading } = useTeams();
  const { data: sports } = useSports();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  // Fetch team stats including wins/losses - try all sports to get aggregate stats
  useEffect(() => {
    const fetchTeamStats = async () => {
      if (!teams || teams.length === 0) return;
      
      console.log('[Teams] Starting to fetch team stats. Total teams:', teams.length);
      const stats: Record<string, any> = {};
      const sportIds = [1, 2, 3, 4]; // Tennis, Badminton, Football, Pickleball
      
      for (const team of teams) {
        // Type cast to access backend fields
        const teamData = team as any;
        const teamId = teamData.teamId || teamData.id || team.id;
        
        // Try to get stats from all sports and aggregate them
        let aggregatedStats = {
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDrawn: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          winRate: 0,
        };
        
        for (const sportId of sportIds) {
          try {
            const data = await api.get<any>(`/api/stats/team/${teamId}/sport/${sportId}`);
            if (data && data.matchesPlayed > 0) {
              aggregatedStats.matchesPlayed += data.matchesPlayed || 0;
              aggregatedStats.matchesWon += data.matchesWon || 0;
              aggregatedStats.matchesLost += data.matchesLost || 0;
              aggregatedStats.matchesDrawn += data.matchesDrawn || 0;
              aggregatedStats.goalsFor += data.goalsFor || 0;
              aggregatedStats.goalsAgainst += data.goalsAgainst || 0;
              aggregatedStats.points += data.points || 0;
            }
          } catch (error) {
            // Silently skip if no stats for this sport
          }
        }
        
        // Calculate overall win rate
        if (aggregatedStats.matchesPlayed > 0) {
          aggregatedStats.winRate = Math.round((aggregatedStats.matchesWon / aggregatedStats.matchesPlayed) * 100);
        }
        
        console.log(`[Teams] Aggregated stats for team ${teamId}:`, aggregatedStats);
        stats[String(teamId)] = aggregatedStats;
      }
      
      console.log('[Teams] Final stats map:', stats);
      setTeamStats(stats);
    };
    
    fetchTeamStats();
  }, [teams]);
  
  // Helper function to map sport names to IDs (adjust based on your backend)
  const getSportIdByName = (sportName: string): number => {
    const sportMap: Record<string, number> = {
      'Tennis': 1,
      'Badminton': 2,
      'Football': 3,
      'Pickleball': 4,
    };
    return sportMap[sportName] || 1;
  };

  // Map backend team structure to frontend format with stats
  const mappedTeams = teams?.map((team: any) => {
    const teamData = team as any;
    const teamId = teamData.teamId || teamData.id || team.id;
    const sportName = teamData.sport || teamData.sportName;
    const sportId = teamData.sportId || team.sportId || getSportIdByName(sportName);
    // Use simple teamId lookup instead of composite key
    const stats = teamStats[String(teamId)] || {};
    
    console.log(`[Teams] Mapping team ${teamId} (${teamData.teamName || team.name}):`, { 
      hasStats: !!stats, 
      statsKeys: Object.keys(stats),
      matchesWon: stats.matchesWon,
      matchesPlayed: stats.matchesPlayed 
    });
    
    return {
      id: teamId,
      name: teamData.teamName || team.name,
      sportId: sportId,
      sportName: sportName || team.sportName,
      logoUrl: teamData.teamImage || team.logoUrl,
      memberCount: teamData.playerCount || teamData.members?.length || 0,
      members: teamData.members || [],
      createdAt: teamData.createdAt,
      createdBy: teamData.createdByUsername,
      description: teamData.description,
      location: teamData.location,
      // Add stats from API
      matchesWon: stats.matchesWon || 0,
      matchesLost: stats.matchesLost || 0,
      matchesPlayed: stats.matchesPlayed || 0,
      matchesDrawn: stats.matchesDrawn || 0,
      winRate: stats.winRate || 0,
    };
  }) || [];

  const filteredTeams = mappedTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (team?: any) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        sportId: team.sportId,
        logoUrl: team.logoUrl || "",
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: "",
        sportId: null,
        logoUrl: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
    setFormData({
      name: "",
      sportId: null,
      logoUrl: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sportId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTeam) {
        await updateTeam.mutateAsync({
          id: editingTeam.id,
          data: formData as any,
        });
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
      } else {
        await createTeam.mutateAsync(formData as any);
        toast({
          title: "Success",
          description: "Team created successfully",
        });
      }
      handleCloseForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save team",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam.mutateAsync(teamToDelete);
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const getSportColor = (sportId: number) => {
    const colors: Record<number, string> = {
      1: "hsl(210 90% 55%)", // Tennis - Blue
      2: "hsl(35 95% 55%)",  // Badminton - Orange
      3: "hsl(145 80% 45%)", // Football - Green
      4: "hsl(280 70% 50%)", // Pickleball - Purple
    };
    return colors[sportId] || "hsl(0 0% 50%)";
  };

  return (
    <DashboardLayout title="TEAMS" subtitle="Manage all teams">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTeams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No teams found</p>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => {
          const sport = sports?.find(s => s.id === team.sportId);
          const color = getSportColor(team.sportId);
          
          return (
            <div
              key={team.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              {/* Color Bar */}
              <div
                className="h-2"
                style={{ background: color }}
              />

              <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-foreground"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display text-xl tracking-wide text-foreground">
                        {team.name}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {sport?.name || 'Unknown Sport'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-3 gap-3 rounded-lg bg-secondary/50 p-4">
                  <div className="text-center">
                    <p className="font-display text-xl text-success">
                      {team.matchesWon || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-destructive">
                      {team.matchesLost || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-foreground">
                      {team.memberCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Players</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      Win Rate
                    </div>
                    <span className="font-medium text-primary">
                      {team.winRate ? `${team.winRate}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      Matches Played
                    </div>
                    <span className="font-medium text-foreground">
                      {team.matchesPlayed || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenForm(team)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setTeamToDelete(team.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Team Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </DialogTitle>
            <DialogDescription>
              {editingTeam
                ? 'Update team information'
                : 'Add a new team to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select
                value={formData.sportId?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, sportId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTeam.isPending || updateTeam.isPending}
              >
                {(createTeam.isPending || updateTeam.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingTeam ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTeam.isPending}
            >
              {deleteTeam.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
