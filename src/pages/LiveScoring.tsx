import { useState, useEffect, useRef } from "react";
import { Undo2, AlertCircle, Loader2, RefreshCw, Trophy } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { webSocketService } from "@/lib/websocket-service";

interface MatchEvent {
  id: number;
  type: "goal" | "yellow" | "red" | "substitution";
  team: "home" | "away";
  player: string;
  playerId?: number;
  time: string;
}

interface LiveMatch {
  matchId: number;
  sportType: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  status: string;
  startTime?: string;
  venueName?: string;
  timerState?: {
    elapsedTimeInSeconds: number;
    running: boolean;
  };
}

interface TeamMember {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
  };
}

export default function LiveScoring() {
  const { toast } = useToast();
  const hasAutoSelected = useRef(false);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [matchTime, setMatchTime] = useState("0:00");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [homePlayers, setHomePlayers] = useState<TeamMember[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sportType, setSportType] = useState<string>("");
  const [isRacketSport, setIsRacketSport] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [team1SetsWon, setTeam1SetsWon] = useState(0);
  const [team2SetsWon, setTeam2SetsWon] = useState(0);
  const [team1SetScore, setTeam1SetScore] = useState(0);
  const [team2SetScore, setTeam2SetScore] = useState(0);
  const [pointWonBy, setPointWonBy] = useState<string>("ACE");
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const [winnerScore, setWinnerScore] = useState("");

  // Fetch live matches on component mount
  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-select first match ONLY on initial load (runs once)
  useEffect(() => {
    if (liveMatches.length > 0 && !hasAutoSelected.current) {
      console.log('Auto-selecting first live match on initial load:', liveMatches[0].matchId);
      setSelectedMatchId(liveMatches[0].matchId);
      hasAutoSelected.current = true;
    }
  }, [liveMatches.length]); // Only depend on length to avoid re-running when array reference changes

  // WebSocket connection and match details
  useEffect(() => {
    if (selectedMatchId) {
      // Initial fetch
      fetchMatchDetails(selectedMatchId);
      
      // Connect to WebSocket
      webSocketService.connect(
        () => console.log('WebSocket connected for live scoring'),
        (error) => console.error('WebSocket connection error:', error)
      );
      
      // Subscribe to match updates
      const unsubscribe = webSocketService.subscribeToMatch(
        selectedMatchId,
        (message) => {
          console.log('WebSocket message:', message);
          
          // Backend sends RealTimeEvent with type and data fields
          if (message.type === 'SCORE_UPDATE') {
            updateScoresFromWebSocket(message.data);
          } else if (message.type === 'SET_COMPLETED') {
            handleSetCompleted(message.data);
          } else if (message.type === 'MATCH_COMPLETED') {
            handleMatchCompleted(message.data);
          } else if (message.type === 'EVENT' || message.type === 'GOAL' || message.type === 'CARD') {
            handleNewEvent(message.data);
          }
        }
      );
      
      return () => {
        unsubscribe();
      };
    }
  }, [selectedMatchId]);

  const handleSetCompleted = (data: any) => {
    console.log('Set completed:', data);
    
    // Show the final scores of the completed set first
    // The data contains: setNumber, team1SetScore, team2SetScore, winnerTeamId, team1SetsWon, team2SetsWon
    setTeam1SetsWon(data.team1SetsWon || 0);
    setTeam2SetsWon(data.team2SetsWon || 0);
    
    // Show a toast notification about the set completion
    const winnerName = data.winnerTeamId === 1 ? selectedMatch?.teamAName : selectedMatch?.teamBName;
    toast({
      title: `Set ${data.setNumber} Complete!`,
      description: `${winnerName} wins the set ${data.team1SetScore}-${data.team2SetScore}. Sets: ${data.team1SetsWon}-${data.team2SetsWon}`,
    });
    
    // Update current set for the UI
    if (data.nextSetNumber) {
      setCurrentSet(data.nextSetNumber);
    }
  };

  const handleMatchCompleted = (data: any) => {
    console.log('========== MATCH COMPLETED ==========');
    console.log('Match completed data:', JSON.stringify(data, null, 2));
    console.log('Winner Name:', data.winnerName);
    console.log('Team1 Name:', data.team1Name);
    console.log('Team2 Name:', data.team2Name);
    console.log('Final Scores - Team1:', data.team1TotalScore, 'Team2:', data.team2TotalScore);
    
    // Show winner celebration popup
    const winner = data.winnerName || data.team1Name || 'Winner';
    const finalScore = `${data.team1TotalScore || data.scoreA || 0} - ${data.team2TotalScore || data.scoreB || 0}`;
    
    console.log('Setting winner popup - Name:', winner, 'Score:', finalScore);
    setWinnerName(winner);
    setWinnerScore(finalScore);
    setShowWinnerPopup(true);
    console.log('Winner popup state set to true');
    
    // Also show toast
    toast({
      title: "Match Complete!",
      description: `${winner} wins the match!`,
    });
    
    // Refresh to get final state
    if (selectedMatchId) {
      fetchMatchDetails(selectedMatchId);
    }
  };

  const updateScoresFromWebSocket = (data: any) => {
    console.log('========== WebSocket Score Update ==========');
    console.log('Raw WebSocket data:', JSON.stringify(data, null, 2));
    console.log('team1TotalScore:', data.team1TotalScore);
    console.log('team2TotalScore:', data.team2TotalScore);
    
    // Check if this is racket sport by checking if set-related fields exist
    if (data.team1SetsWon !== undefined || data.currentSet !== undefined) {
      // Racket sport - update set scores
      console.log('Detected racket sport - updating set scores');
      setTeam1SetsWon(data.team1SetsWon || 0);
      setTeam2SetsWon(data.team2SetsWon || 0);
      setTeam1SetScore(data.team1CurrentSetPoints || 0);
      setTeam2SetScore(data.team2CurrentSetPoints || 0);
      setCurrentSet(data.currentSet || 1);
      setHomeScore(data.team1TotalScore || 0);
      setAwayScore(data.team2TotalScore || 0);
      console.log('Updated racket sport scores - Home:', data.team1TotalScore, 'Away:', data.team2TotalScore);
    } else {
      // Football - simple goal count
      console.log('Detected football - updating goal scores');
      setHomeScore(data.team1TotalScore || 0);
      setAwayScore(data.team2TotalScore || 0);
      console.log('Updated football scores - Home:', data.team1TotalScore, 'Away:', data.team2TotalScore);
    }
    console.log('==========================================');
  };
  
  const handleNewEvent = (event: any) => {
    const newEvent: MatchEvent = {
      id: events.length + 1,
      type: event.eventType?.toLowerCase() || 'goal',
      team: event.team === 1 || event.scoringTeam === 1 ? 'home' : 'away',
      player: event.playerName || 'Unknown',
      playerId: event.playerId,
      time: event.matchMinute ? `${event.matchMinute}'` : "0'",
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const fetchLiveMatches = async () => {
    try {
      const matches = await api.get<LiveMatch[]>('/api/matches/live');
      console.log('Fetched live matches:', matches.length);
      setLiveMatches(matches);
      
      // If the currently selected match is no longer in the live matches list, clear selection
      // User will need to manually select a new match
      if (selectedMatchId && matches.length > 0 && !matches.find(m => m.matchId === selectedMatchId)) {
        console.log('Warning: Selected match is no longer live');
        toast({
          title: "Match Ended",
          description: "The selected match is no longer live. Please select another match.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      toast({
        title: "Error",
        description: "Failed to load live matches",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId: number) => {
    try {
      setIsRefreshing(true);
      // Get live score
      const liveScore = await api.get<any>(`/api/match/${matchId}/live-score`);
      
      // Get match details
      const matchDetails = await api.get<any>(`/api/match/${matchId}`);
      
      // Detect sport type
      const sport = liveScore.sportName || matchDetails.sport?.name || selectedMatch?.sportType || '';
      setSportType(sport);
      const isRacket = ['Tennis', 'Badminton', 'Pickleball'].includes(sport);
      setIsRacketSport(isRacket);
      
      // Update scores based on sport type
      if (isRacket) {
        // Racket sport - show set scores
        setTeam1SetsWon(liveScore.team1SetsWon || matchDetails.team1SetsWon || 0);
        setTeam2SetsWon(liveScore.team2SetsWon || matchDetails.team2SetsWon || 0);
        setTeam1SetScore(liveScore.team1CurrentSetPoints || 0);
        setTeam2SetScore(liveScore.team2CurrentSetPoints || 0);
        setCurrentSet(liveScore.currentSet || 1);
        setHomeScore(liveScore.team1TotalScore || liveScore.data?.scoreA || matchDetails.team1Score || 0);
        setAwayScore(liveScore.team2TotalScore || liveScore.data?.scoreB || matchDetails.team2Score || 0);
      } else {
        // Football - simple scores
        setHomeScore(liveScore.data?.scoreA || matchDetails.team1Score || 0);
        setAwayScore(liveScore.data?.scoreB || matchDetails.team2Score || 0);
      }
      
      // Update match info
      const match = liveMatches.find(m => m.matchId === matchId);
      if (match) {
        setSelectedMatch(match);
      }
      
      // Calculate match time
      if (match?.timerState?.elapsedTimeInSeconds) {
        const minutes = Math.floor(match.timerState.elapsedTimeInSeconds / 60);
        const seconds = match.timerState.elapsedTimeInSeconds % 60;
        setMatchTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
      
      // Load team members - use team1Players/team2Players from API (MatchPlayer table)
      // not team1.teamMembers (Team table) since matches have their own player rosters
      const team1Members = matchDetails.team1Players || matchDetails.team1?.teamMembers || [];
      const team2Members = matchDetails.team2Players || matchDetails.team2?.teamMembers || [];
      
      console.log('Team 1 members from API:', team1Members);
      console.log('Team 2 members from API:', team2Members);
      
      // Convert to TeamMember format if needed
      const formatPlayers = (players: any[]) => {
        return players.map((p: any) => ({
          id: p.id || p.playerId,
          user: {
            id: p.id || p.playerId,
            name: p.name || p.playerName || 'Unknown',
            username: p.username || ''
          }
        }));
      };
      
      setHomePlayers(formatPlayers(team1Members));
      setAwayPlayers(formatPlayers(team2Members));
      
      // Load events from match scoring events
      if (liveScore.data?.events) {
        const mappedEvents = liveScore.data.events.map((evt: any, idx: number) => ({
          id: idx + 1,
          type: evt.eventType?.toLowerCase() || 'goal',
          team: evt.team === 1 ? 'home' : 'away',
          player: evt.playerName || 'Unknown',
          playerId: evt.playerId,
          time: evt.matchMinute ? `${evt.matchMinute}'` : "0'",
        }));
        setEvents(mappedEvents);
      }
      
      setIsRefreshing(false);
    } catch (error) {
      console.error('Failed to fetch match details:', error);
      setIsRefreshing(false);
    }
  };

  const addEvent = async (type: "goal" | "yellow" | "red" | "substitution") => {
    if (!selectedMatchId) {
      toast({
        title: "No match selected",
        description: "Please select a live match first.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlayerId) {
      toast({
        title: "Select a player",
        description: "Please select a player before adding an event.",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      const teamNumber = selectedTeam === 'home' ? 1 : 2;

      if (type === "goal") {
        if (isRacketSport) {
          // For racket sports, use rally-score endpoint with selected point type
          response = await api.post(`/api/match/${selectedMatchId}/rally-score/team${teamNumber}`, {
            scorerPlayerId: selectedPlayerId,
            pointWonBy: pointWonBy,
          });
        } else {
          // For football, use goal endpoint with query parameters
          const params = new URLSearchParams();
          params.append('team', teamNumber.toString());
          if (selectedPlayerId) params.append('playerId', selectedPlayerId.toString());
          
          response = await api.post(`/api/match/${selectedMatchId}/goal?${params.toString()}`);
        }
      } else if (type === "yellow") {
        // Add yellow card with query parameters
        const params = new URLSearchParams();
        params.append('team', teamNumber.toString());
        if (selectedPlayerId) params.append('playerId', selectedPlayerId.toString());
        
        response = await api.post(`/api/match/${selectedMatchId}/yellow-card?${params.toString()}`);
      } else if (type === "red") {
        // Add red card with query parameters
        const params = new URLSearchParams();
        params.append('team', teamNumber.toString());
        if (selectedPlayerId) params.append('playerId', selectedPlayerId.toString());
        
        response = await api.post(`/api/match/${selectedMatchId}/red-card?${params.toString()}`);
      }

      toast({
        title: type === "goal" ? "⚽ GOAL!" : type === "yellow" ? "🟨 Yellow Card" : type === "red" ? "🟥 Red Card" : "🔄 Substitution",
        description: `${selectedPlayer} - ${matchTime.split(":")[0]}'`,
      });

      // Refresh match details
      await fetchMatchDetails(selectedMatchId);
      
      // Keep player selected for consecutive scoring
      // setSelectedPlayer("");
      // setSelectedPlayerId(null);
    } catch (error) {
      console.error('Failed to add event:', error);
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const undoLastEvent = async () => {
    if (!selectedMatchId || events.length === 0) return;
    
    try {
      // Use the correct LiveScoring undo endpoint instead of MatchScoring
      await api.post(`/api/match/${selectedMatchId}/scoring-undo`, {});
      
      toast({
        title: "Event Undone",
        description: "Last action has been removed.",
      });
      
      // Refresh match details
      await fetchMatchDetails(selectedMatchId);
    } catch (error) {
      console.error('Failed to undo event:', error);
      toast({
        title: "Error",
        description: "Failed to undo last event.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="LIVE SCORING" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <DashboardLayout title="LIVE SCORING" subtitle="No live matches">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No live matches at the moment</p>
          <Button className="mt-4" onClick={fetchLiveMatches}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="LIVE SCORING" 
      subtitle={selectedMatch ? `${selectedMatch.teamAName} vs ${selectedMatch.teamBName}` : "Select a match"}
    >
      {/* Match Selection */}
      {liveMatches.length > 1 && (
        <div className="mb-6">
          <Select value={selectedMatchId?.toString()} onValueChange={(v) => {
            const newMatchId = parseInt(v);
            console.log('User manually selected match:', newMatchId);
            setSelectedMatchId(newMatchId);
            hasAutoSelected.current = true; // Mark as manually selected
          }}>
            <SelectTrigger className="max-w-md mx-auto">
              <SelectValue placeholder="Select a live match" />
            </SelectTrigger>
            <SelectContent>
              {liveMatches.map((match) => (
                <SelectItem key={match.matchId} value={match.matchId.toString()}>
                  {match.teamAName} vs {match.teamBName} - {match.sportType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Match Header */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-8">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Badge variant="live" className="text-sm px-4 py-1">
            <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
            LIVE
          </Badge>
          <span className="text-muted-foreground">|</span>
          <span className="font-display text-xl tracking-wider text-muted-foreground">
            {matchTime}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">{selectedMatch?.sportType || 'Match'}</span>
          {isRefreshing && (
            <>
              <span className="text-muted-foreground">|</span>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-16">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-3xl font-bold">
              {selectedMatch?.teamAName.charAt(0) || 'A'}
            </div>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              {selectedMatch?.teamAName.toUpperCase() || 'TEAM A'}
            </h3>
            <p className="text-sm text-muted-foreground">Home</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            {isRacketSport && (
              <div className="text-sm text-muted-foreground mb-2">
                Sets: {team1SetsWon} - {team2SetsWon} | Set {currentSet}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className={`font-display text-7xl tracking-wider transition-all ${
                  events.length > 0 && events[events.length - 1].team === "home" && events[events.length - 1].type === "goal"
                    ? "animate-score-pop text-primary"
                    : "text-foreground"
                }`}>
                  {isRacketSport ? team1SetScore : homeScore}
                </span>
                {isRacketSport && (
                  <div className="text-sm text-muted-foreground mt-1">Total: {homeScore}</div>
                )}
              </div>
              <span className="font-display text-4xl text-muted-foreground">:</span>
              <div className="text-center">
                <span className={`font-display text-7xl tracking-wider transition-all ${
                  events.length > 0 && events[events.length - 1].team === "away" && events[events.length - 1].type === "goal"
                    ? "animate-score-pop text-primary"
                    : "text-foreground"
                }`}>
                  {isRacketSport ? team2SetScore : awayScore}
                </span>
                {isRacketSport && (
                  <div className="text-sm text-muted-foreground mt-1">Total: {awayScore}</div>
                )}
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-3xl font-bold">
              {selectedMatch?.teamBName.charAt(0) || 'B'}
            </div>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              {selectedMatch?.teamBName.toUpperCase() || 'TEAM B'}
            </h3>
            <p className="text-sm text-muted-foreground">Away</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scoring Controls */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              SCORING CONTROLS
            </h3>

            {/* Team & Player Selection */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Select Team
                </label>
                <Select value={selectedTeam} onValueChange={(v: "home" | "away") => setSelectedTeam(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">{selectedMatch?.teamAName || 'Team A'} (Home)</SelectItem>
                    <SelectItem value="away">{selectedMatch?.teamBName || 'Team B'} (Away)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Select Player
                </label>
                <Select 
                  value={selectedPlayerId?.toString() || ""} 
                  onValueChange={(v) => {
                    setSelectedPlayerId(parseInt(v));
                    const players = selectedTeam === 'home' ? homePlayers : awayPlayers;
                    const player = players.find(p => p.user.id === parseInt(v));
                    setSelectedPlayer(player?.user.name || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedTeam === 'home' ? homePlayers : awayPlayers).map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id.toString()}>
                        {member.user.name} ({member.user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Point Type Selection for Racket Sports */}
            {isRacketSport && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Point Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={pointWonBy === "ACE" ? "default" : "outline"}
                    onClick={() => setPointWonBy("ACE")}
                    className="h-12"
                  >
                    🎯 ACE
                  </Button>
                  <Button
                    type="button"
                    variant={pointWonBy === "SMASH" ? "default" : "outline"}
                    onClick={() => setPointWonBy("SMASH")}
                    className="h-12"
                  >
                    💥 SMASH
                  </Button>
                  <Button
                    type="button"
                    variant={pointWonBy === "WINNER" ? "default" : "outline"}
                    onClick={() => setPointWonBy("WINNER")}
                    className="h-12"
                  >
                    ⭐ WINNER
                  </Button>
                  <Button
                    type="button"
                    variant={pointWonBy === "ERROR" ? "default" : "outline"}
                    onClick={() => setPointWonBy("ERROR")}
                    className="h-12"
                  >
                    ❌ ERROR
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Button
                variant="score"
                size="xl"
                className="h-20"
                onClick={() => addEvent("goal")}
              >
                {isRacketSport ? "🎾 POINT" : "⚽ GOAL"}
              </Button>
              <Button
                variant="warning"
                size="xl"
                className="h-20"
                onClick={() => addEvent("yellow")}
              >
                🟨 YELLOW CARD
              </Button>
              <Button
                variant="destructive"
                size="xl"
                className="h-20"
                onClick={() => addEvent("red")}
              >
                🟥 RED CARD
              </Button>
              <Button
                variant="accent"
                size="xl"
                className="h-20"
                onClick={() => addEvent("substitution")}
              >
                🔄 SUBSTITUTION
              </Button>
            </div>

            {/* Undo Button */}
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={undoLastEvent} disabled={events.length === 0}>
                <Undo2 className="mr-2 h-4 w-4" />
                Undo Last Action
              </Button>
            </div>
          </div>
        </div>

        {/* Match Events */}
        <div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display text-lg tracking-wide text-foreground">
              MATCH EVENTS
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="mb-2 h-8 w-8" />
                  <p className="text-sm">No events yet</p>
                </div>
              ) : (
                [...events].reverse().map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3 animate-slide-in"
                  >
                    <span className="text-lg">
                      {event.type === "goal" && "⚽"}
                      {event.type === "yellow" && "🟨"}
                      {event.type === "red" && "🟥"}
                      {event.type === "substitution" && "🔄"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {event.player}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.team === "home" ? selectedMatch?.teamAName : selectedMatch?.teamBName}
                      </p>
                    </div>
                    <span className="font-display text-sm text-muted-foreground">
                      {event.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Celebration Popup */}
      <Dialog open={showWinnerPopup} onOpenChange={setShowWinnerPopup}>
        <DialogContent className="max-w-md border-0 bg-gradient-to-b from-teal-700 via-teal-800 to-slate-900 p-0 overflow-hidden">
          {/* Confetti Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-confetti via-transparent to-transparent animate-fade-in">
              <div className="confetti-piece" style={{left: '10%', animationDelay: '0s'}}>🎊</div>
              <div className="confetti-piece" style={{left: '25%', animationDelay: '0.2s'}}>🎉</div>
              <div className="confetti-piece" style={{left: '40%', animationDelay: '0.4s'}}>✨</div>
              <div className="confetti-piece" style={{left: '60%', animationDelay: '0.1s'}}>🎊</div>
              <div className="confetti-piece" style={{left: '75%', animationDelay: '0.3s'}}>🎉</div>
              <div className="confetti-piece" style={{left: '90%', animationDelay: '0.5s'}}>✨</div>
            </div>
          </div>

          <div className="relative z-10 text-center px-8 py-10">
            {/* Trophy Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 p-6 shadow-2xl animate-bounce-slow">
                <Trophy className="h-16 w-16 text-yellow-900" strokeWidth={2} />
              </div>
            </div>

            {/* You Did It! */}
            <h2 className="mb-6 font-display text-3xl font-bold tracking-wide text-cyan-400 animate-fade-in">
              You Did It!
            </h2>

            {/* Winner Card */}
            <div className="mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-900/40 to-yellow-950/40 p-6 shadow-xl border border-yellow-700/50">
              <h3 className="mb-4 font-display text-2xl font-bold text-yellow-400 animate-pulse-slow">
                Congratulations!
              </h3>
              <p className="mb-4 font-display text-3xl font-bold tracking-wide text-yellow-300">
                {winnerName}
              </p>
              
              {/* Team Logo Placeholder - First letter of team name */}
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg border-4 border-yellow-400">
                <span className="font-display text-5xl font-bold text-white">
                  {winnerName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Final Score */}
              <div className="mt-4">
                <p className="text-sm text-yellow-300/80 mb-1">Final Score</p>
                <p className="font-display text-2xl font-bold text-yellow-200">
                  {winnerScore}
                </p>
              </div>

              {/* Gold Confetti Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
                <div className="gold-shimmer"></div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setShowWinnerPopup(false)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg"
            >
              Close
            </Button>
          </div>

          {/* Decorative Trumpets */}
          <div className="absolute bottom-4 left-4 text-4xl opacity-70">🎺</div>
          <div className="absolute bottom-4 right-4 text-4xl opacity-70 transform scale-x-[-1]">🎺</div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
