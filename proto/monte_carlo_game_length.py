"""
Roll Better -- Monte Carlo Game Length Simulation (v4)

Competitive AI with pressure-based unlock decisions.
- Players race simultaneously against the same goal
- Round ends when ANY player completes all 8 locks on a given turn
- AI considers opponent progress, handicap pressure, and value saturation
- Unlock choice prefers "clogged" values (already locked, rare in remaining goal)

Scoring (total dice = 8 locked + remaining pool):
  8 dice = 8 pts, 9 = 7, 10 = 5, 11 = 3, 12 = 1
"""

import random
from collections import Counter

NUM_SIMULATIONS = 50_000
WINNING_SCORE = 20
MAX_DICE = 12
DEFAULT_STARTING_DICE = 2
SCORE_TABLE = {8: 8, 9: 7, 10: 5, 11: 3, 12: 1}


def roll_goal():
    return sorted(random.randint(1, 6) for _ in range(8))


def calc_score(total_dice):
    return SCORE_TABLE.get(total_dice, 0)


def find_auto_locks(pool_dice, goal, locked_mask):
    new_locked = list(locked_mask)
    remaining = []
    for die in pool_dice:
        matched = False
        for i in range(8):
            if not new_locked[i] and goal[i] == die:
                new_locked[i] = True
                matched = True
                break
        if not matched:
            remaining.append(die)
    return new_locked, remaining


def pick_best_unlock(locked_mask, goal):
    """
    Choose which locked die to unlock based on value saturation.
    Prefer unlocking a value that is "clogged" — already fully represented
    in locked slots, meaning rolling that value again would be wasted.

    Score each locked die by: how FEW remaining (unfilled) goal slots share
    its value. Lower = more clogged = better to unlock.
    Tiebreak: prefer values that appear MORE in locked (most redundant).
    """
    locked_indices = [i for i in range(8) if locked_mask[i]]
    if not locked_indices:
        return None

    # Count how many unfilled slots need each value
    unfilled_values = [goal[i] for i in range(8) if not locked_mask[i]]
    unfilled_freq = Counter(unfilled_values)

    # Count how many locked slots have each value
    locked_values = [goal[i] for i in locked_indices]
    locked_freq = Counter(locked_values)

    # Score: lower unfilled_freq = more clogged = better unlock candidate
    # Tiebreak: higher locked_freq = more redundant
    def unlock_priority(idx):
        val = goal[idx]
        remaining_need = unfilled_freq.get(val, 0)
        locked_copies = locked_freq.get(val, 0)
        # Primary: fewest remaining slots needing this value (most clogged)
        # Secondary: most locked copies of this value (most redundant)
        return (remaining_need, -locked_copies)

    best_idx = min(locked_indices, key=unlock_priority)
    return best_idx


