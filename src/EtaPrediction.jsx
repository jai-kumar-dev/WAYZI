
import { useEffect, useState } from "react";
import "./EtaPrediction.css";

const API_URL = "http://127.0.0.1:8000";

function EtaPrediction({ routeResult, startPoint, destination }) {
  const [crowdLevel, setCrowdLevel] = useState(2);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actualMinutes, setActualMinutes] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const routeCost = Number(routeResult?.distanceUnits);

  const verticalTransitions = (routeResult?.steps || []).filter(step => {
    const type = String(step.via || "").toLowerCase();
    return type.includes("lift") || type.includes("stairs");
  }).length;

  useEffect(() => {
    if (!routeResult || routeResult.error || !routeCost || routeCost <= 0) {
      setEta(null);
      return;
    }

    let cancelled = false;

    async function getPrediction() {
      setLoading(true);
      setError("");
      setEta(null);
      setFeedbackMessage("");

      try {
        const response = await fetch(`${API_URL}/api/eta/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            distance_units: routeCost,
            crowd_level: Number(crowdLevel),
            vertical_transitions: verticalTransitions
          })
        });

        if (!response.ok) {
          throw new Error("ETA service could not calculate the journey.");
        }

        const result = await response.json();

        if (!cancelled) {
          setEta(result.estimated_minutes);
        }
      } catch (err) {
        if (!cancelled) {
          setError("ETA service unavailable. Start the Python backend.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getPrediction();

    return () => {
      cancelled = true;
    };
  }, [routeResult, routeCost, crowdLevel, verticalTransitions]);

  async function submitFeedback(event) {
    event.preventDefault();

    const actual = Number(actualMinutes);

    if (!actual || actual <= 0) {
      setFeedbackMessage("Enter a valid journey time.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/eta/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          distance_units: routeCost,
          crowd_level: Number(crowdLevel),
          vertical_transitions: verticalTransitions,
          predicted_minutes: eta,
          actual_minutes: actual,
          start_point: startPoint || "Unknown",
          destination: destination || "Unknown"
        })
      });

      if (!response.ok) {
        throw new Error("Feedback could not be saved.");
      }

      setFeedbackMessage("Journey feedback saved. Thank you!");
      setActualMinutes("");
    } catch {
      setFeedbackMessage("Could not save feedback. Check the backend.");
    }
  }

  if (!routeResult || routeResult.error) {
    return null;
  }

  return (
    <section className="eta-card">
      <div className="eta-heading">
        <div>
          <span className="eta-kicker">SMART ETA</span>
          <h3>Journey time prediction</h3>
        </div>
        <span className="eta-demo-tag">DEMO MODEL</span>
      </div>

      <label htmlFor="eta-crowd">Expected crowd level</label>

      <select
        id="eta-crowd"
        value={crowdLevel}
        onChange={event => setCrowdLevel(Number(event.target.value))}
      >
        <option value={1}>Very low</option>
        <option value={2}>Low</option>
        <option value={3}>Moderate</option>
        <option value={4}>High</option>
        <option value={5}>Very high</option>
      </select>

      <div className="eta-result">
        {loading ? (
          <p>Calculating estimated time...</p>
        ) : error ? (
          <p className="eta-error">{error}</p>
        ) : eta !== null ? (
          <>
            <span>Estimated walking time</span>
            <strong>{eta} min</strong>
            <small>Random Forest prediction · synthetic training data</small>
          </>
        ) : (
          <p>Waiting for a valid route.</p>
        )}
      </div>

      {eta !== null && (
        <form className="eta-feedback" onSubmit={submitFeedback}>
          <label htmlFor="actual-time">
            Actual journey time (minutes)
          </label>

          <input
            id="actual-time"
            type="number"
            min="0.1"
            max="300"
            step="0.1"
            value={actualMinutes}
            onChange={event => setActualMinutes(event.target.value)}
            placeholder="Enter after completing your journey"
          />

          <button type="submit">Submit journey feedback</button>

          {feedbackMessage && (
            <p role="status">{feedbackMessage}</p>
          )}
        </form>
      )}

      <p className="eta-disclaimer">
        Demonstration estimate only. Campus routing units are illustrative,
        not measured metres. Actual time may vary.
      </p>
    </section>
  );
}

export default EtaPrediction;
