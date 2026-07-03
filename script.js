const app = document.getElementById("app");

let BLOG_POSTS = [];
let SITE_SETTINGS = {};

const DEFAULT_SITE_SETTINGS = {
  siteName: "WANGGU BLOG",
  brandInitial: "W",
  metaDescription: "WANGGU BLOG - 记录技术、跨境电商与自由职业生活",
  heroEyebrow: "PERSONAL BLOG",
  heroTitle: "记录技术、跨境电商\n与自由职业生活。",
  heroDescription: "这里分享我正在做的项目、解决过的问题，以及一路上的经验和想法。",
  featuredTitle: "精选文章",
  updateTitle: "持续更新中",
  updateDescription: "博客会继续记录技术实践、跨境业务和个人成长。",
  aboutTitle: "你好，我是这个博客的作者。",
  aboutParagraph1: "我是一名自由职业者，平时关注技术工具、跨境电商、网站搭建与效率提升。",
  aboutParagraph2: "这个博客用来记录真实的实践过程：做过什么、踩过哪些坑、最后怎样解决。",
  aboutParagraph3: "这里不会刻意追求复杂，内容会尽量直接、清楚、可操作。",
  authorName: "WANGGU",
  authorTagline: "自由职业者 · 实践者 · 持续学习",
  topics: "技术 / 跨境电商 / 效率工具",
  website: "wanggu.top",
  footerText: "由 Cloudflare Pages 托管"
};

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadBlogContent() {
  const version = Date.now();

  try {
    const [siteResponse, postsResponse] = await Promise.all([
      fetch(`site.json?v=${version}`, { cache: "no-store" }),
      fetch(`posts.json?v=${version}`, { cache: "no-store" })
    ]);

    if (!siteResponse.ok || !postsResponse.ok) {
      throw new Error("内容文件读取失败");
    }

    SITE_SETTINGS = {
      ...DEFAULT_SITE_SETTINGS,
      ...(await siteResponse.json())
    };

    const loadedPosts = await postsResponse.json();
    BLOG_POSTS = Array.isArray(loadedPosts) ? loadedPosts : [];
  } catch (error) {
    console.error(error);
    SITE_SETTINGS = { ...DEFAULT_SITE_SETTINGS };
    BLOG_POSTS = [];
  }

  applyGlobalSettings();
}

function applyGlobalSettings() {
  const siteName = SITE_SETTINGS.siteName || DEFAULT_SITE_SETTINGS.siteName;
  document.title = siteName;

  const values = {
    brandMark: SITE_SETTINGS.brandInitial,
    brandText: siteName,
    footerSiteName: siteName,
    footerText: SITE_SETTINGS.footerText
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  });

  const meta = document.getElementById("metaDescription");
  if (meta) {
    meta.setAttribute(
      "content",
      SITE_SETTINGS.metaDescription || DEFAULT_SITE_SETTINGS.metaDescription
    );
  }
}
const year = document.getElementById("year");
const themeToggle = document.getElementById("themeToggle");

year.textContent = new Date().getFullYear();

const savedTheme = localStorage.getItem("wanggu-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.dataset.theme = "dark";
}

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  if (nextTheme === "light") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = "dark";
  }

  localStorage.setItem("wanggu-theme", nextTheme);
});

function cloneTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function renderPostCard(post) {
  const coverStyle = post.cover
    ? ` style="--post-cover: url('${encodeURI(post.cover)}')"`
    : "";

  return `
    <a class="post-card card ${post.cover ? "has-cover" : ""}"
       href="#post/${encodeURIComponent(post.id)}"${coverStyle}>
      <span class="tag">${escapeHTML(post.category)}</span>
      <h3>${escapeHTML(post.title)}</h3>
      <p>${escapeHTML(post.excerpt)}</p>
      <div class="post-card-bottom">
        <span>${formatDate(post.date)}</span>
        <span>${escapeHTML(post.readTime || "5 分钟")}</span>
      </div>
    </a>
  `;
}

function setActiveNav(route) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const key = link.dataset.nav;
    const isActive =
      key === route ||
      (route === "post" && key === "articles");

    link.classList.toggle("active", isActive);
  });
}

