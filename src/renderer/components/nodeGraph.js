class NodeGraph {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activities = [];
    this.nodes = []; // { id, x, y, width, height, data }
    this.edges = []; // { from, to }
    this.isDragging = false;
    this.dragNode = null;
    this.pan = { x: 40, y: 40 };
    this.scale = 1;
    this.dragStart = { x: 0, y: 0 };
    this.isPanning = false;
  }

  setData(activities) {
    this.activities = activities;
    this.buildGraph();
  }

  buildGraph() {
    this.nodes = [];
    this.edges = [];

    const nodeWidth = 240;
    const nodeHeight = 110;
    const paddingX = 120;
    const paddingY = 60;

    // Hitung level ketergantungan (Topological layout)
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

      let maxDepLevel = 0;
      act.dependencies.forEach(depId => {
        const depLevel = getLevel(depId, new Set(visited));
        if (depLevel + 1 > maxDepLevel) maxDepLevel = depLevel + 1;
      });

      levelMap[id] = maxDepLevel;
      return maxDepLevel;
    };

    this.activities.forEach(a => getLevel(a.id));

    // Kelompokkan per level
    const columns = {};
    this.activities.forEach(a => {
      const lvl = levelMap[a.id] || 0;
      if (!columns[lvl]) columns[lvl] = [];
      columns[lvl].push(a);
    });

    // Posisikan node
    Object.keys(columns).forEach(colKey => {
      const lvl = parseInt(colKey, 10);
      const items = columns[lvl];
      items.forEach((act, rowIdx) => {
        const x = 50 + lvl * (nodeWidth + paddingX);
        const y = 80 + rowIdx * (nodeHeight + paddingY);

        this.nodes.push({
          id: act.id,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
          data: act
        });
      });
    });

    // Posisikan edges (garis panah Point A -> Point B)
    this.activities.forEach(act => {
      if (act.dependencies && act.dependencies.length > 0) {
        act.dependencies.forEach(depId => {
          this.edges.push({
            from: depId,
            to: act.id
          });
        });
      }
    });
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="nodegraph-container">
        <!-- Toolbar -->
        <div class="nodegraph-toolbar">
          <span style="font-weight: 800; font-size: 13px; color: var(--accent-cyan); display: flex; align-items: center; gap: 6px;">
            🕸️ Peta Kesinambungan (Point A ➜ Point B)
          </span>
          <span style="font-size: 11px; color: #94a3b8;">• Geser kanvas atau drag kotak node</span>
          <button class="btn btn-secondary btn-sm" onclick="window.nodeGraph.resetView()">Reset Posisi</button>
        </div>

        <!-- SVG Interactive Canvas -->
        <div id="svgCanvasWrap" class="nodegraph-canvas-wrap">
          <svg id="nodeSvg" width="100%" height="100%" style="overflow: visible;">
            <defs>
              <!-- Arrowhead Marker -->
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-blocked" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>
            <g id="graphGroup" transform="translate(${this.pan.x}, ${this.pan.y}) scale(${this.scale})">
              <!-- Render Edges -->
              <g id="edgesLayer"></g>
              <!-- Render Nodes -->
              <g id="nodesLayer"></g>
            </g>
          </svg>
        </div>
      </div>
    `;

    this.renderElements();
    this.setupInteractions();
  }

  renderElements() {
    const edgesLayer = document.getElementById('edgesLayer');
    const nodesLayer = document.getElementById('nodesLayer');
    if (!edgesLayer || !nodesLayer) return;

    // Render Edges
    let edgesHtml = '';
    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        const startX = fromNode.x + fromNode.width;
        const startY = fromNode.y + fromNode.height / 2;
        const endX = toNode.x;
        const endY = toNode.y + toNode.height / 2;

        const isBlocked = toNode.data.isBlocked;
        const strokeColor = isBlocked ? '#64748b' : '#38bdf8';
        const marker = isBlocked ? 'url(#arrow-blocked)' : 'url(#arrow)';

        // Curved Bezier Path
        const dx = (endX - startX) * 0.5;
        const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

        edgesHtml += `
          <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-dasharray="${isBlocked ? '5,5' : 'none'}" marker-end="${marker}" />
        `;
      }
    });
    edgesLayer.innerHTML = edgesHtml;

    // Render Nodes
    let nodesHtml = '';
    this.nodes.forEach(node => {
      const act = node.data;
      const isDone = act.status === 'completed';
      const isBlocked = act.isBlocked;

      let borderColor = '#334155';
      let statusColor = '#3b82f6';
      let statusText = act.horizonLabel || 'Tenggat';

      if (isDone) {
        borderColor = '#10b981';
        statusColor = '#10b981';
        statusText = '✓ Selesai';
      } else if (isBlocked) {
        borderColor = '#475569';
        statusColor = '#64748b';
        statusText = '🔒 Terkunci (Prasyarat)';
      } else if (act.priority === 'urgent' || (act.horizonLabel && act.horizonLabel.includes('Hari H'))) {
        borderColor = '#ef4444';
        statusColor = '#ef4444';
      } else if (act.priority === 'high' || (act.horizonLabel && act.horizonLabel.includes('H-1'))) {
        borderColor = '#f59e0b';
        statusColor = '#f59e0b';
      }

      nodesHtml += `
        <g class="node-card" data-id="${node.id}" transform="translate(${node.x}, ${node.y})">
          <!-- Card Background -->
          <rect width="${node.width}" height="${node.height}" rx="12" fill="#1e293b" stroke="${borderColor}" stroke-width="2" />
          
          <!-- Top Status Tag Bar -->
          <rect x="0" y="0" width="${node.width}" height="28" rx="12" fill="rgba(15, 23, 42, 0.6)" />
          <circle cx="16" cy="14" r="5" fill="${statusColor}" />
          <text x="28" y="18" fill="${statusColor}" font-size="11" font-weight="700">${statusText}</text>
          
          <!-- Title -->
          <text x="14" y="52" fill="#ffffff" font-size="13" font-weight="700" width="${node.width - 28}">
            ${this.truncate(act.title, 24)}
          </text>
          
          <!-- Deadline & Priority -->
          <text x="14" y="74" fill="#94a3b8" font-size="11">
            🗓️ ${act.dueDate || '-'} • ⏰ ${act.dueTime || '-'}
          </text>

          <!-- Category Badge -->
          <rect x="14" y="84" width="70" height="18" rx="4" fill="#334155" />
          <text x="20" y="97" fill="#38bdf8" font-size="10" font-weight="600">${this.truncate(act.category || 'Umum', 10)}</text>
        </g>
      `;
    });
    nodesLayer.innerHTML = nodesHtml;
  }

  setupInteractions() {
    const wrap = document.getElementById('svgCanvasWrap');
    if (!wrap) return;

    let activeNode = null;
    let offset = { x: 0, y: 0 };

    wrap.onmousedown = (e) => {
      const nodeElem = e.target.closest('.node-card');
      if (nodeElem) {
        const id = nodeElem.getAttribute('data-id');
        activeNode = this.nodes.find(n => n.id === id);
        if (activeNode) {
          this.isDragging = true;
          offset.x = (e.clientX / this.scale) - activeNode.x;
          offset.y = (e.clientY / this.scale) - activeNode.y;
        }
      } else {
        this.isPanning = true;
        this.dragStart.x = e.clientX - this.pan.x;
        this.dragStart.y = e.clientY - this.pan.y;
      }
    };

    window.onmousemove = (e) => {
      if (this.isDragging && activeNode) {
        activeNode.x = (e.clientX / this.scale) - offset.x;
        activeNode.y = (e.clientY / this.scale) - offset.y;
        this.renderElements();
      } else if (this.isPanning) {
        this.pan.x = e.clientX - this.dragStart.x;
        this.pan.y = e.clientY - this.dragStart.y;
        const g = document.getElementById('graphGroup');
        if (g) {
          g.setAttribute('transform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.scale})`);
        }
      }
    };

    window.onmouseup = () => {
      this.isDragging = false;
      this.isPanning = false;
      activeNode = null;
    };

    wrap.onwheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale = Math.min(Math.max(0.4, this.scale * zoomFactor), 2.5);
      const g = document.getElementById('graphGroup');
      if (g) {
        g.setAttribute('transform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.scale})`);
      }
    };
  }

  resetView() {
    this.pan = { x: 40, y: 40 };
    this.scale = 1;
    this.buildGraph();
    this.render();
  }

  truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  }
}

window.NodeGraph = NodeGraph;
