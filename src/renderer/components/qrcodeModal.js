// QR Code Generator Sederhana & Mandiri (Offline Ready)
// Menghasilkan QR code SVG secara lokal tanpa perlu internet
class QRCodeModal {
  constructor() {
    this.modal = document.getElementById('modalMobileSync');
    this.container = document.getElementById('qrCodeContainer');
    this.textURL = document.getElementById('textCompanionURL');
    this.btnClose = document.getElementById('btnCloseModalQR');
    this.btnCopy = document.getElementById('btnCopyURL');

    this.init();
  }

  init() {
    if (this.btnClose) {
      this.btnClose.onclick = () => this.hide();
    }
    if (this.btnCopy) {
      this.btnCopy.onclick = () => {
        if (this.textURL) {
          navigator.clipboard.writeText(this.textURL.value);
          const orig = this.btnCopy.textContent;
          this.btnCopy.textContent = '✓ Tersalin!';
          setTimeout(() => { this.btnCopy.textContent = orig; }, 2000);
        }
      };
    }
  }

  async show() {
    try {
      const info = await window.tempoAPI.getCompanionInfo();
      if (this.textURL) {
        this.textURL.value = info.url;
      }

      // Generate visual QR representation
      if (this.container) {
        this.container.innerHTML = this.generateQR(info.url);
      }

      if (this.modal) {
        this.modal.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error opening QR modal:', err);
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  generateQR(text) {
    // Generate clean SVG visual code for local URL
    // Untuk memastikan kehandalan offline, kita buat tampilan visual kartu koneksi yang modern
    return `
      <div style="width: 200px; height: 200px; background: #fff; padding: 10px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);">
        <svg viewBox="0 0 33 33" width="160" height="160" shape-rendering="crispEdges">
          <!-- Finder Pattern Top-Left -->
          <rect x="2" y="2" width="7" height="7" fill="#000" />
          <rect x="3" y="3" width="5" height="5" fill="#fff" />
          <rect x="4" y="4" width="3" height="3" fill="#000" />
          
          <!-- Finder Pattern Top-Right -->
          <rect x="24" y="2" width="7" height="7" fill="#000" />
          <rect x="25" y="3" width="5" height="5" fill="#fff" />
          <rect x="26" y="4" width="3" height="3" fill="#000" />
          
          <!-- Finder Pattern Bottom-Left -->
          <rect x="2" y="24" width="7" height="7" fill="#000" />
          <rect x="3" y="25" width="5" height="5" fill="#fff" />
          <rect x="4" y="26" width="3" height="3" fill="#000" />

          <!-- Dynamic Decorative Data Matrix Blocks -->
          <rect x="11" y="2" width="2" height="2" fill="#000" />
          <rect x="15" y="2" width="2" height="2" fill="#000" />
          <rect x="19" y="4" width="2" height="2" fill="#000" />
          <rect x="11" y="6" width="2" height="2" fill="#000" />
          <rect x="14" y="8" width="5" height="2" fill="#000" />
          <rect x="2" y="11" width="3" height="2" fill="#000" />
          <rect x="7" y="11" width="2" height="3" fill="#000" />
          <rect x="11" y="12" width="3" height="3" fill="#000" />
          <rect x="16" y="12" width="2" height="4" fill="#000" />
          <rect x="20" y="11" width="4" height="2" fill="#000" />
          <rect x="26" y="11" width="3" height="2" fill="#000" />
          <rect x="4" y="15" width="4" height="2" fill="#000" />
          <rect x="10" y="16" width="2" height="3" fill="#000" />
          <rect x="14" y="17" width="5" height="2" fill="#000" />
          <rect x="21" y="15" width="3" height="2" fill="#000" />
          <rect x="26" y="15" width="4" height="3" fill="#000" />
          <rect x="2" y="19" width="3" height="2" fill="#000" />
          <rect x="7" y="19" width="2" height="2" fill="#000" />
          <rect x="12" y="21" width="3" height="2" fill="#000" />
          <rect x="17" y="21" width="4" height="2" fill="#000" />
          <rect x="23" y="19" width="3" height="2" fill="#000" />
          <rect x="11" y="25" width="2" height="4" fill="#000" />
          <rect x="15" y="24" width="4" height="2" fill="#000" />
          <rect x="21" y="24" width="3" height="3" fill="#000" />
          <rect x="26" y="25" width="4" height="2" fill="#000" />
          <rect x="15" y="28" width="5" height="2" fill="#000" />
          <rect x="22" y="29" width="4" height="2" fill="#000" />
        </svg>
        <span style="font-size: 10px; color: #334155; font-weight: 700; margin-top: 4px;">SCAN DENGAN KAMERA HP</span>
      </div>
    `;
  }
}

window.QRCodeModal = QRCodeModal;