function renderHome() {
  app.replaceChildren(cloneTemplate("homeTemplate"));

  const values = {
    heroEyebrow: SITE_SETTINGS.heroEyebrow,
    heroDescription: SITE_SETTINGS.heroDescription,
    featuredTitle: SITE_SETTINGS.featuredTitle,
    updateTitle: SITE_SETTINGS.updateTitle,
    updateDescription: SITE_SETTINGS.updateDescription
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  });

  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) {
    heroTitle.innerHTML = escapeHTML(
      SITE_SETTINGS.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle
    ).replaceAll("\n", "<br />");
  }

  const featured = BLOG_POSTS
    .filter((post) => post.featured)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);

  document.getElementById("featuredPosts").innerHTML =
    featured.length
      ? featured.map(renderPostCard).join("")
      : '<div class="empty-state card"><strong>还没有精选文章</strong><span>请在博客后台把文章设为“首页精选”。</span></div>';

  setActiveNav("home");
}

function renderArticles() {
  app.replaceChildren(cloneTemplate("articlesTemplate"));

  const input = document.getElementById("searchInput");
  const list = document.getElementById("articleList");
  const filters = document.getElementById("categoryFilters");
  const empty = document.getElementById("emptyState");

  const categories = ["全部", ...new Set(BLOG_POSTS.map((post) => post.category))];
  let activeCategory = "全部";

  filters.innerHTML = categories.map((category, index) => `
    <button class="filter-btn ${index === 0 ? "active" : ""}" data-category="${category}" type="button">
      ${category}
    </button>
  `).join("");

  function updateList() {
    const keyword = input.value.trim().toLowerCase();

    const filtered = [...BLOG_POSTS].sort((a, b) => String(b.date).localeCompare(String(a.date))).filter((post) => {
      const matchesCategory =
        activeCategory === "全部" || post.category === activeCategory;

      const haystack =
        `${post.title} ${post.excerpt} ${post.category}`.toLowerCase();

      return matchesCategory && haystack.includes(keyword);
    });

    list.innerHTML = filtered.map((post) => `
      <a class="post-list-item card ${post.cover ? "has-cover" : ""}" href="#post/${post.id}">
        ${post.cover ? `<img class="post-list-thumb" src="${encodeURI(post.cover)}" alt="${escapeHTML(post.title)}" loading="lazy" />` : `<div class="date">${formatDate(post.date)}</div>`}
        <div>
          ${post.cover ? `<div class="date">${formatDate(post.date)}</div>` : ""}
          <span class="tag">${escapeHTML(post.category)}</span>
          <h3>${escapeHTML(post.title)}</h3>
          <p>${escapeHTML(post.excerpt)}</p>
        </div>
        <span class="arrow">→</span>
      </a>
    `).join("");

    empty.hidden = filtered.length !== 0;
  }

  input.addEventListener("input", updateList);

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    activeCategory = button.dataset.category;
    filters.querySelectorAll(".filter-btn").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    updateList();
  });

  updateList();
  setActiveNav("articles");
}

function renderAbout() {
  app.replaceChildren(cloneTemplate("aboutTemplate"));

  const values = {
    aboutTitle: SITE_SETTINGS.aboutTitle,
    aboutParagraph1: SITE_SETTINGS.aboutParagraph1,
    aboutParagraph2: SITE_SETTINGS.aboutParagraph2,
    aboutParagraph3: SITE_SETTINGS.aboutParagraph3,
    profileAvatar: SITE_SETTINGS.brandInitial,
    authorName: SITE_SETTINGS.authorName,
    authorTagline: SITE_SETTINGS.authorTagline,
    topics: SITE_SETTINGS.topics,
    websiteAddress: SITE_SETTINGS.website
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  });

  setActiveNav("about");
}

function renderPost(postId) {
  const post = BLOG_POSTS.find((item) => item.id === postId);

  if (!post) {
    location.hash = "#articles";
    return;
  }

  app.replaceChildren(cloneTemplate("postTemplate"));

  document.getElementById("postMeta").innerHTML = `
    <span class="tag">${escapeHTML(post.category)}</span>
    <span>${formatDate(post.date)}</span>
    <span>·</span>
    <span>${escapeHTML(post.readTime || "5 分钟")}</span>
  `;

  document.getElementById("postTitle").textContent = post.title;
  document.getElementById("postExcerpt").textContent = post.excerpt;
  document.getElementById("postContent").innerHTML = post.content || "";

  const coverWrap = document.getElementById("postCoverWrap");
  const coverImage = document.getElementById("postCoverImage");
  if (post.cover && coverWrap && coverImage) {
    coverWrap.hidden = false;
    coverImage.src = encodeURI(post.cover);
    coverImage.alt = post.title;
  }

  document.title = `${post.title} - ${SITE_SETTINGS.siteName || "WANGGU BLOG"}`;
  setupContentImages();
  setActiveNav("post");
}

