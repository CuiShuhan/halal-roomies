(function () {
  function client() {
    return window.HalalSupabase && HalalSupabase.getClient();
  }

  function randomAvatarSeed() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return "user-" + crypto.randomUUID();
    }
    return "user-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function avatarSeedFromUser(user) {
    if (!user) return "guest";
    var meta = user.user_metadata || {};
    return meta.avatar_seed || user.id || user.email || "guest";
  }

  function avatarUrlFromSeed(seed) {
    var s = String(seed || "guest").trim() || "guest";
    return "https://api.dicebear.com/9.x/adventurer/svg?seed=" + encodeURIComponent(s);
  }

  function avatarUrlFromUser(user) {
    return avatarUrlFromSeed(avatarSeedFromUser(user));
  }

  function ensureAvatarSeed(session) {
    if (!session || !session.user) return Promise.resolve(session);
    var user = session.user;
    var meta = user.user_metadata || {};
    if (meta.avatar_seed) return Promise.resolve(session);

    var c = client();
    if (!c) return Promise.resolve(session);

    var seed = randomAvatarSeed();
    return c.auth
      .updateUser({
        data: Object.assign({}, meta, { avatar_seed: seed }),
      })
      .then(function (res) {
        if (res.error) throw res.error;
        if (res.data && res.data.user) session.user = res.data.user;
        return session;
      })
      .catch(function () {
        return session;
      });
  }

  function signUp(email, password, name) {
    var c = client();
    if (!c) return Promise.reject(new Error("Supabase is not ready. Reload the page and try again."));
    return c.auth
      .signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name || "",
            avatar_seed: randomAvatarSeed(),
          },
        },
      })
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
  }

  function signIn(email, password) {
    var c = client();
    if (!c) return Promise.reject(new Error("Supabase is not ready. Reload the page and try again."));
    return c.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) throw res.error;
      var session = res.data && res.data.session;
      if (!session && res.data && res.data.user) {
        session = { user: res.data.user };
      }
      return ensureAvatarSeed(session).then(function () {
        return res.data;
      });
    });
  }

  function signOut() {
    var c = client();
    if (!c) return Promise.resolve();
    return c.auth.signOut();
  }

  function getSession() {
    var c = client();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (res) {
      if (res.error) throw res.error;
      var session = res.data.session;
      if (!session) return null;
      return ensureAvatarSeed(session);
    });
  }

  function loginRedirectUrl() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next");
    if (next && next.indexOf("login.html") === -1) return next;
    return "apartments.html";
  }

  function requireAuth() {
    var next = "login.html?next=" + encodeURIComponent(window.location.pathname + window.location.search);
    return getSession().then(function (session) {
      if (!session) {
        window.location.replace(next);
        return null;
      }
      return session;
    });
  }

  window.HalalAuth = {
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    ensureAvatarSeed: ensureAvatarSeed,
    avatarSeedFromUser: avatarSeedFromUser,
    avatarUrlFromUser: avatarUrlFromUser,
    avatarUrlFromSeed: avatarUrlFromSeed,
    requireAuth: requireAuth,
    loginRedirectUrl: loginRedirectUrl,
    onAuthStateChange: function (cb) {
      var c = client();
      if (!c || typeof cb !== "function") return function () {};
      var result = c.auth.onAuthStateChange(function (event, session) {
        cb(event, session);
      });
      return function () {
        if (result && result.data && result.data.subscription) {
          result.data.subscription.unsubscribe();
        }
      };
    },
  };
})();
