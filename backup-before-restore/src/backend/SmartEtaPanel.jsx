import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Send, Sparkles, Users } from "lucide-react";
import "./SmartEtaPanel.css";

const API_BASE = import.meta.env.VITE_ETA_API_URL || "http://localhost:8000";

export default function SmartEtaPanel({ routeResult, start, destination }) {
  const [crowd, setCrowd] = useState("medium");
  const [pace, setPace] = useState("normal");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actualMinutes, setActualMinutes] = useState("");
  const [feedbackState, setFeedbackState] = useState("");
  const [apiAvailable, setApiAvailable] = useState(true);

  const features = useMemo(() => {
    const steps = routeResult?.steps || [];
    const verticalTransitions = steps.filter((step) =>
      /lift|stairs/i.test(String(step.via || ""))
    ).length;
    return {
      route_cost_units: Math.max(1, Number(routeResult?.distanceUnits) || 1),
      crowd_level: crowd,
      walking_pace: pace,
      vertical_transitions: verticalTransitions,
    };
  }, [routeResult, crowd, pace]);

  useEffect(() => {
    let cancelled = false;
    async function predict() {
      setLoading(true);
      setPrediction(null);
      try {
        const response = await fetch(`${API_BASE}/api/eta/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        });
        if (!response.ok) throw new Error("ETA service unavailable");
        const data = await response.json();
        if (!cancelled) {
          setPrediction(data);
          setApiAvailable(true);
        }
      } catch {
        if (!cancelled) {
          // Transparent local fallback; route units are schematic, not metres.
          const crowdFactor = { low: 0.9, medium: 1, high: 1.2 }[crowd];
          const paceFactor = { slow: 1.2, normal: 1, fast: 0.85 }[pace];
          const minutes = Math.max(1, (features.route_cost_units * 0.12 + features.vertical_transitions * 0.8) * crowdFactor * paceFactor);
          setPrediction({
            estimated_minutes: Number(minutes.toFixed(1)),
            model_source: "local_heuristic",
            sample_count: 0,
            note: "Backend is offline. This is a simple fallback estimate, not an ML prediction.",
          });
          setApiAvailable(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    predict();
    return () => { cancelled = true; };
  }, [features, crowd, pace]);

  async function submitFeedback(event) {
    event.preventDefault();
    const actual = Number(actualMinutes);
    if (!Number.isFinite(actual) || actual <= 0 || actual > 240) {
      setFeedbackState("Enter an actual journey time between 0 and 240 minutes.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/eta/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...features, actual_minutes: actual, start, destination }),
      });
      if (!response.ok) throw new Error("Could not save feedback");
      const data = await response.json();
      setFeedbackState(data.message || "Journey observation saved. Thank you!");
      setActualMinutes("");
    } catch {
      setFeedbackState("Feedback needs the ETA backend running. No observation was saved.");
    }
  }

  const sourceLabel = prediction?.model_source === "real_data"
    ? "Trained on collected campus observations"
    : prediction?.model_source === "synthetic_demo"
      ? "Demo ML model · synthetic training data"
      : "Local fallback · backend offline";

  return (
    <section className="smart-eta-card" aria-live="polite">
      <div className="smart-eta-heading">
        <span className="smart-eta-icon"><Sparkles size={17} /></span>
        <div><strong>Smart ETA Prediction</strong><small>Experimental journey-time estimate</small></div>
      </div>
      <div className="smart-eta-controls">
        <label><span><Users size={13}/> Crowd level</span>
          <select value={crowd} onChange={(e) => setCrowd(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </label>
        <label><span><Activity size={13}/> Walking pace</span>
          <select value={pace} onChange={(e) => setPace(e.target.value)}>
            <option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option>
          </select>
        </label>
      </div>
      <div className="smart-eta-result">
        <span className="smart-eta-clock"><Clock3 size={18}/></span>
        <div><small>Estimated journey time</small>
          <strong>{loading ? "Calculating…" : prediction ? `${prediction.estimated_minutes} min` : "—"}</strong>
        </div>
      </div>
      <p className="smart-eta-source">{sourceLabel}{prediction?.sample_count ? ` · ${prediction.sample_count} observations` : ""}</p>
      <p className="smart-eta-disclaimer">
        Route costs in this prototype are illustrative units, not surveyed metres. Treat this as a demo estimate, not a guaranteed arrival time.
      </p>
      <form className="smart-eta-feedback" onSubmit={submitFeedback}>
        <label htmlFor="smart-eta-actual">After walking, enter your actual time (minutes)</label>
        <div><input id="smart-eta-actual" type="number" min="0.1" max="240" step="0.1" value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} placeholder="e.g. 4.5" />
          <button type="submit"><Send size={13}/> Submit</button>
        </div>
        {feedbackState && <small role="status">{feedbackState}</small>}
      </form>
      {!apiAvailable && <p className="smart-eta-offline">Start the optional Python backend to enable the ML model and save journey observations.</p>}
    </section>
  );
}
