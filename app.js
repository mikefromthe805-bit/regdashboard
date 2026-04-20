// ---- CONFIG ----
const FEEDS = [
  {
    id: "senate",
    label: "Senate Banking – Press Releases",
    url: "https://reg-proxy.mikefromthe805.workers.dev/senate/press",
  },
  {
    id: "hfsc",
    label: "House Financial Services – Press Releases",
    url: "https://reg-proxy.mikefromthe805.workers.dev/hfsc/press",
  },
  {
    id: "hfscHearings",
    label: "House Financial Services – Hearings",
    url: "https://reg-proxy.mikefromthe805.workers.dev/hfsc/hearings",
  },
  {
    id: "treasury",
    label: "U.S. Treasury – Press Releases",
    url: "https://reg-proxy.mikefromthe805.workers.dev/treasury/press",
  },
  {
    id: "circle",
    label: "Circle – Announcements",
    url: "https://reg-proxy.mikefromthe805.workers.dev/circle/rss",
  },
  {
    id: "paxos",
    label: "Paxos – Updates",
    url: "https://reg-proxy.mikefromthe805.workers.dev/paxos/rss",
  },
  {
    id: "paypal",
    label: "PayPal – News (PYUSD)",
    url: "https://reg-proxy.mikefromthe805.workers.dev/paypal/rss",
  },
  {
    id: "gemini",
    label: "Gemini – Updates",
    url: "https://reg-proxy.mikefromthe805.workers.dev/gemini/rss",
  },
];

// ---- SIGNAL SCORING ----
function scoreSignal(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  const highKeywords = [
    "stablecoin",
    "payment stablecoin",
    "digital asset market clarity",
    "genius act",
    "markup",
    "mark-up",
    "hearing",
    "legislation",
    "bill",
    "framework",
    "regulation",
    "regulatory",
  ];

  const mediumKeywords = [
    "crypto",
    "digital asset",
    "token",
    "blockchain",
    "web3",
    "pilot",
    "program",
    "guidance",
    "consultation",
  ];

  if (highKeywords.some(k => text.includes(k))) return "high";
  if (mediumKeywords.some(k => text.includes(k))) return "medium";
  return "low";
}

function signalLabel(level) {
  if (level === "high") return "HIGH";
  if (level === "medium") return "MED";
  return "LOW";
}

// ---- RENDERING ----
function renderFeed(container, label, items) {
  const now = new Date();

  const html = `
    <div class="feed-header">
      <h2>${label}</h2>
      <span class="feed-updated">Updated: ${now.toLocaleTimeString()}</span>
    </div>
    <div class="feed-items">
      ${items
        .slice(0, 8)
        .map(item => {
          const level = scoreSignal(item);
          const date = item.pubDate ? new Date(item.pubDate) : null;
          const dateStr = date ? date.toLocaleString() : "";

          return `
            <div class="feed-item feed-item-${level}">
              <div class="feed-item-top">
                <span class="signal signal-${level}">
                  ${signalLabel(level)}
                </span>
                <a href="${item.link}" target="_blank" class="feed-title">
                  ${item.title || "(no title)"}
                </a>
              </div>
              <div class="feed-meta">
                ${dateStr ? `<span class="feed-date">${dateStr}</span>` : ""}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  container.innerHTML = html;
}

// ---- FETCHING ----
async function loadFeed(feed) {
  const container = document.getElementById(feed.id);
  if (!container) return;

  container.innerHTML = `
    <div class="feed-header">
      <h2>${feed.label}</h2>
      <span class="feed-updated">Loading…</span>
    </div>
  `;

  try {
    const res = await fetch(feed.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = Array.isArray(data.items) ? data.items : [];
    renderFeed(container, feed.label, items);
  } catch (err) {
    container.innerHTML = `
      <div class="feed-header">
        <h2>${feed.label}</h2>
        <span class="feed-updated error">Error loading feed</span>
      </div>
      <pre class="error-details">${String(err)}</pre>
    `;
  }
}

async function loadAllFeeds() {
  await Promise.all(FEEDS.map(loadFeed));
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  loadAllFeeds();
  // auto-refresh every 60s
  setInterval(loadAllFeeds, 60000);
});
