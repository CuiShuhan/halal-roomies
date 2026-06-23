(function () {
  if (!window.HALAL_SUPABASE_CONFIG || !window.HALAL_SUPABASE_CONFIG.url || !window.HALAL_SUPABASE_CONFIG.anonKey) {
    window.HALAL_SUPABASE_CONFIG = {
      url: "https://joecgybyakaylyprlzpi.supabase.co",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZWNneWJ5YWtheWx5cHJsenBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjkwNDAsImV4cCI6MjA5NjYwNTA0MH0.Iv1ty8s4FVV5TeOxOAkan5aNG9-B-NNC6inrrPuB9es",
    };
  }

  if (window.HalalSupabase) return;

  function getConfig() {
    var c = window.HALAL_SUPABASE_CONFIG;
    if (!c || !c.url || !c.anonKey) return null;
    if (c.anonKey === "YOUR_ANON_PUBLIC_KEY") return null;
    return c;
  }

  function getClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    var cfg = getConfig();
    if (!cfg) return null;
    if (!window._halalSupabaseClient) {
      window._halalSupabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return window._halalSupabaseClient;
  }

  window.HalalSupabase = {
    BUCKET: "listing-photos",
    isConfigured: function () {
      return !!getConfig();
    },
    isReady: function () {
      return !!getClient();
    },
    getClient: getClient,
  };
})();
