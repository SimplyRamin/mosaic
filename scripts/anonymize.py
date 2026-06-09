import pandas as pd
import random
import os
import psycopg2
from pathlib import Path
from faker import Faker
from psycopg2.extras import execute_values

# ------------------------------- Configuration ------------------------------ #
DATA_DIR = Path(__file__).parent

# Input files
EMPLOYEE_FILE    = DATA_DIR / 'all_employees.csv' 
COMPANIES_FILE   = DATA_DIR / 'companies.csv'
DEPARTMENTS_FILE = DATA_DIR / 'departments.csv'
SALARY_FILE      = DATA_DIR / 'fact_salary.csv'
COMMISSION_FILE  = DATA_DIR / 'fact_comission.csv'

# Output files
OUT_EMPLOYEES   = DATA_DIR / 'anon_employees.csv'
OUT_SALARY      = DATA_DIR / 'anon_salary.csv'
OUT_COMMISSION  = DATA_DIR / 'anon_commission.csv'

# Faker
fake = Faker('fa_IR')
Faker.seed(69)
random.seed(69)

# Neos Postgres connection
DB_URL = os.environ.get('DATABASE_URL', '')

# --------------------------------- Load Data -------------------------------- #

def load_data():
    print("Loading CSV files...")
    employees   = pd.read_csv(EMPLOYEE_FILE,    encoding='utf-8-sig', sep=None, engine='python')
    companies   = pd.read_csv(COMPANIES_FILE,   encoding='utf-8-sig', sep=None, engine='python')
    departments = pd.read_csv(DEPARTMENTS_FILE, encoding='utf-8-sig', sep=None, engine='python')
    salary      = pd.read_csv(SALARY_FILE,      encoding='utf-8-sig', sep=None, engine='python')
    commission  = pd.read_csv(COMMISSION_FILE,  encoding='utf-8-sig', sep=None, engine='python')

    print(f'    Employees:   {len(employees):,}')
    print(f'    Companies:   {len(companies):,}')
    print(f'    Departments: {len(departments):,}')
    print(f'    Salary:      {len(salary):,}')
    print(f'    Commission:  {len(commission):,}')

    return employees, companies, departments, salary, commission


# --------------------------------- Anonymize -------------------------------- #

def anonymize_employees(employees):
    print('Anonymizing employees...')
    df = employees.copy()

    # Build a mapping from real Employee_ID to new sequential ID
    # This preserves referential integrity across all tables
    unique_ids = df['Employee_ID'].unique()
    id_mapping = {real_id: new_id for new_id, real_id in enumerate(unique_ids, start=1)}

    # Apply ID remapping
    df['Employee_ID']   = df['Employee_ID'].map(id_mapping)
    df['Employee_Code'] = df['Employee_ID'].astype(str).str.zfill(6)

    # Replace personal fields based on gender
    def fake_name_row(row):
        if row['Gender_Type'] == 'مرد':
            first = fake.first_name_male()
        else:
            first = fake.first_name_female()
        last        = fake.last_name()
        father      = fake.first_name_male()
        row['First_Name']   = first
        row['Last_Name']    = last
        row['Full_Name']    = first + ' ' + last
        row['Father_Name']  = father
        return row
    
    df = df.apply(fake_name_row, axis=1)

    # Normalize Arabic characters to Persian
    for col in ['First_Name', 'Last_Name', 'Full_Name', 'Father_Name']:
        df[col] = df[col].str.replace('ي', 'ی', regex=False)
        df[col] = df[col].str.replace('ك', 'ک', regex=False)

    # Replace sensitive fields
    df['National_ID']      = df['Employee_ID'].apply(lambda x: str(random.randint(1000000000, 9999999999)))
    df['Mobile']           = df['Employee_ID'].apply(lambda x: '09' + str(random.randint(100000000, 999999999)))
    df['Insurance_Number'] = df['Employee_ID'].apply(lambda x: str(random.randint(100000000, 999999999)))

    print(f'    Done. {len(df):,} employees anonymized.')
    return df, id_mapping


def anonymize_salary(salary, id_mapping):
    print('Anonymizing salary...')
    df = salary.copy()
    df['Employee_ID'] = df['Employee_ID'].map(id_mapping)

    # Drop rows where Employee_id didn't match any employee
    before = len(df)
    df = df.dropna(subset=['Employee_ID'])
    df['Employee_ID'] = df['Employee_ID'].astype(int)
    after = len(df)

    if before != after:
        print(f'    Dropped {before - after:,} rows with no matching employee.')

    print(f'    Done. {len(df):,} Salary rows.')
    return df


