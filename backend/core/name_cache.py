# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from rapidfuzz import process, fuzz
from core.database import run_pg
import threading

_cache = []
_lock = threading.Lock()


def load_names():
    global _cache
    print("Loading employee name cache...")
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        from core.config import settings
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT full_name FROM employees WHERE full_name IS NOT NULL")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        with _lock:
            _cache = [r['full_name'] for r in rows]
        print(f"Name cache loaded: {len(_cache)} names")
    except Exception as e:
        print(f"Name cache error: {type(e).__name__}: {e}")


def find_closest_name(transcript: str, limit: int = 3) -> list[dict]:
    with _lock:
        if not _cache:
            return []
    
    # Try multiple scores and take the best result
    results_token_sort = process.extract(
        transcript,
        _cache,
        scorer=fuzz.token_set_ratio,
        limit=limit
    )

    results_ratio = process.extract(
        transcript,
        _cache,
        scorer=fuzz.ratio,
        limit=limit
    )

    # Merge and deduplicate - take highest score per name
    combined = {}
    for name, score, _ in results_token_sort + results_ratio:
        if name not in combined or combined[name] < score:
            combined[name] = score
    
    # Sort by score descending
    sorted_results = sorted(combined.items(), key=lambda x: x[1], reverse=True)

    return [
        {"name": name, "score": score}
        for name, score in sorted_results[:limit]
        if score >= 65
    ]