def choose_unlocks_competitive(locked_mask, pool_count, goal, my_locked,
                                opponent_max_locked, starting_dice):
    """
    Competitive unlock decision considering:
    1. Must unlock if pool=0 and not done
    2. Competitive pressure: how close is the nearest opponent?
    3. Handicap pressure: fewer starting dice = more need to unlock
    4. Smart die selection via value saturation
    """
    locked_count = sum(locked_mask)
    total = locked_count + pool_count
    remaining_to_lock = 8 - locked_count

    # Must unlock if pool is empty and haven't won
    if pool_count == 0 and locked_count < 8:
        idx = pick_best_unlock(locked_mask, goal)
        return [idx] if idx is not None else []

    # Already done or almost done with good pool — don't unlock
    if remaining_to_lock <= 0:
        return []

    # --- Competitive pressure ---
    # How far ahead/behind am I vs the closest opponent?
    opponent_remaining = 8 - opponent_max_locked
    my_remaining = remaining_to_lock

    # Pressure factors (each 0.0 to ~1.0, summed into unlock threshold)
    pressure = 0.0

    # 1. Opponent closeness: if opponent is close to finishing, pressure rises
    if opponent_max_locked >= 6:
        pressure += 0.4  # opponent is very close
    elif opponent_max_locked >= 4:
        pressure += 0.2  # opponent making progress

    # 2. Am I behind the opponent?
    if opponent_max_locked > locked_count:
        pressure += 0.3  # I'm trailing

    # 3. Handicap pressure: fewer starting dice = was winning = unlock more
    if starting_dice <= 1:
        pressure += 0.4  # severe handicap, need speed
    elif starting_dice <= 2:
        pressure += 0.2  # moderate handicap

    # 4. Pool too small for remaining work
    if pool_count <= 1 and remaining_to_lock >= 3:
        pressure += 0.3
    elif pool_count <= 2 and remaining_to_lock >= 4:
        pressure += 0.2

    # Decision: unlock if pressure exceeds threshold
    # Higher threshold = more conservative
    threshold = 0.5

    if pressure >= threshold and total + 1 <= MAX_DICE:
        idx = pick_best_unlock(locked_mask, goal)
        if idx is not None:
            # Under extreme pressure, consider unlocking 2
            unlocks = [idx]
            if pressure >= 0.9 and remaining_to_lock >= 4:
                # Apply the unlock, then pick another
                test_mask = list(locked_mask)
                test_mask[idx] = False
                new_total = sum(test_mask) + pool_count + 2
                if new_total + 1 <= MAX_DICE:
                    idx2 = pick_best_unlock(test_mask, goal)
                    if idx2 is not None:
                        unlocks.append(idx2)
            return unlocks

    return []


def simulate_round(players, all_locked_counts=None):
    """
    Simulate one round with simultaneous play.
    Returns list of points per player.
    """
    goal = roll_goal()
    n = len(players)

    locked_masks = [[False] * 8 for _ in range(n)]
    pool_counts = [p["starting_dice"] for p in players]

    for turn in range(200):
        completers = []

        # All players roll simultaneously
        new_pool_counts = list(pool_counts)
        for pidx in range(n):
            locked_count = sum(locked_masks[pidx])
            if locked_count == 8:
                continue

            rolled = [random.randint(1, 6) for _ in range(pool_counts[pidx])]
            locked_masks[pidx], remaining = find_auto_locks(rolled, goal, locked_masks[pidx])
            new_pool_counts[pidx] = len(remaining)

            if sum(locked_masks[pidx]) == 8:
                total_dice = 8 + len(remaining)
                completers.append((pidx, total_dice))

        pool_counts = new_pool_counts

        if completers:
            scores = [0] * n
            for pidx, total_dice in completers:
                scores[pidx] = calc_score(total_dice)
            return scores

        # Unlock phase — each player sees how many locks opponents have
        locked_counts = [sum(locked_masks[pidx]) for pidx in range(n)]

        for pidx in range(n):
            if sum(locked_masks[pidx]) == 8:
                continue

            # Opponent info: max locked among OTHER players
            opponent_max = max(
                (locked_counts[j] for j in range(n) if j != pidx),
                default=0
            )

            to_unlock = choose_unlocks_competitive(
                locked_masks[pidx],
                pool_counts[pidx],
                goal,
                locked_counts[pidx],
                opponent_max,
                players[pidx]["starting_dice"]
            )
            for idx in to_unlock:
                locked_masks[pidx][idx] = False
                pool_counts[pidx] += 2
                locked_count = sum(locked_masks[pidx])
                total = locked_count + pool_counts[pidx]
                if total > MAX_DICE:
                    pool_counts[pidx] = MAX_DICE - locked_count

    return [0] * n


def simulate_game(num_players):
    """Simulate a full game to 20 points."""
    players = [{"score": 0, "starting_dice": DEFAULT_STARTING_DICE} for _ in range(num_players)]
    rounds = 0
    all_round_scores = []

    for _ in range(500):
        rounds += 1
        scores = simulate_round(players)
        all_round_scores.append(scores)

        for pidx in range(num_players):
            players[pidx]["score"] += scores[pidx]
            if scores[pidx] > 0:
                players[pidx]["starting_dice"] = max(1, players[pidx]["starting_dice"] - 1)
            else:
                players[pidx]["starting_dice"] = min(MAX_DICE, players[pidx]["starting_dice"] + 1)

        if any(p["score"] >= WINNING_SCORE for p in players):
            break

    return rounds, players, all_round_scores


