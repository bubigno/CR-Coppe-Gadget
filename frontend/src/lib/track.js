import axios from "axios";

const sid = (() => {
  try {
    let s = localStorage.getItem("cg_sid");
    if (!s) {
      s = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
      localStorage.setItem("cg_sid", s);
    }
    return s;
  } catch (e) {
    return "";
  }
})();

let firstReferrer = "";
try {
  if (!sessionStorage.getItem("cg_ref")) {
    sessionStorage.setItem("cg_ref", document.referrer || "");
  }
  firstReferrer = sessionStorage.getItem("cg_ref") || "";
} catch (e) {
  firstReferrer = "";
}

export function track(event, path, label = "", extra = {}) {
  axios
    .post(`${process.env.REACT_APP_BACKEND_URL}/api/track`, {
      event,
      path,
      label,
      referrer: firstReferrer,
      session_id: sid,
      ...extra,
    })
    .catch(() => {});
}

export const trackClick = (label, extra = {}) =>
  track("click", "/cta", label, extra);