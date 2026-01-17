# Badge System - Frontend Integration Guide

## Overview
The badge system rewards players for achievements in matches. Badges are automatically earned when players meet specific thresholds (e.g., score 50 points, get 10 aces). This guide shows how to integrate badges into your frontend application.

---

## API Endpoints

### 1. Get Player Badges
Fetch all badges earned by a specific player.

```http
GET /api/v1/badges/player/{playerId}
```

**Headers:**
```json
{
  "userId": "1"  // Required: ID of the requesting user
}
```

**Response:** Array of `PlayerBadgeDTO`
```json
[
  {
    "id": 1,
    "playerId": 1,
    "playerName": "ayushi",
    "badge": {
      "id": 6,
      "name": "Point Scorer",
      "description": "Score 50 points in a match",
      "iconUrl": null,
      "sportCategory": "RACKET_GAMES",
      "statType": "POINTS",
      "tier": "BRONZE",
      "thresholdValue": 50,
      "pointsReward": 10,
      "isRepeatable": true,
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2026-01-07T19:49:33",
      "updatedAt": "2026-01-07T19:49:33"
    },
    "matchId": null,
    "matchTitle": null,
    "tournamentId": null,
    "tournamentName": null,
    "statValue": 50,
    "earnedAt": "2026-01-08T22:53:31",
    "earnCount": null,
    "isNotified": null
  }
]
```

---

### 2. Get All Available Badges
Fetch all badge definitions in the system.

```http
GET /api/v1/badges?includeInactive={true|false}
```

**Headers:**
```json
{
  "userId": "1"
}
```

**Query Parameters:**
- `includeInactive` (optional): Include inactive badges. Default: `false`

**Response:** Array of `Badge` objects
```json
[
  {
    "id": 6,
    "name": "Point Scorer",
    "description": "Score 50 points in a match",
    "iconUrl": null,
    "sportCategory": "RACKET_GAMES",
    "statType": "POINTS",
    "tier": "BRONZE",
    "thresholdValue": 50,
    "pointsReward": 10,
    "isRepeatable": true,
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2026-01-07T19:49:33",
    "updatedAt": "2026-01-07T19:49:33"
  }
]
```

---

### 3. Get Badge Thresholds
Get threshold configurations for all badges.

```http
GET /api/v1/badges/thresholds?includeInactive={true|false}
```

**Headers:**
```json
{
  "userId": "1"
}
```

**Response:** Array of badge threshold info
```json
[
  {
    "badgeId": 6,
    "name": "Point Scorer",
    "tier": "BRONZE",
    "statType": "POINTS",
    "threshold": 50,
    "pointsReward": 10
  }
]
```

---

### 4. Evaluate Badges (Admin Only)
Trigger badge evaluation for a player in a specific match.

```http
POST /api/v1/badges/evaluate/match/{matchId}/player/{playerId}
```

**Headers:**
```json
{
  "userId": "1",
  "Content-Type": "application/json"
}
```

**Response:** Array of newly earned badges (same structure as Get Player Badges)

---

## Data Structures

### PlayerBadgeDTO
Represents a badge earned by a player.

```typescript
interface PlayerBadgeDTO {
  id: number;                    // Player badge record ID
  playerId: number;              // Player who earned the badge
  playerName: string;            // Player's name
  badge: Badge;                  // Nested badge details
  matchId: number | null;        // Match where badge was earned
  matchTitle: string | null;     // Match title
  tournamentId: number | null;   // Tournament ID if applicable
  tournamentName: string | null; // Tournament name
  statValue: number;             // Stat value when earned
  earnedAt: string;              // ISO timestamp
  earnCount: number | null;      // Number of times earned (for repeatable)
  isNotified: boolean | null;    // Notification status
}
```

### Badge
Badge definition/template.

```typescript
interface Badge {
  id: number;
  name: string;                  // Badge name (e.g., "Point Scorer")
  description: string;           // What it takes to earn
  iconUrl: string | null;        // Badge icon URL (future feature)
  sportCategory: string;         // "RACKET_GAMES" | "FOOTBALL"
  statType: string;              // "POINTS" | "ACES" | "GOALS" | etc.
  tier: BadgeTier;              // Badge rarity/tier
  thresholdValue: number;        // Value needed to earn badge
  pointsReward: number;          // Points awarded when earned
  isRepeatable: boolean;         // Can be earned multiple times
  isActive: boolean;             // Is badge currently active
  displayOrder: number;          // Display ordering (1-5)
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Badge Tiers
```typescript
type BadgeTier = 
  | "BRONZE"    // Entry-level achievements
  | "SILVER"    // Moderate achievements
  | "GOLD"      // Significant achievements
  | "PLATINUM"  // Expert-level achievements
  | "DIAMOND"   // Legendary achievements
