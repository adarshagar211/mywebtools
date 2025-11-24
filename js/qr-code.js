document.addEventListener("DOMContentLoaded", () => {

    const hitCountElement = document.getElementById('hitCount');
    if (hitCountElement) {
        fetch('/api/hits?nocache=' + Date.now())
            .then(res => res.ok ? res.text() : 'N/A')
            .then(count => { hitCountElement.textContent = count; })
            .catch(() => { hitCountElement.textContent = 'N/A'; });
    }

    // ---------- QR GENERATOR ----------
    const qrBox = document.getElementById("qrcode");
    const textInput = document.getElementById("qrText");
    const generateBtn = document.getElementById("generateBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    generateBtn.addEventListener("click", () => {
        const text = textInput.value.trim();
        if (!text) return alert("Enter some text or URL first");
        qrBox.innerHTML = "";
        new QRCode(qrBox, { text, width: 200, height: 200 });
        setTimeout(() => (downloadBtn.disabled = false), 400);
    });

    downloadBtn.addEventListener("click", () => {
        const img = qrBox.querySelector("img") || qrBox.querySelector("canvas");
        if (!img) return alert("No QR code yet");
        const link = document.createElement("a");
        link.href = img.src || img.toDataURL("image/png");
        link.download = "qrcode.png";
        link.click();
    });

    // ---------- QR SCANNER ----------
    const startBtn = document.getElementById("startScan");
    const stopBtn = document.getElementById("stopScan");
    const resultBox = document.getElementById("scanResult");
    const fileInput = document.getElementById("qrFile");
    const copyBtn = document.getElementById("copyResult");
    const clearBtn = document.getElementById("clearResult");

    let html5QrCode = null;
    let isRunning = false;

    async function ensureHtml5QrcodeReady() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.Html5Qrcode) resolve();
                else setTimeout(check, 100);
            };
            check();
        });
    }

    async function startScanner() {
        await ensureHtml5QrcodeReady();

        const readerDiv = document.getElementById("reader");
        if (!readerDiv) return alert("No reader element found.");

        if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras.length) return alert("No camera found.");
            const camId = cameras[0].id;

            await html5QrCode.start(camId, { fps: 10, qrbox: 250 }, (decodedText) => {
                resultBox.value = decodedText;
                copyBtn.disabled = false;
            });

            isRunning = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } catch (err) {
            alert("Failed to start scanner: " + err.message);
        }
    }

    async function stopScanner() {
        if (!isRunning || !html5QrCode) return;
        await html5QrCode.stop();
        html5QrCode.clear();
        isRunning = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    startBtn.addEventListener("click", startScanner);
    stopBtn.addEventListener("click", stopScanner);

    fileInput.addEventListener("change", async (e) => {
        await ensureHtml5QrcodeReady();
        const readerDiv = document.getElementById("reader");
        if (!readerDiv) return;
        const file = e.target.files[0];
        if (!file) return;
        const temp = new Html5Qrcode("reader");
        try {
            const result = await temp.scanFile(file, true);
            resultBox.value = result;
            copyBtn.disabled = false;
        } catch {
            alert("No QR code found in image");
        }
    });

    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(resultBox.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
    });

    clearBtn.addEventListener("click", () => {
        resultBox.value = "";
        copyBtn.disabled = true;
    });
});
