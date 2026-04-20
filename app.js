const SOURCES = [
  {
    id: "hfsc",
    label: "House Financial Services",
    type: "regulator",
    url: "https://financialservices.house.gov/news/documentquery.aspx?DocumentTypeID=27",
  },
  {
    id: "senate-banking",
    label: "Senate Banking",
    type: "regulator",
    url: "https://www.banking.senate.gov/newsroom/majority-press-releases",
  },
  {
    id: "treasury",
    label: "U.S. Treasury",
    type: "regulator",
    url: "https://home.treasury.gov/news/press-releases",
  },
  {
    id: "fed",
    label: "Federal Reserve",
    type: "regulator",
    url: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
  },
  {
    id: "occ",
    label: "OCC",
    type: "regulator",
    url: "https://www.occ.gov/news-issuances/index-news-issuances.html",
  },
  {
    id: "circle",
    label: "Circle (USDC)",
    type: "issuer",
    url: "https://www.circle.com/blog",
  },
];

const KEYWORDS_HIGH = [
  "clarity act",
  "stablecoin",
  "payment stablecoin",
  "digital asset framework",
  "legislation",
  "markup",
  "committee vote",
  "floor vote",
  "signed into law",
];

const KEYWORDS_MEDIUM = [
  "guidance",
  "supervisory",
  "policy statement",
  "consultation",
  "proposal",
  "rulemaking",
];

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const regulatorsList = document.getElementById("regulators-list");
const issuersList = document.getElementById("issuers-list");
const metaList = document.getElementById("meta-list");
const regulatorsCount = document.getElementById("regulators-count");
const issuersCount = document.getElementById("issuers-count");
const lastUpdatedEl = document.getElementById("last-updated");
const refreshBtn = document.getElementById("refresh-btn");

function normalizeText(str) {
  return (str || "").toLowerCase();
}

function scorePriority(title, summary) {
  const text = normalizeText(title + " " + summary);

  if (KEYWORDS_HIGH.some((k) => text.includes(k))) return "high";
  if (KEYWORDS_MEDIUM.some((k) => text.includes(k))) return "medium";
  return "low";
}

function parseItemsFromHtml(html, source) {
  // Very lightweight heuristic parsing; you can refine per‑source later.
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [];

  // Try generic article / list selectors
  const candidates = doc.querySelectorAll("article, .press-release, .news-item, li, .post");

  candidates.forEach((node) => {
    const link = node.querySelector("a[href]");
    if (!link) return;

    const title = link.textContent.trim();
    if (!title) return;

    const href = link.getAttribute("href");
    const url = href.startsWith("http")
      ? href
      : new URL(href, source.url).toString();

    const timeNode =
      node.querySelector("time") ||
      node.querySelector(".date") ||
      node.querySelector(".pubdate");

    const summaryNode =
      node.querySelector("p") ||
      node.querySelector(".summary") ||
      node.querySelector(".dek");

    const summary = summaryNode ? summaryNode.textContent.trim() : "";
    const priority = scorePriority(title, summary);

    let timestamp = timeNode ? timeNode.getAttribute("datetime") || timeNode.textContent.trim() : "";
    items.push({
      sourceId: source.id,
      sourceLabel: source.label,
      type: source.type,
      title,
      url,
      summary,
      priority,
      timestamp,
    });
  });

  return items;
}

async function fetchSource(source) {
  try {
    const res = await fetch