```

---

## Implementation Examples

### Example 1: Fetch and Display Player Badges

```typescript
// Fetch badges for a player
async function fetchPlayerBadges(playerId: number) {
  try {
    const response = await fetch(`/api/v1/badges/player/${playerId}`, {
      headers: { userId: "1" }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const badgeData: PlayerBadgeDTO[] = await response.json();
    
    // Map to simpler structure for display
    const badges = badgeData.map(pb => ({
      id: pb.badge.id,
      name: pb.badge.name,
      tier: pb.badge.tier,
      pointsReward: pb.badge.pointsReward,
      earnedAt: pb.earnedAt
    }));
    
    return badges;
  } catch (error) {
    console.error('Failed to fetch player badges:', error);
    return [];
  }
}

// Usage
const badges = await fetchPlayerBadges(1);
console.log(`Player has ${badges.length} badges`);
```

---

### Example 2: Display Badges with Tier Colors

```tsx
import { Badge } from "@/components/ui/badge";

interface SimpleBadge {
  id: number;
  name: string;
  tier: string;
  pointsReward: number;
}

function BadgeDisplay({ badges }: { badges: SimpleBadge[] }) {
  // Tier color mapping
  const tierColors: Record<string, string> = {
    'BRONZE': 'bg-orange-100 text-orange-800 border-orange-300',
    'SILVER': 'bg-gray-100 text-gray-800 border-gray-300',
    'GOLD': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'PLATINUM': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'DIAMOND': 'bg-blue-100 text-blue-800 border-blue-300'
  };

  if (badges.length === 0) {
    return <span className="text-xs text-muted-foreground">No badges</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 3).map(badge => {
        const colorClass = tierColors[badge.tier] || 'bg-gray-100 text-gray-800';
        
        return (
          <Badge 
            key={badge.id}
            variant="outline"
            className={`text-xs ${colorClass}`}
            title={`${badge.name} (${badge.tier}) - ${badge.pointsReward} points`}
          >
            {badge.name}
          </Badge>
        );
      })}
      
      {badges.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{badges.length - 3} more
        </Badge>
      )}
    </div>
  );
}
```

---

### Example 3: Badge Integration in Player Leaderboard

```typescript
interface PlayerData {
  id: number;
  name: string;
  username: string;
  badges?: SimpleBadge[];
  // ... other fields
}

async function fetchPlayersWithBadges(): Promise<PlayerData[]> {
  // Fetch users
  const usersRes = await fetch('/api/users');
  const users = await usersRes.json();
  
  // Fetch badges for each user
  const playersWithBadges = await Promise.all(
    users.map(async (user) => {
      let playerBadges: SimpleBadge[] = [];
      
      try {
        const badgesRes = await fetch(`/api/v1/badges/player/${user.id}`, {
          headers: { userId: "1" }
        });
        
        if (badgesRes.ok) {
          const badgeData = await badgesRes.json();
          playerBadges = badgeData.map((pb: any) => ({
            id: pb.badge.id,
            name: pb.badge.name,
            tier: pb.badge.tier,
            pointsReward: pb.badge.pointsReward,
            earnedAt: pb.earnedAt
          }));
        }
      } catch (err) {
        console.error(`Failed to fetch badges for player ${user.id}:`, err);
      }
      
      return {
        ...user,
        badges: playerBadges
      };
    })
  );
  
  return playersWithBadges;
}
```

---

## Badge Categories & Stat Types

### Sport Categories
- `RACKET_GAMES` - Badminton, Tennis, Squash, etc.
- `FOOTBALL` - Soccer/Football

### Stat Types (RACKET_GAMES)
- `ACES` - Aces scored in a match
- `POINTS` - Total points scored
- `SMASHES` - Smashes hit
- `MVP` - MVP score achieved
- `CONNECTIVITY` - Consecutive matches played

### Stat Types (FOOTBALL)
- `GOALS` - Goals scored
- `ASSISTS` - Assists made
- `HAT_TRICK` - Hat tricks scored
- `CLEAN_SHEET` - Clean sheets kept (goalkeeper)
- `MINUTES_PLAYED` - Total minutes played

---

## Badge Tiers & Examples

### BRONZE Tier (Entry Level)
- **Point Scorer**: Score 50 points (10 pts reward)
- **First Goal**: Score 1 goal (10 pts reward)
- **Smash Beginner**: Hit 10 smashes (10 pts reward)

### SILVER Tier (Moderate)
- **Ace Hunter**: Score 10 aces (20 pts reward)
- **Point Machine**: Score 100 points (25 pts reward)
- **Double Strike**: Score 2 goals (25 pts reward)

### GOLD Tier (Significant)
- **Ace Master**: Score 20 aces (50 pts reward)
- **Hat Trick Hero**: Score 3 goals (50 pts reward)
- **Assist King**: Make 3 assists (50 pts reward)

### PLATINUM Tier (Expert)
- **Ace Legend**: Score 35 aces (100 pts reward)
- **Super Scorer**: Score 4 goals (100 pts reward)
- **Season Warrior**: Play 2700 minutes (100 pts reward)

### DIAMOND Tier (Legendary)
- **Point God**: Score 500 points (200 pts reward)
- **Goal Machine**: Score 5+ goals (200 pts reward)
- **Legendary Guardian**: Keep 20 clean sheets (300 pts reward)

---

## Best Practices

### 1. Error Handling
Always handle badge fetch errors gracefully:
```typescript
try {
  const badges = await fetchPlayerBadges(playerId);
  // Use badges
} catch (error) {
  console.error('Badge fetch failed:', error);
  // Show fallback UI or empty state
  return [];
}
```

### 2. Performance Optimization
Batch badge requests when loading multiple players:
```typescript
// Good: Parallel requests
const badgePromises = players.map(p => fetchPlayerBadges(p.id));
const allBadges = await Promise.all(badgePromises);

