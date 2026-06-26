"""
E_STATE Data Structure
Standardized emotional state object
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional


@dataclass
class IntensityState:
    """Emotional intensity measurement"""
    current: float  # 0-10 scale
    baseline: float
    trend: str  # 'increasing', 'decreasing', 'stable'
    acceleration: float


@dataclass
class AgencyState:
    """User agency assessment"""
    current_score: float  # 0-1 scale
    baseline: float
    delta: float
    trajectory: str  # 'increasing', 'declining', 'stable'


@dataclass
class RuminationState:
    """Rumination pattern detection"""
    entropy: float
    entropy_decay: float
    topic_count: int
    topic_fixation: List[str]
    loop_closure_detected: bool


@dataclass
class VolatilityState:
    """Emotional volatility measurement"""
    EVI: float
    pattern: str  # 'oscillating', 'escalating', 'stable'
    excess_EVI: float


@dataclass
class TraumaIndicators:
    """Trauma screening results"""
    present: bool
    confidence: float  # 0-1
    markers: List[str]
    crisis_language_detected: bool


@dataclass
class RiskAssessment:
    """Overall risk evaluation"""
    overall_risk: str  # 'low', 'moderate', 'moderate_high', 'high', 'critical'
    risk_score: float
    primary_concern: Optional[str]
    all_concerns: List[str]
    crisis_detected: bool


class EState:
    """
    Complete emotional state object
    Produced by ESDE, consumed by Kernel
    """

    def __init__(
        self,
        timestamp: str,
        user_message: str,
        intensity: IntensityState,
        agency: AgencyState,
        rumination: RuminationState,
        volatility: VolatilityState,
        trauma_indicators: TraumaIndicators,
        risk_assessment: RiskAssessment,
        conversation_turn: int,
        baseline: Optional[Dict] = None
    ):
        self.timestamp = timestamp
        self.user_message_hash = self._hash_message(user_message)
        self.intensity = intensity
        self.agency = agency
        self.rumination = rumination
        self.volatility = volatility
        self.trauma_indicators = trauma_indicators
        self.risk_assessment = risk_assessment
        self.conversation_turn = conversation_turn
        self.baseline = baseline

    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization"""
        return {
            'timestamp': self.timestamp,
            'user_message_hash': self.user_message_hash,
            'intensity': asdict(self.intensity),
            'agency': asdict(self.agency),
            'rumination': asdict(self.rumination),
            'volatility': asdict(self.volatility),
            'trauma_indicators': asdict(self.trauma_indicators),
            'risk_assessment': asdict(self.risk_assessment),
            'conversation_turn': self.conversation_turn,
            'baseline': self.baseline
        }

    @staticmethod
    def _hash_message(message: str) -> str:
        """Hash message for privacy"""
        import hashlib
        return hashlib.sha256(message.encode()).hexdigest()[:16]

    def __repr__(self) -> str:
        return f"EState(turn={self.conversation_turn}, risk={self.risk_assessment.overall_risk}, intensity={self.intensity.current:.1f}, agency={self.agency.current_score:.2f})"
