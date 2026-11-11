// Force-Directed Physics Graph Engine (Obsidian-Style Interactive Network)
class NodeGraph {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activities = [];
    this.nodes = [];
    this.edges = [];
    this.mode = 'force'; // 'force' (Force-directed) atau 'pipeline' (Horizontal tree)

    // Canvas & Animation
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Viewport transform (Pan & Zoom)
    this.pan = { x: 0, y: 0 };
    this.scale = 1;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    // Interaction states
    this.draggedNode = null;
    this.hoveredNode = null;
    this.selectedNode = null;
    this.hasDragged = false;
    this.dragStartPos = { x: 0, y: 0 };

    // Physics constants (Obsidian-like gentle float)
    this.repulsion = 2200;
    this.springLength = 150;
    this.springStrength = 0.035;
    this.gravity = 0.0006;
    this.damping = 0.84;

    this.initDone = false;
  }

  setData(activities) {
    this.activities = activities || [];
    this.buildGraph();
    if (this.canvas) {
      this.render();
    }
  }

  buildGraph(forceReset = false) {
    const existingMap = new Map();
    if (!forceReset) {
      this.nodes.forEach(n => existingMap.set(n.id, { x: n.x, y: n.y, isPinned: n.isPinned }));
    }

    const width = this.canvas ? this.canvas.width : 850;
    const height = this.canvas ? this.canvas.height : 600;
    const centerX = width / 2;
    const centerY = height / 2;

    this.nodes = this.activities.map((act, i) => {
      const prev = existingMap.get(act.id);
      const angle = (i / Math.max(1, this.activities.length)) * Math.PI * 2;
      const radius = 130 + (i % 3) * 60;

      // Hitung ukuran & warna node sesuai status
      let color = '#38bdf8'; // normal cyan
      let glowColor = 'rgba(56, 189, 248, 0.6)';
      let size = 18;

      if (act.status === 'completed') {
        color = '#10b981';
        glowColor = 'rgba(16, 185, 129, 0.6)';
        size = 16;
      } else if (act.isBlocked) {
        color = '#64748b';
        glowColor = 'rgba(100, 116, 139, 0.3)';
        size = 15;
      } else if (act.priority === 'urgent' || (act.horizonLabel && act.horizonLabel.includes('Hari H'))) {
        color = '#ef4444';
        glowColor = 'rgba(239, 68, 68, 0.8)';
        size = 22;
      } else if (act.priority === 'high' || (act.horizonLabel && act.horizonLabel.includes('H-1'))) {
        color = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.7)';
        size = 20;
      }

      return {
        id: act.id,
        title: act.title,
        data: act,
        x: prev ? prev.x : centerX + Math.cos(angle) * radius,
        y: prev ? prev.y : centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        isPinned: prev ? !!prev.isPinned : false,
        radius: size,
        color,
        glowColor,
        isCompleted: act.status === 'completed',
        isBlocked: act.isBlocked
      };
    });

    // Edges
    this.edges = [];
    this.activities.forEach(act => {
      if (act.dependencies && act.dependencies.length > 0) {
        act.dependencies.forEach(depId => {
          const source = this.nodes.find(n => n.id === depId);
          const target = this.nodes.find(n => n.id === act.id);
          if (source && target) {
            this.edges.push({ source, target });
          }
        });
      }
    });

    if (this.selectedNode) {
      const found = this.nodes.find(n => n.id === this.selectedNode.id);
      this.selectedNode = found || null;
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="graph-canvas-wrapper" id="graphWrapper">
        <!-- Floating Controls Toolbar -->
        <div class="graph-controls-overlay">
          <span style="display: flex; align-items: center; color: var(--accent-cyan);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </span>
          
          <div class="graph-stat-badge">
            ${this.nodes.length} Nodes • ${this.edges.length} Relasi
          </div>
          
          <div class="graph-view-toggles">
            <button class="graph-toggle-btn ${this.mode === 'force' ? 'active' : ''}" onclick="window.nodeGraph.setMode('force')">
              Force Galaxy
            </button>
            <button class="graph-toggle-btn ${this.mode === 'pipeline' ? 'active' : ''}" onclick="window.nodeGraph.setMode('pipeline')">
              Timeline Flowchart
            </button>
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.nodeGraph.zoomIn()" title="Perbesar Tampilan (+)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.nodeGraph.zoomOut()" title="Perkecil Tampilan (-)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.nodeGraph.resetCamera()" title="Tengahkan Kanvas (Reset Zoom & Pan)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              Reset View
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.nodeGraph.resetNodePositions()" title="Lepas Semua Pin & Sebar Ulang Posisi Node">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Sebar Ulang
            </button>
          </div>
        </div>

        <!-- HTML5 Physics Canvas -->
        <canvas id="graphCanvas" style="width: 100%; height: 100%; display: block;"></canvas>

        <!-- Node Inspector Drawer (Detail saat node diklik) -->
        <div id="graphDrawer" class="graph-inspector-drawer ${this.selectedNode ? '' : 'hidden'}">
          ${this.selectedNode ? this.renderDrawerContent(this.selectedNode) : ''}
        </div>
      </div>
    `;

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas = document.getElementById('graphCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Resize canvas to match container exactly
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.max(300, rect.width || 900);
    this.canvas.height = Math.max(300, rect.height || 600);

    // Initial center pan
    if (!this.initDone) {
      this.pan = { x: 0, y: 0 };
      this.scale = 1;
      this.initDone = true;
    }

    this.setupListeners();
    this.startSimulation();
  }

  setupListeners() {
    const canvas = this.canvas;
    if (!canvas) return;

    // Pointer Down (Supports Mouse & Touch)
    canvas.onpointerdown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      const mouse = this.getTransformedMouse(e);
      const clicked = this.getNodeAt(mouse.x, mouse.y);

      if (clicked) {
        this.draggedNode = clicked;
        this.selectedNode = clicked;
        this.hasDragged = false;
        this.dragStartPos = { x: clicked.x, y: clicked.y };
        clicked.vx = 0;
        clicked.vy = 0;
        clicked.isPinned = true; // Pin during drag
        canvas.style.cursor = 'grabbing';
      } else {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
        canvas.style.cursor = 'grabbing';
      }
    };

    // Pointer Move
    canvas.onpointermove = (e) => {
      if (this.draggedNode) {
        const mouse = this.getTransformedMouse(e);
        this.draggedNode.x = mouse.x;
        this.draggedNode.y = mouse.y;
        this.draggedNode.vx = 0;
        this.draggedNode.vy = 0;

        if (Math.hypot(this.draggedNode.x - this.dragStartPos.x, this.draggedNode.y - this.dragStartPos.y) > 4) {
          this.hasDragged = true;
        }
      } else if (this.isPanning) {
        this.pan.x = e.clientX - this.panStart.x;
        this.pan.y = e.clientY - this.panStart.y;
      } else {
        // Hover detection
        const mouse = this.getTransformedMouse(e);
        const hovered = this.getNodeAt(mouse.x, mouse.y);
        if (this.hoveredNode !== hovered) {
          this.hoveredNode = hovered;
          canvas.style.cursor = hovered ? 'pointer' : 'grab';
        }
      }
    };

    // Pointer Up
    canvas.onpointerup = (e) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (this.draggedNode) {
        // Tetap pinned di posisi yang baru ditaruh oleh pengguna
        this.draggedNode.vx = 0;
        this.draggedNode.vy = 0;
        this.draggedNode.isPinned = true;

        if (!this.hasDragged) {
          // Hanya klik biasa tanpa drag -> update drawer detail
          this.updateDrawer();
        }
        this.draggedNode = null;
      }

      this.isPanning = false;
      canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
    };

    // Double-click unpins node so it can float naturally again
    canvas.ondblclick = (e) => {
      const mouse = this.getTransformedMouse(e);
      const clicked = this.getNodeAt(mouse.x, mouse.y);
      if (clicked) {
        clicked.isPinned = !clicked.isPinned;
        clicked.vx = (Math.random() - 0.5) * 2;
        clicked.vy = (Math.random() - 0.5) * 2;
      }
    };

    // Smooth Zoom with Mouse Wheel toward cursor
    canvas.onwheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
      const newScale = Math.min(Math.max(0.25, this.scale * zoomFactor), 3.5);

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.pan.x = mouseX - (mouseX - this.pan.x) * (newScale / this.scale);
      this.pan.y = mouseY - (mouseY - this.pan.y) * (newScale / this.scale);
      this.scale = newScale;
    };
  }

  getTransformedMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: (rawX - this.pan.x) / this.scale,
      y: (rawY - this.pan.y) / this.scale
    };
  }

  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const dist = Math.hypot(n.x - x, n.y - y);
      if (dist <= n.radius + 8) {
        return n;
      }
    }
    return null;
  }

  startSimulation() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const tick = () => {
      this.updatePhysics();
      this.draw();
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  updatePhysics() {
    if (this.mode === 'pipeline') {
      this.updatePipelineLayout();
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Repulsion (Coulomb Force between all nodes)
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < 320) {
          const force = (this.repulsion / (dist * dist));
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (n1 !== this.draggedNode && !n1.isPinned) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2 !== this.draggedNode && !n2.isPinned) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }
    }

    // 2. Spring Force (Edges connecting Point A -> Point B)
    this.edges.forEach(edge => {
      const n1 = edge.source;
      const n2 = edge.target;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.hypot(dx, dy) || 1;

      const displacement = dist - this.springLength;
      const force = displacement * this.springStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (n1 !== this.draggedNode && !n1.isPinned) {
        n1.vx += fx;
        n1.vy += fy;
      }
      if (n2 !== this.draggedNode && !n2.isPinned) {
        n2.vx -= fx;
        n2.vy -= fy;
      }
    });

    // 3. Very gentle centering force only for unpinned nodes
    this.nodes.forEach(n => {
      if (n === this.draggedNode || n.isPinned) return;

      const toCenterX = centerX - n.x;
      const toCenterY = centerY - n.y;
      const distCenter = Math.hypot(toCenterX, toCenterY);

      // Hanya tarik lembut jika terlalu jauh dari kanvas tengah
      if (distCenter > 200) {
        n.vx += toCenterX * this.gravity;
        n.vy += toCenterY * this.gravity;
      }

      n.vx *= this.damping;
      n.vy *= this.damping;

      n.x += n.vx;
      n.y += n.vy;
    });
  }

  updatePipelineLayout() {
    const colSpacing = 220;
    const rowSpacing = 90;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const levelMap = {};
    const getLevel = (id, visited = new Set()) => {
      if (levelMap[id] !== undefined) return levelMap[id];
      if (visited.has(id)) return 0;
      visited.add(id);
      const act = this.activities.find(a => a.id === id);
      if (!act || !act.dependencies || act.dependencies.length === 0) {
        levelMap[id] = 0;
        return 0;
      }
      let maxLvl = 0;
      act.dependencies.forEach(d => {
        maxLvl = Math.max(maxLvl, getLevel(d, new Set(visited)) + 1);
      });
      levelMap[id] = maxLvl;
      return maxLvl;
    };

    this.nodes.forEach(n => getLevel(n.id));

    const cols = {};
    this.nodes.forEach(n => {
      const lvl = levelMap[n.id] || 0;
      if (!cols[lvl]) cols[lvl] = [];
      cols[lvl].push(n);
    });

    const totalCols = Object.keys(cols).length;
    const startX = centerX - ((totalCols - 1) * colSpacing) / 2;

    Object.keys(cols).forEach(colIdx => {
      const lvl = parseInt(colIdx, 10);
      const items = cols[lvl];
      const startY = centerY - ((items.length - 1) * rowSpacing) / 2;

      items.forEach((n, rowIdx) => {
        if (n === this.draggedNode || n.isPinned) return;
        const targetX = startX + lvl * colSpacing;
        const targetY = startY + rowIdx * rowSpacing;
        n.x += (targetX - n.x) * 0.08;
        n.y += (targetY - n.y) * 0.08;
      });
    });
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.scale, this.scale);

    // 1. Draw Star / Dot Grid Background (Cosmos Vibe)
    this.drawBackgroundGrid(ctx);

    // Tentukan set tetangga jika ada node yang sedang di-hover atau di-klik
    const focusNode = this.hoveredNode || this.selectedNode;
    const neighborIds = new Set();
    if (focusNode) {
      neighborIds.add(focusNode.id);
      this.edges.forEach(e => {
        if (e.source.id === focusNode.id) neighborIds.add(e.target.id);
        if (e.target.id === focusNode.id) neighborIds.add(e.source.id);
      });
    }

    // 2. Draw Edges (Garis Penghubung dengan Arrow)
    this.edges.forEach(edge => {
      const isHighlighted = focusNode && (edge.source.id === focusNode.id || edge.target.id === focusNode.id);
      const isDimmed = focusNode && !isHighlighted;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);

      if (isHighlighted) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 10;
      } else if (isDimmed) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = edge.target.isBlocked ? 'rgba(100, 116, 139, 0.4)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        if (edge.target.isBlocked) {
          ctx.setLineDash([4, 4]);
        }
      }

      ctx.stroke();

      // Panah penunjuk arah alur
      this.drawArrowHead(ctx, edge.source.x, edge.source.y, edge.target.x, edge.target.y, edge.target.radius + 2);
      ctx.restore();
    });

    // 3. Draw Nodes (Glowing Orbs)
    this.nodes.forEach(node => {
      const isFocused = focusNode && (focusNode.id === node.id);
      const isNeighbor = focusNode && neighborIds.has(node.id);
      const isDimmed = focusNode && !isNeighbor;

      ctx.save();
      const alpha = isDimmed ? 0.2 : 1;
      ctx.globalAlpha = alpha;

      // Outer Glow Aura
      const glowGrad = ctx.createRadialGradient(node.x, node.y, node.radius * 0.3, node.x, node.y, node.radius * 2.2);
      glowGrad.addColorStop(0, node.glowColor);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Inner Core Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isFocused ? 24 : 12;
      ctx.fill();

      // Ring border untuk fokus, selesai, atau pinned
      if (isFocused) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else if (node.isCompleted) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#a7f3d0';
        ctx.stroke();
      } else if (node.isPinned) {
        // Aksen cincin halus untuk node yang posisinya dikunci
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Node Label Floating Text
      ctx.shadowBlur = 0;
      ctx.font = isFocused ? 'bold 13px -apple-system, sans-serif' : '600 12px -apple-system, sans-serif';
      ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.3)' : (isFocused ? '#ffffff' : '#e2e8f0');
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 18);

      // Sub-label (Horizon Badge)
      ctx.font = '500 10px -apple-system, sans-serif';
      ctx.fillStyle = isDimmed ? 'rgba(148, 163, 184, 0.2)' : '#94a3b8';
      ctx.fillText(node.data.horizonLabel || 'Tenggat', node.x, node.y + node.radius + 32);

      ctx.restore();
    });

    ctx.restore();
  }

  drawBackgroundGrid(ctx) {
    const spacing = 40;
    const viewLeft = -this.pan.x / this.scale;
    const viewTop = -this.pan.y / this.scale;
    const viewRight = (this.canvas.width - this.pan.x) / this.scale;
    const viewBottom = (this.canvas.height - this.pan.y) / this.scale;

    const startX = Math.floor(viewLeft / spacing) * spacing;
    const startY = Math.floor(viewTop / spacing) * spacing;

    ctx.save();
    ctx.fillStyle = 'rgba(51, 65, 85, 0.25)';
    for (let x = startX; x < viewRight; x += spacing) {
      for (let y = startY; y < viewBottom; y += spacing) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
    ctx.restore();
  }

  drawArrowHead(ctx, fromX, fromY, toX, toY, radiusOffset) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    if (dist <= radiusOffset + 10) return;

    const arrowX = toX - Math.cos(angle) * radiusOffset;
    const arrowY = toY - Math.sin(angle) * radiusOffset;
    const headLen = 8;

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - headLen * Math.cos(angle - Math.PI / 6), arrowY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - headLen * Math.cos(angle + Math.PI / 6), arrowY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  renderDrawerContent(node) {
    const act = node.data;
    const isDone = act.status === 'completed';
    const vaultLinks = (act.vault && act.vault.links) ? act.vault.links : [];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 800; color: ${node.color}; text-transform: uppercase;">
          ● DETAIL NODE TUGAS
        </span>
        <button class="btn-close-modal" onclick="window.nodeGraph.closeDrawer()" style="font-size: 20px;">&times;</button>
      </div>

      <div>
        <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">${act.title}</h3>
        <p style="font-size: 12px; color: var(--text-dim); line-height: 1.4;">${act.description || 'Tidak ada deskripsi.'}</p>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
        <div><strong>Status:</strong> ${act.horizonLabel || 'Tenggat'} ${isDone ? '(✓ Selesai)' : ''}</div>
        <div><strong>Deadline:</strong> ${act.dueDate || '-'} • ${act.dueTime || '-'}</div>
        <div><strong>Prioritas:</strong> ${act.priority || 'Normal'}</div>
        <div><strong>Kategori:</strong> ${act.category || 'Umum'}</div>
        <div><strong>Posisi:</strong> ${node.isPinned ? '<span style="color: #38bdf8;">Terkunci di Kanvas (Klik 2x untuk lepas)</span>' : '<span style="color: #94a3b8;">Mengambang Bebas</span>'}</div>
      </div>

      ${vaultLinks.length > 0 ? `
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Tautan Vault Terkait</div>
          ${vaultLinks.map(l => `
            <div style="font-size: 12px; margin-bottom: 4px;">
              <a href="#" onclick="window.tempoAPI.openExternal('${l.url}'); return false;" style="color: #38bdf8; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                <span>${l.title || l.url}</span>
              </a>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <button class="btn btn-primary" onclick="window.nodeGraph.toggleSelectedComplete()" style="width: 100%; justify-content: center;">
          ${isDone ? 'Buka Kembali Tugas' : 'Tandai Selesai'}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.tempoAPI.testForcedAlert('${act.id}')" style="width: 100%; justify-content: center; display: flex; align-items: center; gap: 6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          Uji Notifikasi Paksa
        </button>
      </div>
    `;
  }

  updateDrawer() {
    const drawer = document.getElementById('graphDrawer');
    if (!drawer) return;
    if (this.selectedNode) {
      drawer.innerHTML = this.renderDrawerContent(this.selectedNode);
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }

  closeDrawer() {
    this.selectedNode = null;
    this.updateDrawer();
  }

  async toggleSelectedComplete() {
    if (this.selectedNode) {
      await window.tempoAPI.toggleComplete(this.selectedNode.id);
      window.refreshApp();
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  zoomIn() {
    this.scale = Math.min(3.5, this.scale * 1.25);
  }

  zoomOut() {
    this.scale = Math.max(0.25, this.scale / 1.25);
  }

  resetCamera() {
    this.pan = { x: 0, y: 0 };
    this.scale = 1;
  }

  resetNodePositions() {
    this.nodes.forEach(n => {
      n.isPinned = false;
      n.vx = (Math.random() - 0.5) * 4;
      n.vy = (Math.random() - 0.5) * 4;
    });
    this.buildGraph(true);
    this.resetCamera();
  }
}

window.NodeGraph = NodeGraph;
