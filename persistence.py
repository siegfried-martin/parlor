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
    """Create data dir, open connection with WAL mode, create runs table."""
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
