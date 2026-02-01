// Listen for clipboard copy requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "copy-to-clipboard") {
    copyToClipboard(message.text).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      console.error("Copy failed:", err);
      sendResponse({ success: false, error: err.message });
    });
    return true; // Keep the message channel open for async response
  }
});

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback to execCommand
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
