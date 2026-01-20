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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        {/* Home Team */}
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg font-bold shrink-0">
            {homeTeam.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm sm:text-base truncate">{homeTeam.name}</p>
            <p className="text-xs text-muted-foreground">Home</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-0">
          <span
            className={`font-display text-2xl sm:text-3xl tracking-wider ${
              status === "live" ? "text-primary" : "text-foreground"
            }`}
          >
            {homeTeam.score}
          </span>
          <span className="text-muted-foreground">-</span>
          <span
            className={`font-display text-2xl sm:text-3xl tracking-wider ${
              status === "live" ? "text-primary" : "text-foreground"
            }`}
          >
            {awayTeam.score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex flex-1 items-center justify-end gap-3 w-full sm:w-auto flex-row-reverse sm:flex-row">
          <div className="text-left sm:text-right min-w-0 flex-1 sm:flex-auto">
            <p className="font-medium text-foreground text-sm sm:text-base truncate">{awayTeam.name}</p>
            <p className="text-xs text-muted-foreground">Away</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg font-bold shrink-0">
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