def anonymize_commission(commission, id_mapping):
    print('Anonymizing commission...')
    df = commission.copy()
    df['Employee_ID']   = df['Employee_ID'].map(id_mapping)
    df['Employee_Code'] = df['Employee_ID'].astype(str).str.zfill(6)

    # Drop rows where Employee_ID didn't match any employee
    before = len(df)
    df = df.dropna(subset=['Employee_ID'])
    df['Employee_ID'] = df['Employee_ID'].astype(int)
    after = len(df)

    if before != after:
        print(f'    Dropped {before - after:,} rows with no matching employee.')
    
    print(f'    Done. {len(df):,} commission rows.')
    return df


def save_anonymized(anon_employees, anon_salary, anon_commission, companies, departments):
    print('Saving anonymized files...')
    anon_employees.to_csv(OUT_EMPLOYEES,   index=False, encoding='utf-8-sig')
    anon_salary.to_csv(OUT_SALARY,         index=False, encoding='utf-8-sig')
    anon_commission.to_csv(OUT_COMMISSION, index=False, encoding='utf-8-sig')
    print(f'    Saved: {OUT_EMPLOYEES.name}')
    print(f'    Saved: {OUT_SALARY.name}')
    print(f'    Saved: {OUT_COMMISSION.name}')
    print('Done.')


# --------------------------------- Database --------------------------------- #

def create_tables(conn):
    print('Creating tables...')
    cursor = conn.cursor()
    cursor.execute("""
    DROP TABLE IF EXISTS fact_commission CASCADE;
    DROP TABLE IF EXISTS fact_salary CASCADE;
    DROP TABLE IF EXISTS employees CASCADE;
    DROP TABLE IF EXISTS departments CASCADE;
    DROP TABLE IF EXISTS companies CASCADE;
    """)

    cursor.execute("""
        CREATE TABLE companies (
            corporation_id   INTEGER PRIMARY KEY,
            company_name     VARCHAR(200),
            company_status   VARCHAR(50),
            holding_name     VARCHAR(200)
        );

        CREATE TABLE departments (
            org              VARCHAR(200) PRIMARY KEY,
            count            INTEGER
        );

        CREATE TABLE employees (
            employee_id          INTEGER PRIMARY KEY,
            employee_code        VARCHAR(20),
            holding_name         VARCHAR(200),
            corporation_id       INTEGER,
            company_name         VARCHAR(200),
            org                  VARCHAR(200),
            post                 VARCHAR(200),
            cost_center_name     VARCHAR(200),
            work_loc_name        VARCHAR(200),
            is_active_text       VARCHAR(20),
            full_name            VARCHAR(200),
            first_name           VARCHAR(100),
            last_name            VARCHAR(100),
            gender_type          VARCHAR(10),
            age                  FLOAT,
            solar_date           VARCHAR(20),
            father_name          VARCHAR(100),
            marital_status       VARCHAR(20),
            education_degree     VARCHAR(100),
            education_field      VARCHAR(200),
            employment_date      VARCHAR(30),
            employment_solar_date VARCHAR(20),
            leave_date           VARCHAR(30),
            tenure_years         FLOAT,
            mobile               VARCHAR(20),
            national_id          VARCHAR(20),
            insurance_number     VARCHAR(20)
        );

        CREATE TABLE fact_salary (
            id                  SERIAL PRIMARY KEY,
            employee_id         INTEGER,
            date_id             INTEGER,
            corporation_id      INTEGER,
            compensation_title  VARCHAR(200),
            payable_value       FLOAT
        );

        CREATE TABLE fact_commission (
            id              SERIAL PRIMARY KEY,
            employee_id     INTEGER,
            employee_code   VARCHAR(20),
            commission_type VARCHAR(200),
            work_location   VARCHAR(200),
            org_chart       VARCHAR(200),
            effect_date     VARCHAR(30),
            solar_date      VARCHAR(20)
        );
    """)

    conn.commit()
    cursor.close()
    print(' Tables created.')

