
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(title="CampusAccess Smart ETA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FEEDBACK_FILE = DATA_DIR / "eta_feedback.csv"

DATA_DIR.mkdir(exist_ok=True)

# Synthetic demonstration data.
# Routing units are prototype costs, not measured metres.
rng = np.random.default_rng(42)
sample_count = 800

distance = rng.uniform(5, 120, sample_count)
crowd = rng.integers(1, 6, sample_count)
transitions = rng.integers(0, 5, sample_count)

base_time = distance * 0.18
crowd_delay = (crowd - 1) * 0.35
vertical_delay = transitions * 0.75
noise = rng.normal(0, 0.25, sample_count)

training_data = pd.DataFrame({
    "distance_units": distance,
    "crowd_level": crowd,
    "vertical_transitions": transitions,
})

training_target = (
    base_time + crowd_delay + vertical_delay + noise
).clip(min=1)

model = RandomForestRegressor(
    n_estimators=150,
    random_state=42
)

model.fit(training_data, training_target)


class ETARequest(BaseModel):
    distance_units: float = Field(gt=0, le=10000)
    crowd_level: int = Field(default=1, ge=1, le=5)
    vertical_transitions: int = Field(default=0, ge=0, le=20)


class FeedbackRequest(BaseModel):
    distance_units: float = Field(gt=0, le=10000)
    crowd_level: int = Field(ge=1, le=5)
    vertical_transitions: int = Field(ge=0, le=20)
    actual_minutes: float = Field(gt=0, le=300)
    predicted_minutes: float | None = Field(default=None, gt=0)
    start_point: str = Field(default="Unknown", max_length=100)
    destination: str = Field(default="Unknown", max_length=100)


@app.get("/")
def home():
    return {
        "message": "CampusAccess Smart ETA API is running",
        "status": "active"
    }


@app.get("/api/eta/health")
def health():
    return {
        "status": "healthy",
        "model": "Random Forest",
        "mode": "demo"
    }


@app.post("/api/eta/predict")
def predict_eta(data: ETARequest):
    features = pd.DataFrame([{
        "distance_units": data.distance_units,
        "crowd_level": data.crowd_level,
        "vertical_transitions": data.vertical_transitions
    }])

    prediction = float(model.predict(features)[0])

    return {
        "estimated_minutes": round(max(1, prediction), 1),
        "model": "Random Forest",
        "mode": "demo",
        "note": "Prediction uses synthetic demonstration data."
    }


@app.post("/api/eta/feedback")
def save_feedback(data: FeedbackRequest):
    row = pd.DataFrame([{
        "distance_units": data.distance_units,
        "crowd_level": data.crowd_level,
        "vertical_transitions": data.vertical_transitions,
        "predicted_minutes": data.predicted_minutes,
        "actual_minutes": data.actual_minutes,
        "start_point": data.start_point,
        "destination": data.destination,
    }])

    try:
        row.to_csv(
            FEEDBACK_FILE,
            mode="a",
            header=not FEEDBACK_FILE.exists(),
            index=False
        )
    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Could not save journey feedback."
        )

    return {
        "message": "Journey feedback saved successfully.",
        "saved": True
    }
