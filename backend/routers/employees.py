# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

from fastapi import APIRouter, Query, HTTPException, Depends
from core.database import run_dax, load_query
from core.auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/search")
def search_employees(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user)
    ):
    q_clean = q.replace("'", "''").replace("'", '')

    try:
        dax = load_query("employee_search.dax", query=q_clean)
        results = run_dax(dax)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{employee_code}")
def get_employee(
    employee_code: str,
    current_user: dict = Depends(get_current_user)
    ):
    clean_code = employee_code.replace("'", "''")

    try:
        dax = load_query("employee_detail.dax", employee_code=clean_code)
        results = run_dax(dax)
        if not results:
            raise HTTPException(status_code=404, detail="Employee not found")
        return results[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))