const base = "http://localhost:5000/api";
const form = document.querySelector("form");
const message = document.querySelector("#message");
const setMessage = (text, error = false) => { message.textContent = text; message.style.color = error ? "#a22" : "#246b45"; };
document.querySelector("#sendOtp").addEventListener("click", async () => {
  const phone = form.phone.value.trim();
  if (!/^[6-9]\d{9}$/.test(phone)) return setMessage("Enter a valid 10-digit mobile number.", true);
  try { const r = await fetch(`${base}/auth/send-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone}) }); const d = await r.json(); if (!r.ok) throw new Error(d.message); form.otp.value = d.otp; setMessage(`OTP sent. Demo OTP: ${d.otp}`); } catch (e) { setMessage(e.message || "Could not reach the API.", true); }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault(); const values = Object.fromEntries(new FormData(form));
  try { const r = await fetch(`${base}/auth/verify-otp`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,role:values.role || "FARMER"})}); const d=await r.json(); if(!r.ok) throw new Error(d.message); localStorage.setItem("nexhaatToken",d.token); localStorage.setItem("nexhaatUser",JSON.stringify(d.user)); location.href=d.user.role === "BUYER" ? "buyer-requirements.html" : "dashboard.html"; } catch(e) { setMessage(e.message || "Could not sign in.",true); }
});
