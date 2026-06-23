(function () {
  function guestMarkup() {
    return (
      '<a class="btn btn--outline" href="signup.html">Sign Up</a>' +
      '<a class="btn btn--primary" href="login.html">Log In</a>'
    );
  }

  function avatarUrlForUser(user) {
    if (window.HalalAuth && HalalAuth.avatarUrlFromUser) {
      return HalalAuth.avatarUrlFromUser(user);
    }
    var meta = (user && user.user_metadata) || {};
    var seed = meta.avatar_seed || (user && user.id) || (user && user.email) || "guest";
    return (
      "https://api.dicebear.com/9.x/adventurer/svg?seed=" + encodeURIComponent(String(seed))
    );
  }

  function userMarkup(user) {
    var email = (user && user.email) || "Account";
    var avatarUrl = avatarUrlForUser(user);
    return (
      '<span class="header-actions__user" title="' +
      email.replace(/"/g, "&quot;") +
      '">' +
      '<img class="header-actions__avatar" src="' +
      avatarUrl.replace(/"/g, "&quot;") +
      '" alt="' +
      email.replace(/"/g, "&quot;") +
      '" width="34" height="34" decoding="async" />' +
      "</span>" +
      '<button type="button" class="btn btn--outline" id="header-log-out">Log Out</button>'
    );
  }

  function renderSession(session) {
    if (!session || !session.user) {
      render(null);
      return Promise.resolve();
    }
    if (!window.HalalAuth || !HalalAuth.ensureAvatarSeed) {
      render(session);
      return Promise.resolve();
    }
    return HalalAuth.ensureAvatarSeed(session)
      .then(render)
      .catch(function () {
        render(session);
      });
  }

  function render(session) {
    var el = document.querySelector(".header-actions");
    if (!el) return;
    if (session && session.user) {
      el.innerHTML = userMarkup(session.user);
      var btn = document.getElementById("header-log-out");
      if (btn && window.HalalAuth) {
        btn.addEventListener("click", function () {
          HalalAuth.signOut().then(function () {
            window.location.href = "index.html";
          });
        });
      }
    } else {
      el.innerHTML = guestMarkup();
    }
  }

  function init() {
    if (!window.HalalAuth) {
      return;
    }
    HalalAuth.getSession()
      .then(renderSession)
      .catch(function () {
        render(null);
      });
    HalalAuth.onAuthStateChange(function (_event, session) {
      renderSession(session);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
