# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, HTTPException, Depends
from core.database import run_pg
from core.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/home")
def get_home_stats(current_user: dict = Depends(get_current_user)):
    try:
        overview = run_pg("""
            SELECT
                COUNT(*)                                                    AS total_active,
                COUNT(*) FILTER (WHERE gender_type = 'مرد')                AS total_male,
                COUNT(*) FILTER (WHERE gender_type = 'زن')                 AS total_female,
                ROUND(COUNT(*) FILTER (WHERE gender_type = 'مرد') * 100.0
                    / NULLIF(COUNT(*), 0), 1)                               AS male_percent,
                ROUND(COUNT(*) FILTER (WHERE gender_type = 'زن') * 100.0
                    / NULLIF(COUNT(*), 0), 1)                               AS female_percent,
                ROUND(AVG(age::numeric), 1)                                 AS avg_age,
                ROUND(AVG(tenure_years::numeric), 1)                        AS avg_tenure
            FROM employees
            WHERE is_active_text = 'فعال'
        """)

        departments = run_pg("""
            SELECT org AS name, COUNT(*) AS count
            FROM employees
            WHERE is_active_text = 'فعال'
            GROUP BY org
            ORDER BY count DESC
            LIMIT 5
        """)

        if not overview:
            raise HTTPException(status_code=500, detail="No data returned")

        stats = overview[0]

        def safe_float(val):
            if val is None:
                return 0.0
            f = float(val)
            return 0.0 if f != f else f  # f != f is True only for nan

        return {
            "total_active":     int(stats['total_active'] or 0),
            "total_male":       int(stats['total_male'] or 0),
            "total_female":     int(stats['total_female'] or 0),
            "male_percent":     safe_float(stats['male_percent']),
            "female_percent":   safe_float(stats['female_percent']),
            "avg_age":          safe_float(stats['avg_age']),
            "avg_tenure":       safe_float(stats['avg_tenure']),
            "top_departments":  [{"name": d['name'], "count": int(d['count'])} for d in departments]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
