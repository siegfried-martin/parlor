"""
Curtain Call — Run Persistence (SQLite)

SQLite-backed save/restore so solo runs survive page refreshes.
Uses Python's built-in sqlite3 module. All DB operations are wrapped
in asyncio.to_thread() to avoid blocking the event loop.
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
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            run_id      TEXT PRIMARY KEY,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            status      TEXT NOT NULL DEFAULT 'active',
            current_act INTEGER NOT NULL DEFAULT 1,
            current_scene TEXT NOT NULL DEFAULT '0',
            state_json  TEXT NOT NULL
        )
    """)
    # M7 Meta-Progression tables
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_profile (
            id          INTEGER PRIMARY KEY CHECK (id = 1),
            tickets     INTEGER NOT NULL DEFAULT 0
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_unlocks (
            track_id    TEXT NOT NULL,
            tier        INTEGER NOT NULL,
            PRIMARY KEY (track_id, tier)
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_achievements (
            achievement_id TEXT PRIMARY KEY
        )
    """)
    _conn.execute("""
        CREATE TABLE IF NOT EXISTS meta_run_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
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

def _save_run(run_id: str, state: dict):
    conn = get_db()
    run_state = state.get("runState", {})
    current_act = run_state.get("currentAct", 1)
    current_scene = str(run_state.get("currentScene", "0"))
    state_json = json.dumps(state)
    conn.execute(
        """INSERT OR REPLACE INTO runs (run_id, updated_at, status, current_act, current_scene, state_json)
           VALUES (?, datetime('now'), 'active', ?, ?, ?)""",
        (run_id, current_act, current_scene, state_json),
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


# --- Meta-Progression CRUD (synchronous, called via to_thread) ---

def _ensure_profile():
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO meta_profile (id, tickets) VALUES (1, 0)")
    conn.commit()


def _get_meta_state() -> dict:
    conn = get_db()
    _ensure_profile()

    row = conn.execute("SELECT tickets FROM meta_profile WHERE id = 1").fetchone()
    tickets = row[0] if row else 0

    unlocks = {}
    for r in conn.execute("SELECT track_id, tier FROM meta_unlocks").fetchall():
        track_id, tier = r
        if track_id not in unlocks:
            unlocks[track_id] = []
        unlocks[track_id].append(tier)

    achievements = [
        r[0] for r in conn.execute("SELECT achievement_id FROM meta_achievements").fetchall()
    ]

    history = []
    for r in conn.execute(
        "SELECT id, completed_at, result, acts_completed, bosses_defeated, "
        "macguffin_id, difficulty, tickets_earned, final_gold, aldric_basic, pip_basic "
        "FROM meta_run_history ORDER BY id DESC LIMIT 50"
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


def _add_tickets(amount: int) -> int:
    conn = get_db()
    _ensure_profile()
    conn.execute("UPDATE meta_profile SET tickets = tickets + ? WHERE id = 1", (amount,))
    conn.commit()
    row = conn.execute("SELECT tickets FROM meta_profile WHERE id = 1").fetchone()
    return row[0]


def _purchase_unlock(track_id: str, tier: int, cost: int) -> dict | None:
    conn = get_db()
    _ensure_profile()

    row = conn.execute("SELECT tickets FROM meta_profile WHERE id = 1").fetchone()
    if not row or row[0] < cost:
        return None

    # Check not already unlocked
    existing = conn.execute(
        "SELECT 1 FROM meta_unlocks WHERE track_id = ? AND tier = ?",
        (track_id, tier)
    ).fetchone()
    if existing:
        return None

    conn.execute("UPDATE meta_profile SET tickets = tickets - ? WHERE id = 1", (cost,))
    conn.execute(
        "INSERT INTO meta_unlocks (track_id, tier) VALUES (?, ?)",
        (track_id, tier)
    )
    conn.commit()
    return _get_meta_state()


def _record_achievement(achievement_id: str):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO meta_achievements (achievement_id) VALUES (?)",
        (achievement_id,)
    )
    conn.commit()


def _record_run(run_data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO meta_run_history "
        "(result, acts_completed, bosses_defeated, macguffin_id, difficulty, "
        "tickets_earned, final_gold, aldric_basic, pip_basic) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
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


def _end_run(body: dict) -> dict:
    """Record run results, achievements, add tickets, return updated meta state."""
    conn = get_db()
    _ensure_profile()

    # Record achievements
    for ach_id in body.get("newAchievements", []):
        _record_achievement(ach_id)

    # Add tickets
    tickets_earned = body.get("ticketsEarned", 0)
    if tickets_earned > 0:
        _add_tickets(tickets_earned)

    # Record run history
    _record_run(body.get("runData", {}))

    return _get_meta_state()


# --- FastAPI Router ---

router = APIRouter(prefix="/api/curtain-call")


@router.post("/save")
async def save_run(body: dict):
    run_id = body.get("run_id")
    state = body.get("state")
    if not run_id or state is None:
        return JSONResponse({"error": "run_id and state required"}, status_code=400)
    await asyncio.to_thread(_save_run, run_id, state)
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

@router.get("/meta")
async def get_meta():
    result = await asyncio.to_thread(_get_meta_state)
    return result


@router.post("/meta/purchase")
async def purchase_unlock(body: dict):
    track_id = body.get("trackId")
    tier = body.get("tier")
    cost = body.get("cost")
    if not track_id or tier is None or cost is None:
        return JSONResponse({"error": "trackId, tier, and cost required"}, status_code=400)
    result = await asyncio.to_thread(_purchase_unlock, track_id, tier, cost)
    if result is None:
        return JSONResponse({"error": "insufficient tickets or already unlocked"}, status_code=400)
    return result


@router.post("/meta/end-run")
async def end_run(body: dict):
    result = await asyncio.to_thread(_end_run, body)
    return result
