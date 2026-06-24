(function () {
  var STORAGE_KEY = "halalRoomies:userReferrals";

  function escapeHtml(text) {
    if (text == null || text === "") return "";
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  function readAllLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeAllLocal(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function readAll() {
    return readAllLocal();
  }

  function newReferralId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return "r-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function displayContact(value) {
    var v = String(value || "").trim();
    return v || "Not available";
  }

  function avatarUrl(seed) {
    var s = String(seed || "referral").trim() || "referral";
    return "https://api.dicebear.com/9.x/adventurer/svg?seed=" + encodeURIComponent(s);
  }

  function referralFromFormData(fd, options) {
    options = options || {};
    var name = String(fd.get("name") || "").trim();
    var id = newReferralId();
    return {
      id: id,
      name: name,
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      note: String(fd.get("note") || "").trim(),
      apartmentName: String(fd.get("apartment_name") || "").trim(),
      apartmentLocation: String(fd.get("apartment_location") || "").trim(),
      avatarSeed: options.avatarSeed || name || id,
      createdAt: new Date().toISOString(),
    };
  }

  function appendReferralLocal(referral) {
    var all = readAllLocal();
    all.unshift(referral);
    writeAllLocal(all);
    return referral;
  }

  function appendReferral(referral) {
    return appendReferralLocal(referral);
  }

  function cardMarkup(R) {
    var noteHtml = "";
    if (R.note) {
      noteHtml =
        '<p class="card__price card__price--note">Note: ' + escapeHtml(R.note) + "</p>";
    }
    return (
      '<article class="card roommate-card referral-card">' +
      '<img class="avatar" src="' +
      escapeHtml(avatarUrl(R.avatarSeed)) +
      '" alt="" />' +
      '<h3 class="card__title">' +
      escapeHtml(R.name || "Member") +
      "</h3>" +
      '<p class="card__meta">' +
      escapeHtml(R.apartmentLocation || "Location TBD") +
      "</p>" +
      noteHtml +
      '<div class="card__tags" style="justify-content: center">' +
      '<span class="tag tag--neutral">Phone: ' +
      escapeHtml(displayContact(R.phone)) +
      "</span>" +
      "</div>" +
      '<span class="btn btn--outline" style="margin-top: 0.75rem">' +
      escapeHtml(R.apartmentName || "Apartment") +
      "</span>" +
      '<p class="card__meta" style="margin-top: 0.5rem">Email: ' +
      escapeHtml(displayContact(R.email)) +
      "</p>" +
      "</article>"
    );
  }

  window.HalalRoomiesReferrals = {
    STORAGE_KEY: STORAGE_KEY,
    readAll: readAll,
    readAllLocal: readAllLocal,
    appendReferral: appendReferral,
    appendReferralLocal: appendReferralLocal,
    referralFromFormData: referralFromFormData,
    cardMarkup: cardMarkup,
    escapeHtml: escapeHtml,
    avatarUrl: avatarUrl,
    displayContact: displayContact,
    isRemoteEnabled: function () {
      return false;
    },
  };
})();
