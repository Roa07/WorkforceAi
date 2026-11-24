"""
NexHR Official Model Context Protocol (MCP) Server
Implements JSON-RPC 2.0 protocol for autonomous agent tool discovery and execution.
Adheres to the official MCP specification (tools/list, tools/call, initialize).
"""

import sys
import json
from datetime import date, datetime
from database import SessionLocal
from models import Employee, User, Attendance, LeaveRequest
from services.attendance_service import punch_in, punch_out, get_employee_attendance_summary, detect_attendance_anomalies
from services.leave_service import apply_leave, update_leave_status
from services.payroll_service import preview_payroll, execute_payroll

PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "nexhr-hrms-mcp-server"
SERVER_VERSION = "1.0.0"

TOOLS_REGISTRY = [
    {
        "name": "hrms_punch_in",
        "description": "Punch in attendance for an employee for today.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "employee_code": {"type": "string", "description": "Employee code, e.g. EMP101"}
            },
            "required": ["employee_code"]
        }
    },
    {
        "name": "hrms_punch_out",
        "description": "Punch out attendance for an employee for today.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "employee_code": {"type": "string", "description": "Employee code, e.g. EMP101"}
            },
            "required": ["employee_code"]
        }
    },
    {
        "name": "hrms_apply_leave",
        "description": "Submit a leave application for an employee.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "employee_code": {"type": "string", "description": "e.g. EMP101"},
                "leave_type": {"type": "string", "enum": ["CASUAL", "SICK", "UNPAID"]},
                "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                "reason": {"type": "string", "description": "Justification for leave"}
            },
            "required": ["employee_code", "leave_type", "start_date", "end_date", "reason"]
        }
    },
    {
        "name": "hrms_preview_payroll",
        "description": "Calculate and preview monthly payroll without committing disbursement.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "month": {"type": "integer", "description": "1 to 12"},
                "year": {"type": "integer", "description": "e.g. 2026"}
            },
            "required": ["month", "year"]
        }
    },
    {
        "name": "hrms_execute_payroll",
        "description": "Execute and commit payroll using a verified preview token.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "preview_token": {"type": "string", "description": "Token obtained from preview_payroll"}
            },
            "required": ["preview_token"]
        }
    },
    {
        "name": "hrms_detect_anomalies",
        "description": "Scans attendance data to flag chronic tardiness and burnout risks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "month": {"type": "integer", "description": "1 to 12"},
                "year": {"type": "integer", "description": "e.g. 2026"}
            },
            "required": ["month", "year"]
        }
    },
    {
        "name": "hrms_flight_risk_analysis",
        "description": "Evaluates predictive employee flight risk, attrition signals, and retention strategies.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

def handle_tool_call(tool_name: str, arguments: dict) -> dict:
    db = SessionLocal()
    try:
        if tool_name == "hrms_punch_in":
            emp = db.query(Employee).filter(Employee.employee_code == arguments["employee_code"].upper()).first()
            if not emp:
                return {"error": "Employee not found"}
            res = punch_in(db, emp.id, emp.user_id)
            return {"result": res}

        elif tool_name == "hrms_punch_out":
            emp = db.query(Employee).filter(Employee.employee_code == arguments["employee_code"].upper()).first()
            if not emp:
                return {"error": "Employee not found"}
            res = punch_out(db, emp.id, emp.user_id)
            return {"result": res}

        elif tool_name == "hrms_apply_leave":
            emp = db.query(Employee).filter(Employee.employee_code == arguments["employee_code"].upper()).first()
            if not emp:
                return {"error": "Employee not found"}
            s_date = datetime.strptime(arguments["start_date"], "%Y-%m-%d").date()
            e_date = datetime.strptime(arguments["end_date"], "%Y-%m-%d").date()
            res = apply_leave(db, emp.id, emp.user_id, arguments["leave_type"], s_date, e_date, arguments["reason"])
            return {"result": res["message"]}

        elif tool_name == "hrms_preview_payroll":
            res = preview_payroll(db, arguments["month"], arguments["year"])
            return {
                "preview_token": res["preview_token"],
                "total_employees": res["total_employees"],
                "total_amount": res["total_amount"],
                "items_count": len(res["items"])
            }

        elif tool_name == "hrms_execute_payroll":
            admin = db.query(User).filter(User.role == "SUPER_ADMIN").first()
            res = execute_payroll(db, arguments["preview_token"], admin.id if admin else 1)
            return {"result": res}

        elif tool_name == "hrms_detect_anomalies":
            res = detect_attendance_anomalies(db, arguments["month"], arguments["year"])
            return {"result": res}

        elif tool_name == "hrms_flight_risk_analysis":
            from services.retention_service import calculate_flight_risk
            res = calculate_flight_risk(db)
            return {"result": res}

        return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

def main():
    """Reads JSON-RPC messages from stdin and outputs to stdout."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id")
            method = req.get("method")
            params = req.get("params", {})

            if method == "initialize":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": PROTOCOL_VERSION,
                        "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
                        "capabilities": {"tools": {}}
                    }
                }
            elif method == "tools/list":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"tools": TOOLS_REGISTRY}
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                tool_result = handle_tool_call(tool_name, arguments)
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps(tool_result, default=str)}]
                    }
                }
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Method {method} not found"}
                }

            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
