import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Award, Edit, Plus, Save, Trophy, Target, Zap, Timer, Star, Medal, Loader2 } from "lucide-react";

// Types
interface TierThreshold {
  tier: string;
  thresholdValue: number;
  pointsReward: number;
  iconUrl?: string;
  isActive: boolean;
}

interface StatTypeConfig {
  statType: string;
  displayName: string;
  description: string;
  unit: string;
  tiers: TierThreshold[];
}

interface BadgeConfig {
  sportCategory: string;
  sportDisplayName: string;
  statTypes: StatTypeConfig[];
}

interface BadgeThreshold {
  id: number;
  sportCategory: string;
  statType: string;
  tier: string;
  thresholdValue: number;
  pointsReward: number;
  displayName: string;
  description: string;
  isActive: boolean;
}

// Tier colors and icons
const tierConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  BRONZE: { color: "text-amber-700", bgColor: "bg-amber-100", icon: <Medal className="h-4 w-4" /> },
  SILVER: { color: "text-slate-500", bgColor: "bg-slate-100", icon: <Medal className="h-4 w-4" /> },
  GOLD: { color: "text-yellow-500", bgColor: "bg-yellow-100", icon: <Trophy className="h-4 w-4" /> },
  PLATINUM: { color: "text-cyan-500", bgColor: "bg-cyan-100", icon: <Star className="h-4 w-4" /> },
  DIAMOND: { color: "text-purple-500", bgColor: "bg-purple-100", icon: <Zap className="h-4 w-4" /> },
};

// Stat type icons
const statIcons: Record<string, React.ReactNode> = {
  ACES: <Zap className="h-5 w-5" />,
  POINTS: <Target className="h-5 w-5" />,
  MVP: <Star className="h-5 w-5" />,
  CONNECTIVITY: <Timer className="h-5 w-5" />,
  SMASHES: <Zap className="h-5 w-5" />,
  GOALS: <Target className="h-5 w-5" />,
  ASSISTS: <Award className="h-5 w-5" />,
  MINUTES_PLAYED: <Timer className="h-5 w-5" />,
  HAT_TRICK: <Trophy className="h-5 w-5" />,
  CLEAN_SHEET: <Medal className="h-5 w-5" />,
};

