import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, LocateFixed, MapPin, QrCode, ShieldCheck, X, Crosshair, Trash2 } from "lucide-react";

const CAMPUS = { lat: 28.63173, lon: 77.1162 }; // Approximate public reference only; not used as a gate coordinate.
const STORAGE_KEY = "campusaccess.checkpoint-calibration.v1";
const CHECKPOINTS = {
  "GTBIT:MAIN_GATE": { start: "Main Gate", label: "Main Gate" },
  "GTBIT:FOUNTAIN": { start: "Fountain", label: "Fountain" },
  "GTBIT:BVS_ENTRANCE": { start: "BVS Block entrance", label: "BVS Block entrance" },
  "GTBIT:ACADEMIC_ENTRANCE": { start: "Academic Block entrance", label: "Academic Block entrance" },
  "GTBIT:LAB_ENTRANCE": { start: "Lab Block entrance", label: "Lab Block entrance" },
  "GTBIT:LAB_LIFT_LOBBY": { start: "Lab Block · Lift lobby", label: "Lab Block lift lobby" },
};
const metresBetween = (a, b) => {
  const rad = v => v * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
};
function loadCalibration() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export default function LocationCheckpoints({ onCheckpoint }) {
  const [gps, setGps] = useState({ state: "idle", message: "GPS is off", coords: null, accuracy: null, nearCampus: false });
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [qrMessage, setQrMessage] = useState("");
  const [calibration, setCalibration] = useState(loadCalibration);
  const [calibrationTarget, setCalibrationTarget] = useState("GTBIT:MAIN_GATE");
  const [autoMatch, setAutoMatch] = useState("");
  const lastAutoRef = useRef("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const watchRef = useRef(null);

  useEffect(() => () => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    stopCamera();
  }, []);

  useEffect(() => {
    if (gps.state !== "active" || !gps.coords || !gps.accuracy || gps.accuracy > 35) return;
    let nearest = null;
    for (const [code, point] of Object.entries(calibration)) {
      if (!CHECKPOINTS[code]) continue;
      const distance = metresBetween(gps.coords, point);
      if (!nearest || distance < nearest.distance) nearest = { code, distance };
    }
    if (!nearest || nearest.distance > Math.max(18, gps.accuracy * 1.25)) {
      setAutoMatch("");
      lastAutoRef.current = "";
      return;
    }
    if (lastAutoRef.current !== nearest.code) {
      lastAutoRef.current = nearest.code;
      const point = CHECKPOINTS[nearest.code];
      setAutoMatch(`${point.label} · about ${Math.round(nearest.distance)} m away`);
      onCheckpoint(point.start, point.label);
    }
  }, [gps, calibration, onCheckpoint]);

  function startGps() {
    if (!navigator.geolocation) { setGps({ state: "error", message: "This browser does not support GPS location.", coords: null, accuracy: null, nearCampus: false }); return; }
    setGps(old => ({ ...old, state: "loading", message: "Requesting location permission…" }));
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(position => {
      const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
      const accuracy = Math.round(position.coords.accuracy || 0);
      const distance = Math.round(metresBetween(coords, CAMPUS));
      const nearCampus = distance <= 250;
      setGps({ state: "active", coords, accuracy, nearCampus, message: nearCampus ? `GPS active · approximately ${distance} m from the GTBIT campus reference` : `GPS active · approximately ${distance} m from GTBIT` });
    }, error => {
      const message = error.code === 1 ? "Location permission was denied. Allow location access in your browser." : error.code === 2 ? "Your location is unavailable. Try near a window or outdoors." : "GPS request timed out. Try again.";
      setGps(old => ({ ...old, state: "error", message }));
    }, { enableHighAccuracy: true, maximumAge: 1500, timeout: 15000 });
  }

  function stopGps() {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    lastAutoRef.current = "";
    setAutoMatch("");
    setGps(old => ({ ...old, state: "idle", message: "GPS paused" }));
  }

  function acceptCode(raw) {
    const code = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    const checkpoint = CHECKPOINTS[code];
    if (!checkpoint) { setQrMessage("Checkpoint not recognized. Use a CampusAccess QR code installed at a mapped location."); return; }
    lastAutoRef.current = code;
    onCheckpoint(checkpoint.start, checkpoint.label);
    setQrMessage(`Position confirmed at ${checkpoint.label}. Route start updated.`);
    setManualCode("");
    stopCamera();
  }

  function saveCalibration() {
    if (!gps.coords || gps.state !== "active") { setQrMessage("Start GPS and wait for a location fix before calibrating a checkpoint."); return; }
    if (gps.accuracy > 35) { setQrMessage(`GPS accuracy is ±${gps.accuracy} m. Wait for a more accurate outdoor fix (35 m or better) before saving.`); return; }
    const next = { ...calibration, [calibrationTarget]: { ...gps.coords, accuracy: gps.accuracy, savedAt: new Date().toISOString() } };
    setCalibration(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { setQrMessage("Could not save calibration in this browser."); return; }
    lastAutoRef.current = calibrationTarget;
    setAutoMatch(`${CHECKPOINTS[calibrationTarget].label} calibrated at current GPS position`);
    onCheckpoint(CHECKPOINTS[calibrationTarget].start, CHECKPOINTS[calibrationTarget].label);
    setQrMessage(`Saved this GPS position for ${CHECKPOINTS[calibrationTarget].label} on this device. Repeat on-site for each checkpoint.`);
  }

  function removeCalibration(code) {
    const next = { ...calibration };
    delete next[code];
    setCalibration(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    lastAutoRef.current = "";
    setAutoMatch("");
  }

  function stopCamera() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }

  async function startCamera() {
    setQrMessage("");
    if (!("BarcodeDetector" in window)) { setQrMessage("Live QR scanning is not supported in this browser. Enter the checkpoint code below instead."); return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      detectorRef.current = detector;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } });
      const scan = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length) { acceptCode(codes[0].rawValue); return; }
          }
        } catch { /* Keep scanning until a code is found. */ }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch { stopCamera(); setQrMessage("Camera access failed. Allow camera permission or enter the checkpoint code manually."); }
  }

  return <section className="location-checkpoints" aria-label="Live location and QR checkpoints">
    <div className="location-section-title"><span className="location-icon"><LocateFixed size={16}/></span><div><strong>Live location</strong><small>GPS outdoors · calibrated checkpoints · QR indoors</small></div><span className={`location-status ${gps.state === "active" ? "is-active" : ""}`}>{gps.state === "active" ? "LIVE" : "READY"}</span></div>
    <p className="location-description">GPS updates your position. Calibrate a checkpoint while physically standing there; afterwards the app can suggest that checkpoint when GPS gets close. QR scanning remains the reliable indoor confirmation method.</p>
    <div className="location-actions"><button type="button" className="location-action-primary" onClick={gps.state === "active" ? stopGps : startGps}><LocateFixed size={15}/>{gps.state === "active" ? "Pause GPS" : "Use my location"}</button><button type="button" className="location-action-secondary" onClick={scanning ? stopCamera : startCamera}>{scanning ? <CameraOff size={15}/> : <Camera size={15}/>}{scanning ? "Stop scan" : "Scan QR"}</button></div>
    {gps.message && <div className={`gps-feedback ${gps.state === "error" ? "is-error" : ""}`}><MapPin size={14}/><span>{gps.message}{gps.accuracy != null && <small>Accuracy ±{gps.accuracy} m · live updates</small>}</span></div>}
    {gps.state === "active" && gps.nearCampus && <div className="campus-confirm"><ShieldCheck size={14}/><span>Near the campus reference. GPS alone cannot identify the exact gate or indoor floor.</span></div>}
    {autoMatch && <div className="checkpoint-auto-match"><Crosshair size={15}/><span><strong>GPS checkpoint match</strong><small>{autoMatch}</small></span></div>}
    <div className="checkpoint-calibrator"><div className="checkpoint-calibrator-title"><Crosshair size={15}/><strong>Calibrate a real checkpoint</strong></div><p>Use this on-site, not from home. Save each checkpoint while standing at its actual location.</p><div className="checkpoint-calibrator-controls"><select value={calibrationTarget} onChange={e => setCalibrationTarget(e.target.value)} aria-label="Checkpoint to calibrate">{Object.entries(CHECKPOINTS).map(([code, point]) => <option value={code} key={code}>{point.label}</option>)}</select><button type="button" onClick={saveCalibration} disabled={gps.state !== "active" || !gps.coords}><Crosshair size={14}/>Save here</button></div>
      {Object.keys(calibration).length > 0 ? <div className="calibrated-list"><strong>Saved on this device ({Object.keys(calibration).length})</strong>{Object.entries(calibration).filter(([code]) => CHECKPOINTS[code]).map(([code, point]) => <div key={code}><span>{CHECKPOINTS[code].label}<small>GPS accuracy ±{point.accuracy ?? "?"} m</small></span><button type="button" onClick={() => removeCalibration(code)} aria-label={`Remove ${CHECKPOINTS[code].label} calibration`}><Trash2 size={13}/></button></div>)}</div> : <small className="calibration-empty">No real checkpoint coordinates saved yet.</small>}
    </div>
    {scanning && <div className="qr-camera-panel"><video ref={videoRef} muted playsInline/><p>Point your camera at a CampusAccess checkpoint QR.</p><button type="button" onClick={stopCamera}><X size={14}/> Close camera</button></div>}
    <form className="checkpoint-code-form" onSubmit={e => { e.preventDefault(); acceptCode(manualCode); }}><label htmlFor="checkpoint-code"><QrCode size={14}/> Checkpoint code</label><div><input id="checkpoint-code" value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. GTBIT:LAB_ENTRANCE" autoCapitalize="characters"/><button type="submit">Confirm</button></div></form>
    <div className="checkpoint-examples"><span>Demo codes:</span>{Object.entries(CHECKPOINTS).map(([code, point]) => <button type="button" key={code} onClick={() => acceptCode(code)} title={`Simulate scanning ${point.label}`}>{point.label}</button>)}</div>
    {qrMessage && <p className="checkpoint-message" role="status">{qrMessage}</p>}
    <p className="location-footnote">GPS calibrations are saved locally in this browser. Accuracy varies; automatic matching is only a prototype and can be wrong near close checkpoints. Coordinates and indoor locations must be surveyed on-site before deployment.</p>
  </section>;
}
