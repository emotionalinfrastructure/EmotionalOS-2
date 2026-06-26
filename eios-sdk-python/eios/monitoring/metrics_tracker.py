"""
Metrics Tracking System
Tracks NAS, ∆A, REI, EVI, CIS across interactions
"""

from typing import Dict, List, Optional
from collections import deque
import numpy as np


class MetricsTracker:
    """
    Track and aggregate EIOS metrics
    """

    def __init__(self):
        self.conversation_metrics = {}
        self.global_metrics = {
            'NAS': deque(maxlen=10000),
            'delta_A': deque(maxlen=10000),
            'REI': deque(maxlen=10000),
            'EVI': deque(maxlen=10000),
            'CIS': deque(maxlen=10000)
        }

    def calculate_turn_metrics(
        self,
        E_STATE_before: Optional[Dict],
        E_STATE_after: Dict,
        route: str,
        response: str
    ) -> Dict:
        """Calculate metrics for single turn"""

        metrics = {}

        # NAS calculation
        if E_STATE_before:
            intensity_before = E_STATE_before.get('intensity', {}).get('current', 0)
            intensity_after = E_STATE_after.get('intensity', {}).get('current', 0)

            expected_decay = intensity_before * 0.1  # 10% natural reduction
            actual_change = intensity_before - intensity_after

            if expected_decay > 0:
                NAS = actual_change / expected_decay
            else:
                NAS = 1.0 if actual_change >= 0 else 0.0

            metrics['NAS'] = NAS
            self.global_metrics['NAS'].append(NAS)
        else:
            metrics['NAS'] = None

        # Agency delta
        delta_A = E_STATE_after.get('agency', {}).get('delta', 0)
        metrics['delta_A'] = delta_A
        self.global_metrics['delta_A'].append(delta_A)

        # REI
        REI = E_STATE_after.get('rumination', {}).get('entropy', 5.0)
        metrics['REI'] = REI
        self.global_metrics['REI'].append(REI)

        # EVI
        EVI = E_STATE_after.get('volatility', {}).get('EVI', 0)
        metrics['EVI'] = EVI
        self.global_metrics['EVI'].append(EVI)

        # CIS placeholder (should be computed from consent events)
        metrics['CIS'] = 1.0

        return metrics

    def calculate_session_metrics(self, conversation_id: str) -> Dict:
        """Calculate aggregate metrics for entire session"""

        if conversation_id not in self.conversation_metrics:
            return {}

        session_data = self.conversation_metrics[conversation_id]

        NAS_values = [m['NAS'] for m in session_data if m.get('NAS') is not None]
        delta_A_values = [m['delta_A'] for m in session_data]
        REI_values = [m['REI'] for m in session_data]
        EVI_values = [m['EVI'] for m in session_data]

        return {
            'mean_NAS': float(np.mean(NAS_values)) if NAS_values else None,
            'mean_delta_A': float(np.mean(delta_A_values)) if delta_A_values else None,
            'mean_REI': float(np.mean(REI_values)) if REI_values else None,
            'mean_EVI': float(np.mean(EVI_values)) if EVI_values else None,
            'min_NAS': float(min(NAS_values)) if NAS_values else None,
            'max_EVI': float(max(EVI_values)) if EVI_values else None,
            'turn_count': len(session_data)
        }

    def get_summary(self) -> Dict:
        """Get summary of global metrics"""

        return {
            'mean_NAS': float(np.mean(self.global_metrics['NAS'])) if self.global_metrics['NAS'] else None,
            'mean_delta_A': float(np.mean(self.global_metrics['delta_A'])) if self.global_metrics['delta_A'] else None,
            'mean_REI': float(np.mean(self.global_metrics['REI'])) if self.global_metrics['REI'] else None,
            'mean_EVI': float(np.mean(self.global_metrics['EVI'])) if self.global_metrics['EVI'] else None,
            'total_interactions': len(self.global_metrics['NAS'])
        }

    def get_history(self, conversation_id: str) -> List[Dict]:
        """Get metrics history for conversation"""
        return self.conversation_metrics.get(conversation_id, [])
