import os
from datetime import datetime, date, timedelta
from database import engine, Base, SessionLocal
from models import User, Employee, Attendance, LeaveRequest, PayrollRun, AuditLog
from auth import hash_password

def seed_database():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@hrms.com").first():
            print("Database already seeded.")
            return

        print("Seeding Super Admin...")
        admin = User(
            email="admin@hrms.com",
            password_hash=hash_password("admin123"),
            role="SUPER_ADMIN",
            is_active=True
        )
        db.add(admin)
        db.flush()

        print("Seeding Employees...")
        sample_employees = [
            {
                "email": "john.doe@hrms.com",
                "code": "EMP101",
                "first": "John",
                "last": "Doe",
                "dept": "Engineering",
                "designation": "Senior Full-Stack Engineer",
                "basic": 4500.0,
                "allowances": 600.0,
                "deductions": 300.0,
                "casual": 12,
                "sick": 8
            },
            {
                "email": "sarah.connor@hrms.com",
                "code": "EMP102",
                "first": "Sarah",
                "last": "Connor",
                "dept": "Product",
                "designation": "Lead Product Designer",
                "basic": 4000.0,
                "allowances": 500.0,
                "deductions": 250.0,
                "casual": 10,
                "sick": 7
            },
            {
                "email": "mike.ross@hrms.com",
                "code": "EMP103",
                "first": "Mike",
                "last": "Ross",
                "dept": "Operations",
                "designation": "Operations Analyst",
                "basic": 3600.0,
                "allowances": 400.0,
                "deductions": 200.0,
                "casual": 14,
                "sick": 6
            },
            {
                "email": "emily.blunt@hrms.com",
                "code": "EMP104",
                "first": "Emily",
                "last": "Blunt",
                "dept": "Human Resources",
                "designation": "HR Generalist",
                "basic": 3400.0,
                "allowances": 350.0,
                "deductions": 180.0,
                "casual": 11,
                "sick": 8
            },
            {
                "email": "david.miller@hrms.com",
                "code": "EMP105",
                "first": "David",
                "last": "Miller",
                "dept": "Infrastructure",
                "designation": "DevOps Architect",
                "basic": 4800.0,
                "allowances": 700.0,
                "deductions": 350.0,
                "casual": 9,
                "sick": 5
            }
        ]

        created_employees = []
        for emp_data in sample_employees:
            u = User(
                email=emp_data["email"],
                password_hash=hash_password("password123"),
                role="EMPLOYEE",
                is_active=True
            )
            db.add(u)
            db.flush()

            e = Employee(
                user_id=u.id,
                employee_code=emp_data["code"],
                first_name=emp_data["first"],
                last_name=emp_data["last"],
                department=emp_data["dept"],
                designation=emp_data["designation"],
                basic_salary=emp_data["basic"],
                allowances=emp_data["allowances"],
                standard_deductions=emp_data["deductions"],
                casual_leave_balance=emp_data["casual"],
                sick_leave_balance=emp_data["sick"],
                date_of_joining=date(2025, 1, 15)
            )
            db.add(e)
            db.flush()
            created_employees.append(e)

        # Seed realistic October 2026 attendance records for each employee (weekdays)
        print("Seeding October 2026 attendance...")
        for emp in created_employees:
            # 22 working days in October
            for day in range(1, 23):
                att_date = date(2026, 10, day)
                # EMP101 has perfect attendance, EMP103 has 2 late days, EMP104 has 1 half day
                status = "PRESENT"
                hours = 8.5
                if emp.employee_code == "EMP103" and day in [5, 12]:
                    status = "LATE"
                    hours = 8.0
                elif emp.employee_code == "EMP104" and day == 18:
                    status = "HALF_DAY"
                    hours = 4.0

                att = Attendance(
                    employee_id=emp.id,
                    date=att_date,
                    punch_in=datetime(2026, 10, day, 9, 0 if status != "LATE" else 30),
                    punch_out=datetime(2026, 10, day, 17, 30),
                    status=status,
                    total_hours=hours
                )
                db.add(att)

        # Seed sample pending leaves
        print("Seeding pending leaves...")
        l1 = LeaveRequest(
            employee_id=created_employees[0].id,
            leave_type="CASUAL",
            start_date=date(2026, 11, 28),
            end_date=date(2026, 11, 29),
            total_days=2,
            reason="Attending family wedding ceremony",
            status="PENDING"
        )
        l2 = LeaveRequest(
            employee_id=created_employees[1].id,
            leave_type="SICK",
            start_date=date(2026, 11, 26),
            end_date=date(2026, 11, 26),
            total_days=1,
            reason="Severe migraine / doctor appointment",
            status="PENDING"
        )
        db.add_all([l1, l2])

        db.commit()
        print("Database successfully seeded with Super Admin and 5 active employees!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
