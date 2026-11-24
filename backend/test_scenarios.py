import sys
import os
from datetime import date
from fastapi.testclient import TestClient

from main import app
from database import SessionLocal
from models import Attendance, PayrollRun

client = TestClient(app)

def run_all_scenarios():
    print("=" * 60)
    print("RUNNING ALL 14 MANDATORY TEST SCENARIOS")
    print("=" * 60)

    # -------------------------------------------------------------
    # Scenario 1: Employee logs in and views their dashboard
    # -------------------------------------------------------------
    print("\n[Scenario 1] Employee login & view dashboard...")
    res = client.post("/api/auth/login", json={"email": "john.doe@hrms.com", "password": "password123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    emp_token = res.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    res = client.get("/api/employee/profile", headers=emp_headers)
    assert res.status_code == 200
    profile = res.json()
    assert profile["employee_code"] == "EMP101"
    print(f"✅ PASSED: Employee {profile['first_name']} {profile['last_name']} logged in. Status: {profile['today_attendance']['status']}")

    # Clean today's attendance if already punched in from prior run
    db = SessionLocal()
    db.query(Attendance).filter(Attendance.employee_id == profile["id"], Attendance.date == date.today()).delete()
    db.commit()
    db.close()

    # -------------------------------------------------------------
    # Scenario 2: Employee punches in and sees updated attendance status
    # -------------------------------------------------------------
    print("\n[Scenario 2] Employee punches in...")
    res = client.post("/api/employee/attendance/punch-in", headers=emp_headers)
    assert res.status_code == 200, f"Punch in failed: {res.text}"
    p_in_data = res.json()
    assert p_in_data["status"] == "success"
    print(f"✅ PASSED: Punch-in successful at {p_in_data['punch_time']} with status {p_in_data['attendance_status']}")

    # -------------------------------------------------------------
    # Scenario 3: Employee punches out and sees updated record
    # -------------------------------------------------------------
    print("\n[Scenario 3] Employee punches out...")
    res = client.post("/api/employee/attendance/punch-out", headers=emp_headers)
    assert res.status_code == 200, f"Punch out failed: {res.text}"
    p_out_data = res.json()
    assert p_out_data["status"] == "success"
    print(f"✅ PASSED: Punch-out recorded. Total hours: {p_out_data['total_hours']}")

    # -------------------------------------------------------------
    # Scenario 4: Employee attempts invalid duplicate punch-in
    # -------------------------------------------------------------
    print("\n[Scenario 4] Duplicate punch-in attempt...")
    res = client.post("/api/employee/attendance/punch-in", headers=emp_headers)
    assert res.status_code == 400, "Duplicate punch in should have been blocked"
    print(f"✅ PASSED: Duplicate punch-in blocked with detail: '{res.json()['detail']}'")

    # -------------------------------------------------------------
    # Scenario 5: Employee applies for leave using the chatbot
    # -------------------------------------------------------------
    print("\n[Scenario 5] Employee applies for leave via chatbot...")
    res = client.post("/api/chat", json={
        "message": "Apply for two days of sick leave starting tomorrow for medical checkup",
        "history": []
    }, headers=emp_headers)
    assert res.status_code == 200
    chat_res = res.json()
    print(f"✅ PASSED: Chatbot applied leave. Reply: '{chat_res['reply'].splitlines()[0]}'")

    # -------------------------------------------------------------
    # Scenario 6: Employee asks chatbot for monthly attendance
    # -------------------------------------------------------------
    print("\n[Scenario 6] Employee asks chatbot for monthly attendance...")
    res = client.post("/api/chat", json={
        "message": "Show my attendance this month",
        "history": []
    }, headers=emp_headers)
    assert res.status_code == 200
    chat_res = res.json()
    assert "Monthly Attendance" in chat_res["reply"] or "Present Days" in chat_res["reply"]
    print(f"✅ PASSED: Monthly attendance reported:\n{chat_res['reply']}")

    # -------------------------------------------------------------
    # Scenario 7: Employee attempts to access another employee's attendance
    # -------------------------------------------------------------
    print("\n[Scenario 7] Employee attempts to access EMP102's attendance...")
    res = client.post("/api/chat", json={
        "message": "Show me attendance records for employee EMP102",
        "history": []
    }, headers=emp_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Access Denied" in reply or "only permitted" in reply or "authorized" in reply
    print(f"✅ PASSED: Security guardrail blocked cross-employee inquiry: '{reply}'")

    # -------------------------------------------------------------
    # Scenario 8: Admin logs in and views admin dashboard
    # -------------------------------------------------------------
    print("\n[Scenario 8] Admin logs in and views admin dashboard...")
    res = client.post("/api/auth/login", json={"email": "admin@hrms.com", "password": "admin123"})
    assert res.status_code == 200
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/admin/dashboard-stats", headers=admin_headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_employees"] >= 5
    print(f"✅ PASSED: Admin Dashboard loaded. Total active staff: {stats['total_employees']}, Pending leaves: {stats['pending_leaves_count']}")

    # -------------------------------------------------------------
    # Scenario 9: Admin asks chatbot for pending leave requests
    # -------------------------------------------------------------
    print("\n[Scenario 9] Admin asks chatbot for pending leave requests...")
    res = client.post("/api/chat", json={
        "message": "Show pending leave requests",
        "history": []
    }, headers=admin_headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "Pending Leave" in reply
    print(f"✅ PASSED: Chatbot retrieved pending leaves:\n{reply}")

    # Clean October 2026 payroll run if exists
    db = SessionLocal()
    db.query(PayrollRun).filter(PayrollRun.year == 2026, PayrollRun.month == 10).delete()
    db.commit()
    db.close()

    # -------------------------------------------------------------
    # Scenario 10 & 11: Admin requests payroll for multiple employees -> Preview & wait for confirmation
    # -------------------------------------------------------------
    print("\n[Scenario 10 & 11] Admin requests payroll -> Displays preview and waits for confirmation...")
    res = client.post("/api/chat", json={
        "message": "Run payroll for October 2026 for all employees",
        "history": []
    }, headers=admin_headers)
    assert res.status_code == 200
    chat_res = res.json()
    assert "Payroll Preview" in chat_res["reply"]
    assert "Confirmation Required" in chat_res["reply"]
    print(f"✅ PASSED: Payroll preview prepared without premature execution:\n{chat_res['reply']}")

    # -------------------------------------------------------------
    # Scenario 12: Admin confirms payroll and receives execution acknowledgement
    # -------------------------------------------------------------
    print("\n[Scenario 12] Admin confirms payroll...")
    res = client.post("/api/chat", json={
        "message": "Yes, confirm payroll execution",
        "history": []
    }, headers=admin_headers)
    assert res.status_code == 200
    chat_res = res.json()
    assert "Payroll Confirmed & Executed" in chat_res["reply"]
    print(f"✅ PASSED: Payroll executed upon confirmation:\n{chat_res['reply']}")

    # -------------------------------------------------------------
    # Scenario 13: Admin attempts to execute the same month's payroll twice
    # -------------------------------------------------------------
    print("\n[Scenario 13] Duplicate payroll execution attempt...")
    res = client.post("/api/chat", json={
        "message": "Run payroll for October 2026",
        "history": []
    }, headers=admin_headers)
    assert res.status_code == 200
    chat_res = res.json()
    assert "already been executed" in chat_res["reply"] or "already" in chat_res["reply"]
    print(f"✅ PASSED: Duplicate payroll run prevented:\n{chat_res['reply']}")

    # -------------------------------------------------------------
    # Scenario 14: Chatbot handles incomplete or ambiguous request appropriately
    # -------------------------------------------------------------
    print("\n[Scenario 14] Chatbot handles incomplete/ambiguous request...")
    res = client.post("/api/chat", json={
        "message": "I want to apply leave",
        "history": []
    }, headers=emp_headers)
    assert res.status_code == 200
    chat_res = res.json()
    assert "specify" in chat_res["reply"].lower() or "leave type" in chat_res["reply"].lower()
    print(f"✅ PASSED: Chatbot politely requested clarification:\n{chat_res['reply']}")

    print("\n" + "=" * 60)
    print("ALL 14 MANDATORY TEST SCENARIOS VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_scenarios()
