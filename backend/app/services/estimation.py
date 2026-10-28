import math
from typing import List, Tuple, Dict, Any, Optional

class WaitingTimeEstimationResult:
    def __init__(
        self,
        estimated_seconds: int,
        range_min_seconds: int,
        range_max_seconds: int,
        explanation: str,
        is_approximate: bool = False,
        observed_sample_size: int = 0
    ):
        self.estimated_seconds = estimated_seconds
        self.range_min_seconds = range_min_seconds
        self.range_max_seconds = range_max_seconds
        self.explanation = explanation
        self.is_approximate = is_approximate
        self.observed_sample_size = observed_sample_size

    def to_dict(self) -> Dict[str, Any]:
        return {
            "estimated_seconds": self.estimated_seconds,
            "range_min_seconds": self.range_min_seconds,
            "range_max_seconds": self.range_max_seconds,
            "explanation": self.explanation,
            "is_approximate": self.is_approximate,
            "observed_sample_size": self.observed_sample_size
        }

class EstimationService:
    @staticmethod
    def calculate_estimated_wait(
        people_ahead: int,
        base_service_seconds: int = 180,
        recent_durations: Optional[List[int]] = None,
        is_active: bool = True,
        variance_factor: float = 0.25
    ) -> WaitingTimeEstimationResult:
        """
        Calculates estimated waiting time with transparent uncertainty boundaries
        based on queue depth, recent service duration observations, and counter parameters.
        """
        if not is_active:
            return WaitingTimeEstimationResult(
                estimated_seconds=0,
                range_min_seconds=0,
                range_max_seconds=0,
                explanation="Counter is currently inactive or admissions are paused.",
                is_approximate=True,
                observed_sample_size=0
            )

        if people_ahead <= 0:
            return WaitingTimeEstimationResult(
                estimated_seconds=0,
                range_min_seconds=0,
                range_max_seconds=60,
                explanation="You are at the front of the queue. Service will begin shortly.",
                is_approximate=False,
                observed_sample_size=len(recent_durations) if recent_durations else 0
            )

        # Determine effective service duration
        recent_durations = recent_durations or []
        valid_durations = [d for d in recent_durations if 30 <= d <= 1800] # clamp between 30s and 30m

        if valid_durations:
            # Weighted average favoring the most recent observations
            weights = [1.0 + (i * 0.2) for i in range(len(valid_durations))]
            weighted_sum = sum(d * w for d, w in zip(valid_durations, weights))
            avg_service_time = weighted_sum / sum(weights)
            sample_size = len(valid_durations)
            is_approximate = sample_size < 3
            
            # Dynamic variance based on sample standard deviation or baseline
            if sample_size >= 3:
                variance = sum((d - avg_service_time) ** 2 for d in valid_durations) / sample_size
                std_dev = math.sqrt(variance)
                relative_std = max(0.15, min(0.40, std_dev / avg_service_time))
            else:
                relative_std = variance_factor
                
            duration_minutes = round(avg_service_time / 60, 1)
            source_note = f"derived from {sample_size} recent service session{'s' if sample_size > 1 else ''} (~{duration_minutes} min/person)"
        else:
            avg_service_time = float(base_service_seconds)
            sample_size = 0
            is_approximate = True
            relative_std = 0.30
            source_note = f"based on standard counter baseline (~{round(base_service_seconds/60, 1)} min/person, awaiting recent telemetry)"

        # Central estimate: people_ahead * avg_service_time
        base_estimate = people_ahead * avg_service_time
        
        # Uncertainty intervals (approximating 80% confidence bound given Poisson arrival/service process)
        lower_bound = max(30, int(base_estimate * (1.0 - relative_std)))
        upper_bound = max(lower_bound + 60, int(base_estimate * (1.0 + relative_std)))
        estimated_seconds = int(base_estimate)

        # Formulate human-friendly explanation
        mins = round(estimated_seconds / 60)
        min_range = max(1, round(lower_bound / 60))
        max_range = max(min_range + 1, round(upper_bound / 60))
        
        explanation = (
            f"Estimated {min_range}–{max_range} mins for {people_ahead} person{'s' if people_ahead > 1 else ''} ahead, "
            f"{source_note}."
        )

        return WaitingTimeEstimationResult(
            estimated_seconds=estimated_seconds,
            range_min_seconds=lower_bound,
            range_max_seconds=upper_bound,
            explanation=explanation,
            is_approximate=is_approximate,
            observed_sample_size=sample_size
        )

estimation_service = EstimationService()
