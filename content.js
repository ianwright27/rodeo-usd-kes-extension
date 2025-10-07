(async function() {
  // selector for your element(s)
  const selector = "div.st--c-oWUGi.st--c-oWUGi-cAFiqo-size-4.st--c-oWUGi-iqCzBn-weight-semibold.st--c-oWUGi-ieFPByI-css";

  function parseUsdAmount(text) {
    // remove $ and commas, parse float
    const cleaned = text.replace(/\$/g, "").replace(/,/g, "").trim();
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  }

  function formatKes(amount) {
    // Format with commas, 2 decimals, add “ KES ”
    return ` KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Fetch USD → KES rate (or retrieve from cache)
  async function fetchUsdToKesRate() {
    const cacheKey = "usdToKesRate";
    const cacheExpiryKey = "usdToKesExpiry";
    const now = Date.now();

    // check cached
    const cached = localStorage.getItem(cacheKey);
    const expiry = localStorage.getItem(cacheExpiryKey);
    if (cached && expiry && now < Number(expiry)) {
      return Number(cached);
    }

    try {
      const resp = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (!resp.ok) {
        console.error("Rate fetch failed:", resp.statusText);
        return null;
      }
      const data = await resp.json();
      const rate = data.rates["KES"];
      if (!rate) {
        console.error("KES rate not present in response", data);
        return null;
      }
      // cache for e.g. 1 hour
      const oneHour = 3600 * 1000;
      localStorage.setItem(cacheKey, rate.toString());
      localStorage.setItem(cacheExpiryKey, (now + oneHour).toString());
      return rate;
    } catch (err) {
      console.error("Error fetching rate", err);
      return null;
    }
  }

  // main
  const elements = document.querySelectorAll(selector);
  if (!elements || elements.length === 0) {
    // no elements, exit
    return;
  }

  const rate = await fetchUsdToKesRate();
  if (!rate) {
    console.warn("No USD→KES rate available, aborting conversion.");
    return;
  }

  elements.forEach(el => {
    const txt = el.innerText;
    const usd = parseUsdAmount(txt);
    if (usd !== null) {
      const kesVal = usd * rate;
      // avoid appending multiple times
      if (!el.dataset.kesAppended) {
        const span = document.createElement("span");
        span.style.marginLeft = "6px";
        span.style.color = "#666";  // you can style as you like
        span.innerText = formatKes(kesVal);
        el.appendChild(span);
        el.dataset.kesAppended = "true";
      }
    }
  });

})();
