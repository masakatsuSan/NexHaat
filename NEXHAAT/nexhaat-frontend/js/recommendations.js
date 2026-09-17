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

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&", "<": "<", ">": ">", "'": "&#039;", '"': """ })[char]);

const formatMoney = (value) => "₹" + Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const lotSelect = document.querySelector("#lotSelect");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const lotIdInput = document.querySelector("#lotId");
const lotMessage = document.querySelector("#lotMessage");
const resultsCard = document.querySelector("#resultsCard");
const resultsTitle = document.querySelector("#resultsTitle");
const advisory = document.querySelector("#advisory");
const resultsTableBody = document.querySelector("#resultsTable tbody");
const priceSource = document.querySelector("#priceSource");
const recommendBtn = document.querySelector("#recommendBtn");
const useProfileBtn = document.querySelector("#useProfileLocation");
const signOutBtn = document.querySelector("#signOut");

let userProfile = null;
let farmerLots = [];

const loadProfileAndLots = async () => {
  try {
    const [me, lotsData] = await Promise.all([
      request("/auth/me"),
      request("/farmer/lots/my-lots")
    ]);
    userProfile = me.user;
    farmerLots = lotsData.lots || [];

    if (userProfile.latitude && userProfile.longitude) {
      latitudeInput.value = userProfile.latitude;
      longitudeInput.value = userProfile.longitude;
    }

    if (farmerLots.length === 0) {
      lotSelect.innerHTML = '<option value="">No lots found. Create one first.</option>';
      lotMessage.textContent = "You have no active lots. Please create a lot in the dashboard first.";
      lotMessage.style.color = "#a22";
      recommendBtn.disabled = true;
      return;
    }

    lotSelect.innerHTML = '<option value="">Select a lot…</option>' + farmerLots.map(lot =>
      `<option value="${escapeHtml(lot._id)}" data-lat="${escapeHtml(lot.latitude || '')}" data-lon="${escapeHtml(lot.longitude || '')}">
        ${escapeHtml(lot.commodity)} · ${escapeHtml(lot.quantity_quintals)} q · ${escapeHtml(lot.quality_grade)}
      </option>`
    ).join("");

  } catch (error) {
    lotMessage.textContent = error.message;
    lotMessage.style.color = "#a22";
  }
};

lotSelect.addEventListener("change", () => {
  const option = lotSelect.selectedOptions[0];
  if (!option.value) {
    lotIdInput.value = "";
    return;
  }
  lotIdInput.value = option.value;
  if (option.dataset.lat) latitudeInput.value = option.dataset.lat;
  if (option.dataset.lon) longitudeInput.value = option.dataset.lon;
  lotMessage.textContent = "";
});

useProfileBtn.addEventListener("click", () => {
  if (userProfile?.latitude && userProfile?.longitude) {
    latitudeInput.value = userProfile.latitude;
    longitudeInput.value = userProfile.longitude;
    lotMessage.textContent = "Profile location applied.";
    lotMessage.style.color = "#246b45";
  } else {
    lotMessage.textContent = "No location saved in profile.";
    lotMessage.style.color = "#a22";
  }
});

document.querySelector("#lotSelectForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  lotMessage.textContent = "";
  resultsCard.classList.add("hidden");

  const lotId = lotIdInput.value;
  const latitude = Number(latitudeInput.value);
  const longitude = Number(longitudeInput.value);

  if (!lotId) return lotMessage.textContent = "Please select a lot.";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return lotMessage.textContent = "Please enter valid latitude and longitude.";

  recommendBtn.disabled = true;
  recommendBtn.textContent = "Loading…";

  try {
    const data = await request("/recommend", {
      method: "POST",
      body: JSON.stringify({ lot_id: lotId, latitude, longitude, max_distance_km: 200 })
    });

    resultsCard.classList.remove("hidden");
    const lot = farmerLots.find(l => l._id === lotId);
    resultsTitle.textContent = `${escapeHtml(lot?.commodity || "Produce")} · ${escapeHtml(lot?.quantity_quintals)} quintals`;

    advisory.textContent = data.smart_advisory;
    advisory.style.color = data.all_options[0]?.is_viable ? "#246b45" : "#a22";

    resultsTableBody.innerHTML = data.all_options.map(opt => `
      <tr class="${opt.is_viable ? "" : "not-viable"}">
        <td>${escapeHtml(opt.mandi_name)}</td>
        <td>${escapeHtml(opt.district)}</td>
        <td>₹${Number(opt.modal_price_per_quintal).toLocaleString()}</td>
        <td>${Number(opt.distance_km).toFixed(2)}</td>
        <td>${formatMoney(opt.gross_earnings)}</td>
        <td>${formatMoney(opt.transport_cost)}</td>
        <td class="net" style="font-weight:700;color:${opt.net_profit >= 0 ? "#246b45" : "#a22"}">${formatMoney(opt.net_profit)}</td>
        <td>${opt.is_viable ? '<span style="color:#246b45;font-weight:600">✓ Yes</span>' : '<span style="color:#a22;font-weight:600">✗ No</span>'}</td>
      </tr>
    `).join("");

    priceSource.textContent = `Source: ${data.price_source} · Live matches: ${data.live_price_matches} · Transport rate: ₹${data.transport_rate_per_km}/km`;

    lotMessage.textContent = "Recommendations loaded successfully.";
    lotMessage.style.color = "#246b45";

  } catch (error) {
    lotMessage.textContent = error.message;
    lotMessage.style.color = "#a22";
  } finally {
    recommendBtn.disabled = false;
    recommendBtn.textContent = "Get Recommendations";
  }
});

signOutBtn.onclick = () => {
  localStorage.removeItem("nexhaatToken");
  localStorage.removeItem("nexhaatUser");
  location.href = "index.html";
};

loadProfileAndLots();