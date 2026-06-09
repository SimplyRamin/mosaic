# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, HTTPException, Depends
from core.database import run_dax, load_query
from core.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/home")
def get_home_stats(current_user: dict = Depends(get_current_user)):
    try:
        overview    = run_dax(load_query("home_stats.dax"))
        departments = run_dax(load_query("top_departments.dax"))

        dept_list = []
        for d in departments:
            dept_list.append({
                "name": d.get("ORG", ""),
                "count": int(d.get("Count", 0))
            })
        
        if not overview:
            raise HTTPException(status_code=500, detail="No data returned")
        
        stats = overview[0]

        return {
            "total_active":     int(stats.get("TotalActive", 0)),
            "total_male":       int(stats.get("TotalMale", 0)),
            "total_female":     int(stats.get("TotalFemale", 0)),
            "male_percent":     round(float(stats.get("MalePercent", 0)), 1),
            "female_percent":   round(float(stats.get("FemalePercent", 0)), 1),
            "avg_age":          round(float(stats.get("AvgAge", 0)), 1),
            "avg_tenure":       round(float(stats.get("AvgTenure", 0)), 1),
            "top_departments":  dept_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Stats error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
