/* ============================================================
   PULSE MUSIC — script.js
   Vanilla JavaScript Music Player
   ============================================================ */
"use strict";

/* ==================== SONG DATABASE ==================== */
const songs = [
  { id: 1, title: "Api Aye Hamuwela", artist: "Uvindu Ayshcharya", album: "Api Aye Hamuwela", genre: "Sinhala", year: 2026, duration: "3:50", image: "images/api_aye_hamuwela.jpeg", audio: "songs/api_aye_hamuwela.mpeg" },
  { id: 2, title: "Atha Arala Dala", artist: "Lil Rome Praba", album: "Atha Arala Dala", genre: "Sinhala", year: 2026, duration: "5:05", image: "images/atha_arala_dala.jpeg", audio: "songs/atha_arala_dala.mpeg" },
  { id: 3, title: "Pattampoochi", artist: "G.V. Prakash Kumar / Sublahshini", album: "Vishwanath & Son", genre: "Tamil", year: 2026, duration: "3:25", image: "images/pattampoochi_tamil.jpeg", audio: "songs/pottampoochi_tamil.mpeg" },
  { id: 4, title: "Kannumuzhi", artist: "Anthony Daasan / Sublahshini", album: "Mask", genre: "Tamil", year: 2025, duration: "3:49", image: "images/kannumuzhi_tamil.jpeg", audio: "songs/kannumuzhi_tamil.mpeg" },
  { id: 5, title: "Saiyaara", artist: "Faheem Abdullah", album: "Saiyaara", genre: "Hindi", year: 2025, duration: "4:06", image: "images/saiyaara_hindi.jpeg", audio: "songs/saiyaara_hindi.mpeg" },
  { id: 6, title: "Ashiqui", artist: "Arijit Singh", album: "Ashiqui 2", genre: "Hindi", year: 2013, duration: "5:04", image: "images/ashiqui_hindi.jpeg", audio: "songs/ashiqui_hindi.mpeg" },
  { id: 7, title: "Dynamite", artist: "BTS", album: "Featured on the albums BE", genre: "Disco-Pop", year: 2020, duration: "3:17", image: "images/dynamite_bts.jpeg", audio: "songs/dynamite_bts.mpeg" },
  { id: 8, title: "Swim", artist: "BTS", album: "K-Pop", genre: "A laid-back Lo-Fi R&B-Pop synth", year: 2026, duration: "2:44", image: "images/swim_bts.jpeg", audio: "songs/swim_bts.mpeg" },
  { id: 9, title: "Morrocco", artist: "Joshua Baraka & Axon", album: "Morocco", genre: "Afro-Pop", year: 2025, duration: "3:09", image: "images/morrocco_english.jpeg", audio: "songs/morocco _2026_english.mpeg" },
  { id: 10, title: "The Lover's Litacy", artist: "Rudyard Kipling", album: "The Lover's Litacy", genre: "Synth-Pop", year: 2000, duration: "4:41", image: "images/the_lover's_litacy_english.jpeg", audio: "songs/the_lover's_litany_english.mpeg" },
 
];

const GENRE_COLORS = {
  "Pop":        "linear-gradient(135deg,#ec4899,#f97316)",
  "Rock":       "linear-gradient(135deg,#ef4444,#7c3aed)",
  "Hip Hop":    "linear-gradient(135deg,#f59e0b,#ef4444)",
  "R&B":        "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "Electronic": "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "Jazz":       "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "Classical":  "linear-gradient(135deg,#a16207,#eab308)",
  "Sinhala":    "linear-gradient(135deg,#16a34a,#0d9488)",
  "Tamil":      "linear-gradient(135deg,#dc2626,#f59e0b)",
  "Lo-Fi":      "linear-gradient(135deg,#64748b,#94a3b8)",
};

/* ==================== STATE & STORAGE ==================== */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("pulse_" + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem("pulse_" + key, JSON.stringify(value)); }
};

let favorites    = store.get("favorites", []);
let recentIds    = store.get("recent", []);
let userPlaylists = store.get("playlists", [
  { id: "pl_chill",   name: "Chill Vibes", songIds: [3, 5, 11, 14, 15] },
  { id: "pl_workout", name: "Workout",     songIds: [10, 17, 18, 22] },
  { id: "pl_study",   name: "Study Time",  songIds: [14, 15, 16, 23] },
  { id: "pl_party",   name: "Party Mix",   songIds: [2, 6, 9, 17, 24] },
]);

let currentIndex = 0;          // index inside `currentQueue`
let currentQueue = [...songs]; // active playback queue
let isPlaying    = false;
let isShuffle    = store.get("shuffle", false);
let repeatMode   = store.get("repeat", "off"); // off | one | all
let pendingPickerSongId = null;

