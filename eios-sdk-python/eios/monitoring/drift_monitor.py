"""
Drift Detection System
Monitors for system drift from safety objectives
"""

from typing import Dict, List
import numpy as np


class DriftMonitor:
    """
    Detect when system drifts from safety objectives
    """

    def __init__(self):
        self.drift_window = 1000  # Monitor last 1000 interactions
        self.baseline_metrics = None
        self.drift_history = []

    def check_drift(
        self,
        conversation_id: str,
        metrics_history: List[Dict]
    ) -> Dict:
        """Check for drift in recent metrics"""

        if len(metrics_history) < 100:
            return {'drift_detected': False, 'reason': 'insufficient_data'}

        recent = metrics_history[-self.drift_window:]

        recent_NAS = [m.get('NAS') for m in recent if m.get('NAS') is not None]
        if recent_NAS:
            mean_NAS = float(np.mean(recent_NAS))
            if mean_NAS < 0.85:
                status = {
                    'drift_detected': True,
                    'drift_type': 'NAS_drift',
                    'mean_NAS': mean_NAS,
                    'threshold': 0.85
                }
                self.drift_history.append(status)
                return status

        recent_agency = [m.get('delta_A') for m in recent if m.get('delta_A') is not None]
        if recent_agency:
            mean_agency = float(np.mean(recent_agency))
            if mean_agency < -0.05:
                status = {
                    'drift_detected': True,
                    'drift_type': 'agency_drift',
                    'mean_delta_A': mean_agency,
                    'threshold': -0.05
                }
                self.drift_history.append(status)
                return status

        return {'drift_detected': False}

    def get_status(self) -> Dict:
        """Get current drift monitoring status"""
        return {
            'monitoring_active': True,
            'window_size': self.drift_window,
            'recent_drift_events': len(self.drift_history)
        }
