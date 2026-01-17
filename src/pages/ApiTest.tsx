import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMatches, usePlayerStats } from "@/hooks/use-api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

const ApiTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [backendVersion, setBackendVersion] = useState<string>('');

  // Test API hooks
  const { data: matches, isLoading: matchesLoading, error: matchesError } = useMatches();
  const { data: playerStats, isLoading: statsLoading, error: statsError } = usePlayerStats(1, 3);

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to fetch matches to test connection
        await api.get('/api/match');
        setConnectionStatus('connected');
        setBackendVersion('Spring Boot 4.0.0 - Java 23');
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('error');
      }
    };

    testConnection();
  }, []);

  return (
    <DashboardLayout title="API Test">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Connection Test</h1>
            <p className="text-muted-foreground">Testing backend API connectivity on port 8081</p>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Backend Connection Status</h2>
          <div className="flex items-center gap-4">
            {connectionStatus === 'checking' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                <span className="text-lg">Checking connection...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <span className="text-lg font-semibold text-green-500">Connected!</span>
                  <p className="text-sm text-muted-foreground">{backendVersion}</p>
                  <p className="text-sm text-muted-foreground">Backend URL: http://localhost:8081</p>
                </div>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <span className="text-lg font-semibold text-red-500">Connection Failed</span>
                  <p className="text-sm text-muted-foreground">Cannot reach backend API on port 8081</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Matches API Test */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Matches API Test</h2>
          {matchesLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading matches...</span>
            </div>
          )}
          {matchesError && (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              <span>Error: {(matchesError as Error).message}</span>
            </div>
          )}
          {matches && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Success! Found {matches.length} matches</span>
              </div>
              <div className="space-y-2">
                {matches.slice(0, 5).map((match) => (
                  <div key={match.matchId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <span className="font-medium">Match #{match.matchId}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {match.sportName || `Sport ${match.sportId}`} - {match.matchFormat}
                      </span>
                    </div>
                    <Badge variant={match.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {match.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Stats API Test */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Stats API Test</h2>
          <p className="text-sm text-muted-foreground mb-4">Testing Player #1, Sport #3 (Football)</p>
          {statsLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading stats...</span>
            </div>
          )}
          {statsError && (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              <span>Error: {(statsError as Error).message}</span>
            </div>
          )}
          {playerStats && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Success!</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Matches Played</div>
                  <div className="text-2xl font-bold">{playerStats.matchesPlayed}</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Wins</div>
                  <div className="text-2xl font-bold text-green-500">{playerStats.wins}</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Losses</div>
                  <div className="text-2xl font-bold text-red-500">{playerStats.losses}</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Win %</div>
                  <div className="text-2xl font-bold">{playerStats.winPercentage}%</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* API Documentation */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Available API Hooks</h2>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-secondary rounded font-mono">useMatches() - Fetch all matches</div>
            <div className="p-2 bg-secondary rounded font-mono">useMatch(id) - Fetch single match</div>
            <div className="p-2 bg-secondary rounded font-mono">usePlayerStats(playerId, sportId) - Player stats</div>
            <div className="p-2 bg-secondary rounded font-mono">useTeamStats(teamId, sportId) - Team stats</div>
            <div className="p-2 bg-secondary rounded font-mono">useLiveScore(matchId) - Live match score</div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Import from: <code className="bg-secondary px-2 py-1 rounded">@/hooks/use-api</code>
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApiTest;
