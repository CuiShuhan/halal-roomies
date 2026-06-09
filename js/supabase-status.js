(function () {
  function hasConfig() {
    var c = window.HALAL_SUPABASE_CONFIG;
    return !!(c && c.url && c.anonKey && c.anonKey !== "YOUR_ANON_PUBLIC_KEY");
  }

  function paint(el, text, bg, color) {
    el.textContent = text;
    el.style.display = "block";
    el.style.background = bg;
    el.style.color = color;
  }

  function refresh() {
    var el = document.getElementById("supabase-status");
    if (!el) return;

    var cfg = hasConfig();
    var booted = !!(window.HalalSupabase && HalalSupabase.isConfigured());
    var sdk = !!(window.supabase && typeof window.supabase.createClient === "function");
    var ready = !!(window.HalalSupabase && HalalSupabase.isReady());

    if (ready) {
      paint(el, "Connected to Supabase — listings save to the cloud.", "#d1e7dd", "#0f5132");
      return;
    }
    if (cfg && !booted) {
      paint(
        el,
        "Supabase key is set but js/supabase-boot.js did not load. Check the Network tab for 404 errors.",
        "#f8d7da",
        "#842029"
      );
      return;
    }
    if (cfg && !sdk) {
      paint(
        el,
        "Supabase key is set but the SDK did not load from the internet. Check your network or ad blocker.",
        "#f8d7da",
        "#842029"
      );
      return;
    }
    if (cfg) {
      paint(
        el,
        "Supabase key is set but the client did not start. Open the browser console (F12) for errors.",
        "#f8d7da",
        "#842029"
      );
      return;
    }
    paint(
      el,
      "No Supabase config — listings only save in this browser (localStorage), not in the database.",
      "#fff3cd",
      "#664d03"
    );
  }

  window.HalalSupabaseStatus = { refresh: refresh };
  window.addEventListener("load", refresh);
  refresh();
})();
