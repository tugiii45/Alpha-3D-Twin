/* Floodsight pages on the county desk: unified 3D twin, and a full-page ward map. */
(function () {
  const WARDS = [
    { id: "cbd", name: "Nairobi CBD", ward: "Starehe", risk: "HIGH", mm: 150, lat: -1.2833, lng: 36.8219, avoid: "Kimathi Street", note: "150mm in 48 hours from Tuesday 10 Nov 2026, 7:30pm. Businesses move exposed assets. Residents avoid Kimathi Street." },
    { id: "mathare", name: "Mathare", ward: "Mathare", risk: "HIGH", mm: 120, lat: -1.2614, lng: 36.8572, avoid: "Juja Road low bridge", note: "Riverside settlement. The river path floods first. Move ground-floor stock and use the upper shelter." },
    { id: "mukuru", name: "Mukuru", ward: "Viwandani", risk: "HIGH", mm: 110, lat: -1.3168, lng: 36.8842, avoid: "Lunga Lunga Road", note: "Blocked drains along the industrial edge. The SMS names Lunga Lunga Road, not a county-wide rain warning." },
    { id: "kibera", name: "Kibera", ward: "Kibera", risk: "MEDIUM", mm: 90, lat: -1.3133, lng: 36.7892, avoid: "Nairobi Dam road", note: "Dam-edge paths flood before the estate roads. Schools on the rim get the same picture as the county desk." },
    { id: "korogocho", name: "Korogocho", ward: "Korogocho", risk: "HIGH", mm: 100, lat: -1.2478, lng: 36.8902, avoid: "Gitathuru crossing", note: "River overflow through the settlement. Feature phones receive the full warning. The 3D view is the extra tap." }
  ];
  const SHELTERS = [
    { name: "City Stadium shelter", kind: "Shelter", lat: -1.2921, lng: 36.8272 },
    { name: "Kenya Red Cross Nairobi", kind: "Partner", lat: -1.2928, lng: 36.8214 },
    { name: "Kenyatta National Hospital", kind: "Clinic", lat: -1.3012, lng: 36.8072 },
    { name: "Eastleigh High hall", kind: "Shelter", lat: -1.2718, lng: 36.8488 },
    { name: "Mathare social hall", kind: "Shelter", lat: -1.2588, lng: 36.8624 },
    { name: "Mukuru community hall", kind: "Shelter", lat: -1.3194, lng: 36.8796 }
  ];
  const ROADS = [
    { name: "Kimathi Street", note: "Avoid from 7:30pm Tuesday", lat: -1.2847, lng: 36.8248 },
    { name: "Landhies Road", note: "Water holds at the dip", lat: -1.2886, lng: 36.8382 },
    { name: "Jogoo Road dip", note: "Drain overwhelmed", lat: -1.2954, lng: 36.8604 },
    { name: "Lunga Lunga Road", note: "Do not use the industrial edge", lat: -1.3142, lng: 36.8725 },
    { name: "Juja Road low bridge", note: "River path crosses the road", lat: -1.2672, lng: 36.8518 }
  ];

  let atlasMap = null;
  let wardLayer, shelterLayer, roadLayer, routeLayer, searchMarker;
  let layersOn = { wards: true, shelters: true, roads: true };

  function leaveDesks() {
    if (typeof closeDocs === "function") closeDocs();
    if (typeof hideBoards === "function") hideBoards();
    if (typeof hideMenu === "function") hideMenu();
    const stage = document.querySelector(".stage");
    if (stage) stage.hidden = true;
    ["workspace", "prescreen", "psModal", "vetting"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    document.body.classList.remove("in-app", "in-screen", "in-vetting", "in-menu", "in-exec", "in-track", "in-twin", "in-atlas");
  }

  function openTwin() {
    leaveDesks();
    const frame = document.getElementById("twinFrame");
    if (frame && !frame.getAttribute("src")) frame.src = "twin.html";
    document.getElementById("twin").hidden = false;
    document.body.classList.add("in-twin");
    document.body.style.overflow = "hidden";
    if (typeof shellOn === "function") shellOn();
  }

  function openAtlas() {
    leaveDesks();
    document.getElementById("atlas").hidden = false;
    document.body.classList.add("in-atlas");
    document.body.style.overflow = "hidden";
    if (typeof shellOn === "function") shellOn();
    loadLeaflet().then(() => {
      bootAtlas();
      window.setTimeout(() => { if (atlasMap) atlasMap.invalidateSize(); }, 80);
    }).catch(() => {
      if (typeof toast === "function") toast("The map could not load. Check the connection and try again.");
    });
  }

  window.openTwin = openTwin;
  window.openAtlas = openAtlas;

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (loadLeaflet.pending) return loadLeaflet.pending;
    loadLeaflet.pending = new Promise((resolve, reject) => {
      if (!document.querySelector("link[data-leaflet]")) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        css.setAttribute("data-leaflet", "1");
        document.head.appendChild(css);
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("leaflet"));
      document.head.appendChild(script);
    });
    return loadLeaflet.pending;
  }

  function pin(color) {
    return L.divIcon({
      className: "atlas-pin",
      html: `<i style="background:${color}"></i>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function bootAtlas() {
    if (atlasMap) return;
    atlasMap = L.map("atlasMap", { zoomControl: false, attributionControl: true }).setView([-1.286, 36.835], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap &copy; CARTO"
    }).addTo(atlasMap);
    wardLayer = L.layerGroup().addTo(atlasMap);
    shelterLayer = L.layerGroup().addTo(atlasMap);
    roadLayer = L.layerGroup().addTo(atlasMap);
    routeLayer = L.layerGroup().addTo(atlasMap);
    WARDS.forEach((ward) => {
      const color = ward.risk === "HIGH" ? "#c0392b" : "#d4a017";
      L.circle([ward.lat, ward.lng], { radius: 850, color, weight: 1.5, fillColor: color, fillOpacity: 0.18 }).addTo(wardLayer);
      L.marker([ward.lat, ward.lng], { icon: pin(color) }).addTo(wardLayer).bindTooltip(ward.name, { direction: "top" }).on("click", () => focusPlace(ward.lat, ward.lng, wardCard(ward)));
    });
    SHELTERS.forEach((place) => {
      L.marker([place.lat, place.lng], { icon: pin("#0a9a4a") }).addTo(shelterLayer).bindTooltip(place.name, { direction: "top" }).on("click", () => focusPlace(place.lat, place.lng, placeCard(place)));
    });
    ROADS.forEach((road) => {
      L.marker([road.lat, road.lng], { icon: pin("#1c1c1c") }).addTo(roadLayer).bindTooltip(road.name, { direction: "top" }).on("click", () => focusPlace(road.lat, road.lng, roadCard(road)));
    });
    atlasMap.on("click", (event) => {
      reverseGeocode(event.latlng.lat, event.latlng.lng);
    });
    bindAtlas();
    const cbd = WARDS[0];
    focusPlace(cbd.lat, cbd.lng, wardCard(cbd), 14);
  }

  function bindAtlas() {
    const form = document.getElementById("atlasSearch");
    const input = document.getElementById("atlasQuery");
    const hits = document.getElementById("atlasHits");
    let timer = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const first = hits.querySelector("button");
      if (first) first.click();
      else runSearch(input.value.trim());
    });
    input.addEventListener("input", () => {
      window.clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { hits.hidden = true; hits.innerHTML = ""; return; }
      timer = window.setTimeout(() => suggest(q), 380);
    });
    document.getElementById("atlasIn").onclick = () => atlasMap.zoomIn();
    document.getElementById("atlasOut").onclick = () => atlasMap.zoomOut();
    document.getElementById("atlasLocate").onclick = locateMe;
    document.getElementById("atlasLayersBtn").onclick = () => {
      const box = document.getElementById("atlasLayerBox");
      box.hidden = !box.hidden;
    };
    document.getElementById("atlasLayerBox").addEventListener("change", (event) => {
      const key = event.target.dataset.layer;
      if (!key) return;
      layersOn[key] = event.target.checked;
      applyLayers();
    });
    document.getElementById("atlasChips").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-chip]");
      if (!btn) return;
      const key = btn.dataset.chip;
      document.querySelectorAll("#atlasChips button").forEach((el) => el.classList.toggle("on", el === btn));
      Object.keys(layersOn).forEach((name) => { layersOn[name] = name === key; });
      document.querySelectorAll("#atlasLayerBox input").forEach((box) => { box.checked = box.dataset.layer === key; });
      applyLayers();
      const group = key === "wards" ? wardLayer : key === "shelters" ? shelterLayer : roadLayer;
      const bounds = group.getBounds();
      if (bounds.isValid()) atlasMap.fitBounds(bounds.pad(0.25));
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#atlasSearch")) hits.hidden = true;
    });
  }

  function applyLayers() {
    toggleLayer(wardLayer, layersOn.wards);
    toggleLayer(shelterLayer, layersOn.shelters);
    toggleLayer(roadLayer, layersOn.roads);
  }
  function toggleLayer(layer, on) {
    if (on && !atlasMap.hasLayer(layer)) layer.addTo(atlasMap);
    if (!on && atlasMap.hasLayer(layer)) atlasMap.removeLayer(layer);
  }

  async function suggest(q) {
    const hits = document.getElementById("atlasHits");
    hits.hidden = false;
    hits.innerHTML = `<p class="atlas-pending">Searching…</p>`;
    try {
      const rows = await geocode(q);
      if (!rows.length) {
        hits.innerHTML = `<p class="atlas-pending">No place matches that search</p>`;
        return;
      }
      hits.innerHTML = rows.map((row, index) => `<button type="button" data-i="${index}"><b>${esc(row.short)}</b><small>${esc(row.display_name)}</small></button>`).join("");
      hits.querySelectorAll("button").forEach((btn) => {
        btn.onclick = () => choose(rows[Number(btn.dataset.i)]);
      });
    } catch (err) {
      hits.innerHTML = `<p class="atlas-pending">Search is unavailable right now</p>`;
    }
  }

  async function runSearch(q) {
    if (!q) return;
    const rows = await geocode(q);
    if (!rows.length) {
      if (typeof toast === "function") toast("No place matches that search");
      return;
    }
    choose(rows[0]);
  }

  function choose(row) {
    document.getElementById("atlasHits").hidden = true;
    document.getElementById("atlasQuery").value = row.short;
    const near = nearestWard(row.lat, row.lng);
    const body = near && near.km < 3 ? wardCard(near.ward, row.display_name) : searchCard(row);
    focusPlace(row.lat, row.lng, body, 16);
  }

  async function geocode(q) {
    const local = await nominatim(q + " Nairobi", "ke");
    const rows = local.length ? local : await nominatim(q, "");
    return rows.map((row) => ({
      lat: Number(row.lat),
      lng: Number(row.lon),
      display_name: row.display_name,
      short: row.namedetails && row.namedetails.name ? row.namedetails.name : (row.display_name || "").split(",")[0]
    }));
  }

  function nominatim(q, country) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("limit", "6");
    if (country) url.searchParams.set("countrycodes", country);
    return fetch(url.toString(), { headers: { Accept: "application/json" } }).then((res) => {
      if (!res.ok) throw new Error("search");
      return res.json();
    });
  }

  async function reverseGeocode(lat, lng) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    try {
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const data = await res.json();
      const name = (data.display_name || "Dropped pin").split(",").slice(0, 2).join(",");
      const near = nearestWard(lat, lng);
      const body = near && near.km < 2.2 ? wardCard(near.ward, data.display_name || name) : searchCard({ short: name, display_name: data.display_name || name, lat, lng });
      focusPlace(lat, lng, body, atlasMap.getZoom());
    } catch (_err) {
      focusPlace(lat, lng, searchCard({ short: "Dropped pin", display_name: lat.toFixed(4) + ", " + lng.toFixed(4), lat, lng }), atlasMap.getZoom());
    }
  }

  function focusPlace(lat, lng, html, zoom) {
    if (searchMarker) atlasMap.removeLayer(searchMarker);
    searchMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "atlas-pin atlas-drop",
        html: `<i></i>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      }),
      zIndexOffset: 800
    }).addTo(atlasMap);
    if (zoom) atlasMap.flyTo([lat, lng], zoom, { duration: 0.7 });
    else atlasMap.panTo([lat, lng]);
    const card = document.getElementById("atlasCard");
    card.hidden = false;
    card.innerHTML = html;
    const route = card.querySelector("[data-route]");
    if (route) route.onclick = () => routeToShelter(lat, lng);
    const twin = card.querySelector("[data-twin]");
    if (twin) twin.onclick = () => openTwin();
    const close = card.querySelector("[data-close]");
    if (close) close.onclick = () => { card.hidden = true; };
  }

  function wardCard(ward, address) {
    return `<button type="button" class="atlas-x" data-close aria-label="Close">×</button>
      <p class="atlas-kicker ${ward.risk === "HIGH" ? "high" : "mid"}">${esc(ward.risk)} · ${ward.mm}mm in 48 hours</p>
      <h2>${esc(ward.name)}</h2>
      <p class="atlas-ward">${esc(ward.ward)} ward${address ? " · " + esc(address.split(",").slice(0, 2).join(",")) : ""}</p>
      <p>${esc(ward.note)}</p>
      <p class="atlas-avoid"><b>Avoid</b> ${esc(ward.avoid)}</p>
      <div class="atlas-actions">
        <button type="button" data-route>Safe route</button>
        <button type="button" data-twin>3D scenario</button>
      </div>`;
  }
  function placeCard(place) {
    return `<button type="button" class="atlas-x" data-close aria-label="Close">×</button>
      <p class="atlas-kicker mid">${esc(place.kind)}</p>
      <h2>${esc(place.name)}</h2>
      <p>Marked for the county desk and for the resident who opens the link in the SMS.</p>
      <div class="atlas-actions"><button type="button" data-route>Route onward</button><button type="button" data-twin>3D scenario</button></div>`;
  }
  function roadCard(road) {
    return `<button type="button" class="atlas-x" data-close aria-label="Close">×</button>
      <p class="atlas-kicker high">Road to avoid</p>
      <h2>${esc(road.name)}</h2>
      <p>${esc(road.note)}</p>
      <div class="atlas-actions"><button type="button" data-route>Route around</button><button type="button" data-twin>3D scenario</button></div>`;
  }
  function searchCard(row) {
    const near = nearestWard(row.lat, row.lng);
    const extra = near ? `<p class="atlas-avoid">Nearest watch is <b>${esc(near.ward.name)}</b>, ${near.km.toFixed(1)} km away, ${esc(near.ward.risk)}.</p>` : "";
    return `<button type="button" class="atlas-x" data-close aria-label="Close">×</button>
      <p class="atlas-kicker">Place</p>
      <h2>${esc(row.short)}</h2>
      <p>${esc(row.display_name || "")}</p>
      ${extra}
      <div class="atlas-actions"><button type="button" data-route>Safe route</button><button type="button" data-twin>3D scenario</button></div>`;
  }

  function nearestWard(lat, lng) {
    let best = null;
    WARDS.forEach((ward) => {
      const km = haversine(lat, lng, ward.lat, ward.lng);
      if (!best || km < best.km) best = { ward, km };
    });
    return best;
  }
  function nearestShelter(lat, lng) {
    let best = null;
    SHELTERS.forEach((place) => {
      const km = haversine(lat, lng, place.lat, place.lng);
      if (km < 0.08) return;
      if (!best || km < best.km) best = { place, km };
    });
    return best;
  }
  function haversine(a, b, c, d) {
    const r = 6371;
    const dLat = (c - a) * Math.PI / 180;
    const dLng = (d - b) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  async function routeToShelter(lat, lng) {
    const dest = nearestShelter(lat, lng);
    if (!dest) return;
    routeLayer.clearLayers();
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${dest.place.lng},${dest.place.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      const line = data.routes && data.routes[0];
      if (!line) throw new Error("no route");
      const coords = line.geometry.coordinates.map((pair) => [pair[1], pair[0]]);
      L.polyline(coords, { color: "#0a9a4a", weight: 5, opacity: 0.9 }).addTo(routeLayer);
      atlasMap.fitBounds(L.latLngBounds(coords).pad(0.2));
      if (typeof toast === "function") toast(`Safe route to ${dest.place.name} · ${Math.round(line.duration / 60)} min`);
    } catch (_err) {
      L.polyline([[lat, lng], [dest.place.lat, dest.place.lng]], { color: "#0a9a4a", weight: 4, dashArray: "8 8" }).addTo(routeLayer);
      if (typeof toast === "function") toast(`Straight line to ${dest.place.name}. The road route did not load.`);
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      if (typeof toast === "function") toast("This browser has no location");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    }, () => {
      if (typeof toast === "function") toast("Location was not shared");
    }, { enableHighAccuracy: true, timeout: 8000 });
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function applyFloodVoice() {
    if (typeof roster === "undefined") return;
    const titles = { passport: "Rainfall brief", licence: "Drainage survey", address: "Ward boundary", nvq: "Impact brief", dbs: "Gauge reading" };
    const notes = {
      verified: {
        passport: "The 48-hour rainfall scenario matches this ward.",
        licence: "Drainage survey is on the file.",
        address: "Ward boundary matches the SMS catchment.",
        nvq: "Impact brief covers roads, shelters, traders, and clinics.",
        dbs: "Gauge reading is signed and current."
      },
      pending: {
        passport: "Rainfall scenario is uploaded. The duty officer still needs to check it.",
        licence: "Drainage survey is uploaded and still needs a desk check.",
        address: "Ward boundary is uploaded and still needs a desk check.",
        nvq: "Impact brief is uploaded. The road list is still unchecked.",
        dbs: "Gauge print is in the locker. The live status is not signed off."
      },
      missing: {
        passport: "Rainfall brief has not been filed.",
        licence: "Drainage survey is not on the file.",
        address: "Ward boundary is not on the file.",
        nvq: "Impact brief has not been filed.",
        dbs: "Gauge reading has not been checked."
      }
    };
    roster.forEach((p) => {
      if (!p.pack || p.pack._flood) return;
      (p.pack.docs || []).forEach((doc) => {
        if (titles[doc.id]) doc.title = titles[doc.id];
        const bank = notes[doc.status] || notes.pending;
        if (bank[doc.id]) doc.note = bank[doc.id];
      });
      (p.pack.history || []).forEach((row) => { if (row.gap) row.title = "Forecast gap"; });
      (p.pack.refs || []).forEach((ref) => {
        ref.written = ref.name ? `${ref.name} confirmed the ward picture for this alert.` : ref.written;
      });
      if (p.pack.induction) {
        ["Day 1 · Shelter brief", "Day 2 · Route drill", "Day 3 · SMS dry run"].forEach((label, i) => {
          if (p.pack.induction.days[i]) p.pack.induction.days[i].label = label;
        });
        ["Radio pickup", "Ward access badge", "Field phone agreement"].forEach((label, i) => {
          if (p.pack.induction.assets[i]) p.pack.induction.assets[i].label = label;
        });
      }
      p.pack._flood = true;
    });
  }

  window.applyFloodVoice = applyFloodVoice;

  const asked = new URLSearchParams(location.search).get("page");
  if (asked === "map" || asked === "atlas") {
    const gate = document.getElementById("gate");
    if (gate) gate.hidden = true;
    openAtlas();
  } else if (asked === "twin" || asked === "3d") {
    const gate = document.getElementById("gate");
    if (gate) gate.hidden = true;
    openTwin();
  }
})();
