document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  const { apiKey, expiration } = await chrome.storage.sync.get(["apiKey", "expiration"]);

  if (apiKey) {
    document.getElementById("apiKey").value = apiKey;
  }

  if (expiration) {
    document.getElementById("expiration").value = expiration;
  }

  // Load history
  renderHistory();

  // Toggle API key visibility
  document.getElementById("toggleBtn").addEventListener("click", () => {
    const input = document.getElementById("apiKey");
    const btn = document.getElementById("toggleBtn");
    const icon = btn.querySelector("svg");

    if (input.type === "password") {
      input.type = "text";
      // Eye Off Icon
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
      input.type = "password";
      // Eye Icon
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  });

  // Save settings
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    const expiration = document.getElementById("expiration").value;

    if (!apiKey) {
      showStatus("API Key required", "error");
      return;
    }

    await chrome.storage.sync.set({ apiKey, expiration });
    showStatus("Saved.", "success");
  });

  // Clear history
  document.getElementById("clearHistoryBtn").addEventListener("click", async () => {
    // Only ask if there is history
    const { history = [] } = await chrome.storage.local.get(["history"]);
    if (history.length === 0) return;

    if (confirm("Clear history?")) {
      await chrome.storage.local.set({ history: [] });
      renderHistory();
      showStatus("Cleared", "success");
    }
  });
});

async function renderHistory() {
  const { history = [] } = await chrome.storage.local.get(["history"]);
  const container = document.getElementById("historyList");

  // clear container safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (history.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "No uploads.";
    container.appendChild(emptyState);
    return;
  }

  history.forEach((item) => {
    const timeAgo = getTimeAgo(item.timestamp);

    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item";

    // Thumbnail
    const img = document.createElement("img");
    img.src = item.thumb;
    img.className = "history-thumb";
    img.alt = "Thumbnail";
    img.loading = "lazy";
    itemDiv.appendChild(img);

    // Content
    const contentDiv = document.createElement("div");
    contentDiv.className = "history-content";

    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.className = "history-link";
    link.title = item.url;
    link.textContent = item.url;
    contentDiv.appendChild(link);

    const metaDiv = document.createElement("div");
    metaDiv.className = "history-meta";
    metaDiv.textContent = timeAgo;
    contentDiv.appendChild(metaDiv);

    itemDiv.appendChild(contentDiv);

    // Actions
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "history-actions";

    const copyLinkBtn = createActionButton(item.url, "link", "Copy Link");
    const copyBbBtn = createActionButton(item.url, "bb", "Copy BB Code");

    actionsDiv.appendChild(copyLinkBtn);
    actionsDiv.appendChild(copyBbBtn);
    itemDiv.appendChild(actionsDiv);

    container.appendChild(itemDiv);
  });
}

function createActionButton(url, type, title) {
  const btn = document.createElement("button");
  btn.className = "btn-action";
  btn.dataset.url = url;
  btn.dataset.type = type;
  btn.title = title;

  // Create icon using DOM methods
  function createLinkIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon icon-sm");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71");
    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("d", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71");
    svg.appendChild(path1);
    svg.appendChild(path2);
    return svg;
  }

  function createBbIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon icon-sm");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 7V4h16v3M9 20h6M12 4v16");
    svg.appendChild(path);
    return svg;
  }

  function createCheckIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon icon-sm");
    svg.setAttribute("viewBox", "0 0 24 24");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", "20 6 9 17 4 12");
    svg.appendChild(polyline);
    return svg;
  }

  const createIcon = type === 'link' ? createLinkIcon : createBbIcon;
  btn.appendChild(createIcon());

  btn.addEventListener("click", async () => {
    const textToCopy = type === "bb" ? `[img]${url}[/img]` : url;

    try {
      await navigator.clipboard.writeText(textToCopy);

      // Visual feedback
      btn.classList.add("copied");

      // Replace with check icon
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      btn.appendChild(createCheckIcon());

      setTimeout(() => {
        btn.classList.remove("copied");
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        btn.appendChild(createIcon());
      }, 1500);
    } catch (err) {
      showStatus("Failed to copy", "error");
    }
  });

  return btn;
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status-toast ${type === 'error' ? 'error' : ''} visible`;

  // Clear any existing timeout to avoid glitching
  if (status.timeoutId) clearTimeout(status.timeoutId);

  status.timeoutId = setTimeout(() => {
    status.className = `status-toast ${type === 'error' ? 'error' : ''}`;
  }, 3000);
}