(function () {
  if (!window.HalalRoomiesReferrals || !window.HalalSupabase) return;

  var core = window.HalalRoomiesReferrals;

  function rowToReferral(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      note: row.note || "",
      apartmentName: row.apartment_name || "",
      apartmentLocation: row.apartment_location || "",
      avatarSeed: row.avatar_seed || row.name || row.id,
      createdAt: row.created_at || "",
    };
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
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (result) {
        if (result.error) throw result.error;
        return (result.data || []).map(rowToReferral);
      });
  }

  function saveReferralAsync(fd) {
    var client = HalalSupabase.getClient();
    if (!client) {
      if (HalalSupabase.isConfigured()) {
        return Promise.reject(
          new Error(
            "Supabase is configured but the client did not start. Reload the page and check the browser console."
          )
        );
      }
      var draft = core.referralFromFormData(fd);
      core.appendReferralLocal(draft);
      return Promise.resolve(draft);
    }

    return HalalAuth.getSession().then(function (session) {
      if (!session || !session.user) {
        throw new Error("Please log in to post a referral.");
      }
      var userId = session.user.id;
      var avatarSeed = HalalAuth.avatarSeedFromUser(session.user);
      var draft = core.referralFromFormData(fd, { avatarSeed: avatarSeed });
      var row = {
        id: draft.id,
        user_id: userId,
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        note: draft.note,
        apartment_name: draft.apartmentName,
        apartment_location: draft.apartmentLocation,
        avatar_seed: avatarSeed,
      };
      return client.from("referrals").insert(row).select().single();
    }).then(function (result) {
      if (result.error) throw result.error;
      return rowToReferral(result.data);
    });
  }

  core.isRemoteEnabled = function () {
    return HalalSupabase.isReady();
  };

  core.readAllAsync = readAllAsync;
  core.saveReferralAsync = saveReferralAsync;
  core.rowToReferral = rowToReferral;
})();
