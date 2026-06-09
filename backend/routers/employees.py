# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, Query, HTTPException, Depends
from core.database import run_pg
from core.auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/search")
def search_employees(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user)
    ):
    try:
        pattern = f"%{q}%"
        results = run_pg("""
            SELECT
                employee_id      AS "Employee_ID",
                employee_code    AS "Employee_Code",
                full_name        AS "Full_Name",
                post             AS "Post",
                org              AS "ORG",
                company_name     AS "Company_Name",
                holding_name     AS "Holding_Name",
                work_loc_name    AS "Work_Loc_Name",
                is_active_text   AS "Is_Active_Text"
            FROM employees
            WHERE
                full_name       ILIKE %s OR
                employee_code   ILIKE %s OR
                post            ILIKE %s OR
                org             ILIKE %s
            LIMIT 20
        """, (pattern, pattern, pattern, pattern))
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{employee_code}/salary")
def get_employee_salary(
    employee_code: str,
    current_user: dict = Depends(get_current_user)
    ):
    clean_code = employee_code.replace("'", "''")
    try:
        employee = run_pg("""
            SELECT employee_id FROM employees WHERE employee_code = %s
        """, (employee_code,))
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee_id = employee[0]['employee_id']

        results = run_pg("""
            SELECT
                employee_id,
                date_id,
                MAX(CASE WHEN compensation_title = 'حقوق پایه'                                    THEN payable_value END) AS "Base_Salary",
                MAX(CASE WHEN compensation_title = 'حق مسکن'                                      THEN payable_value END) AS "Housing_Allowance",
                MAX(CASE WHEN compensation_title = 'بن کارگری'                                    THEN payable_value END) AS "Worker_Bonus",
                MAX(CASE WHEN compensation_title = 'بیمه تامین اجتماعی سهم کارمند'               THEN payable_value END) AS "Insurance_Employee",
                MAX(CASE WHEN compensation_title = 'مالیات'                                       THEN payable_value END) AS "Tax_Deduction",
                MAX(CASE WHEN compensation_title = 'جمع مزایا'                                    THEN payable_value END) AS "Gross_Salary",
                MAX(CASE WHEN compensation_title = 'دستمزد و مزایای مشمول بیمه تامین اجتماعی'   THEN payable_value END) AS "Insurable_Wages",
                MAX(CASE WHEN compensation_title = 'خالص پرداختی'                                THEN payable_value END) AS "Net_Salary"
            FROM fact_salary
            WHERE employee_id = %s
            AND date_id = (
                SELECT MAX(date_id) FROM fact_salary WHERE employee_id = %s
            )
            GROUP BY employee_id, date_id
        """, (employee_id, employee_id))

        if not results:
            raise HTTPException(status_code=404, detail="Salary data not found")
        return results[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{employee_code}/decree")
def get_employee_decree(
    employee_code: str,
    current_user: dict = Depends(get_current_user)
    ):
    try:
        employee = run_pg("""
            SELECT employee_id FROM employees WHERE employee_code = %s
        """, (employee_code,))
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee_id = employee[0]['employee_id']

        results = run_pg("""
            SELECT
                employee_code    AS "Employee_Code",
                commission_type  AS "Commission_Type",
                work_location    AS "Work_Location",
                org_chart        AS "ORG_Chart",
                effect_date      AS "Effect_Date",
                solar_date       AS "Solar_Date"
            FROM fact_commission
            WHERE employee_id = %s
            AND effect_date = (
                SELECT MAX(effect_date) FROM fact_commission WHERE employee_id = %s
            )
        """, (employee_id, employee_id))

        return {"results": results, "count": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{employee_code}/attendance")
def get_employee_attendance(
    employee_code: str,
    current_user: dict = Depends(get_current_user)
    ):
    # Attendance data is not available in Postgres portfolio version
    return {"results": [], "count": 0}


@router.get("/{employee_code}")
def get_employee(
    employee_code: str,
    current_user: dict = Depends(get_current_user)
    ):
    try:
        results = run_pg("""
            SELECT
                employee_id           AS "Employee_ID",
                employee_code         AS "Employee_Code",
                full_name             AS "Full_Name",
                first_name            AS "First_Name",
                last_name             AS "Last_Name",
                holding_name          AS "Holding_Name",
                corporation_id        AS "Corporation_ID",
                company_name          AS "Company_Name",
                org                   AS "ORG",
                post                  AS "Post",
                cost_center_name      AS "CostCenter_Name",
                work_loc_name         AS "Work_Loc_Name",
                is_active_text        AS "Is_Active_Text",
                gender_type           AS "Gender_Type",
                age                   AS "Age",
                solar_date            AS "Solar_Date",
                father_name           AS "Father_Name",
                marital_status        AS "Marital_Status",
                education_degree      AS "Education_Degree",
                education_field       AS "Education_Field",
                employment_date       AS "Employment_Date",
                employment_solar_date AS "Employment_Solar_Date",
                leave_date            AS "Leave_Date",
                tenure_years          AS "Tenure_Years",
                mobile                AS "Mobile",
                national_id           AS "National_ID",
                insurance_number      AS "Insurance_Number"
            FROM employees
            WHERE employee_code = %s
        """, (employee_code,))

        if not results:
            raise HTTPException(status_code=404, detail="Employee not found")
        return results[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))