from __future__ import annotations

import csv
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(title="CampusAccess Smart ETA API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local prototype only; restrict before deployment.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "eta_observations.csv"
MIN_REAL_SAMPLES = 40
FEATURES = ["route_cost_units", "crowd_level", "walking_pace", "vertical_transitions"]
CROWD = {"low": 0, "medium": 1, "high": 2}
PACE = {"slow": 0, "normal": 1, "fast": 2}
model: RandomForestRegressor | None = None
model_source = "synthetic_demo"
real_sample_count = 0
real_mae: float | None = None


class EtaInput(BaseModel):
    route_cost_units: float = Field(gt=0, le=10000)
    crowd_level: Literal["low", "medium", "high"] = "medium"
    walking_pace: Literal["slow", "normal", "fast"] = "normal"
    vertical_transitions: int = Field(ge=0, le=30)


class FeedbackInput(EtaInput):
    actual_minutes: float = Field(gt=0, le=240)
    start: str = Field(default="", max_length=120)
    destination: str = Field(default="", max_length=160)


def vector(item: EtaInput) -> list[float]:
    return [
        item.route_cost_units,
        CROWD[item.crowd_level],
        PACE[item.walking_pace],
        item.vertical_transitions,
    ]


def train_demo_model() -> RandomForestRegressor:
    rng = np.random.default_rng(2026)
    count = 2400
    route = rng.uniform(5, 180, count)
    crowd = rng.integers(0, 3, count)
    pace = rng.integers(0, 3, count)
    vertical = rng.integers(0, 5, count)
    pace_factor = np.choose(pace, [1.22, 1.0, 0.84])
    crowd_factor = np.choose(crowd, [0.9, 1.0, 1.2])
    noise = rng.normal(0, 0.35, count)
    minutes = np.maximum(
        0.5,
        (route * 0.12 + vertical * 0.75) * pace_factor * crowd_factor + noise,
    )
    x = np.column_stack([route, crowd, pace, vertical])
    estimator = RandomForestRegressor(
        n_estimators=120, max_depth=12, min_samples_leaf=2, random_state=42
    )
    estimator.fit(x, minutes)
    return estimator


def load_real_observations():
    if not DATA_FILE.exists():
        return None, None, 0
    rows = []
    targets = []
    with DATA_FILE.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            try:
                rows.append([
                    float(row["route_cost_units"]),
                    float(row["crowd_level"]),
                    float(row["walking_pace"]),
                    float(row["vertical_transitions"]),
                ])
                targets.append(float(row["actual_minutes"]))
            except (KeyError, TypeError, ValueError):
                continue
    if not rows:
        return None, None, 0
    return np.asarray(rows), np.asarray(targets), len(rows)


def refresh_model():
    global model, model_source, real_sample_count, real_mae
    x, y, count = load_real_observations()
    real_sample_count = count
    if count >= MIN_REAL_SAMPLES:
        # Evaluate on a held-out tail before fitting the final model.
        split = max(1, int(count * 0.8))
        if count - split:
            evaluator = RandomForestRegressor(
                n_estimators=100, max_depth=10, random_state=42
            )
            evaluator.fit(x[:split], y[:split])
            real_mae = float(np.mean(np.abs(evaluator.predict(x[split:]) - y[split:])))
        else:
            real_mae = None
        model = RandomForestRegressor(
            n_estimators=140, max_depth=12, min_samples_leaf=2, random_state=42
        )
        model.fit(x, y)
        model_source = "real_data"
    else:
        model = train_demo_model()
        model_source = "synthetic_demo"
        real_mae = None


@app.on_event("startup")
def startup():
    refresh_model()


@app.post("/api/eta/predict")
def predict(item: EtaInput):
    if model is None:
        refresh_model()
    estimate = float(model.predict(np.asarray([vector(item)]))[0])
    return {
        "estimated_minutes": round(max(0.5, estimate), 1),
        "model_source": model_source,
        "sample_count": real_sample_count,
        "mae_minutes": round(real_mae, 2) if real_mae is not None else None,
        "note": (
            "Trained from collected observations."
            if model_source == "real_data"
            else "Demo model trained on synthetic examples; not validated against GTBIT journeys."
        ),
    }


@app.post("/api/eta/feedback")
def feedback(item: FeedbackInput):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    new_file = not DATA_FILE.exists()
    with DATA_FILE.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if new_file:
            writer.writerow([
                "route_cost_units", "crowd_level", "walking_pace",
                "vertical_transitions", "actual_minutes", "start", "destination"
            ])
        writer.writerow([
            item.route_cost_units, CROWD[item.crowd_level], PACE[item.walking_pace],
            item.vertical_transitions, item.actual_minutes, item.start, item.destination
        ])
    refresh_model()
    return {
        "message": f"Observation saved ({real_sample_count} total). "
                   f"The model switches to campus observations after {MIN_REAL_SAMPLES}.",
        "sample_count": real_sample_count,
        "model_source": model_source,
    }


@app.get("/api/eta/health")
def health():
    return {
        "status": "ok",
        "model_source": model_source,
        "real_observations": real_sample_count,
        "minimum_real_observations": MIN_REAL_SAMPLES,
        "mae_minutes": round(real_mae, 2) if real_mae is not None else None,
    }
