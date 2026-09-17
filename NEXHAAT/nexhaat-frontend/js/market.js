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

document.querySelector("#priceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const crop = document.querySelector("#priceCrop").value.trim();
  const state = document.querySelector("#priceState").value.trim();
  const district = document.querySelector("#priceDistrict").value.trim();
  const source = document.querySelector("#priceSource");
  const list = document.querySelector("#priceList");
  source.textContent = "Loading mandi prices…";
  list.innerHTML = "";
  try {
    const params = new URLSearchParams({ crop });
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    const data = await request(`/market/prices?${params.toString()}`);
    source.textContent = `${data.source}${data.is_live ? " — live" : " — cached"}${data.notice ? ` (${data.notice})` : ""}`;
    const records = data.records || data.comparison || [];
    if (!records.length) {
      list.innerHTML = "<p>No mandi prices found for this crop.</p>";
      return;
    }
    list.innerHTML = records.map((row) => `<article><h3>${escapeHtml(row.mandi_name)}</h3><small>${escapeHtml(row.district)}, ${escapeHtml(row.state || "")} · Modal ₹${escapeHtml(row.modal_price_per_quintal)}/quintal${row.min_price_per_quintal ? ` · Range ₹${escapeHtml(row.min_price_per_quintal)}–₹${escapeHtml(row.max_price_per_quintal)}` : ""}${row.price_date ? ` · ${escapeHtml(row.price_date)}` : ""}</small></article>`).join("");
  } catch (error) {
    source.textContent = error.message;
    list.innerHTML = "";
  }
});

document.querySelector("#signOut").onclick = () => {
  localStorage.removeItem("nexhaatToken");
  location.href = "index.html";
};