function router() {
  const raw = location.hash.replace(/^#/, "") || "home";
  const [route, param] = raw.split("/");

  document.title = SITE_SETTINGS.siteName || "WANGGU BLOG";

  if (route === "articles") {
    renderArticles();
  } else if (route === "about") {
    renderAbout();
  } else if (route === "post") {
    renderPost(param);
  } else {
    renderHome();
  }

  app.classList.remove("route-enter");
  void app.offsetWidth;
  app.classList.add("route-enter");

  window.scrollTo({ top: 0, behavior: "instant" });
  requestAnimationFrame(() => setupDynamicEffects(app));
}

window.addEventListener("hashchange", router);
loadBlogContent().then(router);


/* =========================
   动态效果增强版
   ========================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollProgress = document.getElementById("scrollProgress");
const cursorGlow = document.getElementById("cursorGlow");
const ambientCanvas = document.getElementById("ambientCanvas");
const topbar = document.querySelector(".topbar");
let revealObserver = null;

// 首次进入时的加载动画
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  window.setTimeout(() => {
    loader?.classList.add("loader-hidden");
  }, reduceMotion.matches ? 0 : 650);
});

// 滚动进度和悬浮导航栏
function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  if (scrollProgress) {
    scrollProgress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  topbar?.classList.toggle("scrolled", window.scrollY > 20);
}

window.addEventListener("scroll", updateScrollEffects, { passive: true });
window.addEventListener("resize", updateScrollEffects);
updateScrollEffects();

// 鼠标跟随光晕
if (cursorGlow && !reduceMotion.matches) {
  let glowX = window.innerWidth / 2;
  let glowY = window.innerHeight / 2;
  let targetX = glowX;
  let targetY = glowY;

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    targetX = event.clientX;
    targetY = event.clientY;
    cursorGlow.classList.add("visible");
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    cursorGlow.classList.remove("visible");
  });

  const animateGlow = () => {
    glowX += (targetX - glowX) * 0.16;
    glowY += (targetY - glowY) * 0.16;
    cursorGlow.style.transform =
      `translate3d(${glowX - 210}px, ${glowY - 210}px, 0)`;
    requestAnimationFrame(animateGlow);
  };

  animateGlow();
}

// 轻量动态粒子背景
function startAmbientCanvas() {
  if (!ambientCanvas || reduceMotion.matches) return;

  const context = ambientCanvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let ratio = 1;
  let particles = [];
  const pointer = { x: -9999, y: -9999 };

  function createParticles() {
    const count = window.innerWidth < 700 ? 16 : 34;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.19,
      vy: (Math.random() - 0.5) * 0.19,
      radius: Math.random() * 1.5 + 0.45,
      alpha: Math.random() * 0.28 + 0.08
    }));
  }

  function resizeCanvas() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    ambientCanvas.width = Math.floor(width * ratio);
    ambientCanvas.height = Math.floor(height * ratio);
    ambientCanvas.style.width = `${width}px`;
    ambientCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });

  function draw() {
    context.clearRect(0, 0, width, height);

    const dark = document.documentElement.dataset.theme === "dark";
    const rgb = dark ? "255,255,255" : "20,20,20";

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];

      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 110 && distance > 0) {
        const force = (110 - distance) / 110;
        particle.x += (dx / distance) * force * 0.5;
        particle.y += (dy / distance) * force * 0.5;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -10) particle.x = width + 10;
      if (particle.x > width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = height + 10;
      if (particle.y > height + 10) particle.y = -10;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${rgb},${particle.alpha})`;
      context.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const lineDistance = Math.hypot(
          particle.x - other.x,
          particle.y - other.y
        );

        if (lineDistance < 105) {
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle =
            `rgba(${rgb},${(1 - lineDistance / 105) * 0.035})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resizeCanvas();
  draw();
}

startAmbientCanvas();

// 页面每次渲染后初始化动态效果
function setupDynamicEffects(root) {
  if (!root) return;

  setupReveal(root);
  setupTiltCards(root);
  setupMagneticButtons(root);
  setupRipples(root);
  setupHeroParallax(root);
}

// 滚动进入视区动画
function setupReveal(root) {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const elements = root.querySelectorAll(
    ".hero, .section-head, .post-card, .newsletter, .page-heading, " +
    ".toolbar, .post-list-item, .about-main, .about-side > *, " +
    ".post-header, .article-body"
  );

  elements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty(
      "--reveal-delay",
      `${Math.min(index % 6, 5) * 70}ms`
    );
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("revealed"));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("revealed");
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -45px"
  });

  elements.forEach((element) => revealObserver.observe(element));
}

// 卡片 3D 倾斜与高光
function setupTiltCards(root) {
  if (reduceMotion.matches || !window.matchMedia("(hover: hover)").matches) {
    return;
  }

  const cards = root.querySelectorAll(
    ".post-card, .post-list-item, .profile-card, .mini-card, .newsletter"
  );

  cards.forEach((card) => {
    card.classList.add("interactive-card");

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 6;
      const rotateY = (x - 0.5) * 7;

      card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--shine-x", "50%");
      card.style.setProperty("--shine-y", "50%");
    });
  });
}

// 按钮磁吸效果
function setupMagneticButtons(root) {
  if (reduceMotion.matches || !window.matchMedia("(hover: hover)").matches) {
    return;
  }

  root.querySelectorAll(
    ".primary-btn, .ghost-btn, .filter-btn, .text-link, .back-link"
  ).forEach((element) => {
    element.classList.add("magnetic");

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);

      element.style.setProperty("--mag-x", `${x * 0.09}px`);
      element.style.setProperty("--mag-y", `${y * 0.09}px`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--mag-x", "0px");
      element.style.setProperty("--mag-y", "0px");
    });
  });
}

// 点击水波纹
function setupRipples(root) {
  root.querySelectorAll(
    ".primary-btn, .ghost-btn, .filter-btn, .icon-btn"
  ).forEach((element) => {
    element.addEventListener("pointerdown", (event) => {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple-wave";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
}

// 首页插画随鼠标轻微漂移
function setupHeroParallax(root) {
  if (reduceMotion.matches || !window.matchMedia("(hover: hover)").matches) {
    return;
  }

  const hero = root.querySelector(".hero");
  if (!hero) return;

  const orbA = hero.querySelector(".orb-a");
  const orbB = hero.querySelector(".orb-b");
  const cardOne = hero.querySelector(".art-card-one");
  const cardTwo = hero.querySelector(".art-card-two");
  const cardThree = hero.querySelector(".art-card-three");

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (orbA) orbA.style.transform =
      `translate3d(${x * -18}px, ${y * -18}px, 0)`;
    if (orbB) orbB.style.transform =
      `translate3d(${x * 12}px, ${y * 12}px, 0) rotate(${x * 7}deg)`;
    if (cardOne) cardOne.style.transform =
      `translate3d(${x * -25}px, ${y * -20}px, 0) rotate(${-7 + x * 4}deg)`;
    if (cardTwo) cardTwo.style.transform =
      `translate3d(${x * 22}px, ${y * 18}px, 0) rotate(${8 + x * 4}deg)`;
    if (cardThree) cardThree.style.transform =
      `translate3d(${x * -12}px, ${y * 25}px, 0) rotate(${2 - x * 3}deg)`;
  });

  hero.addEventListener("pointerleave", () => {
    if (orbA) orbA.style.transform = "";
    if (orbB) orbB.style.transform = "";
    if (cardOne) cardOne.style.transform = "";
    if (cardTwo) cardTwo.style.transform = "";
    if (cardThree) cardThree.style.transform = "";
  });
}

// 顶部深色模式按钮也加入点击水波纹


function setupContentImages() {
  const content = document.getElementById("postContent");
  if (!content) return;

  content.querySelectorAll("img").forEach((image) => {
    if (!image.getAttribute("loading")) {
      image.setAttribute("loading", "lazy");
    }

    image.addEventListener("click", () => openImageLightbox(image.src, image.alt || ""));
  });
}

const imageLightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

function openImageLightbox(src, alt) {
  if (!imageLightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  imageLightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeImageLightbox() {
  if (!imageLightbox || !lightboxImage) return;
  imageLightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.style.overflow = "";
}

lightboxClose?.addEventListener("click", closeImageLightbox);

imageLightbox?.addEventListener("click", (event) => {
  if (event.target === imageLightbox) {
    closeImageLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageLightbox && !imageLightbox.hidden) {
    closeImageLightbox();
  }
});

setupRipples(document);
