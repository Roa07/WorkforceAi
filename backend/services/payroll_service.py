import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract
from fastapi import HTTPException, status
from models import PayrollRun, PayrollItem, Employee, Attendance, LeaveRequest
from services.audit_service import log_audit

# In-memory preview token store (or DB backed) with expiration/lock
PREVIEW_CACHE: Dict[str, Dict[str, Any]] = {}

def calculate_employee_payroll(db: Session, employee: Employee, month: int, year: int):
    """
    Computes basic salary, allowances, and attendance-based deductions.
    Standard month working days: 22.
    Deductions formula: (basic_salary / 22) * unexcused_absent_days + standard_deductions
    """
    total_working_days = 22
    
    attendances = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        extract("year", Attendance.date) == year,
        extract("month", Attendance.date) == month
    ).all()

    present_days = sum(1 for a in attendances if a.status in ("PRESENT", "LATE"))
    half_days = sum(1 for a in attendances if a.status == "HALF_DAY")
    
    # Approved leaves in that month
    approved_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee.id,
        LeaveRequest.status == "APPROVED",
        extract("year", LeaveRequest.start_date) == year,
        extract("month", LeaveRequest.start_date) == month
    ).all()
    leave_days = sum(l.total_days for l in approved_leaves)

    effective_present = present_days + (half_days * 0.5)
    absent_days = max(0, total_working_days - int(effective_present) - leave_days)

    daily_rate = employee.basic_salary / total_working_days
    attendance_deduction = round(absent_days * daily_rate, 2)
    total_deductions = round(employee.standard_deductions + attendance_deduction, 2)

    gross_salary = employee.basic_salary + employee.allowances
    payable_salary = max(0.0, round(gross_salary - total_deductions, 2))

    return {
        "employee_id": employee.id,
        "employee_code": employee.employee_code,
        "employee_name": f"{employee.first_name} {employee.last_name}",
        "basic_salary": employee.basic_salary,
        "allowances": employee.allowances,
        "deductions": total_deductions,
        "payable_salary": payable_salary,
        "present_days": int(effective_present),
        "leave_days": leave_days,
        "absent_days": absent_days
    }

def preview_payroll(db: Session, month: int, year: int, employee_id: Optional[int] = None):
    # 1. Check if already executed for this month & year
    existing_run = db.query(PayrollRun).filter(
        PayrollRun.year == year,
        PayrollRun.month == month,
        PayrollRun.status == "CONFIRMED"
    ).first()

    if existing_run:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payroll for {month}/{year} has already been executed on {existing_run.executed_at.strftime('%Y-%m-%d')} (Run #{existing_run.id}). Duplicate runs are strictly prevented."
        )

    # 2. Fetch eligible active employees
    query = db.query(Employee).filter(Employee.is_active == True)
    if employee_id:
        query = query.filter(Employee.id == employee_id)
    
    employees = query.all()
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found for payroll calculation.")

    items = []
    total_amount = 0.0
    for emp in employees:
        item = calculate_employee_payroll(db, emp, month, year)
        items.append(item)
        total_amount += item["payable_salary"]

    total_amount = round(total_amount, 2)
    preview_token = f"PREV-{year}{month:02d}-{uuid.uuid4().hex[:8]}"

    preview_payload = {
        "month": month,
        "year": year,
        "total_employees": len(items),
        "total_amount": total_amount,
        "preview_token": preview_token,
        "items": items,
        "created_at": datetime.utcnow().isoformat()
    }

    # Store preview for confirmation
    PREVIEW_CACHE[preview_token] = preview_payload

    return preview_payload

def execute_payroll(db: Session, preview_token: str, admin_user_id: int):
    preview = PREVIEW_CACHE.get(preview_token)
    if not preview:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired preview token. Please generate a new payroll preview before executing."
        )

    month = preview["month"]
    year = preview["year"]

    # Re-check idempotency right before DB commit
    existing_run = db.query(PayrollRun).filter(
        PayrollRun.year == year,
        PayrollRun.month == month,
        PayrollRun.status == "CONFIRMED"
    ).first()

    if existing_run:
        del PREVIEW_CACHE[preview_token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate execution blocked: Payroll for {month}/{year} was already confirmed."
        )

    payroll_run = PayrollRun(
        year=year,
        month=month,
        status="CONFIRMED",
        total_employees=preview["total_employees"],
        total_disbursed_amount=preview["total_amount"],
        executed_at=datetime.utcnow(),
        executed_by=admin_user_id
    )
    db.add(payroll_run)
    db.flush()

    for item in preview["items"]:
        p_item = PayrollItem(
            payroll_run_id=payroll_run.id,
            employee_id=item["employee_id"],
            basic_salary=item["basic_salary"],
            allowances=item["allowances"],
            deductions=item["deductions"],
            payable_salary=item["payable_salary"],
            present_days=item["present_days"],
            leave_days=item["leave_days"],
            absent_days=item["absent_days"],
            status="PAID"
        )
        db.add(p_item)

    db.commit()
    db.refresh(payroll_run)

    # Clean up preview cache
    del PREVIEW_CACHE[preview_token]

    log_audit(db, admin_user_id, "PAYROLL_EXECUTE", {
        "payroll_run_id": payroll_run.id,
        "month": month,
        "year": year,
        "total_employees": payroll_run.total_employees,
        "total_disbursed": payroll_run.total_disbursed_amount
    })

    return {
        "status": "success",
        "message": f"Payroll for {month}/{year} successfully executed and saved.",
        "payroll_run_id": payroll_run.id,
        "total_employees": payroll_run.total_employees,
        "total_amount": payroll_run.total_disbursed_amount,
        "executed_at": payroll_run.executed_at.isoformat()
    }
