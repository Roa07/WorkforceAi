import re
from typing import Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from services.audit_service import log_audit

# High-risk adversarial attack patterns
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+rules",
    r"system\s+override",
    r"you\s+are\s+now\s+(in\s+developer\s+mode|dan|jailbroken)",
    r"reveal\s+(system\s+prompt|api\s+key|secret|password)",
    r"grant\s+admin\s+(rights|role|access)",
    r"bypass\s+(rbac|security|permission)",
    r"execute\s+arbitrary\s+(sql|code|command)",
    r"<script>|javascript:|drop\s+table"
]

COMPILED_INJECTION_REGEX = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

def inspect_prompt_security(user_id: Optional[int], prompt: str, db: Optional[Session] = None) -> Tuple[bool, str]:
    """
    Scans incoming user prompts for adversarial jailbreaks and prompt injections.
    Returns: (is_safe, sanitized_or_error_message)
    """
    clean_prompt = prompt.strip()

    for pattern in COMPILED_INJECTION_REGEX:
        if pattern.search(clean_prompt):
            if db:
                log_audit(db, user_id, "SECURITY_ALERT_PROMPT_INJECTION", {
                    "blocked_prompt": clean_prompt[:150],
                    "matched_pattern": pattern.pattern
                })
            return False, "Security Alert: Malicious prompt injection pattern detected and blocked by NexHR AI Firewall."

    return True, clean_prompt

def sanitize_untrusted_content(text: str) -> str:
    """
    Sanitizes user-generated database fields (e.g. leave reasons)
    before feeding them into LLM prompt contexts, preventing Indirect Prompt Injections.
    """
    # Neutralize instruction-like brackets or control tags
    sanitized = text.replace("{", "(").replace("}", ")").replace("[", "(").replace("]", ")")
    sanitized = re.sub(r"(?i)system\s*:", "Note:", sanitized)
    sanitized = re.sub(r"(?i)override", "update", sanitized)
    return sanitized