def run_analysis(num_players):
    round_counts = []
    winner_scores = []
    per_round_scores = []
    handicap_at_win = []  # starting dice of winner when they win the session

    for _ in range(NUM_SIMULATIONS):
        rounds, players, round_scores = simulate_game(num_players)
        round_counts.append(rounds)
        max_score = max(p["score"] for p in players)
        winner_scores.append(max_score)
        for rs in round_scores:
            per_round_scores.extend(rs)

    avg_rounds = sum(round_counts) / len(round_counts)
    med_rounds = sorted(round_counts)[len(round_counts) // 2]
    sorted_rounds = sorted(round_counts)
    p10 = sorted_rounds[int(len(sorted_rounds) * 0.10)]
    p25 = sorted_rounds[int(len(sorted_rounds) * 0.25)]
    p75 = sorted_rounds[int(len(sorted_rounds) * 0.75)]
    p90 = sorted_rounds[int(len(sorted_rounds) * 0.90)]
    avg_winner_score = sum(winner_scores) / len(winner_scores)

    nonzero = [s for s in per_round_scores if s > 0]
    avg_when_scoring = sum(nonzero) / len(nonzero) if nonzero else 0
    scoring_rate = len(nonzero) / len(per_round_scores) * 100 if per_round_scores else 0

    score_freq = Counter(per_round_scores)
    buckets = Counter(round_counts)

    print(f"\n{'=' * 60}")
    print(f"  {num_players} PLAYER{'S' if num_players > 1 else ' '}")
    print(f"{'=' * 60}")
    print(f"  Average rounds:       {avg_rounds:.1f}")
    print(f"  Median rounds:        {med_rounds}")
    print(f"  Min / Max:            {min(round_counts)} / {max(round_counts)}")
    print(f"  10th / 90th %:        {p10} / {p90}")
    print(f"  25th / 75th %:        {p25} / {p75}")
    print(f"  Avg winner score:     {avg_winner_score:.1f}")
    print(f"  Avg pts/round/player: {sum(per_round_scores)/len(per_round_scores):.2f}")
    print(f"  Avg pts when scoring: {avg_when_scoring:.2f}")
    print(f"  Scoring rate:         {scoring_rate:.1f}%")
    print()
    print(f"  Points scored per player-round:")
    for score in sorted(score_freq.keys()):
        pct = score_freq[score] / len(per_round_scores) * 100
        bar = "#" * max(1, int(pct))
        print(f"    {score:2d} pts: {pct:5.1f}% {bar}")
    print()
    print(f"  Game length distribution:")
    for r in sorted(buckets.keys())[:30]:
        pct = buckets[r] / NUM_SIMULATIONS * 100
        bar = "#" * max(1, int(pct * 2))
        print(f"    {r:3d} rounds: {pct:5.1f}% {bar}")

    # Winning score distribution
    ws_freq = Counter(winner_scores)
    print()
    print(f"  Winning score distribution:")
    for s in sorted(ws_freq.keys()):
        pct = ws_freq[s] / NUM_SIMULATIONS * 100
        if pct >= 0.5:
            bar = "#" * max(1, int(pct))
            print(f"    {s:2d} pts: {pct:5.1f}% {bar}")


def main():
    print("=" * 60)
    print("Roll Better -- Monte Carlo v4 (Competitive AI)")
    print(f"Simulations: {NUM_SIMULATIONS:,} games per config")
    print(f"Win threshold: {WINNING_SCORE} points")
    print(f"Starting dice: {DEFAULT_STARTING_DICE}")
    print(f"Scoring: 8d=8pt, 9d=7, 10d=5, 11d=3, 12d=1")
    print(f"Handicap: winner -1 start die, loser +1 start die")
    print(f"AI: competitive pressure + value saturation unlocks")
    print("=" * 60)

    for num_players in [1, 2, 3, 4]:
        run_analysis(num_players)


if __name__ == "__main__":
    main()