/* ==================== DOM SHORTCUTS ==================== */
const $ = (id) => document.getElementById(id);
const audio        = $("audio");
const playBtn      = $("playBtn");
const playerBar    = $("player");
const queuePanel   = $("queuePanel");
const toastEl      = $("toast");

/* ==================== HELPERS ==================== */
const getSong = (id) => songs.find((s) => s.id === Number(id));
const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (sec) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

/* ==================== AUDIO: CORE CONTROLS ==================== */
function loadSong(song, queue = currentQueue) {
  currentQueue = queue;
  currentIndex = queue.findIndex((s) => s.id === song.id);
  if (currentIndex === -1) { currentQueue = [song]; currentIndex = 0; }

  $("pCover").src = song.image;
  $("pCover").alt = `Cover art for ${song.title}`;
  $("pTitle").textContent = song.title;
  $("pArtist").textContent = song.artist;
  audio.src = song.audio;
  document.title = `▶ ${song.title} — PULSE MUSIC`;
  updateFavBtn(song.id);
  highlightPlayingRow(song.id);
  renderQueuePanel();
}

function playSong(song = currentQueue[currentIndex]) {
  if (!song) return;
  const wasSame = audio.src.endsWith(encodeURI(song.audio).split("/").pop()) && audio.src.includes(song.audio.split("/")[0]);
  if (!wasSame || audio.src === "" || audio.src.endsWith("undefined")) loadSong(song);
  audio.play()
    .then(() => { isPlaying = true; syncPlayUI(); updateRecentlyPlayed(song.id); })
    .catch(() => { /* error handled by 'error' event */ });
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  syncPlayUI();
}

function togglePlay() { isPlaying ? pauseSong() : playSong(); }

function nextSong(auto = false) {
  if (isShuffle) {
    let n;
    do { n = Math.floor(Math.random() * currentQueue.length); } while (currentQueue.length > 1 && n === currentIndex);
    currentIndex = n;
  } else if (currentIndex < currentQueue.length - 1) {
    currentIndex++;
  } else if (repeatMode === "all") {
    currentIndex = 0;
  } else if (auto) {
    pauseSong();
    return;
  } else {
    return;
  }
  playSong(currentQueue[currentIndex]);
}

function previousSong() {
  // If > 3s in, restart the song instead of going back
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (currentIndex > 0) currentIndex--;
  else currentIndex = currentQueue.length - 1;
  playSong(currentQueue[currentIndex]);
}

function syncPlayUI() {
  playBtn.textContent = isPlaying ? "⏸" : "▶";
  playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  document.querySelectorAll(".song-row").forEach((r) => r.classList.remove("playing"));
  highlightPlayingRow(currentQueue[currentIndex]?.id);
}

function highlightPlayingRow(id) {
  document.querySelectorAll(".song-row").forEach((row) => {
    row.classList.toggle("playing", Number(row.dataset.id) === Number(id));
  });
}

/* ==================== PROGRESS ==================== */
function updateProgress() {
  const { currentTime, duration } = audio;
  $("curTime").textContent = fmt(currentTime);
  $("durTime").textContent = fmt(duration);
  const pct = duration ? (currentTime / duration) * 100 : 0;
  $("progressFill").style.width = pct + "%";
  $("progressThumb").style.left = pct + "%";
}

function setProgress(clientX) {
  const track = $("progressTrack");
  const rect = track.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  if (isFinite(audio.duration)) audio.currentTime = ratio * audio.duration;
  updateProgress();
}

// Click + drag on progress bar
(function initProgressDrag() {
  const track = $("progressTrack");
  let dragging = false;
  track.addEventListener("pointerdown", (e) => { dragging = true; track.classList.add("dragging"); setProgress(e.clientX); });
  window.addEventListener("pointermove", (e) => { if (dragging) setProgress(e.clientX); });
  window.addEventListener("pointerup", () => { dragging = false; track.classList.remove("dragging"); });
})();

/* ==================== VOLUME ==================== */
function setVolume(value) {
  const v = Math.min(Math.max(value, 0), 1);
  audio.volume = v;
  audio.muted = v === 0;
  $("volumeSlider").value = v * 100;
  updateMuteIcon();
  store.set("volume", v);
}

function updateMuteIcon() {
  $("muteBtn").textContent = (audio.muted || audio.volume === 0) ? "🔇" : audio.volume < 0.5 ? "🔉" : "🔊";
}

function toggleMute() {
  audio.muted = !audio.muted;
  updateMuteIcon();
}

/* ==================== SHUFFLE & REPEAT ==================== */
function toggleShuffle() {
  isShuffle = !isShuffle;
  $("shuffleBtn").classList.toggle("on", isShuffle);
  store.set("shuffle", isShuffle);
  toast(isShuffle ? "🔀 Shuffle on" : "🔀 Shuffle off");
}

