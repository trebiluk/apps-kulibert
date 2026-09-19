/* User origin pin. Alias hosts bounce to the school door only when it answers.
   Never touch TechWorks or tw.kulibert.net deployments from this project. */
(function () {
  var ORIGIN = "https://apps.kulibert.net/coderized";
  try {
    if (location.protocol === "file:") return;
    var host = location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host === "apps.kulibert.net") return;
    if (host === "coderized.kulibert.net") return;
    var alias = /pages\.dev$/.test(host) || /\.github\.io$/.test(host);
    if (!alias) return;
    fetch(ORIGIN + "/manifest.json", { cache: "no-store", mode: "cors" })
      .then(function (r) { if (r && r.ok) location.replace(ORIGIN + "/"); })
      .catch(function () {});
  } catch (e) {}
})();
