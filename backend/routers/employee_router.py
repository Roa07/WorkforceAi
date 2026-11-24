from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Employee, Attendance, LeaveRequest
from schemas import (
    PunchActionResponse, AttendanceRecordOut, AttendanceSummaryOut,
    LeaveApplyRequest, LeaveRequestOut
)
from auth import require_employee
from services.attendance_service import punch_in, punch_out, get_employee_attendance_summary
from services.leave_service import apply_leave
from services.payslip_service import generate_payslip_pdf
from models import PayrollItem, PayrollRun
from fastapi.responses import Response

router = APIRouter(prefix="/api/employee", tags=["Employee Portal"])

@router.get("/payslip/{month}/{year}/pdf")
def download_payslip_pdf(
    month: int,
    year: int,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    emp = current_user.employee
    payroll_item = db.query(PayrollItem).join(PayrollRun).filter(
        PayrollItem.employee_id == emp.id,
        PayrollRun.month == month,
        PayrollRun.year == year
    ).first()

    pdf_bytes = generate_payslip_pdf(emp, month, year, payroll_item)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip_{emp.employee_code}_{year}_{month}.pdf"}
    )

@router.get("/profile")
def get_employee_profile(current_user: User = Depends(require_employee)):
    emp = current_user.employee
    today = date.today()
    today_att = next((a for a in emp.attendances if a.date == today), None)
    
    return {
        "id": emp.id,
        "employee_code": emp.employee_code,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": current_user.email,
        "department": emp.department,
        "designation": emp.designation,
        "casual_leave_balance": emp.casual_leave_balance,
        "sick_leave_balance": emp.sick_leave_balance,
        "date_of_joining": emp.date_of_joining,
        "today_attendance": {
            "status": today_att.status if today_att else "NOT_MARKED",
            "punch_in": today_att.punch_in if today_att else None,
            "punch_out": today_att.punch_out if today_att else None,
            "total_hours": today_att.total_hours if today_att else 0.0
        }
    }

@router.post("/attendance/punch-in", response_model=PunchActionResponse)
def handle_punch_in(current_user: User = Depends(require_employee), db: Session = Depends(get_db)):
    return punch_in(db, current_user.employee.id, current_user.id)

@router.post("/attendance/punch-out", response_model=PunchActionResponse)
def handle_punch_out(current_user: User = Depends(require_employee), db: Session = Depends(get_db)):
    return punch_out(db, current_user.employee.id, current_user.id)

@router.get("/attendance/summary")
def get_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    today = date.today()
    m = month or today.month
    y = year or today.year
    return get_employee_attendance_summary(db, current_user.employee.id, m, y)

@router.get("/attendance/history", response_model=List[AttendanceRecordOut])
def get_history(current_user: User = Depends(require_employee), db: Session = Depends(get_db)):
    return db.query(Attendance).filter(
        Attendance.employee_id == current_user.employee.id
    ).order_by(Attendance.date.desc()).limit(30).all()

@router.post("/leave/apply")
def handle_apply_leave(
    req: LeaveApplyRequest,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    return apply_leave(
        db=db,
        employee_id=current_user.employee.id,
        user_id=current_user.id,
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        reason=req.reason
    )

@router.get("/leave/my-leaves", response_model=List[LeaveRequestOut])
def get_my_leaves(current_user: User = Depends(require_employee), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == current_user.employee.id
    ).order_by(LeaveRequest.created_at.desc()).all()
    
    out = []
    for l in leaves:
        out.append({
            "id": l.id,
            "employee_id": l.employee_id,
            "employee_code": current_user.employee.employee_code,
            "employee_name": f"{current_user.employee.first_name} {current_user.employee.last_name}",
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "total_days": l.total_days,
            "reason": l.reason,
            "status": l.status,
            "admin_notes": l.admin_notes,
            "created_at": l.created_at
        })
    return out
