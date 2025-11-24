// static/js/script.js
// =======================
// Generic tool scripts for WebTools
// =======================

// ---------- Text Encoder/Decoder ----------
function encodeText() {
    const text = document.getElementById('inputText')?.value;
    const method = document.getElementById('method')?.value;
    if (!text || !method) return;

    let result = '';
    switch (method) {
        case 'base64': result = btoa(unescape(encodeURIComponent(text))); break;
        case 'url': result = encodeURIComponent(text); break;
        case 'html': result = text.replace(/[\u00A0-\u9999<>\&]/gim, i => '&#' + i.charCodeAt(0) + ';'); break;
        case 'hex': result = Array.from(text).map(ch => ch.charCodeAt(0).toString(16).padStart(2, '0')).join(' '); break;
        case 'binary': result = Array.from(text).map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' '); break;
    }
    document.getElementById('resultText').value = result;
}

function decodeText() {
    const text = document.getElementById('inputText')?.value;
    const method = document.getElementById('method')?.value;
    if (!text || !method) return;

    let result = '';
    try {
        switch (method) {
            case 'base64': result = decodeURIComponent(escape(atob(text))); break;
            case 'url': result = decodeURIComponent(text); break;
            case 'html': const el = document.createElement('textarea'); el.innerHTML = text; result = el.value; break;
            case 'hex': result = text.split(/\s+/).map(h => String.fromCharCode(parseInt(h, 16))).join(''); break;
            case 'binary': result = text.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(''); break;
        }
        document.getElementById('resultText').value = result;
    } catch (e) {
        document.getElementById('resultText').value = '❌ Invalid input for decoding.';
    }
}

function clearFields() {
    document.getElementById('inputText')?.value && (document.getElementById('inputText').value = '');
    document.getElementById('resultText')?.value && (document.getElementById('resultText').value = '');
}

// ---------- Temperature Converter ----------
function convertTemperature() {
    const inputEl = document.getElementById("tempInput");
    const scaleEl = document.getElementById("scaleSelect");
    const resultDiv = document.getElementById("tempResult");

    if (!inputEl || !scaleEl || !resultDiv) return;

    const input = parseFloat(inputEl.value);
    const scale = scaleEl.value;

    if (isNaN(input)) {
        resultDiv.innerHTML = "<span class='text-danger'>Please enter a valid number.</span>";
        return;
    }

    let c, f, k;
    if (scale === "C") { c = input; f = (c * 9 / 5) + 32; k = c + 273.15; }
    else if (scale === "F") { f = input; c = (f - 32) * 5 / 9; k = c + 273.15; }
    else { k = input; c = k - 273.15; f = (c * 9 / 5) + 32; }

    resultDiv.innerHTML = `
        <div class="alert alert-info mt-3 mb-0">
            <strong>${c.toFixed(2)} °C</strong> &nbsp;=&nbsp;
            <strong>${f.toFixed(2)} °F</strong> &nbsp;=&nbsp;
            <strong>${k.toFixed(2)} K</strong>
        </div>`;
}

// ---------- Page-specific initializations ----------
document.addEventListener('DOMContentLoaded', function() {

    // Hit counter
    const hitCountElement = document.getElementById('hitCount');
    if (hitCountElement) {
        fetch('/api/hits?nocache=' + Date.now())
            .then(res => res.ok ? res.text() : 'N/A')
            .then(count => { hitCountElement.textContent = count; })
            .catch(() => { hitCountElement.textContent = 'N/A'; });
    }

    // Clear JSON Form
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", function(e) {
            e.preventDefault();
            const inputJson = document.getElementById("inputJson");
            const outputJson = document.getElementById("outputJson");
            if (inputJson) inputJson.value = "";
            if (outputJson) outputJson.value = "";
            document.querySelectorAll(".alert").forEach(el => el.remove());
            const msg = document.createElement("div");
            msg.className = "alert alert-secondary text-center fw-bold mt-3";
            msg.innerText = "✅ Cleared input and output.";
            document.querySelector("#jsonForm")?.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
        });
    }
});



