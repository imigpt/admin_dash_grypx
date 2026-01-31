# Backend Support for Doubles Player Selection - STATUS CHECK

**Date:** January 22, 2026  
**Feature:** Player-specific scoring in doubles matches  
**Backend Status:** ✅ ALREADY IMPLEMENTED (No changes needed)

---

## Feature Requirement

When a user clicks on a team in a doubles match on the watch app:
1. A new screen opens showing the 2 players of that team
2. User taps a player's name
3. System updates the team's score
4. System records which specific player scored the point

---

## Backend Analysis

### ✅ Already Supported: Player-Specific Scoring

**File:** `MatchScoringService.java` (Line 39-100)

The backend **already supports** recording which player scored each point through the `addPoint()` method:

```java
@Transactional
public MatchScoringEventDTO addPoint(AddPointRequestDTO request) {
    // Validate required fields
    if (request.getMatchId() == null) {
        throw new RuntimeException("matchId is required");
    }
    if (request.getTeamId() == null) {
        throw new RuntimeException("teamId is required");
    }
    if (request.getPlayerId() == null) {
        throw new RuntimeException("playerId is required - must specify which player scored the point");
    }
    if (request.getMethod() == null || request.getMethod().trim().isEmpty()) {
        throw new RuntimeException("method is required (e.g., ACE, SMASH, DROP, NET)");
    }
    
    // ... fetch match, team, player ...
    
    // Create scoring event with player information
    MatchScoringEvent event = new MatchScoringEvent();
    event.setMatch(match);
    event.setEventType(MatchScoringEvent.EventType.POINT);
    event.setTeam(team);
    event.setPlayer(player);  // ✅ Player who scored is recorded
    event.setScoreMethod(request.getMethod());
    event.setScoreValue(1);
    event.setEventTimestamp(LocalDateTime.now());
    
    eventRepository.save(event);
    
    // Update match scores
    updateMatchScores(match);
    
    // Update player match stats
    updatePlayerMatchStats(match.getId(), player.getId(), team.getId());
    
    // Update last scorer for watch sync
    watchSyncService.setLastScorer(match.getId(), player.getId());
    
    // ... return DTO ...
}
```

---

## API Contract

### POST /api/match-scoring/add-point

**Request Body:**
```json
{
  "matchId": 123,
  "teamId": 1001,
  "playerId": 5001,    // ✅ Required: Specific player ID
  "method": "ACE"
}
```

**Required Fields:**
- `matchId` (Long): The match ID
- `teamId` (Long): The team that scored
- `playerId` (Long): **The specific player who scored the point**
- `method` (String): Scoring method (ACE, SMASH, DROP, NET, etc.)

**Response:**
```json
{
  "eventId": 789,
  "matchId": 123,
  "teamId": 1001,
  "playerId": 5001,
  "team1Score": 15,
  "team2Score": 12,
  "currentSetNumber": 1,
  "team1SetsWon": 0,
  "team2SetsWon": 0,
  "setCompleted": false,
  "matchCompleted": false
}
```

---

## What Backend Already Does

### ✅ 1. Validates Player ID
```java
if (request.getPlayerId() == null) {
    throw new RuntimeException("playerId is required - must specify which player scored the point");
}
```

### ✅ 2. Records Player in Event
```java
User player = userRepository.findById(request.getPlayerId())
    .orElseThrow(() -> new RuntimeException("Player not found with ID: " + request.getPlayerId()));

event.setPlayer(player);  // Player who scored
```

### ✅ 3. Updates Player Stats
```java
updatePlayerMatchStats(match.getId(), player.getId(), team.getId());
```

### ✅ 4. Tracks Last Scorer for Watch
```java
watchSyncService.setLastScorer(match.getId(), player.getId());
```

### ✅ 5. Stores in Database
The `MatchScoringEvent` entity stores:
- `match` - Which match
- `team` - Which team scored
- `player` - **Which player scored** ✅
- `scoreMethod` - How they scored (ACE, SMASH, etc.)
- `scoreValue` - Points earned (1 for racket sports)
- `eventTimestamp` - When it happened
- `setNumber` - Which set

---

## Watch App Integration

### How Watch App Uses This API

**File:** `WatchMatchService.kt` - Line 228-279

