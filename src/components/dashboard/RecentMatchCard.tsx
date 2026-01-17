import { Badge } from "@/components/ui/badge";

interface Team {
  name: string;
  logo?: string;
  score: number;
}

interface RecentMatchCardProps {
  homeTeam: Team;
  awayTeam: Team;
  sport: string;
  status: "live" | "upcoming" | "completed";
  time: string;
  tournament?: string;
}

export function RecentMatchCard({
  homeTeam,
  awayTeam,
  sport,
  status,
  time,
  tournament,
}: RecentMatchCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      {/* Status Bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={status}>{status.toUpperCase()}</Badge>
          <span className="text-xs text-muted-foreground">{sport}</span>
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg font-bold">
            {homeTeam.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{homeTeam.name}</p>
            <p className="text-xs text-muted-foreground">Home</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-4">
          <span
            className={`font-display text-3xl tracking-wider ${
              status === "live" ? "text-primary" : "text-foreground"
            }`}
          >
            {homeTeam.score}
          </span>
          <span className="text-muted-foreground">-</span>
          <span
            className={`font-display text-3xl tracking-wider ${
              status === "live" ? "text-primary" : "text-foreground"
            }`}
          >
            {awayTeam.score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="text-right">
            <p className="font-medium text-foreground">{awayTeam.name}</p>
            <p className="text-xs text-muted-foreground">Away</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg font-bold">
            {awayTeam.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Tournament */}
      {tournament && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{tournament}</p>
        </div>
      )}
    </div>
  );
}
