// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "uploadToImgBB",
    title: "Upload to ImgBB & Copy Link",
    contexts: ["image"]
  });

  chrome.contextMenus.create({
    id: "uploadToImgBBBBCode",
    title: "Upload to ImgBB & Copy BB Code",
    contexts: ["image"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "uploadToImgBB" || info.menuItemId === "uploadToImgBBBBCode") {
    const copyBBCode = info.menuItemId === "uploadToImgBBBBCode";
    await uploadImage(info.srcUrl, tab.id, copyBBCode);
  }
});

async function uploadImage(imageUrl, tabId, copyBBCode = false) {
  try {
    // Get API key from storage
    const { apiKey, expiration = "0" } = await chrome.storage.sync.get(["apiKey", "expiration"]);

    if (!apiKey) {
      showNotification("Missing API Key", "Set it in the popup.");
      return;
    }

    // Show uploading notification
    showNotification("Uploading...", "...");

    // Fetch the image and convert to base64
    const base64Data = await fetchImageAsBase64(imageUrl);

    if (!base64Data) {
      showNotification("Failed", "Could not fetch image.");
      return;
    }

    // Upload to ImgBB
    const params = new URLSearchParams();
    params.append("key", apiKey);
    params.append("image", base64Data);

    if (expiration !== "0") {
      params.append("expiration", expiration);
    }

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json();

    if (data.success) {
      const imgUrl = data.data.url;
      let textToCopy;

      if (copyBBCode) {
        textToCopy = `[img]${imgUrl}[/img]`;
      } else {
        textToCopy = imgUrl;
      }

      // Copy to clipboard using offscreen document
      const copied = await copyToClipboard(textToCopy);

      // Save to history
      await saveToHistory({
        id: data.data.id,
        url: imgUrl,
        thumb: data.data.thumb?.url || imgUrl,
        viewer: data.data.url_viewer,
        deleteUrl: data.data.delete_url,
        timestamp: Date.now(),
        expiration: expiration !== "0" ? parseInt(expiration) : null
      });

      if (copied) {
        showNotification("Copied", textToCopy);
      } else {
        showNotification("Upload Complete", "Copy failed. Check history.");
      }
    } else {
      const errorMsg = data.error?.message || "Unknown error.";
      showNotification("Failed", errorMsg);
    }
  } catch (error) {
    console.error("Upload error:", error);
    showNotification("Error", "Check console.");
  }
}

async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix to get just the base64 data
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

async function copyToClipboard(text) {
  // Try using the clipboard API through an offscreen document
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"]
    });

    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["CLIPBOARD"],
        justification: "Copy image URL to clipboard"
      });
    }
  } catch (e) {
    console.error("Offscreen document error:", e);
    return false;
  }

  // Small delay to ensure the offscreen document is ready
  await new Promise(resolve => setTimeout(resolve, 50));

  // Send message to offscreen document to copy text
  let result = false;
  try {
    const response = await chrome.runtime.sendMessage({
      type: "copy-to-clipboard",
      text: text
    });
    if (response && response.success) {
      result = true;
    }
  } catch (e) {
    console.error("Copy message error:", e);
  }

  // Close offscreen document after a short delay
  setTimeout(async () => {
    try {
      await chrome.offscreen.closeDocument();
    } catch (e) {
      // Ignore errors when closing
    }
  }, 200);

  return result;
}

async function saveToHistory(item) {
  const { history = [] } = await chrome.storage.local.get(["history"]);
  history.unshift(item);
  const trimmedHistory = history.slice(0, 50); // Keep last 50
  await chrome.storage.local.set({ history: trimmedHistory });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: title,
    message: message,
    priority: 2
  });
}

// Listen for messages from offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "copy-complete") {
    sendResponse({ success: true });
  }
  return true;
});