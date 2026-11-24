import json
import hashlib
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from models import AuditLog

GENESIS_HASH = "0" * 64

def calculate_hash(prev_hash: str, user_id: Optional[int], action: str, details_str: str, timestamp_str: str) -> str:
    raw = f"{prev_hash}|{user_id}|{action}|{details_str}|{timestamp_str}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def log_audit(db: Session, user_id: Optional[int], action: str, details: Any = None):
    details_str = json.dumps(details) if isinstance(details, (dict, list)) else str(details or "")
    now = datetime.utcnow()
    now_str = now.isoformat()

    # Fetch last log to get previous hash (Cryptographic Merkle Chaining)
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.record_hash if (last_log and last_log.record_hash) else GENESIS_HASH

    record_hash = calculate_hash(prev_hash, user_id, action, details_str, now_str)

    audit = AuditLog(
        user_id=user_id,
        action=action,
        details=details_str,
        prev_hash=prev_hash,
        record_hash=record_hash,
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

def verify_ledger_integrity(db: Session) -> Dict[str, Any]:
    """
    Traverses the audit blockchain from genesis block to current block,
    validating mathematical consistency of the cryptographic hash chain.
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {"is_intact": True, "total_blocks": 0, "message": "Ledger is empty."}

    prev_hash = GENESIS_HASH
    for log in logs:
        # Check chain link
        if log.prev_hash != prev_hash:
            return {
                "is_intact": False,
                "tampered_at_block_id": log.id,
                "expected_prev_hash": prev_hash,
                "found_prev_hash": log.prev_hash,
                "message": f"CRITICAL INTEGRITY BREACH: Broken chain link at block #{log.id}."
            }

        # Check content integrity
        expected_hash = calculate_hash(
            log.prev_hash,
            log.user_id,
            log.action,
            log.details or "",
            log.timestamp.isoformat()
        )
        if log.record_hash != expected_hash:
            return {
                "is_intact": False,
                "tampered_at_block_id": log.id,
                "expected_hash": expected_hash,
                "found_hash": log.record_hash,
                "message": f"CRITICAL INTEGRITY BREACH: Content altered at block #{log.id}."
            }

        prev_hash = log.record_hash

    return {
        "is_intact": True,
        "total_blocks": len(logs),
        "latest_block_hash": prev_hash,
        "message": f"Cryptographic audit chain fully verified across {len(logs)} blocks. Zero tampering detected."
    }