function toggleRepeat() {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  store.set("repeat", repeatMode);
  const btn = $("repeatBtn");
  btn.classList.toggle("on", repeatMode !== "off");
  btn.textContent = repeatMode === "one" ? "🔂" : "🔁";
  toast(repeatMode === "off" ? "🔁 Repeat off" : repeatMode === "all" ? "🔁 Repeat all" : "🔂 Repeat one");
}

/* ==================== FAVORITES ==================== */
function isFav(id) { return favorites.includes(Number(id)); }

function addToFavorites(id) {
  id = Number(id);
  if (!isFav(id)) favorites.push(id);
  afterFavChange(id, true);
}

function removeFromFavorites(id) {
  id = Number(id);
  favorites = favorites.filter((f) => f !== id);
  afterFavChange(id, false);
}

function toggleFavorite(id) {
  isFav(id) ? removeFromFavorites(id) : addToFavorites(id);
}

function afterFavChange(id, added) {
  store.set("favorites", favorites);
  updateFavBtn(id);
  refreshFavIcons();
  renderFavorites();
  renderPlaylists();
  updateStats();
  toast(added ? "❤️ Added to Favorites" : "💔 Removed from Favorites");
}

function updateFavBtn(id) {
  const btn = $("pFavBtn");
  btn.classList.toggle("faved", isFav(id));
  btn.textContent = isFav(id) ? "♥" : "♡";
}

// Refresh every ♡ button rendered on the page
function refreshFavIcons() {
  document.querySelectorAll("[data-fav]").forEach((btn) => {
    const f = isFav(btn.dataset.fav);
    btn.classList.toggle("faved", f);
    btn.textContent = f ? "♥" : "♡";
  });
}

function renderFavorites() {
  const favSongs = favorites.map(getSong).filter(Boolean);
  $("favCountLabel").textContent = `${favSongs.length} song${favSongs.length === 1 ? "" : "s"}`;
  $("favoritesList").innerHTML = favSongs.map((s, i) => songRowHTML(s, i)).join("");
  $("favEmpty").style.display = favSongs.length ? "none" : "block";
  $("libFavCount").textContent = favSongs.length;
  highlightPlayingRow(currentQueue[currentIndex]?.id);
}

/* ==================== RECENTLY PLAYED ==================== */
function updateRecentlyPlayed(id) {
  recentIds = [Number(id), ...recentIds.filter((r) => r !== Number(id))].slice(0, 15);
  store.set("recent", recentIds);
  renderRecent();
}

function renderRecent() {
  const recentSongs = recentIds.map(getSong).filter(Boolean);
  $("recentList").innerHTML = recentSongs.map((s, i) => songRowHTML(s, i)).join("");
  $("recentPreview").innerHTML = recentSongs.slice(0, 5).map((s, i) => songRowHTML(s, i)).join("");
  $("recentEmpty").style.display = recentSongs.length ? "none" : "block";
  $("libRecentCount").textContent = recentSongs.length;
  highlightPlayingRow(currentQueue[currentIndex]?.id);
}

/* ==================== PLAYLISTS ==================== */
function renderPlaylists() {
  $("playlistGrid").innerHTML = userPlaylists.map((pl, i) => {
    const count = pl.songIds.length;
    const grad = Object.values(GENRE_COLORS)[i % Object.values(GENRE_COLORS).length];
    return `
      <div class="song-card playlist-card" data-pl="${pl.id}">
        <div class="pl-cover" style="background:${grad}">🎼</div>
        <h4>${esc(pl.name)}</h4>
        <p class="artist">${count} track${count === 1 ? "" : "s"}</p>
        <div class="card-meta">
          <span>Playlist</span>
          <div class="card-actions">
            <button class="mini-btn" data-play-pl="${pl.id}" aria-label="Play playlist" title="Play">▶</button>
            <button class="mini-btn" data-del-pl="${pl.id}" aria-label="Delete playlist" title="Delete">🗑</button>
          </div>
        </div>
      </div>`;
  }).join("");
  $("libPlCount").textContent = userPlaylists.length;

  // My Favorites pseudo-playlist card (first position)
  const favCard = `
    <div class="song-card playlist-card" data-nav="favorites">
      <div class="pl-cover" style="background:linear-gradient(135deg,#ec4899,#8b5cf6)">❤️</div>
      <h4>My Favorites</h4>
      <p class="artist">${favorites.length} track${favorites.length === 1 ? "" : "s"}</p>
      <div class="card-meta"><span>Auto playlist</span></div>
    </div>`;
  $("playlistGrid").insertAdjacentHTML("afterbegin", favCard);
}

