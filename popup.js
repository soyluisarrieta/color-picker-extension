const pickBtn = document.getElementById("pick-btn");
const clearBtn = document.getElementById("clear-btn");
const colorList = document.getElementById("color-list");
const historySection = document.getElementById("history-section");

// Load history on open
renderHistory();

pickBtn.addEventListener("click", async () => {
  if (!window.EyeDropper) {
    alert("API EyeDropper not supported in this browser.");
    return;
  }
  document.querySelector("#color-picker-extension").style.display = "none";

  const eyeDropper = new EyeDropper();

  try {
    // delay to allow popup to hide
    await new Promise((resolve) => setTimeout(resolve, 10));

    // open picker. Keeping popup open avoids AbortError.
    const result = await eyeDropper.open();
    const hex = result.sRGBHex;

    // save and refresh
    await saveColor(hex);
    document.querySelector("#color-picker-extension").style.display = "block";
    renderHistory();
  } catch (err) {
    // user cancelled with ESC or error
    console.log("Pick cancelled or error:", err);
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ colors: [] });
  renderHistory();
});

async function saveColor(hex) {
  const data = await chrome.storage.local.get(["colors"]);
  let colors = data.colors || [];

  // remove duplicates and put new one at the start
  colors = colors.filter((c) => c.toLowerCase() !== hex.toLowerCase());
  colors.unshift(hex.toUpperCase());

  // save maximum 50 colors
  if (colors.length > 50) colors = colors.slice(0, 50);

  await chrome.storage.local.set({ colors });
}

async function renderHistory() {
  const data = await chrome.storage.local.get(["colors"]);
  const colors = data.colors || [];

  colorList.innerHTML = "";
  historySection.hidden = colors.length === 0;

  colors.forEach((hex) => {
    const li = document.createElement("li");
    li.className = "color-item";

    li.innerHTML = `
      <div class="color-swatch" style="background-color: ${hex}"></div>
      <span class="color-hex">${hex}</span>
    `;

    li.addEventListener("click", () => {
      // Copy to clipboard
      navigator.clipboard.writeText(hex).then(() => {
        const hexLabel = li.querySelector(".color-hex");
        const originalText = hexLabel.textContent;
        hexLabel.textContent = "Copied!";
        hexLabel.style.color = "#10b981";

        setTimeout(() => {
          hexLabel.textContent = originalText;
          hexLabel.style.color = "";
        }, 2000);
      });
    });

    colorList.appendChild(li);
  });
}
