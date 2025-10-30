(function(){
  const galleryEl = document.getElementById("gallery");
  const lightboxEl = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const filtersEl = document.getElementById("filters");
  const searchInput = document.getElementById("search");
  const musicBtn = document.getElementById("musicToggle");
  const bgm = document.getElementById("bgm");
  const musicShow = document.getElementById("musicShow");
  const themeToggle = document.getElementById("themeToggle");
  const fallingCanvas = document.getElementById("fallingDecor");

  function isVideoUrl(url){
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
  }
  function parseYouTubeId(url){
    try{
      var u = new URL(url);
      var host = u.hostname.replace(/^www\./, "");
      if(host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com"){
        if(u.searchParams.get("v")) return u.searchParams.get("v");
        var parts = u.pathname.split("/").filter(Boolean);
        var i = parts.indexOf("shorts");
        if(i !== -1 && parts[i+1]) return parts[i+1];
        i = parts.indexOf("embed");
        if(i !== -1 && parts[i+1]) return parts[i+1];
      }
      if(host === "youtu.be"){
        var segs = u.pathname.split("/").filter(Boolean);
        if(segs[0]) return segs[0];
      }
    } catch(e){}
    return null;
  }

  function normalizePhotos(input){
    if(typeof input === "string"){
      return input
        .split(/[\,\n]/)
        .map(function(s){ return s.trim().replace(/^@+/, ""); })
        .filter(function(s){ return s.length > 0; })
        .map(function(url){
          var yt = parseYouTubeId(url);
          if(yt){ return { url: url, type: "youtube", youtubeId: yt }; }
          return { url: url, type: isVideoUrl(url) ? "video" : "image" };
        });
    }
    if(Array.isArray(input)){
      if(input.length === 0) return [];
      if(typeof input[0] === "string"){
        return input
          .map(function(s){ return String(s).trim(); })
          .filter(function(s){ return s.length > 0; })
          .map(function(url){
            var yt = parseYouTubeId(url);
            if(yt){ return { url: url, type: "youtube", youtubeId: yt }; }
            return { url: url, type: isVideoUrl(url) ? "video" : "image" };
          });
      }
      return input.map(function(it){
        if(!it) return it;
        if(!it.type && it.url){
          var yt = parseYouTubeId(it.url);
          if(yt){ it.type = "youtube"; it.youtubeId = yt; }
          else { it.type = isVideoUrl(it.url) ? "video" : "image"; }
        }
        return it;
      });
    }
    return [];
  }

  function inferTitleFromUrl(url){
    try{
      var u = url;
      // Remove query/hash
      u = u.split("?")[0].split("#")[0];
      var parts = u.split("/");
      var last = parts[parts.length-1] || "";
      var name = last.replace(/\.[a-z0-9]+$/i, "");
      return name;
    } catch(e){ return ""; }
  }

  function createCard(photo, index){
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    var displayTitle = photo.title || inferTitleFromUrl(photo.url);
    card.setAttribute("aria-label", displayTitle ? ("Xem: " + displayTitle) : "Xem ảnh");

    var mediaEl;
    if(photo.type === "video"){
      mediaEl = document.createElement("video");
      mediaEl.muted = true;
      mediaEl.playsInline = true;
      mediaEl.src = photo.url;
      mediaEl.preload = "metadata";
      const playTag = document.createElement("div");
      playTag.className = "card__play";
      playTag.textContent = "▶ Video";
      card.appendChild(mediaEl);
      card.appendChild(playTag);
    } else if(photo.type === "youtube"){
      mediaEl = document.createElement("img");
      mediaEl.loading = "lazy";
      mediaEl.decoding = "async";
      var thumb = photo.youtubeId ? ("https://img.youtube.com/vi/"+photo.youtubeId+"/hqdefault.jpg") : photo.url;
      mediaEl.src = thumb;
      mediaEl.alt = displayTitle || "YouTube";
      const playTag = document.createElement("div");
      playTag.className = "card__play";
      playTag.textContent = "▶ YouTube";
      card.appendChild(mediaEl);
      card.appendChild(playTag);
    } else {
      mediaEl = document.createElement("img");
      mediaEl.loading = "lazy";
      mediaEl.decoding = "async";
      mediaEl.src = photo.url;
      mediaEl.alt = displayTitle || "Kỷ niệm";
      card.appendChild(mediaEl);
    }

    const caption = document.createElement("div");
    caption.className = "card__caption";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = displayTitle || "";
    caption.appendChild(titleSpan);
    // year badge removed

    // mediaEl was already appended above
    card.appendChild(caption);

    card.addEventListener("click", function(){
      openLightboxByIndex(typeof index === "number" ? index : currentData.indexOf(photo));
    });

    return card;
  }

  const lightboxVideo = document.getElementById("lightboxVideo");
  const lightboxFrame = document.getElementById("lightboxFrame");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  var currentIndex = -1;

  function openLightbox(photo){
    if(photo.type === "video"){
      if(lightboxVideo){
        lightboxVideo.style.display = "block";
        lightboxImg.style.display = "none";
        if(lightboxFrame){ lightboxFrame.removeAttribute("src"); lightboxFrame.style.display = "none"; }
        lightboxVideo.src = photo.url;
        lightboxVideo.currentTime = 0;
        lightboxVideo.play().catch(function(){});
      }
    } else if(photo.type === "youtube"){
      if(lightboxFrame){
        lightboxFrame.style.display = "block";
        lightboxImg.style.display = "none";
        if(lightboxVideo){ lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.load(); lightboxVideo.style.display = "none"; }
        var embed = photo.youtubeId ? ("https://www.youtube.com/embed/"+photo.youtubeId+"?autoplay=1&rel=0") : photo.url;
        lightboxFrame.src = embed;
      }
    } else {
      lightboxImg.src = photo.url;
      lightboxImg.alt = photo.title || "Ảnh kỷ niệm";
      if(lightboxVideo){ lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.load(); lightboxVideo.style.display = "none"; }
      if(lightboxFrame){ lightboxFrame.removeAttribute("src"); lightboxFrame.style.display = "none"; }
      lightboxImg.style.display = "block";
    }
    // Hide caption content in lightbox (no title/number shown)
    lightboxCaption.textContent = "";
    // hide badge if any
    lightboxEl.classList.add("show");
    lightboxEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function openLightboxByIndex(index){
    if(!currentData || currentData.length === 0) return;
    currentIndex = (index + currentData.length) % currentData.length;
    openLightbox(currentData[currentIndex]);
  }

  function closeLightbox(){
    lightboxEl.classList.remove("show");
    lightboxEl.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    if(lightboxVideo){ lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.load(); lightboxVideo.style.display = "none"; }
    if(lightboxFrame){ lightboxFrame.removeAttribute("src"); lightboxFrame.style.display = "none"; }
    document.body.style.overflow = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxEl.addEventListener("click", function(e){
    if(e.target === lightboxEl){ closeLightbox(); }
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && lightboxEl.classList.contains("show")){
      closeLightbox();
    } else if((e.key === "ArrowRight" || e.key === "d") && lightboxEl.classList.contains("show")){
      openLightboxByIndex(currentIndex + 1);
    } else if((e.key === "ArrowLeft" || e.key === "a") && lightboxEl.classList.contains("show")){
      openLightboxByIndex(currentIndex - 1);
    }
  });

  if(lightboxPrev){ lightboxPrev.addEventListener("click", function(){ openLightboxByIndex(currentIndex - 1); }); }
  if(lightboxNext){ lightboxNext.addEventListener("click", function(){ openLightboxByIndex(currentIndex + 1); }); }

  function getCategories(){
    // Ưu tiên CATEGORIES. Nếu không có, rơi về PHOTOS (mặc định "Tất cả").
    if(typeof window !== "undefined" && window.CATEGORIES !== undefined){ return window.CATEGORIES; }
    if(typeof CATEGORIES !== "undefined"){ return CATEGORIES; }
    var photosRaw = (typeof window !== "undefined" && window.PHOTOS !== undefined) ? window.PHOTOS : (typeof PHOTOS !== "undefined" ? PHOTOS : []);
    return { TatCa: photosRaw };
  }

  function categoryDisplayName(key){
    if(key === "TatCa") return "Tất cả";
    if(key === "Tiểu Đội 203") return "Tiểu Đội 203";
    if(key === "Tiểu Đội 204") return "Tiểu Đội 204";
    if(key === "Tiểu Đội 301") return "Tiểu Đội 301";
    if(key === "Tiểu Đội 302") return "Tiểu Đội 302";
    if(key === "Tiểu Đội 303") return "Tiểu Đội 303";
    if(key === "Tiểu Đội 304") return "Tiểu Đội 304";
    return key;
  }

  function buildFilterBar(keys, activeKey){
    if(!filtersEl) return;
    filtersEl.innerHTML = "";
    keys.forEach(function(key){
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.type = "button";
      btn.textContent = categoryDisplayName(key);
      const pressed = key === activeKey;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      if(pressed){ btn.classList.add("active"); }
      btn.addEventListener("click", function(){
        currentCategory = key;
        resetAndRender();
      });
      filtersEl.appendChild(btn);
    });
  }

  function flattenAll(categories){
    var all = [];
    Object.keys(categories).forEach(function(key){
      var list = normalizePhotos(categories[key]);
      all = all.concat(list);
    });
    return all;
  }

  var currentCategory = "TatCa";
  var currentData = [];
  var searchTerm = "";
  var pageSize = 24;
  var pageIndex = 0;
  const loadMoreBtn = document.getElementById("loadMore");

  function updateLoadMoreVisibility(){
    if(!loadMoreBtn) return;
    var loaded = Math.min((pageIndex+1)*pageSize, currentData.length);
    var hasMore = loaded < currentData.length;
    loadMoreBtn.hidden = !hasMore;
  }

  function renderPage(){
    var start = pageIndex * pageSize;
    var end = Math.min(start + pageSize, currentData.length);
    for(var i=start;i<end;i++){
      const card = createCard(currentData[i], i);
      // Boost priority for the very first rows
      var imgEl = card.querySelector("img");
      if(imgEl){
        if(i < 8){ imgEl.setAttribute("fetchpriority", "high"); }
        imgEl.style.opacity = "0";
        imgEl.addEventListener("load", function(){ this.decode && this.decode().catch(function(){}).finally(()=>{ this.style.transition = "opacity .3s ease"; this.style.opacity = "1"; }); }.bind(imgEl), { once:true });
      }
      galleryEl.appendChild(card);
    }
    updateLoadMoreVisibility();
  }

  function resetAndRender(){
    galleryEl.innerHTML = "";
    pageIndex = 0;
    render();
    renderPage();
  }

  function render(){
    var cats = getCategories();
    var keys = Object.keys(cats);
    // Bảo đảm có "TatCa" là nhóm tổng hợp
    if(keys.indexOf("TatCa") === -1){
      cats = Object.assign({ TatCa: flattenAll(cats) }, cats);
      keys = Object.keys(cats);
    }
    // Xây filter nếu có thanh filter
    buildFilterBar(keys, currentCategory);

    var data;
    var selected = cats[currentCategory];
    if(currentCategory === "TatCa" && Array.isArray(selected)){
      data = selected; // đã là mảng chuẩn hoá khi tạo ở trên
    } else {
      data = normalizePhotos(selected);
    }
    // Derive title if missing
    data = data.map(function(it){
      if(!it) return it;
      if(!it.title && it.url){ it.title = inferTitleFromUrl(it.url); }
      return it;
    });
    // Apply search filter
    var q = searchTerm.trim().toLowerCase();
    if(q){
      data = data.filter(function(it){
        var t = (it.title || "").toLowerCase();
        var u = (it.url || "").toLowerCase();
        var y = (it.year ? String(it.year) : "").toLowerCase();
        return t.indexOf(q) !== -1 || u.indexOf(q) !== -1 || y.indexOf(q) !== -1;
      });
    }
    currentData = data;
  }

  // Music controls
  if(bgm){ bgm.volume = 0.5; }
  function updateMusicUI(isPlaying){
    if(!musicBtn) return;
    musicBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    musicBtn.textContent = isPlaying ? "⏸" : "♫";
  }
  // Playlist support
  var playlist = (typeof window !== "undefined" && Array.isArray(window.MUSIC_PLAYLIST)) ? window.MUSIC_PLAYLIST : ["music.mp3"];
  var trackIndex = 0;
  function loadTrack(index){
    if(!bgm) return;
    trackIndex = (index + playlist.length) % playlist.length;
    bgm.src = String(playlist[trackIndex]);
  }
  function playCurrent(){
    if(!bgm) return;
    bgm.play().then(function(){ updateMusicUI(true); }).catch(function(){ /* user gesture may be needed */ });
  }
  function playNext(){
    if(!bgm) return;
    loadTrack(trackIndex + 1);
    playCurrent();
  }
  if(musicBtn && bgm){
    // initialize first track
    loadTrack(0);
    musicBtn.addEventListener("click", function(){
      if(bgm.paused){
        // if no src yet, ensure loaded
        if(!bgm.src){ loadTrack(trackIndex); }
        playCurrent();
      } else {
        bgm.pause();
        updateMusicUI(false);
      }
    });
    // Double-click to hide button; show small tab to restore
    musicBtn.addEventListener("dblclick", function(){
      musicBtn.classList.add("hidden");
      if(musicShow){ musicShow.style.display = "inline-block"; }
    });
    if(musicShow){
      musicShow.addEventListener("click", function(){
        musicBtn.classList.remove("hidden");
        musicShow.style.display = "none";
      });
    }
    bgm.addEventListener("ended", function(){
      if(playlist.length > 1){
        playNext();
      } else {
        updateMusicUI(false);
      }
    });
  }

  if(loadMoreBtn){
    loadMoreBtn.addEventListener("click", function(){
      pageIndex += 1;
      renderPage();
    });
  }

  // Upgrade priority when approaching viewport
  var io;
  if('IntersectionObserver' in window){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          var t = en.target;
          if(t.tagName === 'IMG' && !t.getAttribute('fetchpriority')){
            t.setAttribute('fetchpriority','high');
          }
          io.unobserve(t);
        }
      });
    }, { rootMargin: '200px 0px' });
  }

  // Idle prefetch next batch
  function prefetchNextBatch(){
    var cb = window.requestIdleCallback || function(fn){ return setTimeout(fn, 300); };
    cb(function(){
      var nextStart = (pageIndex+1) * pageSize;
      var nextEnd = Math.min(nextStart + pageSize, currentData.length);
      for(var i=nextStart;i<nextEnd;i++){
        var p = currentData[i];
        if(!p || p.type === 'video') continue;
        var src = (p.type === 'youtube' && p.youtubeId) ? ("https://img.youtube.com/vi/"+p.youtubeId+"/hqdefault.jpg") : p.url;
        var im = new Image();
        im.decoding = 'async';
        im.loading = 'eager';
        im.src = src;
      }
    });
  }

  // Observe images after each render
  var _origRenderPage = renderPage;

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", resetAndRender);
  } else {
    resetAndRender();
  }

  // Search events
  if(searchInput){
    var handleSearch = function(){
      searchTerm = searchInput.value || "";
      resetAndRender();
    };
    searchInput.addEventListener("input", handleSearch);
  }

  // Theme toggle
  function setTheme(isDark){
    var pressed = !!isDark;
    document.body.classList.toggle("theme-dark", pressed);
    if(themeToggle){
      themeToggle.setAttribute("aria-pressed", pressed ? "true" : "false");
      themeToggle.textContent = pressed ? "☀" : "🌙";
    }
  }
  var savedTheme = null;
  try{ savedTheme = localStorage.getItem("theme"); }catch(e){}
  if(savedTheme === "dark"){ setTheme(true); }
  if(themeToggle){
    themeToggle.addEventListener("click", function(){
      var nowDark = !document.body.classList.contains("theme-dark");
      setTheme(nowDark);
      try{ localStorage.setItem("theme", nowDark ? "dark" : "light"); }catch(e){}
    });
  }

  // Falling decor animation (heart-shaped VN flag)
  (function(){
    if(!fallingCanvas) return;
    var ctx = fallingCanvas.getContext("2d");
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var width = 0, height = 0;
    function resize(){
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      fallingCanvas.width = Math.floor(width * dpr);
      fallingCanvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener("resize", resize);

    var img = new Image();
    img.src = "img2/laco.png";
    var particles = [];
    function spawnParticle(){
      var baseSize = 22 + Math.random()*26; // 22-48 px
      particles.push({
        x: Math.random() * width,
        y: -60 - Math.random()*200,
        size: baseSize,
        vx: (-0.3 + Math.random()*0.6),
        vy: 0.8 + Math.random()*1.6,
        rot: Math.random()*Math.PI*2,
        spin: (-0.02 + Math.random()*0.04),
        opacity: 0.8 + Math.random()*0.2
      });
    }
    function targetCount(){
      var area = Math.max(1, width * height);
      // roughly 35 on laptop, scale with area
      return Math.min(80, Math.max(12, Math.floor(area / 45000)));
    }

    var rafId = 0;
    function tick(){
      ctx.clearRect(0,0,width,height);
      // ensure enough particles
      for(var i=particles.length;i<targetCount();i++){ spawnParticle(); }
      // update/draw
      for(var j=particles.length-1;j>=0;j--){
        var p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        if(p.y - p.size > height + 40){
          particles.splice(j,1);
          continue;
        }
        if(!img.complete) continue;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(img, -p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      }
      rafId = requestAnimationFrame(tick);
    }

    // Pause when tab hidden
    function handleVis(){
      if(document.hidden){ cancelAnimationFrame(rafId); }
      else { rafId = requestAnimationFrame(tick); }
    }
    document.addEventListener("visibilitychange", handleVis);
    rafId = requestAnimationFrame(tick);
  })();
})();

