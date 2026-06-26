"""
Memory Management System
Handles session memory, safety ledger, and identity blocking
"""

from typing import Dict, List, Optional
from datetime import datetime


class MemoryManager:
    """
    Manages memory with strict separation:
    - Session memory: Temporary, cleared at end
    - Safety ledger: Permanent audit trail
    - Identity memory: PROHIBITED
    """

    def __init__(self, system_id: str):
        self.system_id = system_id
        self.session_memory = {}  # conversation_id -> session data
        self.safety_ledger = SafetyLedger(system_id)
        self.identity_memory = None  # Architecturally prohibited

    def initialize_conversation(
        self,
        conversation_id: str,
        user_id: str
    ):
        """Initialize new conversation session"""

        self.session_memory[conversation_id] = {
            'conversation_id': conversation_id,
            'user_id_hash': self._hash_user_id(user_id),
            'started': datetime.now().isoformat(),
            'turns': [],
            'baseline_E_STATE': None,
            'last_E_STATE': None
        }

    def store_turn(
        self,
        conversation_id: str,
        user_message: str,
        E_STATE: Dict,
        route: str,
        response: str,
        metrics: Dict,
        violations: List[Dict]
    ):
        """Store turn in both session memory and safety ledger"""

        turn_data = {
            'turn_number': len(self.session_memory[conversation_id]['turns']) + 1,
            'timestamp': datetime.now().isoformat(),
            'user_message_hash': self._hash_message(user_message),
            'E_STATE': E_STATE,
            'route': route,
            'response_hash': self._hash_message(response),
            'metrics': metrics,
            'violations': violations
        }

        # Session memory (temporary)
        if conversation_id in self.session_memory:
            self.session_memory[conversation_id]['turns'].append(turn_data)
            self.session_memory[conversation_id]['last_E_STATE'] = E_STATE

            # Set baseline on first turn
            if turn_data['turn_number'] == 1:
                self.session_memory[conversation_id]['baseline_E_STATE'] = E_STATE

        # Safety ledger (permanent)
        self.safety_ledger.log_turn(conversation_id, turn_data)

    def get_conversation_context(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation context for EIOS processing"""

        if conversation_id not in self.session_memory:
            return None

        session = self.session_memory[conversation_id]

        return {
            'conversation_id': conversation_id,
            'history': session['turns'][-10:],  # Last 10 turns only
            'baseline_E_STATE': session['baseline_E_STATE'],
            'last_E_STATE': session['last_E_STATE'],
            'turn_count': len(session['turns'])
        }

    def get_full_conversation(self, conversation_id: str) -> Dict:
        """Get complete conversation for audit/evaluation"""

        return {
            'session_data': self.session_memory.get(conversation_id),
            'ledger_data': self.safety_ledger.get_conversation_logs(conversation_id)
        }

    def end_session(self, conversation_id: str):
        """End session - clear session memory, keep safety ledger"""

        if conversation_id in self.session_memory:
            # Log session end to safety ledger
            self.safety_ledger.log_session_end(
                conversation_id,
                self.session_memory[conversation_id]
            )

            # Clear session memory
            del self.session_memory[conversation_id]

    def PROHIBITED_get_user_profile(self, user_id: str):
        """
        This function is architecturally prohibited
        Identity memory violates EIOS principles
        """
        raise NotImplementedError(
            "Identity memory is prohibited by EIOS architecture. "
            "System remembers its own behavior, not user vulnerabilities."
        )

    @staticmethod
    def _hash_user_id(user_id: str) -> str:
        """Hash user ID for privacy"""
        import hashlib
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]

    @staticmethod
    def _hash_message(message: str) -> str:
        """Hash message for privacy"""
        import hashlib
        return hashlib.sha256(message.encode()).hexdigest()[:16]


class SafetyLedger:
    """
    Immutable audit trail of system behavior
    Permanent storage for compliance and accountability
    """

    def __init__(self, system_id: str):
        self.system_id = system_id
        self.entries = []
        self.conversation_logs = {}

    def log_turn(self, conversation_id: str, turn_data: Dict):
        """Log turn to immutable ledger"""

        entry = {
            'entry_id': self._generate_entry_id(),
            'system_id': self.system_id,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'turn',
            'data': turn_data,
            'hash': None,
            'previous_hash': self._get_latest_hash()
        }

        entry['hash'] = self._compute_hash(entry)

        self.entries.append(entry)

        # Index by conversation
        if conversation_id not in self.conversation_logs:
            self.conversation_logs[conversation_id] = []
        self.conversation_logs[conversation_id].append(entry)

    def log_session_end(self, conversation_id: str, session_data: Dict):
        """Log session end"""

        entry = {
            'entry_id': self._generate_entry_id(),
            'system_id': self.system_id,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'session_end',
            'data': {
                'turn_count': len(session_data['turns']),
                'duration': self._calculate_duration(session_data)
            },
            'hash': None,
            'previous_hash': self._get_latest_hash()
        }

        entry['hash'] = self._compute_hash(entry)
        self.entries.append(entry)

    def log_violation(self, violation: Dict):
        """Log violation to ledger"""

        entry = {
            'entry_id': self._generate_entry_id(),
            'system_id': self.system_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'violation',
            'data': violation,
            'hash': None,
            'previous_hash': self._get_latest_hash()
        }

        entry['hash'] = self._compute_hash(entry)
        self.entries.append(entry)

    def log_drift_correction(self, drift_status: Dict):
        """Log drift correction"""

        entry = {
            'entry_id': self._generate_entry_id(),
            'system_id': self.system_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'drift_correction',
            'data': drift_status,
            'hash': None,
            'previous_hash': self._get_latest_hash()
        }

        entry['hash'] = self._compute_hash(entry)
        self.entries.append(entry)

    def get_conversation_logs(self, conversation_id: str):
        """Retrieve logs for specific conversation"""
        return self.conversation_logs.get(conversation_id, [])

    def verify_integrity(self) -> bool:
        """Verify ledger integrity via hash chain"""

        for i, entry in enumerate(self.entries):
            computed_hash = self._compute_hash(entry)
            if computed_hash != entry['hash']:
                return False

            if i > 0 and entry['previous_hash'] != self.entries[i-1]['hash']:
                return False

        return True

    def _generate_entry_id(self) -> str:
        """Generate unique entry ID"""
        import uuid
        return f"LED-{uuid.uuid4().hex[:12].upper()}"

    def _compute_hash(self, entry: Dict) -> str:
        """Compute cryptographic hash of entry"""
        import hashlib
        import json

        entry_copy = entry.copy()
        entry_copy.pop('hash', None)

        entry_string = json.dumps(entry_copy, sort_keys=True)
        return hashlib.sha256(entry_string.encode()).hexdigest()[:16]

    def _get_latest_hash(self) -> Optional[str]:
        """Get hash of most recent entry"""
        return self.entries[-1]['hash'] if self.entries else None

    def _calculate_duration(self, session_data: Dict) -> str:
        """Calculate session duration"""
        if not session_data['turns']:
            return "0s"

        start = datetime.fromisoformat(session_data['started'])
        end = datetime.fromisoformat(session_data['turns'][-1]['timestamp'])
        duration = (end - start).total_seconds()

        return f"{int(duration)}s"
