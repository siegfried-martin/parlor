"""
Curtain Call — Run Persistence (SQLite)

SQLite-backed save/restore so solo runs survive page refreshes.
Uses Python's built-in sqlite3 module. All DB operations are wrapped
in asyncio.to_thread() to avoid blocking the event loop.

All data is scoped by username for per-user save progress.
"""

import asyncio
import json
import os
import sqlite3

from fastapi import APIRouter
from fastapi.responses import JSONResponse

# Module-level connection
_conn: sqlite3.Connection | None = None

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "curtain-call.db")


def init_db():
    """Create data dir, open connection with WAL mode, create tables."""
    global _conn
    os.makedirs(DB_DIR, exist_ok=True)
    _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    _conn.execute("PRAGMA journal_mode=WAL")

    # Run saves — add username column if missing (migration from pre-user schema)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            run_id      TEXT PRIMARY KEY,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            status      TEXT NOT NULL DEFAULT 'active',
            current_act INTEGER NOT NULL DEFAULT 1,
            current_scene TEXT NOT NULL DEFAULT '0',
            state_json  TEXT NOT NULL,
            username    TEXT NOT NULL DEFAULT ''
        )
    """)
    _migrate_add_username_to_runs()

    # Drop old single-user meta tables if they exist (pre-user schema)
    _migrate_meta_tables()

    # Meta-Progression tables (per-user)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_profile (
            username    TEXT PRIMARY KEY,
            tickets     INTEGER NOT NULL DEFAULT 0
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_unlocks (
            username    TEXT NOT NULL,
            track_id    TEXT NOT NULL,
            tier        INTEGER NOT NULL,
            PRIMARY KEY (username, track_id, tier)
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_achievements (
            username        TEXT NOT NULL,
            achievement_id  TEXT NOT NULL,
            PRIMARY KEY (username, achievement_id)
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_run_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            username        TEXT NOT NULL DEFAULT '',
            completed_at    TEXT NOT NULL DEFAULT (datetime('now')),
            result          TEXT NOT NULL,
            acts_completed  INTEGER NOT NULL DEFAULT 0,
            bosses_defeated INTEGER NOT NULL DEFAULT 0,
            macguffin_id    TEXT,
            difficulty      INTEGER NOT NULL DEFAULT 0,
            tickets_earned  INTEGER NOT NULL DEFAULT 0,
            final_gold      INTEGER NOT NULL DEFAULT 0,
            aldric_basic    TEXT,
            pip_basic       TEXT
        )
    """)
    _conn.commit()


def _migrate_add_username_to_runs():
    """Add username column to runs table if it doesn't exist."""
    conn = get_db()
    cols = [r[1] for r in conn.execute("PRAGMA table_info(runs)").fetchall()]
    if "username" not in cols:
        conn.execute("ALTER TABLE runs ADD COLUMN username TEXT NOT NULL DEFAULT ''")
        conn.commit()


def _migrate_meta_tables():
    """Drop old single-user meta tables (id=1 schema) so they get recreated with username."""
    conn = get_db()
    # Check if meta_profile has the old schema (integer id with CHECK constraint)
    cols = {r[1]: r[2] for r in conn.execute("PRAGMA table_info(meta_profile)").fetchall()}
    if "id" in cols and "username" not in cols:
        conn.execute("DROP TABLE IF EXISTS meta_profile")
        conn.execute("DROP TABLE IF EXISTS meta_unlocks")
        conn.execute("DROP TABLE IF EXISTS meta_achievements")
        conn.execute("DROP TABLE IF EXISTS meta_run_history")
        conn.commit()


def close_db():
    """Close the database connection."""
    global _conn
    if _conn:
        _conn.close()
        _conn = None


def get_db() -> sqlite3.Connection:
    """Return the module-level connection."""
    if _conn is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _conn


# --- CRUD functions (synchronous, called via to_thread) ---