def load_to_postgres(conn, anon_employees, anon_salary, anon_commission, companies, departments):
    cursor = conn.cursor()

    # Companies
    print('Loading companies...')
    records = list(companies[['Corporation_ID', 'Company_Name', 'Company_Status', 'Holding_Name']].itertuples(index=False, name=None))
    execute_values(cursor, """
        INSERT INTO companies (corporation_id, company_name, company_status, holding_name)
        VALUES %s ON CONFLICT DO NOTHING
    """, records, page_size=500)
    conn.commit()
    print(f'  {len(records):,} rows loaded.')

    # Departments
    print('Loading departments...')
    records = list(departments[['ORG', 'Count']].itertuples(index=False, name=None))
    execute_values(cursor, """
        INSERT INTO departments (org, count)
        VALUES %s ON CONFLICT DO NOTHING
    """, records, page_size=500)
    conn.commit()
    print(f'  {len(records):,} rows loaded.')

    # Employees
    print('Loading employees...')
    df = anon_employees.where(pd.notnull(anon_employees), None)
    records = list(df[[
        'Employee_ID', 'Employee_Code', 'Holding_Name', 'Corporation_ID', 'Company_Name',
        'ORG', 'Post', 'CostCenter_Name', 'Work_Loc_Name', 'Is_Active_Text',
        'Full_Name', 'First_Name', 'Last_Name', 'Gender_Type', 'Age',
        'Solar_Date', 'Father_Name', 'Marital_Status', 'Education_Degree', 'Education_Field',
        'Employment_Date', 'Employment_Solar_Date', 'Leave_Date', 'Tenure_Years',
        'Mobile', 'National_ID', 'Insurance_Number'
    ]].itertuples(index=False, name=None))
    execute_values(cursor, """
        INSERT INTO employees (
            employee_id, employee_code, holding_name, corporation_id, company_name,
            org, post, cost_center_name, work_loc_name, is_active_text,
            full_name, first_name, last_name, gender_type, age,
            solar_date, father_name, marital_status, education_degree, education_field,
            employment_date, employment_solar_date, leave_date, tenure_years,
            mobile, national_id, insurance_number
        ) VALUES %s
    """, records, page_size=2000)
    conn.commit()
    print(f'  {len(records):,} rows loaded.')

    # Salary
    print('Loading salary...')
    df = anon_salary.where(pd.notnull(anon_salary), None)
    records = list(df[['Employee_ID', 'Date_ID', 'Corporation_ID', 'Compensation_Title', 'Payable_Value']].itertuples(index=False, name=None))

    chunk_size = 50000
    total = len(records)
    for i in range(0, total, chunk_size):
        chunk = records[i:i + chunk_size]
        execute_values(cursor, """
            INSERT INTO fact_salary (employee_id, date_id, corporation_id, compensation_title, payable_value)
            VALUES %s
        """, chunk, page_size=5000)
        conn.commit()
        print(f'  {min(i + chunk_size, total):,} / {total:,} rows loaded.')
    print(f'  Done.')

    # Commission
    print('Loading commission...')
    df = anon_commission.where(pd.notnull(anon_commission), None)
    records = list(df[['Employee_ID', 'Employee_Code', 'Commission_Type', 'Work_Location', 'ORG_Chart', 'Effect_Date', 'Solar_Date']].itertuples(index=False, name=None))

    chunk_size = 50000
    total = len(records)
    for i in range(0, total, chunk_size):
        chunk = records[i:i + chunk_size]
        execute_values(cursor, """
            INSERT INTO fact_commission (employee_id, employee_code, commission_type, work_location, org_chart, effect_date, solar_date)
            VALUES %s
        """, chunk, page_size=5000)
        conn.commit()
        print(f'  {min(i + chunk_size, total):,} / {total:,} rows loaded.')
    print(f'  Done.')

    cursor.close()
    print('All data loaded.')


# ----------------------------------- Main ----------------------------------- 
if __name__ == '__main__':
    import sys

    if '--load-only' in sys.argv:
        # Skip anonymization - read already saved files
        print('Loading anonymized files...')
        anon_employees  = pd.read_csv(OUT_EMPLOYEES,  encoding='utf-8-sig', low_memory=False)
        anon_salary     = pd.read_csv(OUT_SALARY,     encoding='utf-8-sig')
        anon_commission = pd.read_csv(OUT_COMMISSION, encoding='utf-8-sig')
        companies       = pd.read_csv(COMPANIES_FILE,    encoding='utf-8-sig', sep=None, engine='python')
        departments     = pd.read_csv(DEPARTMENTS_FILE,  encoding='utf-8-sig', sep=None, engine='python')
        print(f'  Employees:   {len(anon_employees):,}')
        print(f'  Salary:      {len(anon_salary):,}')
        print(f'  Commission:  {len(anon_commission):,}')
    else:
        employees, companies, departments, salary, commission = load_data()
        anon_employees, id_mapping = anonymize_employees(employees)
        anon_salary                = anonymize_salary(salary, id_mapping)
        anon_commission            = anonymize_commission(commission, id_mapping)
        save_anonymized(anon_employees, anon_salary, anon_commission, companies, departments)

    print('\nConnecting to Postgres...')
    conn = psycopg2.connect(DB_URL)
    print('Connected.')

    create_tables(conn)
    load_to_postgres(conn, anon_employees, anon_salary, anon_commission, companies, departments)

    conn.close()
    print('\nAll done.')