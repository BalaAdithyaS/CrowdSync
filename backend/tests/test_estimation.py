import pytest
from app.services.estimation import estimation_service

def test_front_of_queue_estimation():
    result = estimation_service.calculate_estimated_wait(people_ahead=0, base_service_seconds=180)
    assert result.estimated_seconds == 0
    assert "front of the queue" in result.explanation.lower()
    assert result.range_max_seconds <= 60

def test_single_counter_baseline_estimation():
    result = estimation_service.calculate_estimated_wait(people_ahead=3, base_service_seconds=180)
    # 3 * 180 = 540 seconds (9 minutes)
    assert result.estimated_seconds == 540
    assert result.range_min_seconds < 540
    assert result.range_max_seconds > 540
    assert result.is_approximate is True  # Baseline awaiting recent telemetry
    assert "Estimated" in result.explanation

def test_recent_observations_weighting():
    # Observations around 100s
    recent = [100, 105, 95, 110]
    result = estimation_service.calculate_estimated_wait(
        people_ahead=2,
        base_service_seconds=200,
        recent_durations=recent
    )
    # Estimate should be close to 2 * ~105 = ~210 seconds rather than baseline 2 * 200 = 400
    assert 180 <= result.estimated_seconds <= 240
    assert result.is_approximate is False
    assert result.observed_sample_size == 4
    assert "derived from 4 recent service sessions" in result.explanation

def test_inactive_counter():
    result = estimation_service.calculate_estimated_wait(
        people_ahead=5,
        base_service_seconds=180,
        is_active=False
    )
    assert result.estimated_seconds == 0
    assert "inactive" in result.explanation.lower()
