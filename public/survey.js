// Keep this logic in a same-origin file so the site can enforce a strict
// script-src policy without allowing arbitrary inline JavaScript.
const params = new URLSearchParams(window.location.search);
const email = params.get("email") || "";
const container = document.getElementById("survey-content");

// The legacy link carries an email query. Keep it long enough to populate the
// form, then remove it from the visible/current history entry. The page-level
// no-referrer policy also prevents it reaching same-origin asset/API logs.
if (email) window.history.replaceState(null, "", window.location.pathname);

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

if (!email) {
  container.innerHTML = `
    <div class="no-email">
      <h1>Survey Link Invalid</h1>
      <p>This survey requires a valid email parameter in the URL.</p>
      <p><a href="/">← Back to PitchNest</a></p>
    </div>
  `;
} else {
  container.innerHTML = `
    <h1>Quick Survey</h1>
    <p class="subtitle">Help us build the perfect AI pitch simulation for you. Takes 30 seconds.</p>

    <form id="survey-form">
      <div class="form-group">
        <p class="field-label">Your Email</p>
        <div class="email-display">${escapeHtml(email)}</div>
      </div>

      <div class="form-group">
        <label for="pitch_type">What type of pitch are you preparing for?</label>
        <select id="pitch_type" name="pitch_type" required>
          <option value="" disabled selected>Select one…</option>
          <option value="pre-seed">Pre-Seed Round</option>
          <option value="seed">Seed Round</option>
          <option value="series-a">Series A</option>
          <option value="series-b+">Series B+</option>
          <option value="competition">Pitch Competition</option>
          <option value="accelerator">Accelerator / Incubator</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="frustration">
          What's your biggest frustration with pitch prep?
          <span class="label-hint">(optional)</span>
        </label>
        <textarea id="frustration" name="frustration" placeholder="e.g. I never know if my deck is good enough…" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label for="next_pitch">When is your next pitch?</label>
        <select id="next_pitch" name="next_pitch" required>
          <option value="" disabled selected>Select one…</option>
          <option value="this-week">This week</option>
          <option value="this-month">This month</option>
          <option value="1-3-months">1–3 months</option>
          <option value="3-6-months">3–6 months</option>
          <option value="no-plans">No plans yet</option>
        </select>
      </div>

      <button type="submit" class="btn" id="submit-btn">Submit Survey</button>
      <div id="status-msg" class="status" role="status" aria-live="polite"></div>
    </form>
  `;

  document.getElementById("survey-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = document.getElementById("submit-btn");
    const status = document.getElementById("status-msg");
    const pitchType = document.getElementById("pitch_type").value;
    const frustration = document.getElementById("frustration").value.trim();
    const nextPitch = document.getElementById("next_pitch").value;

    if (!pitchType || !nextPitch) {
      status.className = "status error";
      status.textContent = "⚠ Please fill in the required fields.";
      return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Submitting…';
    status.className = "status";
    status.style.display = "none";

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          pitch_type: pitchType,
          frustration,
          next_pitch: nextPitch,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Server error");

      status.className = "status success";
      status.textContent = "✅ Thank you! Your response has been recorded.";
      button.textContent = "Submitted ✓";
      document.querySelectorAll("select, textarea").forEach((field) => {
        field.disabled = true;
      });
    } catch (error) {
      console.error("Survey submission error:", error);
      status.className = "status error";
      status.textContent = `❌ ${error instanceof Error ? error.message : "Something went wrong. Please try again."}`;
      button.disabled = false;
      button.textContent = "Submit Survey";
    }
  });
}