function createPlaylist(name) {
  const pl = { id: "pl_" + Date.now(), name, songIds: [] };
  userPlaylists.push(pl);
  store.set("playlists", userPlaylists);
  renderPlaylists();
  toast(`🎼 Playlist "${name}" created`);
  return pl;
}

function deletePlaylist(id) {
  userPlaylists = userPlaylists.filter((pl) => pl.id !== id);
  store.set("playlists", userPlaylists);
  renderPlaylists();
  toast("🗑 Playlist deleted");
}

function addToPlaylist(playlistId, songId) {
  const pl = userPlaylists.find((p) => p.id === playlistId);
  if (!pl) return;
  songId = Number(songId);
  if (pl.songIds.includes(songId)) { toast("Already in that playlist ✔"); return; }
  pl.songIds.push(songId);
  store.set("playlists", userPlaylists);
  renderPlaylists();
  toast(`➕ Added to "${pl.name}"`);
}

function removeFromPlaylist(playlistId, songId) {
  const pl = userPlaylists.find((p) => p.id === playlistId);
  if (!pl) return;
  pl.songIds = pl.songIds.filter((id) => id !== Number(songId));
  store.set("playlists", userPlaylists);
  renderPlaylistDetail(playlistId);
  renderPlaylists();
  toast("➖ Removed from playlist");
}

function renderPlaylistDetail(id) {
  const pl = userPlaylists.find((p) => p.id === id);
  if (!pl) return;
  $("plDetailTitle").textContent = pl.name;
  $("plDetailMeta").textContent = `${pl.songIds.length} track${pl.songIds.length === 1 ? "" : "s"}`;
  const list = pl.songIds.map(getSong).filter(Boolean);
  $("playlistSongsList").innerHTML = list.map((s, i) =>
    songRowHTML(s, i, { removePl: id })
  ).join("");
  $("plDetailEmpty").style.display = list.length ? "none" : "block";
  highlightPlayingRow(currentQueue[currentIndex]?.id);
}

/* ==================== QUEUE ==================== */
function addToQueue(songId) {
  const song = getSong(songId);
  if (!song) return;
  currentQueue.push(song);
  renderQueuePanel();
  toast(`☰ Added "${song.title}" to queue`);
}

function renderQueuePanel() {
  const items = currentQueue.map((s, i) => `
    <div class="queue-item ${i === currentIndex ? "playing" : ""}" data-queue-i="${i}">
      <img src="${s.image}" alt="${esc(s.title)} cover" />
      <div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div>
      ${i === currentIndex
        ? `<span style="color:var(--accent);font-size:12px">▶ NOW</span>`
        : `<button class="queue-remove" data-queue-rm="${i}" aria-label="Remove from queue">✕</button>`}
    </div>`).join("");
  $("queueList").innerHTML = items || `<p class="empty-msg">Queue is empty.</p>`;
}

function clearQueue() {
  const current = currentQueue[currentIndex];
  currentQueue = current ? [current] : [];
  currentIndex = 0;
  renderQueuePanel();
  toast("🗑 Queue cleared");
}

/* ==================== RENDER: HTML BUILDERS ==================== */
function songCardHTML(s) {
  return `
    <div class="song-card" data-song-card="${s.id}">
      <div class="cover-wrap">
        <img src="${s.image}" alt="${esc(s.title)} by ${esc(s.artist)} album art" loading="lazy" />
        <button class="cover-play" data-play="${s.id}" aria-label="Play ${esc(s.title)}"><span>▶</span></button>
      </div>
      <h4>${esc(s.title)}</h4>
      <p class="artist">${esc(s.artist)} · ${esc(s.album)}</p>
      <div class="card-meta">
        <span>${s.duration} · ${esc(s.genre)}</span>
        <div class="card-actions">
          <button class="mini-btn ${isFav(s.id) ? "faved" : ""}" data-fav="${s.id}" aria-label="Toggle favorite">${isFav(s.id) ? "♥" : "♡"}</button>
          <button class="mini-btn" data-queue="${s.id}" aria-label="Add to queue" title="Add to queue">☰</button>
          <button class="mini-btn" data-more="${s.id}" aria-label="More options" title="More">⋯</button>
        </div>
      </div>
    </div>`;
}

