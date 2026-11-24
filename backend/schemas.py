from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    employee_id: Optional[int] = None
    employee_code: Optional[str] = None
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str
    department: str = "Engineering"
    designation: str = "Software Engineer"

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)

# Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    department: str
    designation: str
    basic_salary: float
    allowances: float
    standard_deductions: float
    casual_leave_balance: int = 12
    sick_leave_balance: int = 8

class EmployeeCreate(EmployeeBase):
    email: EmailStr
    password: str
    employee_code: str

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    basic_salary: Optional[float] = None
    allowances: Optional[float] = None
    standard_deductions: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeOut(EmployeeBase):
    id: int
    user_id: int
    employee_code: str
    email: Optional[str] = None
    is_active: bool
    date_of_joining: date

    class Config:
        from_attributes = True

# Attendance Schemas
class PunchActionResponse(BaseModel):
    status: str
    message: str
    attendance_id: int
    punch_time: datetime
    attendance_status: str
    total_hours: Optional[float] = 0.0

class AttendanceRecordOut(BaseModel):
    id: int
    date: date
    punch_in: Optional[datetime] = None
    punch_out: Optional[datetime] = None
    status: str
    total_hours: float

    class Config:
        from_attributes = True

class AttendanceSummaryOut(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    leave_days: int
    attendance_rate: float

# Leave Schemas
class LeaveApplyRequest(BaseModel):
    leave_type: str = Field(..., description="CASUAL, SICK, or UNPAID")
    start_date: date
    end_date: date
    reason: str

class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveStatusUpdate(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    admin_notes: Optional[str] = None

# Payroll Schemas
class PayrollPreviewItem(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    basic_salary: float
    allowances: float
    deductions: float
    payable_salary: float
    present_days: int
    leave_days: int
    absent_days: int

class PayrollPreviewResponse(BaseModel):
    month: int
    year: int
    total_employees: int
    total_amount: float
    preview_token: str
    items: List[PayrollPreviewItem]

class PayrollExecuteRequest(BaseModel):
    preview_token: str

class PayrollRunOut(BaseModel):
    id: int
    year: int
    month: int
    status: str
    total_employees: int
    total_disbursed_amount: float
    executed_at: datetime

    class Config:
        from_attributes = True

from typing import Optional, List, Any

# Chat Schemas
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    action_taken: Optional[str] = None
    data: Optional[Any] = None
    agent_routing: Optional[dict] = None