def _save_run(run_id: str, state: dict, username: str = ""):
    conn = get_db()
    run_state = state.get("runState", {})
    current_act = run_state.get("currentAct", 1)
    current_scene = str(run_state.get("currentScene", "0"))
    state_json = json.dumps(state)
    conn.execute(
        """INSERT OR REPLACE INTO runs (run_id, updated_at, status, current_act, current_scene, state_json, username)
           VALUES (?, datetime('now'), 'active', ?, ?, ?, ?)""",
        (run_id, current_act, current_scene, state_json, username),
    )
    conn.commit()


def _load_run(run_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT state_json FROM runs WHERE run_id = ? AND status = 'active'",
        (run_id,),
    ).fetchone()
    if row is None:
        return None
    return json.loads(row[0])


def _delete_run(run_id: str) -> bool:
    conn = get_db()
    cursor = conn.execute("DELETE FROM runs WHERE run_id = ?", (run_id,))
    conn.commit()
    return cursor.rowcount > 0


def _get_recent_user() -> str | None:
    """Get the username with the most recently updated run or meta activity."""
    conn = get_db()
    # Check runs table first (most likely to have recent activity)
    row = conn.execute(
        "SELECT username FROM runs WHERE username != '' ORDER BY updated_at DESC LIMIT 1"
    ).fetchone()
    if row:
        return row[0]
    # Fall back to meta_run_history
    row = conn.execute(
        "SELECT username FROM meta_run_history WHERE username != '' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if row:
        return row[0]
    return None


def _get_active_run_for_user(username: str) -> dict | None:
    """Get the active run for a specific user."""
    conn = get_db()
    row = conn.execute(
        "SELECT run_id, state_json FROM runs WHERE username = ? AND status = 'active' "
        "ORDER BY updated_at DESC LIMIT 1",
        (username,),
    ).fetchone()
    if row is None:
        return None
    return {"runId": row[0], "state": json.loads(row[1])}


# --- Meta-Progression CRUD (synchronous, called via to_thread) ---

def _ensure_profile(username: str):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO meta_profile (username, tickets) VALUES (?, 0)",
        (username,),
    )
    conn.commit()


def _get_meta_state(username: str) -> dict:
    conn = get_db()
    _ensure_profile(username)

    row = conn.execute(
        "SELECT tickets FROM meta_profile WHERE username = ?", (username,)
    ).fetchone()
    tickets = row[0] if row else 0

    unlocks = {}
    for r in conn.execute(
        "SELECT track_id, tier FROM meta_unlocks WHERE username = ?", (username,)
    ).fetchall():
        track_id, tier = r
        if track_id not in unlocks:
            unlocks[track_id] = []
        unlocks[track_id].append(tier)

    achievements = [
        r[0] for r in conn.execute(
            "SELECT achievement_id FROM meta_achievements WHERE username = ?", (username,)
        ).fetchall()
    ]

    history = []
    for r in conn.execute(
        "SELECT id, completed_at, result, acts_completed, bosses_defeated, "
        "macguffin_id, difficulty, tickets_earned, final_gold, aldric_basic, pip_basic "
        "FROM meta_run_history WHERE username = ? ORDER BY id DESC LIMIT 50",
        (username,),
    ).fetchall():
        history.append({
            "id": r[0], "completedAt": r[1], "result": r[2],
            "actsCompleted": r[3], "bossesDefeated": r[4],
            "macguffinId": r[5], "difficulty": r[6],
            "ticketsEarned": r[7], "finalGold": r[8],
            "aldricBasic": r[9], "pipBasic": r[10]
        })

    return {
        "tickets": tickets,
        "unlocks": unlocks,
        "achievements": achievements,
        "history": history
    }


def _add_tickets(username: str, amount: int) -> int:
    conn = get_db()
    _ensure_profile(username)
    conn.execute(
        "UPDATE meta_profile SET tickets = tickets + ? WHERE username = ?",
        (amount, username),
    )
    conn.commit()
    row = conn.execute(
        "SELECT tickets FROM meta_profile WHERE username = ?", (username,)
    ).fetchone()
    return row[0]