```kotlin
suspend fun addPoint(
    matchId: Long,
    teamId: Long,
    playerId: Long,    // ✅ Specific player ID passed
    method: String = "ACE"
): AddPointResponse = withContext(Dispatchers.IO) {
    try {
        val requestBody = JSONObject().apply {
            put("matchId", matchId)
            put("teamId", teamId)
            put("playerId", playerId)  // ✅ Player ID sent to backend
            put("method", method.uppercase())
        }
        
        val request = Request.Builder()
            .url("$BASE_URL/match-scoring/add-point")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        val response = client.newCall(request).execute()
        // ... parse response ...
    }
}
```

### Player Selection Flow

**File:** `LiveMatchScoringScreen.kt`

```kotlin
// 1. User taps team button in doubles match
onClick = {
    val players = matchData.team1Players  // [Rahul Sharma, Rohit Jain]
    showPlayerSelectionForTeam(matchData.team1Id, matchData.team1Name, players)
}

// 2. Player selection screen opens
PlayerSelectionScreen(
    teamName = "Net Ninjas",
    players = [
        PlayerInfo(id = 1001, name = "Rahul Sharma"),
        PlayerInfo(id = 1002, name = "Rohit Jain")
    ],
    onPlayerSelected = { player ->
        // 3. User taps "Rahul Sharma"
        addPointForTeam(
            teamId = 1001,
            teamName = "Net Ninjas", 
            playerId = 1001,           // ✅ Rahul's ID
            playerName = "Rahul Sharma"
        )
    }
)

// 4. Point is registered with player ID
fun addPointForTeam(teamId: Long, teamName: String, playerId: Long, playerName: String) {
    scope.launch {
        val response = matchService.addPoint(
            matchId = matchData.matchId,
            teamId = teamId,
            playerId = playerId,  // ✅ Sent to backend
            method = "ACE"
        )
        
        if (response.success) {
            // Update scores
            team1Score = response.team1Score
            team2Score = response.team2Score
            
            // Show who scored
            lastScorerName = playerName  // "⚡ Rahul Sharma"
        }
    }
}
```

---

## Database Schema

### MatchScoringEvent Table
```sql
CREATE TABLE match_scoring_event (
    id BIGINT PRIMARY KEY,
    match_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,        -- ✅ Player who scored
    event_type VARCHAR(50) NOT NULL,  -- 'POINT', 'ACE', 'SMASH', etc.
    score_method VARCHAR(50),
    score_value INT,
    event_timestamp TIMESTAMP,
    set_number INT,
    sequence_number INT,
    opponent_team_id BIGINT,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES users(id)  -- ✅ References player
);
```

### PlayerMatchStats Table
```sql
CREATE TABLE player_match_stats (
    id BIGINT PRIMARY KEY,
    match_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,     -- ✅ Individual player stats
    team_id BIGINT NOT NULL,
    points_scored INT DEFAULT 0,   -- ✅ Points by this player
    aces INT DEFAULT 0,
    smashes INT DEFAULT 0,
    drops INT DEFAULT 0,
    nets INT DEFAULT 0,
    -- ... other stats ...
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (player_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

---

## Testing Scenarios

### Test Case 1: Doubles Point Registration

**Request:**
```bash
curl -X POST http://34.131.53.32:8080/api/match-scoring/add-point \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "matchId": 123,
    "teamId": 1001,
    "playerId": 5001,
    "method": "ACE"
  }'
```

**Expected:**
- ✅ Point added to team 1001
- ✅ Event recorded with player 5001
- ✅ Player stats updated for player 5001
- ✅ Last scorer set to player 5001
- ✅ WebSocket broadcast includes player info

**Verify in Database:**
```sql
SELECT * FROM match_scoring_event 
WHERE match_id = 123 
ORDER BY sequence_number DESC 
LIMIT 1;

-- Should show:
-- team_id: 1001
-- player_id: 5001  ✅
-- score_method: 'ACE'
```

---

### Test Case 2: Player Stats Accumulation

**Scenario:**
1. Rahul Sharma (ID 1001) scores 3 points
2. Rohit Jain (ID 1002) scores 2 points

**Requests:**
```json
// Point 1 - Rahul
{"matchId": 123, "teamId": 1001, "playerId": 1001, "method": "ACE"}