function songRowHTML(s, i, opts = {}) {
  return `
    <div class="song-row" data-id="${s.id}" data-row-play="${s.id}" role="button" tabindex="0"
         aria-label="Play ${esc(s.title)} by ${esc(s.artist)}">
      <span class="s-index">${i + 1}</span>
      <span class="eq" aria-hidden="true"><span></span><span></span><span></span></span>
      <img src="${s.image}" alt="${esc(s.title)} cover" loading="lazy" />
      <div class="s-info">
        <div class="s-title">${esc(s.title)}</div>
        <div class="s-sub">${esc(s.artist)} · ${esc(s.genre)} · ${s.year}</div>
      </div>
      <span class="s-album">${esc(s.album)}</span>
      <span class="s-dur">${s.duration}</span>
      <div class="s-actions">
        <button class="mini-btn ${isFav(s.id) ? "faved" : ""}" data-fav="${s.id}" aria-label="Toggle favorite">${isFav(s.id) ? "♥" : "♡"}</button>
        ${opts.removePl
          ? `<button class="mini-btn" data-rm-pl="${opts.removePl}|${s.id}" aria-label="Remove from playlist" title="Remove">➖</button>`
          : `<button class="mini-btn" data-queue="${s.id}" aria-label="Add to queue" title="Queue">☰</button>`}
        <button class="mini-btn" data-more="${s.id}" aria-label="More options" title="More">⋯</button>
      </div>
    </div>`;
}

function renderSongs() {
  // Featured = first 8 songs as cards
  $("featuredGrid").innerHTML = songs.slice(0, 8).map(songCardHTML).join("");

  // Trending = next 6, numbered
  $("trendingList").innerHTML = songs.slice(8, 14).map((s, i) => `
    <div class="trend-item" data-row-play="${s.id}" role="button" tabindex="0" aria-label="Play ${esc(s.title)}">
      <span class="trend-num">${String(i + 1).padStart(2, "0")}</span>
      <img src="${s.image}" alt="${esc(s.title)} cover" loading="lazy" />
      <div><div class="t-title">${esc(s.title)}</div><div class="t-artist">${esc(s.artist)} · ${esc(s.album)}</div></div>
      <button class="mini-btn ${isFav(s.id) ? "faved" : ""}" data-fav="${s.id}" aria-label="Toggle favorite">${isFav(s.id) ? "♥" : "♡"}</button>
      <span class="t-dur">${s.duration}</span>
    </div>`).join("");

  // Discover view — all songs
  $("allSongsList").innerHTML = songs.map((s, i) => songRowHTML(s, i)).join("");
  refreshFavIcons();
}

function renderArtists() {
  const artists = [...new Set(songs.map((s) => s.artist))];
  const html = artists.map((a) => {
    const list = songs.filter((s) => s.artist === a);
    return `
      <div class="artist-item" data-artist="${esc(a)}" role="button" tabindex="0" aria-label="View ${esc(a)} songs">
        <img src="${list[0].image}" alt="${esc(a)}" loading="lazy" />
        <b>${esc(a)}</b>
        <span>${list.length} song${list.length === 1 ? "" : "s"}</span>
      </div>`;
  }).join("");
  $("artistRow").innerHTML = html;
  $("artistsViewRow").innerHTML = html;
}

function renderAlbums() {
  const map = {};
  songs.forEach((s) => { (map[s.album] = map[s.album] || { artist: s.artist, cover: s.image, list: [] }).list.push(s); });
  const html = Object.entries(map).map(([name, a]) => `
    <div class="song-card" data-album="${esc(name)}" role="button" tabindex="0" aria-label="View album ${esc(name)}">
      <div class="cover-wrap">
        <img src="${a.cover}" alt="${esc(name)} album cover" loading="lazy" />
        <button class="cover-play" data-play-album="${esc(name)}" aria-label="Play album ${esc(name)}"><span>▶</span></button>
      </div>
      <h4>${esc(name)}</h4>
      <p class="artist">${esc(a.artist)}</p>
      <div class="card-meta"><span>${a.list.length} track${a.list.length === 1 ? "" : "s"}</span></div>
    </div>`).join("");
  $("albumGrid").innerHTML = html;
  $("albumsViewGrid").innerHTML = html;
}

function renderGenres() {
  const genres = [...new Set(songs.map((s) => s.genre))];
  $("genreGrid").innerHTML = genres.map((g) => {
    const count = songs.filter((s) => s.genre === g).length;
    return `<button class="genre-card" data-genre="${esc(g)}" style="background:${GENRE_COLORS[g] || "var(--grad)"}">
      ${esc(g)}<small>${count} songs</small>
    </button>`;
  }).join("");
}

function updateStats() {
  $("statSongs").textContent = songs.length;
  $("statArtists").textContent = new Set(songs.map((s) => s.artist)).size;
  $("statAlbums").textContent = new Set(songs.map((s) => s.album)).size;
  $("statFavs").textContent = favorites.length;
}

/* ==================== SEARCH ==================== */
function searchSongs(query) {
  const q = query.trim().toLowerCase();
  if (!q) { showView("home"); return; }
  const results = songs.filter((s) =>
    [s.title, s.artist, s.album, s.genre].some((f) => f.toLowerCase().includes(q))
  );
  $("searchTitle").textContent = `🔍 Results for "${query.trim()}"`;
  $("searchMeta").textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;
  $("searchResults").innerHTML = results.map((s, i) => songRowHTML(s, i)).join("");
  $("searchEmpty").style.display = results.length ? "none" : "block";
  $("searchEmpty").textContent = "No music found.";
  showView("search");
}

