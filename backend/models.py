from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="EMPLOYEE")  # "EMPLOYEE" or "SUPER_ADMIN"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., EMP101
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    department = Column(String(50), nullable=False)
    designation = Column(String(50), nullable=False)
    
    # Salary components
    basic_salary = Column(Float, nullable=False, default=3000.0)
    allowances = Column(Float, nullable=False, default=500.0)
    standard_deductions = Column(Float, nullable=False, default=200.0)
    
    # Leave balances (in days)
    casual_leave_balance = Column(Integer, default=12)
    sick_leave_balance = Column(Integer, default=8)
    
    date_of_joining = Column(Date, default=date.today)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leaves = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payroll_items = relationship("PayrollItem", back_populates="employee")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    punch_in = Column(DateTime, nullable=True)
    punch_out = Column(DateTime, nullable=True)
    status = Column(String(20), default="PRESENT")  # PRESENT, HALF_DAY, ABSENT, LATE
    total_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="unique_employee_date_attendance"),
    )

    employee = relationship("Employee", back_populates="attendances")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type = Column(String(20), nullable=False)  # CASUAL, SICK, UNPAID
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False, default=1)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="leaves")


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1 to 12
    status = Column(String(20), default="CONFIRMED")  # DRAFT, CONFIRMED
    total_employees = Column(Integer, nullable=False)
    total_disbursed_amount = Column(Float, nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("year", "month", name="unique_payroll_month_year"),
    )

    items = relationship("PayrollItem", back_populates="payroll_run", cascade="all, delete-orphan")


class PayrollItem(Base):
    __tablename__ = "payroll_items"

    id = Column(Integer, primary_key=True, index=True)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    basic_salary = Column(Float, nullable=False)
    allowances = Column(Float, nullable=False)
    deductions = Column(Float, nullable=False)
    payable_salary = Column(Float, nullable=False)
    present_days = Column(Integer, default=0)
    leave_days = Column(Integer, default=0)
    absent_days = Column(Integer, default=0)
    status = Column(String(20), default="PAID")

    payroll_run = relationship("PayrollRun", back_populates="items")
    employee = relationship("Employee", back_populates="payroll_items")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)  # e.g., PUNCH_IN, LEAVE_APPLY, PAYROLL_EXECUTE
    details = Column(Text, nullable=True)
    prev_hash = Column(String(64), nullable=True, default="0" * 64)
    record_hash = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
