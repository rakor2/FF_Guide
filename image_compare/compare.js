(function() {
  const sliderStyles = `
    :host {
      --divider-width: 2px;
      --divider-color: #fff;
      --divider-shadow: 0 0 4px rgba(0,0,0,0.3);
      --default-handle-width: 44px;
      --default-handle-color: #fff;
      --default-handle-opacity: 0.9;
      --handle-position-start: 50%;
      position: relative;
      display: block;
      overflow: hidden;
      line-height: 0;
      direction: ltr;
      width: 100%;
      margin: 0;
      padding: 0;
      font-size: 0;
    }
    :host(:focus) { outline: 2px solid #0066ff; }
    ::slotted(*) {
      user-select: none;
      -webkit-user-drag: none;
      display: block;
      margin: 0;
      padding: 0;
    }
    ::slotted(img) {
      width: 100%;
      height: auto;
      display: block;
      vertical-align: top;
    }
    .first {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      height: 100%;
      width: 100%;
      --exposure: 50%;
      --transition-time: 0ms;
      margin: 0;
      padding: 0;
      line-height: 0;
    }
    .first .first-overlay-container {
      position: relative;
      clip-path: inset(0 var(--exposure) 0 0);
      transition: clip-path var(--transition-time);
      height: 100%;
      overflow: hidden;
    }
    .first .first-overlay {
      overflow: hidden;
      height: 100%;
      line-height: 0;
    }
    .second {
      position: relative;
      line-height: 0;
    }
    .handle-container {
      transform: translateX(50%);
      position: absolute;
      top: 0;
      right: var(--exposure);
      height: 100%;
      transition: right var(--transition-time);
      pointer-events: none;
    }
    .divider {
      position: absolute;
      height: 100%;
      width: 100%;
      left: 0;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .divider:after {
      content: " ";
      display: block;
      height: 100%;
      border-left: var(--divider-width) solid var(--divider-color);
      box-shadow: var(--divider-shadow);
    }
    .handle {
      position: absolute;
      top: var(--handle-position-start);
      pointer-events: none;
      transform: translate(calc(-50% - 0.5px), -50%);
      cursor: ew-resize;
      z-index: 20;
    }
    .default-handle {
      width: var(--default-handle-width);
      opacity: var(--default-handle-opacity);
      display: block;
    }
    .default-handle path {
      stroke: var(--default-handle-color);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
  `;

  const template = document.createElement('template');
  template.innerHTML = `
    <div class="second"><slot name="second"></slot></div>
    <div class="first">
      <div class="first-overlay">
        <div class="first-overlay-container"><slot name="first"></slot></div>
      </div>
      <div class="handle-container">
        <div class="divider"></div>
        <div class="handle">
          <slot name="handle">
            <svg class="default-handle" viewBox="-8 -3 16 6">
              <path d="M -5 -2 L -7 0 L -5 2 M 5 -2 L 7 0 L 5 2" fill="none"/>
            </svg>
          </slot>
        </div>
      </div>
    </div>
  `;

  class ImageComparisonSlider extends HTMLElement {
    constructor() {
      super();
      this.exposure = 50;
      this.isDragging = false;

      this.onMove = (e) => {
        if (!this.isDragging) return;
        const rect = this.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        if (!clientX) return;
        let x = clientX - rect.left;
        x = Math.min(rect.width, Math.max(0, x));
        let percent = (x / rect.width) * 100;
        percent = Math.min(100, Math.max(0, percent));
        this.exposure = percent;
        this.updateExposure();
      };

      this.onStart = (e) => {
        e.preventDefault();
        this.isDragging = true;
        window.addEventListener('mousemove', this.onMove);
        window.addEventListener('mouseup', this.onEnd);
        window.addEventListener('touchmove', this.onMove, { passive: false });
        window.addEventListener('touchend', this.onEnd);
        this.onMove(e);
      };

      this.onEnd = () => {
        this.isDragging = false;
        window.removeEventListener('mousemove', this.onMove);
        window.removeEventListener('mouseup', this.onEnd);
        window.removeEventListener('touchmove', this.onMove);
        window.removeEventListener('touchend', this.onEnd);
      };

      const shadow = this.attachShadow({ mode: 'open' });
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(sliderStyles);
      shadow.adoptedStyleSheets = [sheet];
      shadow.appendChild(template.content.cloneNode(true));
      this.firstEl = shadow.querySelector('.first');
      this.handleContainer = shadow.querySelector('.handle-container');

      this.resizeObserver = new ResizeObserver(() => {
        this.updateExposure();
      });
    }

    updateExposure() {
      if (this.firstEl) {
        this.firstEl.style.setProperty('--exposure', 100 - this.exposure + '%');
      }
      if (this.handleContainer) {
        this.handleContainer.style.setProperty('right', 100 - this.exposure + '%');
      }
    }

    connectedCallback() {
      this.updateExposure();
      this.addEventListener('mousedown', this.onStart);
      this.addEventListener('touchstart', this.onStart);
      this.addEventListener('dragstart', (e) => e.preventDefault());
      this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
      this.removeEventListener('mousedown', this.onStart);
      this.removeEventListener('touchstart', this.onStart);
      this.resizeObserver.disconnect();
    }
  }

  customElements.define('img-comparison-slider', ImageComparisonSlider);
})();