export default function Badges() {
  const [config, setConfig] = useState<BadgeConfig[]>([]);
  const [thresholds, setThresholds] = useState<BadgeThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingThreshold, setEditingThreshold] = useState<BadgeThreshold | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState("RACKET_GAMES");
  const { toast } = useToast();

  // Fetch badge configuration
  useEffect(() => {
    fetchBadgeConfig();
    fetchThresholds();
    fetchAllBadges();
  }, []);

  const fetchBadgeConfig = async () => {
    try {
      const data = await api.get<BadgeConfig[]>("/api/v1/badges/config");
      setConfig(data);
    } catch (error) {
      console.error("Error fetching badge config:", error);
      toast({
        title: "Error",
        description: "Failed to fetch badge configuration",
        variant: "destructive",
      });
    }
  };

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      // fetch including inactive so disabled badges remain visible in admin UI
      const data = await api.get<BadgeThreshold[]>("/api/v1/badges/thresholds?includeInactive=true");
      setThresholds(data);
    } catch (error) {
      console.error("Error fetching thresholds:", error);
      toast({
        title: "Error",
        description: "Failed to fetch badge thresholds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBadges = async () => {
    try {
      const data = await api.get<any[]>("/api/v1/badges?includeInactive=true");
      // store in local state or console for now
      console.debug('All badges (incl inactive):', data);
    } catch (error) {
      console.error('Error fetching all badges:', error);
    }
  };

  const handleEditThreshold = (threshold: BadgeThreshold) => {
    setEditingThreshold({ ...threshold });
    setIsEditDialogOpen(true);
  };

  const handleSaveThreshold = async () => {
    if (!editingThreshold) return;

    try {
      await api.put(`/api/v1/badges/thresholds/${editingThreshold.id}`, editingThreshold);
      toast({
        title: "Success",
        description: "Badge threshold updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingThreshold(null);
      fetchThresholds();
      fetchBadgeConfig();
    } catch (error) {
      console.error("Error updating threshold:", error);
      toast({
        title: "Error",
        description: "Failed to update threshold",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (threshold: BadgeThreshold) => {
    try {
      await api.put(`/api/v1/badges/thresholds/${threshold.id}`, {
        isActive: !threshold.isActive,
      });
      toast({
        title: "Success",
        description: `Badge ${threshold.isActive ? "deactivated" : "activated"} successfully`,
      });
      fetchThresholds();
    } catch (error) {
      console.error("Error toggling threshold:", error);
      toast({
        title: "Error",
        description: "Failed to toggle badge status",
        variant: "destructive",
      });
    }
  };

  const getFilteredThresholds = (sportCategory: string) => {
    return thresholds.filter((t) => t.sportCategory === sportCategory);
  };

  const groupThresholdsByStatType = (sportCategory: string) => {
    const filtered = getFilteredThresholds(sportCategory);
    const grouped: Record<string, BadgeThreshold[]> = {};
    
    filtered.forEach((t) => {
      if (!grouped[t.statType]) {
        grouped[t.statType] = [];
      }
      grouped[t.statType].push(t);
    });

    // Sort each group by threshold value
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.thresholdValue - b.thresholdValue);
    });

    return grouped;
  };

  if (loading) {
    return (
      <DashboardLayout title="BADGES" subtitle="Configure badge thresholds and rewards">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading badge configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="BADGES" subtitle="Configure badge thresholds and rewards for different sports">
      <div className="space-y-6">

      {/* Sport Category Tabs */}
      <Tabs value={selectedSport} onValueChange={setSelectedSport} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="RACKET_GAMES" className="flex items-center gap-2">
            🎾 Racket Games
          </TabsTrigger>
          <TabsTrigger value="FOOTBALL" className="flex items-center gap-2">
            ⚽ Football
          </TabsTrigger>
        </TabsList>

        {/* Racket Games Tab */}
        <TabsContent value="RACKET_GAMES" className="mt-6">
          <div className="grid gap-6">
            {Object.entries(groupThresholdsByStatType("RACKET_GAMES")).map(([statType, statThresholds]) => (
              <StatTypeCard
                key={statType}
                statType={statType}
                thresholds={statThresholds}
                onEdit={handleEditThreshold}
                onToggle={handleToggleActive}
              />
            ))}
          </div>
        </TabsContent>

        {/* Football Tab */}
        <TabsContent value="FOOTBALL" className="mt-6">
          <div className="grid gap-6">
            {Object.entries(groupThresholdsByStatType("FOOTBALL")).map(([statType, statThresholds]) => (
              <StatTypeCard
                key={statType}
                statType={statType}
                thresholds={statThresholds}
                onEdit={handleEditThreshold}
                onToggle={handleToggleActive}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Badge Threshold
            </DialogTitle>
            <DialogDescription>
              Modify the threshold value and points reward for this badge tier.
            </DialogDescription>
          </DialogHeader>

          {editingThreshold && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Badge
                  className={`${tierConfig[editingThreshold.tier]?.bgColor} ${tierConfig[editingThreshold.tier]?.color}`}
                >
                  {tierConfig[editingThreshold.tier]?.icon}
                  <span className="ml-1">{editingThreshold.tier}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {editingThreshold.statType.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editingThreshold.displayName || ""}
                  onChange={(e) =>
                    setEditingThreshold({ ...editingThreshold, displayName: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingThreshold.description || ""}
                  onChange={(e) =>
                    setEditingThreshold({ ...editingThreshold, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="thresholdValue">Threshold Value</Label>
                  <Input
                    id="thresholdValue"
                    type="number"
                    min="1"
                    value={editingThreshold.thresholdValue}
                    onChange={(e) =>
                      setEditingThreshold({
                        ...editingThreshold,
                        thresholdValue: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum value to earn this badge
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pointsReward">Points Reward</Label>
                  <Input
                    id="pointsReward"
                    type="number"
                    min="0"
                    value={editingThreshold.pointsReward}
                    onChange={(e) =>
                      setEditingThreshold({
                        ...editingThreshold,
                        pointsReward: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Points awarded to player
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingThreshold.isActive}
                  onCheckedChange={(checked) =>
                    setEditingThreshold({ ...editingThreshold, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Badge Active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveThreshold}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Stat Type Card Component
function StatTypeCard({
  statType,
  thresholds,
  onEdit,
  onToggle,
}: {
  statType: string;
  thresholds: BadgeThreshold[];
  onEdit: (threshold: BadgeThreshold) => void;
  onToggle: (threshold: BadgeThreshold) => void;
}) {
  const displayName = statType.replace(/_/g, " ");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {statIcons[statType] || <Award className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription>
                {thresholds[0]?.description?.split(" ").slice(0, 5).join(" ")}...
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {thresholds.filter((t) => t.isActive).length} / {thresholds.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier</TableHead>
              <TableHead>Badge Name</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thresholds.map((threshold) => (
              <TableRow key={threshold.id} className={!threshold.isActive ? "opacity-50" : ""}>
                <TableCell>
                  <Badge
                    className={`${tierConfig[threshold.tier]?.bgColor} ${tierConfig[threshold.tier]?.color}`}
                  >
                    {tierConfig[threshold.tier]?.icon}
                    <span className="ml-1">{threshold.tier}</span>
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{threshold.displayName}</TableCell>
                <TableCell className="text-right font-mono">
                  {threshold.thresholdValue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600 font-semibold">+{threshold.pointsReward}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={threshold.isActive}
                    onCheckedChange={() => onToggle(threshold)}
                    className="mx-auto"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(threshold)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
