from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models import LeaveRequest, Employee
from services.audit_service import log_audit

def apply_leave(db: Session, employee_id: int, user_id: int, leave_type: str, start_date: date, end_date: date, reason: str):
    leave_type = leave_type.upper()
    if leave_type not in ["CASUAL", "SICK", "UNPAID"]:
        raise HTTPException(status_code=400, detail="Invalid leave type. Choose CASUAL, SICK, or UNPAID.")

    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date.")

    # Calculate business days or calendar days
    total_days = (end_date - start_date).days + 1
    if total_days <= 0:
        total_days = 1

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Validate balances
    if leave_type == "CASUAL" and employee.casual_leave_balance < total_days:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient casual leave balance ({employee.casual_leave_balance} days available, requested {total_days} days)."
        )
    elif leave_type == "SICK" and employee.sick_leave_balance < total_days:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient sick leave balance ({employee.sick_leave_balance} days available, requested {total_days} days)."
        )

    leave = LeaveRequest(
        employee_id=employee_id,
        leave_type=leave_type,
        start_date=start_date,
        end_date=end_date,
        total_days=total_days,
        reason=reason,
        status="PENDING"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    log_audit(db, user_id, "LEAVE_APPLY", {
        "leave_id": leave.id,
        "leave_type": leave_type,
        "total_days": total_days,
        "start_date": str(start_date),
        "end_date": str(end_date)
    })

    return {
        "status": "success",
        "message": f"Leave application for {total_days} day(s) ({leave_type}) submitted successfully and is pending approval.",
        "leave": leave
    }

def update_leave_status(db: Session, leave_id: int, admin_user_id: int, new_status: str, admin_notes: str = None):
    new_status = new_status.upper()
    if new_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Leave request is already {leave.status}")

    employee = leave.employee
    if new_status == "APPROVED":
        # Deduct balance
        if leave.leave_type == "CASUAL":
            employee.casual_leave_balance = max(0, employee.casual_leave_balance - leave.total_days)
        elif leave.leave_type == "SICK":
            employee.sick_leave_balance = max(0, employee.sick_leave_balance - leave.total_days)

    leave.status = new_status
    leave.admin_notes = admin_notes
    db.commit()
    db.refresh(leave)

    log_audit(db, admin_user_id, f"LEAVE_{new_status}", {
        "leave_id": leave.id,
        "employee_id": employee.id,
        "days": leave.total_days
    })

    return leave