/* ==================== FILTERS ==================== */
function filterByGenre(genre) {
  const results = songs.filter((s) => s.genre === genre);
  $("browseTitle").textContent = `🎼 ${genre}`;
  $("browseMeta").textContent = `${results.length} songs`;
  $("browseList").innerHTML = results.map((s, i) => songRowHTML(s, i)).join("");
  $("browseEmpty").style.display = results.length ? "none" : "block";
  showView("browse");
}

function showArtistSongs(artist) {
  const results = songs.filter((s) => s.artist === artist);
  $("browseTitle").textContent = `🎤 ${artist}`;
  $("browseMeta").textContent = `${results.length} song${results.length === 1 ? "" : "s"}`;
  $("browseList").innerHTML = results.map((s, i) => songRowHTML(s, i)).join("");
  $("browseEmpty").style.display = results.length ? "none" : "block";
  showView("browse");
}

function showAlbumSongs(album) {
  const results = songs.filter((s) => s.album === album);
  $("browseTitle").textContent = `💿 ${album}`;
  $("browseMeta").textContent = `${results.length} track${results.length === 1 ? "" : "s"} · ${results[0]?.artist || ""}`;
  $("browseList").innerHTML = results.map((s, i) => songRowHTML(s, i)).join("");
  $("browseEmpty").style.display = results.length ? "none" : "block";
  showView("browse");
}

/* ==================== VIEW NAVIGATION ==================== */
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const target = $("view-" + name) || $("view-home");
  target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.nav === name));
  $("content").scrollTo?.(0, 0);
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeSidebarMobile();
}

/* ==================== MODALS ==================== */
function openSongModal(id) {
  const s = getSong(id);
  if (!s) return;
  $("modalBody").innerHTML = `
    <div class="modal-song">
      <img src="${s.image}" alt="${esc(s.title)} album art" />
      <div class="modal-info">
        <h2 id="modalTitle">${esc(s.title)}</h2>
        <p class="m-artist">${esc(s.artist)}</p>
        <p>💿 Album: ${esc(s.album)}</p>
        <p>🎼 Genre: ${esc(s.genre)}</p>
        <p>📅 Released: ${s.year}</p>
        <p>⏱ Duration: ${s.duration}</p>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn-gradient small" data-modal-play="${s.id}">▶ Play Now</button>
      <button class="btn-ghost small" data-modal-fav="${s.id}">${isFav(s.id) ? "♥ In Favorites" : "♡ Add to Favorites"}</button>
      <button class="btn-ghost small" data-modal-pl="${s.id}">🎼 Add to Playlist</button>
      <button class="btn-ghost small" data-modal-queue="${s.id}">☰ Add to Queue</button>
    </div>`;
  $("songModal").classList.add("open");
}

function openPlaylistPicker(songId) {
  pendingPickerSongId = songId;
  $("pickerList").innerHTML = userPlaylists.map((pl) => `
    <button class="picker-item" data-pick="${pl.id}">
      <span>🎼 ${esc(pl.name)}</span><span style="color:var(--text-dim);font-size:12px">${pl.songIds.length} tracks</span>
    </button>`).join("") || `<p class="empty-msg">No playlists yet — create one first!</p>`;
  $("playlistPicker").classList.add("open");
}

/* ==================== THEME ==================== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("themeToggle").textContent = theme === "dark" ? "🌙" : "☀️";
  store.set("theme", theme);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
}

/* ==================== SIDEBAR (mobile) ==================== */
function openSidebarMobile() { $("sidebar").classList.add("open"); }
function closeSidebarMobile() { $("sidebar").classList.remove("open"); }