// Point 2 - Rahul
{"matchId": 123, "teamId": 1001, "playerId": 1001, "method": "SMASH"}

// Point 3 - Rohit
{"matchId": 123, "teamId": 1001, "playerId": 1002, "method": "DROP"}

// Point 4 - Rahul
{"matchId": 123, "teamId": 1001, "playerId": 1001, "method": "ACE"}

// Point 5 - Rohit
{"matchId": 123, "teamId": 1001, "playerId": 1002, "method": "NET"}
```

**Expected Stats:**
```sql
SELECT player_id, points_scored, aces, smashes, drops, nets 
FROM player_match_stats 
WHERE match_id = 123;

-- Results:
-- player_id: 1001, points_scored: 3, aces: 2, smashes: 1, drops: 0, nets: 0  ✅
-- player_id: 1002, points_scored: 2, aces: 0, smashes: 0, drops: 1, nets: 1  ✅
```

---

### Test Case 3: Last Scorer Tracking

**Request:**
```bash
curl -X POST http://34.131.53.32:8080/api/match-scoring/add-point \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 123,
    "teamId": 1001,
    "playerId": 1001,
    "method": "ACE"
  }'
```

**Expected:**
- ✅ `watchSyncService.setLastScorer(123, 1001)` called
- ✅ GET /api/watch/active-match returns:
  ```json
  {
    "lastScorer": {
      "id": 1001,
      "name": "Rahul Sharma",
      "username": "rahul_s"
    }
  }
  ```

---

## Error Handling

### ❌ Missing Player ID
**Request:**
```json
{
  "matchId": 123,
  "teamId": 1001,
  "playerId": null,
  "method": "ACE"
}
```

**Response:**
```json
{
  "error": "playerId is required - must specify which player scored the point",
  "status": 400
}
```

### ❌ Invalid Player ID
**Request:**
```json
{
  "matchId": 123,
  "teamId": 1001,
  "playerId": 99999,
  "method": "ACE"
}
```

**Response:**
```json
{
  "error": "Player not found with ID: 99999",
  "status": 404
}
```

---

## Summary

### ✅ Backend Requirements Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Accept player ID in scoring API | ✅ Implemented | Required field in `addPoint()` |
| Validate player ID | ✅ Implemented | Throws error if invalid |
| Record player in event | ✅ Implemented | `MatchScoringEvent.player` field |
| Update player stats | ✅ Implemented | `updatePlayerMatchStats()` method |
| Track last scorer | ✅ Implemented | `watchSyncService.setLastScorer()` |
| Store in database | ✅ Implemented | `player_id` in `match_scoring_event` table |
| Return player info | ✅ Implemented | Included in API responses |

### 🎯 No Backend Changes Required!

The backend already has **complete support** for player-specific scoring in doubles matches. All necessary functionality is implemented:

1. ✅ Player ID is required in scoring requests
2. ✅ Player info is recorded in database
3. ✅ Player stats are tracked individually
4. ✅ Last scorer is tracked for watch display
5. ✅ Proper error handling for invalid player IDs

### 📱 Frontend Integration

The watch app now uses this existing backend functionality:

1. ✅ New `PlayerSelectionScreen.kt` for full-screen player selection
2. ✅ Updated `LiveMatchScoringScreen.kt` to navigate to selection screen
3. ✅ Passes specific player ID when user taps player name
4. ✅ Displays "⚡ Player Name" notification after scoring

---

## Files Referenced

### Backend Files (READ-ONLY)
- `MatchScoringService.java` - Line 39: `addPoint()` method
- `MatchScoringEvent.java` - Entity with `player` field
- `PlayerMatchStats.java` - Per-player statistics tracking
- `WatchSyncService.java` - Last scorer tracking

### Watch App Files (MODIFIED)
- ✅ `PlayerSelectionScreen.kt` - New full-screen player selector
- ✅ `LiveMatchScoringScreen.kt` - Updated to show screen instead of dialog
- ✅ `WatchMatchService.kt` - Already sends player IDs to backend

---

**Conclusion:** No backend changes required. The feature is ready to use immediately after deploying the watch app updates.
