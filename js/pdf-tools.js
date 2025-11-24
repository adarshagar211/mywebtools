// static/js/pdf-tools.js
// Stand-alone PDF ⇄ JPG utilities
document.addEventListener("DOMContentLoaded", () => {

    const hitCountElement = document.getElementById('hitCount');
    if (hitCountElement) {
        fetch('/api/hits?nocache=' + Date.now())
            .then(res => res.ok ? res.text() : 'N/A')
            .then(count => { hitCountElement.textContent = count; })
            .catch(() => { hitCountElement.textContent = 'N/A'; });
    }

    const pdfInput = document.getElementById("pdfInput");
    const convertPdfBtn = document.getElementById("convertPdfBtn");
    const jpgOutput = document.getElementById("jpgOutput");
    const jpgInput = document.getElementById("jpgInput");
    const convertJpgBtn = document.getElementById("convertJpgBtn");
    const downloadPdfLink = document.getElementById("downloadPdfLink");

    let pdfjsLibLoaded = false;
    let jsPDFLoaded = false;

    // --- Load pdf.js UMD build ---
    const pdfScript = document.createElement("script");
    pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    document.head.appendChild(pdfScript);
    pdfScript.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        pdfjsLibLoaded = true;
        console.log("PDF.js loaded");
    };
    pdfScript.onerror = () => console.error("Failed to load PDF.js");

    // --- Load jsPDF ---
    const jsPdfScript = document.createElement("script");
    jsPdfScript.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    document.head.appendChild(jsPdfScript);
    jsPdfScript.onload = () => {
        jsPDFLoaded = true;
        console.log("jsPDF loaded");
    };
    jsPdfScript.onerror = () => console.error("Failed to load jsPDF");

    // ---------- PDF → JPG ----------
    if (pdfInput && convertPdfBtn && jpgOutput) {
        convertPdfBtn.addEventListener("click", async () => {
            const file = pdfInput.files[0];
            if (!file) return alert("Please select a PDF file.");

            if (!pdfjsLibLoaded) {
                return alert("PDF library still loading. Please wait a moment and try again.");
            }

            jpgOutput.innerHTML = "<div class='text-muted'>Processing PDF…</div>";
            convertPdfBtn.disabled = true;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                jpgOutput.innerHTML = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: ctx,
                        viewport: viewport
                    }).promise;

                    const img = document.createElement("img");
                    img.src = canvas.toDataURL("image/jpeg", 0.9);
                    img.className = "border rounded shadow-sm me-2 mb-2";
                    img.style.maxWidth = "250px";
                    img.alt = `Page ${i}`;
                    jpgOutput.appendChild(img);

                    const link = document.createElement("a");
                    link.href = img.src;
                    link.download = `page-${i}.jpg`;
                    link.className = "btn btn-sm btn-outline-secondary d-block mb-3";
                    link.innerHTML = `<i class="bi bi-download"></i> Download Page ${i}`;
                    jpgOutput.appendChild(link);
                }
            } catch (err) {
                console.error("PDF to JPG error:", err);
                jpgOutput.innerHTML = `<div class="alert alert-danger">❌ Conversion failed: ${err.message}</div>`;
            } finally {
                convertPdfBtn.disabled = false;
            }
        });
    }

    // ---------- JPG → PDF ----------
    if (jpgInput && convertJpgBtn && downloadPdfLink) {
        convertJpgBtn.addEventListener("click", async () => {
            const files = Array.from(jpgInput.files);
            if (!files.length) return alert("Please select image files.");

            if (!jsPDFLoaded) {
                return alert("PDF library still loading. Please wait a moment and try again.");
            }

            convertJpgBtn.disabled = true;
            downloadPdfLink.classList.add("d-none");

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                });

                for (let i = 0; i < files.length; i++) {
                    const img = new Image();
                    img.src = URL.createObjectURL(files[i]);

                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        setTimeout(() => reject(new Error("Image load timeout")), 10000);
                    });

                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    // Calculate dimensions to fit image on page
                    const imgRatio = img.width / img.height;
                    const pageRatio = pageWidth / pageHeight;

                    let width = pageWidth - 20; // 10mm margin on each side
                    let height = width / imgRatio;

                    if (height > pageHeight - 20) {
                        height = pageHeight - 20;
                        width = height * imgRatio;
                    }

                    const x = (pageWidth - width) / 2;
                    const y = (pageHeight - height) / 2;

                    if (i > 0) pdf.addPage();
                    pdf.addImage(img, "JPEG", x, y, width, height);

                    URL.revokeObjectURL(img.src);
                }

                const pdfBlob = pdf.output("blob");
                const blobUrl = URL.createObjectURL(pdfBlob);
                downloadPdfLink.href = blobUrl;
                downloadPdfLink.download = "converted-images.pdf";
                downloadPdfLink.classList.remove("d-none");

            } catch (err) {
                console.error("JPG to PDF error:", err);
                alert(`Conversion failed: ${err.message}`);
            } finally {
                convertJpgBtn.disabled = false;
            }
        });
    }

    // ---------- Reset buttons ----------
    function setupReset(btnId, ids) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener("click", () => {
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (el.tagName === "DIV") el.innerHTML = "";
                if (el.tagName === "INPUT") el.value = "";
                if (el.tagName === "A") {
                    el.classList.add("d-none");
                    if (el.href && el.href.startsWith('blob:')) {
                        URL.revokeObjectURL(el.href);
                    }
                }
            });

            // Also reset drop zone text
            if (btnId === "resetPdfBtn") {
                const zone = document.getElementById("pdfDropZone");
                if (zone) zone.querySelector("h5").textContent = "Drop PDF here or click to upload";
            }
            if (btnId === "resetJpgBtn") {
                const zone = document.getElementById("jpgDropZone");
                if (zone) zone.querySelector("h5").textContent = "Drop JPG/PNG images here or click to upload";
            }
        });
    }

    setupReset("resetPdfBtn", ["pdfInput", "jpgOutput"]);
    setupReset("resetJpgBtn", ["jpgInput", "downloadPdfLink"]);

    // ---------- Drag & Drop zones ----------
    function setupDropZone(zoneId, inputId, type) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        if (!zone || !input) return;

        zone.addEventListener("click", () => input.click());
        zone.addEventListener("dragover", e => {
            e.preventDefault();
            zone.classList.add("bg-primary-subtle");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("bg-primary-subtle"));
        zone.addEventListener("drop", e => {
            e.preventDefault();
            zone.classList.remove("bg-primary-subtle");
            const files = Array.from(e.dataTransfer.files);
            if (!files.length) return;

            if (type === "pdf") {
                if (files.length > 1 || files[0].type !== "application/pdf") {
                    return alert("Please drop a single PDF file.");
                }
            }
            if (type === "image") {
                const validFiles = files.filter(f => f.type.startsWith("image/"));
                if (validFiles.length === 0) return alert("Drop image files only.");
                input.files = createFileList(validFiles);
            } else {
                input.files = createFileList(files);
            }

            zone.querySelector("h5").textContent = `✅ ${input.files.length} file${input.files.length > 1 ? "s" : ""} ready`;
        });

        input.addEventListener("change", () => {
            if (input.files.length) {
                zone.querySelector("h5").textContent = `✅ ${input.files.length} file${input.files.length > 1 ? "s" : ""} ready`;
            }
        });
    }

    // Helper function to create FileList-like object
    function createFileList(files) {
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        return dt.files;
    }

    setupDropZone("pdfDropZone", "pdfInput", "pdf");
    setupDropZone("jpgDropZone", "jpgInput", "image");

    if (window.bootstrap) {
        document.querySelectorAll('.dropdown-toggle').forEach(el => {
            new bootstrap.Dropdown(el);
        });
    }
});
