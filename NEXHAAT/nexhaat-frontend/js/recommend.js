const base = "http://localhost:5000/api";
const token = localStorage.getItem("nexhaatToken");
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
if (!token) location.href = "login.html";

const request = async (path, options = {}) => {
  const response = await fetch(base + path, { ...options, headers: { ...headers, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&":"&", "<":"<", ">":">", "'":"&#039;", '"':""" })[char]);

async function loadLots() {
  try {
    const data = await request("/farmer/lots/my-lots");
    const select = document.querySelector("#recLot");
    if (!data.lots.length) {
      select.innerHTML = "<option value=''>No lots posted yet</option>";
      return;
    }
    select.innerHTML = data.lots.map(lot => `<option value="${escapeHtml(lot.id)}">${escapeHtml(lot.crop)} — ${escapeHtml(lot.quantity)} q ${escapeHtml(lot.quality)} @ ${escapeHtml(lot.location)}</option>`).join("");
  } catch (e) {
    document.querySelector("#recMsg").textContent = e.message;
  }
}

document.querySelector("#recForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const msg = document.querySelector("#recMsg");
  const result = document.querySelector("#recResult");
  const summary = document.querySelector("#recSummary");
  const options = document.querySelector("#recOptions");
  msg.textContent = "";
  result.hidden = true;
  summary.innerHTML = "";
  options.innerHTML = "";
  const lot_id = document.querySelector("#recLot").value;
  const latitude = Number(document.querySelector("#recLat").value);
  const longitude = Number(document.querySelector("#recLon").value);
  const max_distance_km = Number(document.querySelector("#recDist").value);
  if (!lot_id) return msg.textContent = "Please select a lot.";
  try {
    const data = await request("/recommend", { method: "POST", body: JSON.stringify({ lot_id, latitude, longitude, max_distance_km }) });
    result.hidden = false;
    summary.innerHTML = `<h3>${escapeHtml(data.listing.crop)} — ${escapeHtml(data.listing.quantity_quintals)} quintals</h3><p><strong>Best:</strong> ${escapeHtml(data.best_mandi)} · Net ₹${escapeHtml(data.net_profit_at_best_mandi)} · ${escapeHtml(data.price_source)}</p><p class="hint">${escapeHtml(data.smart_advisory)}</p>`;
    if (!data.all_options.length) {
      options.innerHTML = "<p>No viable mandis found within range.</p>";
      return;
    }
    options.innerHTML = data.all_options.map(opt => `<article><h4>${escapeHtml(opt.mandi_name)}, ${escapeHtml(opt.district)}</h4><small>Modal ₹${escapeHtml(opt.modal_price_per_quintal)}/q · ${escapeHtml(opt.distance_km)} km · Gross ₹${escapeHtml(opt.gross_earnings)} · Transport ₹${escapeHtml(opt.transport_cost)} · <strong>Net ₹${escapeHtml(opt.net_profit)}</strong> ${opt.is_viable ? "✓ Viable" : "✗ Not viable"}</small></article>`).join("");
  } catch (error) {
    msg.textContent = error.message;
  }
});

document.querySelector("#signOut").onclick = () => {
  localStorage.removeItem("nexhaatToken");
  location.href = "index.html";
};

loadLots();