// Avoid: Sequential requests
// for (const player of players) {
//   await fetchPlayerBadges(player.id); // Slow!
// }
```

### 3. Caching
Cache badge data to reduce API calls:
```typescript
const badgeCache = new Map<number, SimpleBadge[]>();

async function getCachedBadges(playerId: number) {
  if (badgeCache.has(playerId)) {
    return badgeCache.get(playerId)!;
  }
  
  const badges = await fetchPlayerBadges(playerId);
  badgeCache.set(playerId, badges);
  return badges;
}
```

### 4. UI States
Handle all badge states:
- **Loading**: Show skeleton or "Loading..."
- **Empty**: Show "No badges" message
- **Error**: Show error message or hide badges section
- **Success**: Display badges with colors and tooltips

---

## Vite Proxy Configuration

Ensure your `vite.config.ts` has the API proxy configured:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

This allows frontend requests to `/api/v1/badges/...` to proxy to the backend at `http://localhost:8081`.

---

## Testing the Integration

### 1. Check API Response
```bash
# PowerShell
$badges = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/badges/player/1" -Headers @{"userId"="1"}
$badges | ConvertTo-Json -Depth 3
```

### 2. Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "badges"
4. Reload the page
5. Check request/response for `/api/v1/badges/player/`

### 3. Console Logging
Add logging to track badge fetching:
```typescript
console.log(`Fetching badges for player ${playerId}...`);
const badges = await fetchPlayerBadges(playerId);
console.log(`Player ${playerId} badges:`, badges);
```

---

## Complete Working Example

See the implementation in:
- **File**: `d:\sportsapp\Admin Dash\src\pages\PlayerLeaderboard.tsx`
- **Lines**: 114-130 (Badge fetching)
- **Lines**: 332-368 (Badge display with tier colors)

Key features implemented:
✅ Fetch badges for each player
✅ Map PlayerBadgeDTO to simple badge objects
✅ Display up to 3 badges with tier-based colors
✅ Show "+N more" indicator for additional badges
✅ Tooltips with badge details
✅ Handle loading, empty, and error states
✅ Console logging for debugging

---

## Common Issues & Solutions

### Issue 1: Badges not showing
**Problem**: API returns empty array  
**Solution**: Players need to earn badges through match play or manual database insertion

### Issue 2: Wrong badge structure
**Problem**: Frontend expects `badge.name` but API returns nested `badge.badge.name`  
**Solution**: Map PlayerBadgeDTO correctly:
```typescript
const badges = badgeData.map(pb => ({
  id: pb.badge.id,
  name: pb.badge.name,
  tier: pb.badge.tier
}));
```

### Issue 3: CORS errors
**Problem**: Browser blocks API requests  
**Solution**: Ensure Vite proxy is configured (see Vite Proxy Configuration section)

### Issue 4: 400 Bad Request
**Problem**: Missing `userId` header  
**Solution**: Always include `userId` header in requests

---

## Summary

To integrate badges in your frontend:

1. **Fetch** player badges using `GET /api/v1/badges/player/{playerId}`
2. **Map** the nested `PlayerBadgeDTO` structure to simpler objects
3. **Display** badges with tier-based colors (Bronze/Silver/Gold/Platinum/Diamond)
4. **Handle** empty states gracefully ("No badges")
5. **Add** tooltips for badge details
6. **Test** using browser DevTools and console logging

For questions or issues, refer to the working implementation in `PlayerLeaderboard.tsx`.
