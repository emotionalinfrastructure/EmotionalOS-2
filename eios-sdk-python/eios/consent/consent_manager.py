"""
Consent Management System
Handles consent lifecycle for depth exploration
"""

from typing import Dict
from datetime import datetime, timedelta
from enum import Enum


class ConsentStatus(Enum):
    """Status of consent"""
    VALID = "valid"
    EXPIRED = "expired"
    REVOKED = "revoked"
    NEVER_GRANTED = "never_granted"


class ConsentManager:
    """
    Manages consent lifecycle for emotional depth exploration
    """

    def __init__(self):
        self.active_consents = {}
        self.consent_ledger = []
        self.expiration_minutes = 20

    def check_consent_requirements(
        self,
        E_STATE: Dict,
        route: str
    ) -> Dict:
        """
        Check if consent is required for this interaction

        Returns:
            Dict with consent_required, depth_category, consent_valid
        """

        # Consent required for trauma exploration
        if E_STATE.get('trauma_indicators', {}).get('present'):
            return {
                'consent_required': True,
                'depth_category': 'trauma_exploration',
                'topic': 'traumatic experiences',
                'consent_valid': False  # Must be explicitly granted
            }

        # Consent required if route suggests depth
        if route in ['CONTAINMENT', 'SAFE_MODE']:
            # Check if intensification likely
            if E_STATE.get('intensity', {}).get('current', 0) > 6.0:
                return {
                    'consent_required': True,
                    'depth_category': 'intensification',
                    'topic': 'difficult emotions',
                    'consent_valid': False
                }

        # No consent required
        return {
            'consent_required': False,
            'consent_valid': True
        }

    def request_consent(
        self,
        conversation_id: str,
        depth_category: str,
        topic: str,
        consent_language: str
    ) -> str:
        """
        Generate consent request
        Returns the consent request text
        """

        consent_id = self._generate_consent_id()

        # Log request
        self.consent_ledger.append({
            'consent_id': consent_id,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'request',
            'depth_category': depth_category,
            'topic': topic,
            'language': consent_language
        })

        return consent_language

    def grant_consent(
        self,
        consent_id: str,
        conversation_id: str,
        depth_category: str
    ):
        """Grant consent for depth exploration"""

        expiration = datetime.now() + timedelta(minutes=self.expiration_minutes)

        consent = {
            'consent_id': consent_id,
            'conversation_id': conversation_id,
            'depth_category': depth_category,
            'granted': datetime.now().isoformat(),
            'expires': expiration.isoformat(),
            'revoked': False
        }

        # Store active consent
        key = f"{conversation_id}:{depth_category}"
        self.active_consents[key] = consent

        # Log to ledger
        self.consent_ledger.append({
            'consent_id': consent_id,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'type': 'granted',
            'depth_category': depth_category
        })

    def check_consent_valid(
        self,
        conversation_id: str,
        depth_category: str
    ) -> ConsentStatus:
        """Check if consent is currently valid"""

        key = f"{conversation_id}:{depth_category}"

        if key not in self.active_consents:
            return ConsentStatus.NEVER_GRANTED

        consent = self.active_consents[key]

        if consent['revoked']:
            return ConsentStatus.REVOKED

        expiration = datetime.fromisoformat(consent['expires'])
        if datetime.now() > expiration:
            return ConsentStatus.EXPIRED

        return ConsentStatus.VALID

    def revoke_consent(
        self,
        conversation_id: str,
        depth_category: str,
        reason: str = "user_requested"
    ):
        """Revoke active consent"""

        key = f"{conversation_id}:{depth_category}"

        if key in self.active_consents:
            self.active_consents[key]['revoked'] = True

            # Log revocation
            self.consent_ledger.append({
                'consent_id': self.active_consents[key]['consent_id'],
                'conversation_id': conversation_id,
                'timestamp': datetime.now().isoformat(),
                'type': 'revoked',
                'reason': reason,
                'depth_category': depth_category
            })

    def revoke_all_consents(self, conversation_id: str):
        """Revoke all active consents for conversation"""

        for key in list(self.active_consents.keys()):
            if key.startswith(f"{conversation_id}:"):
                depth_category = key.split(':')[1]
                self.revoke_consent(conversation_id, depth_category, "user_requested_all")

    def _generate_consent_id(self) -> str:
        """Generate unique consent ID"""
        import uuid
        return f"CNS-{uuid.uuid4().hex[:12].upper()}"
