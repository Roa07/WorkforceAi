from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Employee
from schemas import LoginRequest, RegisterRequest, ResetPasswordRequest, Token
from auth import verify_password, hash_password, create_access_token, get_current_user
from services.audit_service import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(token_data)

    employee = user.employee
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "employee_id": employee.id if employee else None,
        "employee_code": employee.employee_code if employee else None,
        "full_name": f"{employee.first_name} {employee.last_name}" if employee else "Super Admin"
    }

@router.post("/register", response_model=Token)
def register_employee(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Auto-generate next sequential employee code (e.g., EMP106)
    emp_count = db.query(Employee).count()
    next_num = 101 + emp_count
    emp_code = f"EMP{next_num}"
    while db.query(Employee).filter(Employee.employee_code == emp_code).first():
        next_num += 1
        emp_code = f"EMP{next_num}"

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
        employee_code=emp_code,
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip(),
        department=req.department.strip(),
        designation=req.designation.strip(),
        basic_salary=3500.0,
        allowances=400.0,
        standard_deductions=200.0,
        casual_leave_balance=12,
        sick_leave_balance=8
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    log_audit(db, new_user.id, "EMPLOYEE_SELF_REGISTER", {
        "employee_code": emp_code,
        "email": req.email,
        "department": req.department
    })

    token_data = {"sub": str(new_user.id), "role": new_user.role}
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user_id": new_user.id,
        "employee_id": new_emp.id,
        "employee_code": new_emp.employee_code,
        "full_name": f"{new_emp.first_name} {new_emp.last_name}"
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active account found with that email address."
        )

    user.password_hash = hash_password(req.new_password)
    db.commit()

    log_audit(db, user.id, "PASSWORD_RESET", {"email": req.email})
    return {"status": "success", "message": "Password has been reset successfully. You can now sign in."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    emp = current_user.employee
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "employee": {
            "id": emp.id,
            "employee_code": emp.employee_code,
            "name": f"{emp.first_name} {emp.last_name}",
            "department": emp.department,
            "designation": emp.designation,
            "casual_leave_balance": emp.casual_leave_balance,
            "sick_leave_balance": emp.sick_leave_balance
        } if emp else None
    }