def _purchase_unlock(username: str, track_id: str, tier: int, cost: int) -> dict | None:
    conn = get_db()
    _ensure_profile(username)

    row = conn.execute(
        "SELECT tickets FROM meta_profile WHERE username = ?", (username,)
    ).fetchone()
    if not row or row[0] < cost:
        return None

    # Check not already unlocked
    existing = conn.execute(
        "SELECT 1 FROM meta_unlocks WHERE username = ? AND track_id = ? AND tier = ?",
        (username, track_id, tier)
    ).fetchone()
    if existing:
        return None

    conn.execute(
        "UPDATE meta_profile SET tickets = tickets - ? WHERE username = ?",
        (cost, username),
    )
    conn.execute(
        "INSERT INTO meta_unlocks (username, track_id, tier) VALUES (?, ?, ?)",
        (username, track_id, tier)
    )
    conn.commit()
    return _get_meta_state(username)


def _record_achievement(username: str, achievement_id: str):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO meta_achievements (username, achievement_id) VALUES (?, ?)",
        (username, achievement_id)
    )
    conn.commit()


def _record_run(username: str, run_data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO meta_run_history "
        "(username, result, acts_completed, bosses_defeated, macguffin_id, difficulty, "
        "tickets_earned, final_gold, aldric_basic, pip_basic) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            username,
            run_data.get("result", "defeat"),
            run_data.get("actsCompleted", 0),
            run_data.get("bossesDefeated", 0),
            run_data.get("macguffinId"),
            run_data.get("difficulty", 0),
            run_data.get("ticketsEarned", 0),
            run_data.get("finalGold", 0),
            run_data.get("aldricBasic"),
            run_data.get("pipBasic"),
        )
    )
    conn.commit()


def _end_run(username: str, body: dict) -> dict:
    """Record run results, achievements, add tickets, return updated meta state."""
    _ensure_profile(username)

    # Record achievements
    for ach_id in body.get("newAchievements", []):
        _record_achievement(username, ach_id)

    # Add tickets
    tickets_earned = body.get("ticketsEarned", 0)
    if tickets_earned > 0:
        _add_tickets(username, tickets_earned)

    # Record run history
    _record_run(username, body.get("runData", {}))

    return _get_meta_state(username)


# --- FastAPI Router ---

router = APIRouter(prefix="/api/curtain-call")


@router.post("/save")
async def save_run(body: dict):
    run_id = body.get("run_id")
    state = body.get("state")
    username = body.get("username", "")
    if not run_id or state is None:
        return JSONResponse({"error": "run_id and state required"}, status_code=400)
    await asyncio.to_thread(_save_run, run_id, state, username)
    return {"status": "ok"}


@router.get("/load/{run_id}")
async def load_run(run_id: str):
    result = await asyncio.to_thread(_load_run, run_id)
    if result is None:
        return JSONResponse({"error": "not found"}, status_code=404)
    return result


@router.delete("/run/{run_id}")
async def delete_run(run_id: str):
    deleted = await asyncio.to_thread(_delete_run, run_id)
    if not deleted:
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse(None, status_code=204)


# --- Meta-Progression Endpoints ---

@router.get("/recent-user")
async def get_recent_user():
    result = await asyncio.to_thread(_get_recent_user)
    return {"username": result}


@router.get("/user-run/{username}")
async def get_user_run(username: str):
    result = await asyncio.to_thread(_get_active_run_for_user, username)
    if result is None:
        return {"runId": None, "state": None}
    return result


@router.get("/meta/{username}")
async def get_meta(username: str):
    result = await asyncio.to_thread(_get_meta_state, username)
    return result


@router.post("/meta/purchase")
async def purchase_unlock(body: dict):
    username = body.get("username", "")
    track_id = body.get("trackId")
    tier = body.get("tier")
    cost = body.get("cost")
    if not username or not track_id or tier is None or cost is None:
        return JSONResponse({"error": "username, trackId, tier, and cost required"}, status_code=400)
    result = await asyncio.to_thread(_purchase_unlock, username, track_id, tier, cost)
    if result is None:
        return JSONResponse({"error": "insufficient tickets or already unlocked"}, status_code=400)
    return result


@router.post("/meta/end-run")
async def end_run(body: dict):
    username = body.get("username", "")
    result = await asyncio.to_thread(_end_run, username, body)
    return result
