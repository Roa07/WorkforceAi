from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Employee, Attendance, LeaveRequest, PayrollRun, AuditLog
from schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    LeaveRequestOut, LeaveStatusUpdate,
    PayrollPreviewResponse, PayrollExecuteRequest, PayrollRunOut
)
from auth import require_admin, hash_password
from services.leave_service import update_leave_status
from services.payroll_service import preview_payroll, execute_payroll
from services.attendance_service import detect_attendance_anomalies
from services.audit_service import verify_ledger_integrity
from services.retention_service import calculate_flight_risk

router = APIRouter(prefix="/api/admin", tags=["Super Admin Portal"])

@router.get("/retention-intelligence")
def get_retention_intelligence(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return calculate_flight_risk(db)

@router.get("/audit-logs/verify-integrity")
def verify_audit_ledger(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return verify_ledger_integrity(db)

@router.get("/anomaly-report")
def get_anomaly_report(
    month: Optional[int] = 10,
    year: Optional[int] = 2026,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return detect_attendance_anomalies(db, month, year)

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    today = date.today()
    total_employees = db.query(Employee).filter(Employee.is_active == True).count()
    
    today_attendances = db.query(Attendance).filter(Attendance.date == today).all()
    today_present = sum(1 for a in today_attendances if a.punch_in is not None)
    
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "PENDING").count()
    
    recent_payroll = db.query(PayrollRun).order_by(PayrollRun.executed_at.desc()).first()

    return {
        "total_employees": total_employees,
        "today_present": today_present,
        "today_attendance_summary": {
            "total": total_employees,
            "present": today_present,
            "absent": max(0, total_employees - today_present)
        },
        "pending_leaves_count": pending_leaves,
        "last_payroll_run": {
            "month": recent_payroll.month,
            "year": recent_payroll.year,
            "total_amount": recent_payroll.total_disbursed_amount,
            "executed_at": recent_payroll.executed_at
        } if recent_payroll else None
    }

# Employee Management
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    emps = db.query(Employee).all()
    results = []
    for e in emps:
        results.append({
            "id": e.id,
            "user_id": e.user_id,
            "employee_code": e.employee_code,
            "first_name": e.first_name,
            "last_name": e.last_name,
            "email": e.user.email if e.user else None,
            "department": e.department,
            "designation": e.designation,
            "basic_salary": e.basic_salary,
            "allowances": e.allowances,
            "standard_deductions": e.standard_deductions,
            "casual_leave_balance": e.casual_leave_balance,
            "sick_leave_balance": e.sick_leave_balance,
            "is_active": e.is_active,
            "date_of_joining": e.date_of_joining
        })
    return results

@router.post("/employees", response_model=EmployeeOut)
def create_employee(req: EmployeeCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Check duplicate email
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Employee).filter(Employee.employee_code == req.employee_code).first():
        raise HTTPException(status_code=400, detail="Employee code already exists")

    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        role="EMPLOYEE",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_emp = Employee(
        user_id=new_user.id,
        employee_code=req.employee_code,
        first_name=req.first_name,
        last_name=req.last_name,
        department=req.department,
        designation=req.designation,
        basic_salary=req.basic_salary,
        allowances=req.allowances,
        standard_deductions=req.standard_deductions,
        casual_leave_balance=req.casual_leave_balance,
        sick_leave_balance=req.sick_leave_balance
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return {
        "id": new_emp.id,
        "user_id": new_emp.user_id,
        "employee_code": new_emp.employee_code,
        "first_name": new_emp.first_name,
        "last_name": new_emp.last_name,
        "email": new_user.email,
        "department": new_emp.department,
        "designation": new_emp.designation,
        "basic_salary": new_emp.basic_salary,
        "allowances": new_emp.allowances,
        "standard_deductions": new_emp.standard_deductions,
        "casual_leave_balance": new_emp.casual_leave_balance,
        "sick_leave_balance": new_emp.sick_leave_balance,
        "is_active": new_emp.is_active,
        "date_of_joining": new_emp.date_of_joining
    }

@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    req: EmployeeUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in req.dict(exclude_unset=True).items():
        setattr(emp, key, value)
    
    db.commit()
    db.refresh(emp)
    return {"status": "success", "message": f"Employee {emp.employee_code} updated successfully"}

# Leave Management for Admin
@router.get("/leaves", response_model=List[LeaveRequestOut])
def get_all_leaves(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    results = []
    for l in leaves:
        results.append({
            "id": l.id,
            "employee_id": l.employee_id,
            "employee_code": l.employee.employee_code if l.employee else None,
            "employee_name": f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "Unknown",
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "total_days": l.total_days,
            "reason": l.reason,
            "status": l.status,
            "admin_notes": l.admin_notes,
            "created_at": l.created_at
        })
    return results

@router.put("/leaves/{leave_id}/status")
def review_leave(
    leave_id: int,
    req: LeaveStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    leave = update_leave_status(db, leave_id, current_user.id, req.status, req.admin_notes)
    return {"status": "success", "message": f"Leave request #{leave_id} {leave.status}."}

# Payroll Operations
@router.post("/payroll/preview", response_model=PayrollPreviewResponse)
def handle_payroll_preview(
    month: int,
    year: int,
    employee_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return preview_payroll(db, month, year, employee_id)

@router.post("/payroll/execute")
def handle_payroll_execute(
    req: PayrollExecuteRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return execute_payroll(db, req.preview_token, current_user.id)

@router.get("/payroll/history", response_model=List[PayrollRunOut])
def get_payroll_history(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(PayrollRun).order_by(PayrollRun.executed_at.desc()).all()

@router.get("/audit-logs")
def get_audit_logs(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    return [{
        "id": l.id,
        "action": l.action,
        "user_email": l.user.email if l.user else "System",
        "details": l.details,
        "timestamp": l.timestamp
    } for l in logs]
