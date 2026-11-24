from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models import Attendance, Employee
from services.audit_service import log_audit

def punch_in(db: Session, employee_id: int, user_id: int):
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today
    ).first()

    if existing and existing.punch_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate punch-in: You have already punched in today at {existing.punch_in.strftime('%I:%M %p')}."
        )

    now = datetime.now()
    attendance_status = "LATE" if now.hour >= 10 else "PRESENT"

    if existing:
        existing.punch_in = now
        existing.status = attendance_status
        attendance = existing
    else:
        attendance = Attendance(
            employee_id=employee_id,
            date=today,
            punch_in=now,
            status=attendance_status
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)

    log_audit(db, user_id, "PUNCH_IN", {
        "employee_id": employee_id,
        "time": now.isoformat(),
        "status": attendance_status
    })

    return {
        "status": "success",
        "message": f"Successfully punched in at {now.strftime('%I:%M %p')}.",
        "attendance_id": attendance.id,
        "punch_time": now,
        "attendance_status": attendance.status,
        "total_hours": attendance.total_hours
    }

def punch_out(db: Session, employee_id: int, user_id: int):
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today
    ).first()

    if not existing or not existing.punch_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid punch-out: No punch-in record found for today. Please punch in first."
        )

    if existing.punch_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already punched out today at {existing.punch_out.strftime('%I:%M %p')}."
        )

    now = datetime.now()
    existing.punch_out = now
    
    # Calculate duration
    duration = (now - existing.punch_in).total_seconds() / 3600.0
    existing.total_hours = round(duration, 2)
    
    if existing.total_hours < 4.0:
        existing.status = "HALF_DAY"

    db.commit()
    db.refresh(existing)

    log_audit(db, user_id, "PUNCH_OUT", {
        "employee_id": employee_id,
        "time": now.isoformat(),
        "total_hours": existing.total_hours
    })

    return {
        "status": "success",
        "message": f"Successfully punched out at {now.strftime('%I:%M %p')}. Total working hours: {existing.total_hours} hrs.",
        "attendance_id": existing.id,
        "punch_time": now,
        "attendance_status": existing.status,
        "total_hours": existing.total_hours
    }

def get_employee_attendance_summary(db: Session, employee_id: int, month: int, year: int):
    from sqlalchemy import extract
    records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        extract("year", Attendance.date) == year,
        extract("month", Attendance.date) == month
    ).all()

    present_days = sum(1 for r in records if r.status in ("PRESENT", "LATE"))
    late_days = sum(1 for r in records if r.status == "LATE")
    half_days = sum(1 for r in records if r.status == "HALF_DAY")
    absent_days = sum(1 for r in records if r.status == "ABSENT")
    total_logged = len(records)

    # Standard working days assumption (e.g. 22 days/month)
    attendance_rate = round((present_days / (total_logged or 1)) * 100, 1)

    return {
        "month": month,
        "year": year,
        "total_days_recorded": total_logged,
        "present_days": present_days,
        "late_days": late_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "attendance_rate": attendance_rate,
        "records": records
    }

def detect_attendance_anomalies(db: Session, month: int, year: int):
    """
    AI Stretch Goal: Scans all employees' attendance for anomalies,
    chronic tardiness, and burnout risk patterns.
    """
    from sqlalchemy import extract
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    
    anomalies = []
    burnout_warnings = []
    top_performers = []

    for emp in employees:
        records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            extract("year", Attendance.date) == year,
            extract("month", Attendance.date) == month
        ).all()

        total = len(records)
        if total == 0:
            continue

        late_count = sum(1 for r in records if r.status == "LATE")
        half_day_count = sum(1 for r in records if r.status == "HALF_DAY")
        avg_hours = round(sum(r.total_hours for r in records) / total, 1) if total else 0.0

        # Anomaly 1: Chronic Tardiness (> 10% late)
        if late_count >= 2:
            anomalies.append({
                "employee_code": emp.employee_code,
                "name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "type": "CHRONIC_TARDINESS",
                "severity": "HIGH" if late_count >= 3 else "MEDIUM",
                "details": f"Arrived late {late_count} times out of {total} recorded shifts."
            })

        # Anomaly 2: Burnout Risk (zero leaves taken, high hours)
        if emp.casual_leave_balance >= 12 and avg_hours >= 8.2:
            burnout_warnings.append({
                "employee_code": emp.employee_code,
                "name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "avg_hours": avg_hours,
                "details": "Consistently working extended hours with 0 vacation days utilized this cycle."
            })

        # Perfect attendance
        if late_count == 0 and half_day_count == 0 and total >= 15:
            top_performers.append(f"{emp.first_name} {emp.last_name} ({emp.employee_code})")

    return {
        "period": f"{month}/{year}",
        "total_analyzed_staff": len(employees),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies,
        "burnout_warnings": burnout_warnings,
        "top_performers": top_performers,
        "recommendations": [
            "Schedule 1-on-1 check-ins with employees flagged for chronic tardiness.",
            "Encourage vacation utilization for personnel flagged with burnout indicators."
        ]
    }