/* ==================== EVENT WIRING ==================== */
function initEvents() {
  /* --- Player buttons --- */
  playBtn.addEventListener("click", togglePlay);
  $("nextBtn").addEventListener("click", () => nextSong());
  $("prevBtn").addEventListener("click", previousSong);
  $("shuffleBtn").addEventListener("click", toggleShuffle);
  $("repeatBtn").addEventListener("click", toggleRepeat);
  $("muteBtn").addEventListener("click", toggleMute);
  $("pFavBtn").addEventListener("click", () => currentQueue[currentIndex] && toggleFavorite(currentQueue[currentIndex].id));
  $("volumeSlider").addEventListener("input", (e) => setVolume(e.target.value / 100));

  /* --- Audio element events --- */
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("ended", () => {
    if (repeatMode === "one") { audio.currentTime = 0; audio.play(); }
    else nextSong(true); // autoplay next
  });
  audio.addEventListener("error", () => {
    if (!audio.src) return;
    toast("⚠️ Unable to play this song. Please check the audio file.");
    isPlaying = false;
    syncPlayUI();
  });

  /* --- Global click delegation for all dynamic content --- */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const nav = t.closest("[data-nav]");
    if (nav) { e.preventDefault(); showView(nav.dataset.nav); return; }

    const play = t.closest("[data-play]");
    if (play) {
      const song = getSong(play.dataset.play);
      if (song) playSong(song, songs);
      return;
    }

    const rowPlay = t.closest("[data-row-play]");
    if (rowPlay && !t.closest(".mini-btn")) {
      const song = getSong(rowPlay.dataset.rowPlay);
      if (song) playSong(song, songs);
      return;
    }

    const playAlbum = t.closest("[data-play-album]");
    if (playAlbum) {
      const list = songs.filter((s) => s.album === playAlbum.dataset.playAlbum);
      if (list.length) playSong(list[0], list);
      return;
    }

    const fav = t.closest("[data-fav]");
    if (fav) { toggleFavorite(fav.dataset.fav); return; }

    const queueAdd = t.closest("[data-queue]");
    if (queueAdd) { addToQueue(queueAdd.dataset.queue); return; }

    const more = t.closest("[data-more]");
    if (more) { openSongModal(more.dataset.more); return; }

    const artist = t.closest("[data-artist]");
    if (artist) { showArtistSongs(artist.dataset.artist); return; }

    const album = t.closest("[data-album]");
    if (album && !t.closest("[data-play-album]")) { showAlbumSongs(album.dataset.album); return; }

    const genre = t.closest("[data-genre]");
    if (genre) { filterByGenre(genre.dataset.genre); return; }

    const playPl = t.closest("[data-play-pl]");
    if (playPl) {
      const pl = userPlaylists.find((p) => p.id === playPl.dataset.playPl);
      const list = pl.songIds.map(getSong).filter(Boolean);
      if (list.length) playSong(list[0], list);
      else toast("This playlist is empty");
      return;
    }

    const delPl = t.closest("[data-del-pl]");
    if (delPl) {
      if (confirm("Delete this playlist?")) deletePlaylist(delPl.dataset.delPl);
      return;
    }

    const plCard = t.closest("[data-pl]");
    if (plCard) { renderPlaylistDetail(plCard.dataset.pl); showView("playlistDetail"); return; }

    const rmPl = t.closest("[data-rm-pl]");
    if (rmPl) {
      const [plId, songId] = rmPl.dataset.rmPl.split("|");
      removeFromPlaylist(plId, songId);
      return;
    }

    /* Modal inner buttons */
    const mPlay = t.closest("[data-modal-play]");
    if (mPlay) {
      const song = getSong(mPlay.dataset.modalPlay);
      if (song) { playSong(song, songs); $("songModal").classList.remove("open"); }
      return;
    }
    const mFav = t.closest("[data-modal-fav]");
    if (mFav) { toggleFavorite(mFav.dataset.modalFav); openSongModal(mFav.dataset.modalFav); return; }
    const mPl = t.closest("[data-modal-pl]");
    if (mPl) { openPlaylistPicker(mPl.dataset.modalPl); return; }
    const mQueue = t.closest("[data-modal-queue]");
    if (mQueue) { addToQueue(mQueue.dataset.modalQueue); $("songModal").classList.remove("open"); return; }

    const pick = t.closest("[data-pick]");
    if (pick) {
      addToPlaylist(pick.dataset.pick, pendingPickerSongId);
      $("playlistPicker").classList.remove("open");
      $("songModal").classList.remove("open");
      return;
    }

    /* Queue panel */
    const qRm = t.closest("[data-queue-rm]");
    if (qRm) {
      const i = Number(qRm.dataset.queueRm);
      currentQueue.splice(i, 1);
      if (i < currentIndex) currentIndex--;
      if (i === currentIndex) currentIndex = Math.min(currentIndex, currentQueue.length - 1);
      renderQueuePanel();
      return;
    }
    const qItem = t.closest("[data-queue-i]");
    if (qItem && !qRm) {
      currentIndex = Number(qItem.dataset.queueI);
      playSong(currentQueue[currentIndex]);
    }
  });

  /* Keyboard access on rows/cards */
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "Enter" || e.key === " ") {
      const el = e.target.closest?.("[data-row-play], [data-artist], [data-album], [data-pl]");
      if (el) {
        e.preventDefault();
        el.click();
      }
    }
  });

  /* --- Modal close --- */
  $("modalClose").addEventListener("click", () => $("songModal").classList.remove("open"));
  $("pickerClose").addEventListener("click", () => $("playlistPicker").classList.remove("open"));
  document.querySelectorAll(".modal-backdrop").forEach((m) =>
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.remove("open"); })
  );

  /* --- Sidebar / topnav --- */
  $("hamburger").addEventListener("click", openSidebarMobile);
  $("sidebarClose").addEventListener("click", closeSidebarMobile);
  $("sidebarOverlay").addEventListener("click", closeSidebarMobile);
  $("themeToggle").addEventListener("click", toggleTheme);
  $("themeToggle2").addEventListener("click", toggleTheme);
  $("notifBtn").addEventListener("click", () => toast("🔔 You have 3 new recommendations!"));
  $("premiumBtn").addEventListener("click", () => toast("💎 Premium coming soon!"));

  /* --- Hero buttons --- */
  $("exploreBtn").addEventListener("click", () => showView("discover"));
  $("startBtn").addEventListener("click", () => playSong(songs[0], songs));

  /* --- Search --- */
  const searchInput = $("searchInput");
  let searchDeb;
  searchInput.addEventListener("input", () => {
    $("searchClear").classList.toggle("show", searchInput.value.length > 0);
    clearTimeout(searchDeb);
    searchDeb = setTimeout(() => searchSongs(searchInput.value), 200);
  });
  $("searchClear").addEventListener("click", () => {
    searchInput.value = "";
    $("searchClear").classList.remove("show");
    showView("home");
    searchInput.focus();
  });

  /* --- Playlists view --- */
  $("newPlaylistBtn").addEventListener("click", () => {
    const name = prompt("Name your new playlist:");
    if (name && name.trim()) createPlaylist(name.trim());
  });

  /* --- Recent --- */
  $("clearRecentBtn").addEventListener("click", () => {
    recentIds = [];
    store.set("recent", recentIds);
    renderRecent();
    toast("🕒 History cleared");
  });

  /* --- Settings --- */
  $("settingsVolume").addEventListener("input", (e) => setVolume(e.target.value / 100));
  $("resetDataBtn").addEventListener("click", () => {
    if (confirm("Reset all Pulse Music data (favorites, history, playlists)?")) {
      ["favorites", "recent", "playlists", "theme", "volume", "shuffle", "repeat", "lastSong"].forEach((k) => localStorage.removeItem("pulse_" + k));
      location.reload();
    }
  });

  /* --- Queue panel --- */
  $("queueBtn").addEventListener("click", () => { renderQueuePanel(); queuePanel.classList.toggle("open"); });
  $("closeQueueBtn").addEventListener("click", () => queuePanel.classList.remove("open"));
  $("clearQueueBtn").addEventListener("click", clearQueue);

  /* --- Global keyboard shortcuts --- */
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    switch (e.key) {
      case " ": e.preventDefault(); togglePlay(); break;
      case "ArrowRight": audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0); break;
      case "ArrowLeft": audio.currentTime = Math.max(audio.currentTime - 5, 0); break;
      case "ArrowUp": e.preventDefault(); setVolume(Math.min(audio.volume + 0.05, 1)); break;
      case "ArrowDown": e.preventDefault(); setVolume(Math.max(audio.volume - 0.05, 0)); break;
      case "Escape":
        queuePanel.classList.remove("open");
        document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("open"));
        break;
    }
  });
}

