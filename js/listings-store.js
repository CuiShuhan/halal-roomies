(function () {
  var STORAGE_KEY = "halalRoomies:userListings";

  var PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
  ];

  function hashToIndex(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h) % PLACEHOLDER_IMAGES.length;
  }

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

  function pickImageFallback(seed) {
    return PLACEHOLDER_IMAGES[hashToIndex(String(seed || "x"))];
  }

  function readAll() {
    return readAllLocal();
  }

  var MAX_PROPERTY_PHOTOS = 8;

  function landlordAvatarUrl(seed) {
    var s = String(seed || "landlord").trim() || "landlord";
    return "https://api.dicebear.com/9.x/adventurer/svg?seed=" + encodeURIComponent(s);
  }

  function compressImageFile(file, maxDim) {
    maxDim = maxDim || 1200;
    return new Promise(function (resolve, reject) {
      if (!file || !String(file.type || "").match(/^image\//)) {
        reject(new Error("Not an image"));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = function () {
          reject(new Error("Could not load image"));
        };
        img.src = reader.result;
      };
      reader.onerror = function () {
        reject(new Error("Could not read file"));
      };
      reader.readAsDataURL(file);
    });
  }

  function primaryImageUrl(listing) {
    if (listing.images && listing.images.length) return listing.images[0];
    return listing.imageUrl || pickImageFallback(listing.title || listing.id);
  }

  function newListingId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function listingFromFormData(fd, options) {
    options = options || {};
    var rentRaw = fd.get("rent");
    var rentNum = rentRaw === "" || rentRaw == null ? null : Number(rentRaw);
    if (rentNum !== null && (isNaN(rentNum) || rentNum < 0)) rentNum = null;
    var title = String(fd.get("title") || "").trim();
    var landlord = String(fd.get("landlord") || "").trim();
    var lemail = String(fd.get("lemail") || "").trim();
    var id = newListingId();
    var images = Array.isArray(options.images) ? options.images.slice(0, MAX_PROPERTY_PHOTOS) : [];
    var fallback = pickImageFallback(title || String(fd.get("location") || "x"));
    var avatarSeed = landlord || lemail.split("@")[0] || id;
    return {
      id: id,
      title: title,
      location: String(fd.get("location") || "").trim(),
      type: String(fd.get("type") || "Apartment"),
      beds: String(fd.get("beds") || "1"),
      baths: String(fd.get("baths") || "1"),
      rent: rentNum,
      start: fd.get("start") || "",
      furn: fd.get("furn") === "no" ? "no" : "yes",
      lease: String(fd.get("lease") || "12 months"),
      entireRent: fd.get("entire_rent") === "no" ? "no" : "yes",
      roommateGender: String(fd.get("roommate_gender") || "any"),
      landlord: landlord,
      lemail: lemail,
      phone: String(fd.get("phone") || "").trim(),
      images: images,
      imageUrl: images.length ? images[0] : fallback,
      landlordAvatarUrl: landlordAvatarUrl(avatarSeed),
      createdAt: new Date().toISOString(),
    };
  }

  function appendListingLocal(listing) {
    var all = readAllLocal();
    all.push(listing);
    writeAllLocal(all);
    return listing;
  }

  function appendListing(listing) {
    return appendListingLocal(listing);
  }

  function getByIdLocal(id) {
    if (!id) return null;
    return readAllLocal().find(function (x) {
      return x.id === id;
    }) || null;
  }

  function getById(id) {
    return getByIdLocal(id);
  }

  function tagSummary(L) {
    var beds = String(L.beds || "1");
    var baths = String(L.baths || "1");
    var typeLower = String(L.type || "").toLowerCase();
    var bathPhrase = baths + (baths === "1" ? " bath" : " baths");
    if (typeLower === "studio") return "Studio · " + bathPhrase;
    var bedPhrase = beds + (beds === "1" ? " bed" : " beds");
    return bedPhrase + " · " + bathPhrase;
  }

  function formatRent(L) {
    if (L.rent != null && L.rent !== "" && !isNaN(L.rent)) {
      return (
        "$" +
        Number(L.rent).toLocaleString(undefined, { maximumFractionDigits: 0 }) +
        " / month"
      );
    }
    return "Rent TBD";
  }

  function cardMarkup(L) {
    var href = "apartment-detail.html?id=" + encodeURIComponent(L.id);
    var loc = escapeHtml(L.location || "Location TBD");
    return (
      '<article class="card">' +
      '<div style="position: relative">' +
      '<img class="card__media" src="' +
      escapeHtml(primaryImageUrl(L)) +
      '" alt="" />' +
      '<button type="button" class="icon-btn" style="position: absolute; top: 0.65rem; right: 0.65rem" aria-label="Save">♡</button>' +
      "</div>" +
      '<div class="card__body">' +
      '<h2 class="card__title">' +
      escapeHtml(L.title || "Untitled") +
      "</h2>" +
      '<p class="card__meta">📍 ' +
      loc +
      "</p>" +
      '<p class="card__price">' +
      escapeHtml(formatRent(L)) +
      "</p>" +
      '<div class="card__tags"><span class="tag tag--neutral">' +
      escapeHtml(tagSummary(L)) +
      '</span></div>' +
      '<a class="btn btn--primary btn--block" href="' +
      href +
      '" style="margin-top: 0.75rem">View detail</a>' +
      "</div></article>"
    );
  }

  window.HalalRoomiesListings = {
    STORAGE_KEY: STORAGE_KEY,
    MAX_PROPERTY_PHOTOS: MAX_PROPERTY_PHOTOS,
    readAll: readAll,
    readAllLocal: readAllLocal,
    appendListing: appendListing,
    appendListingLocal: appendListingLocal,
    listingFromFormData: listingFromFormData,
    getById: getById,
    getByIdLocal: getByIdLocal,
    formatRent: formatRent,
    tagSummary: tagSummary,
    cardMarkup: cardMarkup,
    escapeHtml: escapeHtml,
    compressImageFile: compressImageFile,
    landlordAvatarUrl: landlordAvatarUrl,
    primaryImageUrl: primaryImageUrl,
    pickImageFallback: pickImageFallback,
    isRemoteEnabled: function () {
      return false;
    },
  };
})();
