(function () {
  if (!window.HalalRoomiesListings || !window.HalalSupabase) return;

  var core = window.HalalRoomiesListings;
  var BUCKET = HalalSupabase.BUCKET;

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    var mimeMatch = parts[0].match(/:(.*?);/);
    var mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    var bstr = atob(parts[1]);
    var n = bstr.length;
    var u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  function rowToListing(row) {
    if (!row) return null;
    var images = Array.isArray(row.image_urls) ? row.image_urls : [];
    var seed = row.landlord_avatar_seed || row.landlord || row.lemail || row.id;
    var start = row.start_date ? String(row.start_date).slice(0, 10) : "";
    return {
      id: row.id,
      title: row.title,
      location: row.location || "",
      type: row.type || "Apartment",
      beds: row.beds || "1",
      baths: row.baths || "1",
      rent: row.rent != null ? Number(row.rent) : null,
      start: start,
      furn: row.furn === "no" ? "no" : "yes",
      lease: row.lease || "12 months",
      landlord: row.landlord || "",
      lemail: row.lemail || "",
      phone: row.phone || "",
      images: images,
      imageUrl: images[0] || core.pickImageFallback(row.title || row.id),
      landlordAvatarUrl: core.landlordAvatarUrl(seed),
      createdAt: row.created_at || "",
    };
  }

  function uploadImages(client, listingId, dataUrls) {
    if (!dataUrls.length) return Promise.resolve([]);
    return Promise.all(
      dataUrls.map(function (dataUrl, index) {
        var path = listingId + "/" + index + ".jpg";
        var blob = dataUrlToBlob(dataUrl);
        return client.storage
          .from(BUCKET)
          .upload(path, blob, { upsert: true, contentType: "image/jpeg" })
          .then(function (result) {
            if (result.error) throw result.error;
            return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          });
      })
    );
  }

  function readAllAsync() {
    var client = HalalSupabase.getClient();
    if (!client) {
      if (HalalSupabase.isConfigured()) {
        return Promise.reject(
          new Error("Supabase is configured but the client did not start.")
        );
      }
      return Promise.resolve(core.readAllLocal());
    }
    return client
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (result) {
        if (result.error) throw result.error;
        return (result.data || []).map(rowToListing);
      });
  }

  function getByIdAsync(id) {
    var client = HalalSupabase.getClient();
    if (!client) {
      if (HalalSupabase.isConfigured()) {
        return Promise.reject(
          new Error("Supabase is configured but the client did not start.")
        );
      }
      return Promise.resolve(core.getByIdLocal(id));
    }
    return client
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(function (result) {
        if (result.error) throw result.error;
        return rowToListing(result.data);
      });
  }

  function saveListingAsync(fd, options) {
    options = options || {};
    var client = HalalSupabase.getClient();
    var draft = core.listingFromFormData(fd, { images: options.images || [] });
    if (!client) {
      if (HalalSupabase.isConfigured()) {
        return Promise.reject(
          new Error(
            "Supabase is configured but the client did not start. Reload the page and check the browser console for script errors."
          )
        );
      }
      core.appendListingLocal(draft);
      return Promise.resolve(draft);
    }

    var listingId = draft.id;
    var imageDataUrls = Array.isArray(options.images) ? options.images : [];
    var avatarSeed = draft.landlord || (draft.lemail || "").split("@")[0] || listingId;

    return uploadImages(client, listingId, imageDataUrls)
      .then(function (publicUrls) {
        var row = {
          id: listingId,
          title: draft.title,
          location: draft.location,
          type: draft.type,
          beds: draft.beds,
          baths: draft.baths,
          rent: draft.rent,
          start_date: draft.start || null,
          furn: draft.furn,
          lease: draft.lease,
          landlord: draft.landlord,
          lemail: draft.lemail,
          phone: draft.phone,
          image_urls: publicUrls,
          landlord_avatar_seed: avatarSeed,
        };
        return client.from("listings").insert(row).select().single();
      })
      .then(function (result) {
        if (result.error) throw result.error;
        return rowToListing(result.data);
      });
  }

  core.isRemoteEnabled = function () {
    return HalalSupabase.isReady();
  };

  core.readAllAsync = readAllAsync;
  core.getByIdAsync = getByIdAsync;
  core.saveListingAsync = saveListingAsync;
  core.rowToListing = rowToListing;
})();