/* ==================== INIT ==================== */
function init() {
  // Theme
  applyTheme(store.get("theme", "dark"));

  // Volume (restore saved)
  const savedVol = store.get("volume", 0.8);
  setVolume(savedVol);
  $("settingsVolume").value = savedVol * 100;

  // Shuffle / repeat UI state
  $("shuffleBtn").classList.toggle("on", isShuffle);
  $("repeatBtn").classList.toggle("on", repeatMode !== "off");
  $("repeatBtn").textContent = repeatMode === "one" ? "🔂" : "🔁";

  // Render everything
  renderSongs();
  renderArtists();
  renderAlbums();
  renderGenres();
  renderFavorites();
  renderRecent();
  renderPlaylists();
  renderQueuePanel();
  updateStats();

  // Restore last played song (loaded but paused)
  const lastId = store.get("lastSong", null);
  const first = getSong(lastId) || songs[0];
  loadSong(first, songs);
  pauseSong();

  initEvents();

  // Loading screen → reveal app + player bar
  window.addEventListener("load", () => {
    setTimeout(() => {
      $("loader").classList.add("hide");
      playerBar.classList.add("show");
    }, 900);
  });
  // Fallback if load already fired or hangs on missing assets
  setTimeout(() => {
    $("loader").classList.add("hide");
    playerBar.classList.add("show");
  }, 3000);

  // Save last song when changing tracks
  audio.addEventListener("play", () => store.set("lastSong", currentQueue[currentIndex]?.id ?? null));
}

init();