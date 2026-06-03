# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================
from rapidfuzz import process, fuzz
from core.database import run_dax
import threading

_cache = []
_lock = threading.Lock()


def load_names():
    global _cache
    print("Loading employee name cache...")
    try:
        dax = """
        EVALUATE
        SUMMARIZE(
            'Dim_Employee',
            'Dim_Employee'[Full_Name]
        )
        """
        results = run_dax(dax)
        print(f"DAX returned {len(results)} rows")

        with _lock:
            _cache = [r['Full_Name'] for r in results if r.get('Full_Name')]
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