    // ─── CONFIG ────────────────────────────────────────────
    const API = 'http://localhost:3001';

    // ─── SIDEBAR RESPONSIVA ────────────────────────────────
    // Abre a sidebar em mobile (< 992px) e mostra o overlay
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebar-overlay').classList.toggle('visible');
    }

    // Fecha a sidebar (chamado ao clicar no overlay ou ao navegar)
    function fecharSidebar() {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('visible');
    }

    // ─── NAV ───────────────────────────────────────────────
    let currentSection = 'dashboard';

    function navigate(section) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
      document.getElementById('section-' + section)?.classList.add('active');
      document.getElementById('nav-' + section)?.classList.add('active');
      currentSection = section;

      // Em mobile, fecha a sidebar automaticamente ao navegar para outra secção
      if (window.innerWidth < 992) fecharSidebar();

      const loaders = {
        sensores:       loadSensores,
        leituras:       loadLeituras,
        alertas:        loadAlertas,
        areasrisco:     loadAreasRisco,
        infraestruturas:loadInfraestruturas,
        previsoes:      loadPrevisoes,
        destinatarios:  loadDestinatarios,
        notificacoes:   loadNotificacoes,
        planos:         loadPlanos,
        planosauton:    loadPlanosAuton,
        relatorios:     loadRelatorios,
        utilizadores:   loadUtilizadores,
        endpoints:      renderEndpoints,
        dashboard:      loadDashboard,
      };
      if (loaders[section]) loaders[section]();
    }

    function refreshCurrentSection() { navigate(currentSection); }

    // ─── MODAL ─────────────────────────────────────────────
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }
    document.querySelectorAll('.modal-backdrop').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
    });

    // ─── AUTH TOKEN ────────────────────────────────────────
    let authToken = null;

    // ─── API HELPER ─────────────────────────────────────────
    async function apiCall(method, path, body) {
      try {
        const opts = {
          method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(API + path, opts);
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok, status: r.status, data };
      } catch (e) {
        return { ok: false, status: 0, data: { error: 'Sem ligação à API: ' + e.message } };
      }
    }

    function getList(res) {
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.data)) return d.data;
      return [];
    }

    function showResponse(elId, result) {
      const el = document.getElementById(elId);
      if (!el) return;
      el.textContent = JSON.stringify(result.data, null, 2);
      el.className = 'api-response visible ' + (result.ok ? 'ok' : 'err');
    }

    // ─── BADGE / STATUS HELPERS ────────────────────────────
    function estadoBadge(estado) {
      const map = { ativo: 'danger', resolvido: 'success', falso_positivo: 'muted', pendente: 'warning', enviado: 'success', falhou: 'danger', concluido: 'success', cancelado: 'muted', online: 'success', offline: 'danger', manutencao: 'warning', operacional: 'success', avariado: 'danger' };
      const cls = map[estado] || 'muted';
      return `<span class="badge badge-${cls}">${estado || '—'}</span>`;
    }
    function vulnBadge(v) {
      const n = parseInt(v);
      const labels = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Muito Alta', 5: 'Crítica' };
      const cls    = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'danger' };
      return `<span class="badge badge-${cls[n] || 'muted'}">${labels[n] || v || '—'}</span>`;
    }
    function actions(editFn, deleteFn) {
      return `<div style="display:flex;gap:.3rem">
    <button class="btn btn-sm btn-outline" onclick="${editFn}"><i class="fa fa-pen"></i></button>
    <button class="btn btn-sm btn-danger" onclick="${deleteFn}"><i class="fa fa-trash"></i></button>
  </div>`;
    }
    function fmtDate(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }); }
      catch { return d; }
    }
    function emptyRow(cols, msg) {
      return `<tr><td colspan="${cols}"><div class="empty"><i class="fa fa-inbox"></i><p>${msg}</p></div></td></tr>`;
    }
    function errRow(cols, err) {
      return `<tr><td colspan="${cols}"><div class="empty"><i class="fa fa-exclamation-triangle" style="color:var(--danger)"></i><p style="color:var(--danger)">${err}</p></div></td></tr>`;
    }

    // ─── DASHBOARD ─────────────────────────────────────────
    async function loadDashboard() {
      loadDashStats();
      loadAlertDist();
      loadRecentAlerts();
      loadPrevisoesDash();
    }

    async function loadDashStats() {
      const [sensRes, alertRes, areaRes, infraRes] = await Promise.all([
        apiCall('GET', '/sensores'),
        apiCall('GET', '/alertas'),
        apiCall('GET', '/areas-risco'),
        apiCall('GET', '/infraestruturas'),
      ]);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      const sensores = getList(sensRes);
      set('stat-sensores', sensores.filter(s => s.status === 'online').length);
      const alertas = getList(alertRes);
      const ativos = alertas.filter(a => a.estado === 'ativo').length;
      set('stat-alertas', ativos || alertas.length || '—');
      const sc = document.getElementById('sidebar-alert-count');
      if (sc) sc.textContent = ativos;
      set('stat-areas', getList(areaRes).length || (areaRes.data?.pagination?.total ?? '—'));
      set('stat-infra', getList(infraRes).length || (infraRes.data?.pagination?.total ?? '—'));
    }

    async function loadAlertDist() {
      const el = document.getElementById('alert-dist-loading');
      const r = await apiCall('GET', '/alertas');
      if (el) el.style.display = 'none';
      const alertList = getList(r);
      if (!r.ok || !alertList.length) return;
      const levels = { Vermelho: 0, Laranja: 0, Amarelo: 0, Verde: 0 };
      alertList.forEach(a => {
        const n = parseInt(a.idnivel_alerta);
        if (n === 4) levels.Vermelho++;
        else if (n === 3) levels.Laranja++;
        else if (n === 2) levels.Amarelo++;
        else levels.Verde++;
      });
      const total = alertList.length || 1;
      const setLevel = (id, cnt, fillId) => {
        document.getElementById(id).textContent = cnt;
        document.getElementById(fillId).style.width = ((cnt / total) * 100) + '%';
      };
      setLevel('cnt-red', levels.Vermelho, 'lvl-red');
      setLevel('cnt-orange', levels.Laranja, 'lvl-orange');
      setLevel('cnt-yellow', levels.Amarelo, 'lvl-yellow');
      setLevel('cnt-green', levels.Verde, 'lvl-green');
    }

    async function loadRecentAlerts() {
      const tl = document.getElementById('recent-alerts-timeline');
      const r = await apiCall('GET', '/alertas');
      const alertList = getList(r);
      if (!r.ok) {
        tl.innerHTML = '<li><div class="empty"><i class="fa fa-unlink"></i><p>Sem ligação à API</p></div></li>';
        return;
      }
      const recent = alertList.slice(0, 6);
      if (!recent.length) { tl.innerHTML = '<li><p class="timeline-text" style="color:var(--muted)">Sem alertas registados.</p></li>'; return; }
      tl.innerHTML = recent.map(a => `
    <li>
      <div class="timeline-time">${fmtDate(a.createdAt || a.data_alerta)}</div>
      <div class="timeline-text">Área #${a.idarea_risco || '—'} · Score ${a.score_risco || '—'}</div>
      <span class="timeline-badge">${estadoBadge(a.estado)}</span>
    </li>
  `).join('');
    }

    let dashChart = null;
    async function loadPrevisoesDash() {
      const loading = document.getElementById('dash-chart-loading');
      if (loading) loading.style.display = 'flex';
      const r = await apiCall('GET', '/previsoes');
      if (loading) loading.style.display = 'none';
      const ctx = document.getElementById('dash-chart');
      if (!ctx) return;
      const data = getList(r).slice(0, 10);
      const labels = data.map((p, i) => fmtDate(p.data_inicio_previsao || p.createdAt) || `P${i + 1}`);
      const values = data.map(p => parseFloat(p.precipitacao_prevista_mm || 0));
      if (dashChart) dashChart.destroy();
      dashChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Sem dados'],
          datasets: [{
            label: 'Precipitação (mm)',
            data: values.length ? values : [0],
            backgroundColor: 'rgba(59,130,246,0.35)',
            borderColor: '#3b82f6',
            borderWidth: 1.5,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1f2d45' } },
            y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1f2d45' } }
          }
        }
      });
    }

    // ─── SENSORES ──────────────────────────────────────────
    async function loadSensores() {
      const tbody = document.getElementById('sensores-tbody');
      tbody.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/sensores');
      if (!r.ok) { tbody.innerHTML = errRow(7, 'Erro a carregar sensores: ' + (r.data.message || r.status)); return; }
      const list = getList(r);
      const filter = document.getElementById('filter-sensor-status').value;
      const filtered = filter ? list.filter(s => s.status === filter) : list;
      if (!filtered.length) { tbody.innerHTML = emptyRow(7, 'Nenhum sensor encontrado.'); return; }
      tbody.innerHTML = filtered.map(s => `
    <tr>
      <td class="td-mono">#${s.idsensor || '—'}</td>
      <td>${s.tipo || '—'}</td>
      <td>${s.localizacao || '—'}</td>
      <td>${estadoBadge(s.status)}</td>
      <td class="td-mono">${s.idinfraestrutura_urbana || '—'}</td>
      <td class="td-mono">${fmtDate(s.data_proxima_manutencao)}</td>
      <td>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-sm btn-outline" onclick="calibrarSensor(${s.idsensor})" title="Calibração"><i class="fa fa-wrench"></i></button>
          <button class="btn btn-sm btn-outline" onclick="updateSensorStatus(${s.idsensor})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteSensor(${s.idsensor})"><i class="fa fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
    }

    async function criarSensor() {
      const body = {
        tipo: document.getElementById('m-sensor-tipo').value,
        localizacao: document.getElementById('m-sensor-loc').value,
        status: document.getElementById('m-sensor-status').value,
        idinfraestrutura_urbana: parseInt(document.getElementById('m-sensor-infra').value) || undefined,
        data_proxima_manutencao: document.getElementById('m-sensor-mant').value || undefined
      };
      const r = await apiCall('POST', '/sensores', body);
      showResponse('modal-sensor-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-sensor'), 1200); loadSensores(); }
    }

    async function updateSensorStatus(id) {
      const s = prompt('Novo status (online / offline / manutencao):');
      if (!s) return;
      const r = await apiCall('PATCH', `/sensores/${id}`, { status: s });
      alert(r.ok ? 'Status atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadSensores();
    }

    async function deleteSensor(id) {
      if (!confirm(`Apagar sensor #${id}?`)) return;
      const r = await apiCall('DELETE', `/sensores/${id}`);
      alert(r.ok ? 'Sensor apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadSensores();
    }

    // ─── LEITURAS ──────────────────────────────────────────
    async function criarLeitura() {
      const body = {
        idsensor:       parseInt(document.getElementById('leitura-sensor-id').value),
        tipo_variavel:  document.getElementById('leitura-tipo').value,
        valor:          parseFloat(document.getElementById('leitura-valor').value),
        unidade:        document.getElementById('leitura-unidade').value,
        data_observacao:document.getElementById('leitura-data-obs').value,
        origem_dado:    document.getElementById('leitura-origem').value || undefined,
        qualidade_dado: document.getElementById('leitura-qualidade').value,
      };
      const r = await apiCall('POST', '/leituras', body);
      showResponse('leitura-response', r);
      if (r.ok) loadLeituras();
    }

    async function criarLeituraModal() {
      const body = {
        idsensor:       parseInt(document.getElementById('m-leitura-sensor').value),
        tipo_variavel:  document.getElementById('m-leitura-tipo').value,
        valor:          parseFloat(document.getElementById('m-leitura-valor').value),
        unidade:        document.getElementById('m-leitura-unidade').value,
        data_observacao:document.getElementById('m-leitura-data-obs').value,
        origem_dado:    document.getElementById('m-leitura-origem').value || undefined,
        qualidade_dado: document.getElementById('m-leitura-qualidade').value,
      };
      const r = await apiCall('POST', '/leituras', body);
      showResponse('modal-leitura-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-nova-leitura'), 1200); loadLeituras(); }
    }

    let leituraPage = 1;
    const LEITURA_LIMIT = 20;

    async function loadLeituras(delta = 0) {
      leituraPage = Math.max(1, leituraPage + delta);
      const tbody = document.getElementById('leituras-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;

      const idsensor = document.getElementById('filter-leitura-sensor')?.value?.trim();
      const offset   = (leituraPage - 1) * LEITURA_LIMIT;
      const base     = idsensor ? `/leituras/sensor/${idsensor}` : '/leituras';
      const path     = `${base}?limit=${LEITURA_LIMIT}&offset=${offset}`;

      const r = await apiCall('GET', path);
      if (!r.ok) {
        tbody.innerHTML = errRow(7, 'Erro: ' + (r.data?.error_description || r.status));
        return;
      }

      const list  = getList(r);
      const total = r.data?.pagination?.total ?? list.length;
      const pages = Math.ceil(total / LEITURA_LIMIT) || 1;

      // título com contagem
      const title = document.getElementById('leituras-title');
      if (title) title.textContent = `Historial de Leituras (${total} total)`;

      // info de paginação
      const info = document.getElementById('leituras-info');
      if (info) info.textContent = `Página ${leituraPage} de ${pages}`;

      // botões prev/next
      const prev = document.getElementById('leituras-prev');
      const next = document.getElementById('leituras-next');
      if (prev) prev.disabled = leituraPage <= 1;
      if (next) next.disabled = leituraPage >= pages;

      if (!list.length) { tbody.innerHTML = emptyRow(7, 'Nenhuma leitura encontrada.'); return; }

      tbody.innerHTML = list.map(l => `
        <tr>
          <td class="td-mono">#${l.idleitura_sensor || '—'}</td>
          <td class="td-mono">#${l.idsensor || '—'}</td>
          <td>${l.tipo_variavel || '—'}</td>
          <td class="td-mono">${l.valor ?? '—'}</td>
          <td>${l.unidade || '—'}</td>
          <td class="td-mono">${fmtDate(l.data_observacao)}</td>
          <td>${estadoBadge(l.qualidade_dado || 'boa')}</td>
        </tr>
      `).join('');
    }

    // ─── ALERTAS ───────────────────────────────────────────
    async function loadAlertas() {
      const tbody = document.getElementById('alertas-tbody');
      tbody.innerHTML = `<tr><td colspan="8"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const estado = document.getElementById('filter-alerta-estado').value;
      const path = estado ? `/alertas?estado=${estado}` : '/alertas';
      const r = await apiCall('GET', path);
      if (!r.ok) { tbody.innerHTML = errRow(8, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      const cnt = document.getElementById('alertas-count');
      if (cnt) cnt.textContent = `(${list.length})`;
      if (!list.length) { tbody.innerHTML = emptyRow(8, 'Nenhum alerta encontrado.'); return; }
      tbody.innerHTML = list.map(a => `
    <tr>
      <td class="td-mono">#${a.idalerta || a.id || '—'}</td>
      <td>${a.idarea_risco || '—'}</td>
      <td>${nivelBadge(a.idnivel_alerta)}</td>
      <td>${estadoBadge(a.estado)}</td>
      <td class="td-mono">${a.score_risco || '—'}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${a.descricao || ''}">${a.descricao || '—'}</td>
      <td class="td-mono">${fmtDate(a.createdAt)}</td>
      <td>${actions(`editAlerta(${a.idalerta || a.id})`, `apagarAlerta(${a.idalerta || a.id})`)}</td>
    </tr>
  `).join('');
    }

    function nivelBadge(n) {
      const map = { 1: 'success', 2: 'warning', 3: 'danger', 4: 'danger' };
      const names = { 1: 'Verde', 2: 'Amarelo', 3: 'Laranja', 4: 'Vermelho' };
      const cls = map[n] || 'muted';
      return `<span class="badge badge-${cls}">${names[n] || `N${n}`}</span>`;
    }

    async function criarAlerta() {
      const body = { idleitura_sensor: parseInt(document.getElementById('m-alerta-leitura').value) };
      const r = await apiCall('POST', '/alertas', body);
      showResponse('modal-alerta-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-alerta'), 1500); loadAlertas(); }
    }

    async function editAlerta(id) {
      const estado = prompt('Novo estado (ativo / resolvido / cancelado):');
      if (!estado) return;
      const r = await apiCall('PATCH', `/alertas/${id}`, { estado });
      alert(r.ok ? 'Atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadAlertas();
    }

    async function apagarAlerta(id) {
      if (!confirm(`Apagar alerta #${id}?`)) return;
      const r = await apiCall('DELETE', `/alertas/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadAlertas();
    }

    // ─── ÁREAS DE RISCO ────────────────────────────────────
    async function loadAreasRisco() {
      const tbody = document.getElementById('areasrisco-tbody');
      tbody.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const vuln = document.getElementById('filter-area-vuln').value;
      const path = vuln ? `/areas-risco?vulnerabilidade=${vuln}` : '/areas-risco';
      const r = await apiCall('GET', path);
      if (!r.ok) { tbody.innerHTML = errRow(7, 'Erro: ' + (r.data.message || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(7, 'Nenhuma área encontrada.'); return; }
      tbody.innerHTML = list.map(a => `
    <tr>
      <td class="td-mono">#${a.idarea_risco || a.id || '—'}</td>
      <td>${a.nome || '—'}</td>
      <td>${a.localizacao || '—'}</td>
      <td>${vulnBadge(a.vulnerabilidade_base)}</td>
      <td class="td-mono">${a.area_m2 || '—'}</td>
      <td class="td-mono">${a.populacao_afetada || '—'}</td>
      <td>${actions(`editAreaRisco(${a.idarea_risco || a.id})`, `apagarAreaRisco(${a.idarea_risco || a.id})`)}</td>
    </tr>
  `).join('');
    }

    async function criarAreaRisco() {
      const body = {
        nome: document.getElementById('m-area-nome').value,
        localizacao: document.getElementById('m-area-local').value,
        vulnerabilidade_base: parseInt(document.getElementById('m-area-vuln').value),
        area_m2: parseFloat(document.getElementById('m-area-m2').value) || undefined,
        populacao_afetada: parseInt(document.getElementById('m-area-pop').value) || undefined,
      };
      const r = await apiCall('POST', '/areas-risco', body);
      showResponse('modal-area-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-nova-area'), 1200); loadAreasRisco(); }
    }

    async function editAreaRisco(id) {
      const vuln = prompt('Nova vulnerabilidade base (1=Baixa, 2=Média, 3=Alta, 4=Muito Alta, 5=Crítica):');
      if (!vuln) return;
      const nivel = parseInt(vuln);
      if (isNaN(nivel) || nivel < 1 || nivel > 5) { alert('Valor inválido. Use um número de 1 a 5.'); return; }
      const r = await apiCall('PATCH', `/areas-risco/${id}`, { vulnerabilidade_base: nivel });
      alert(r.ok ? 'Atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadAreasRisco();
    }

    async function apagarAreaRisco(id) {
      if (!confirm(`Apagar área de risco #${id}?`)) return;
      const r = await apiCall('DELETE', `/areas-risco/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadAreasRisco();
    }

    // ─── INFRAESTRUTURAS ───────────────────────────────────
    async function loadInfraestruturas() {
      const tbody = document.getElementById('infra-tbody');
      tbody.innerHTML = `<tr><td colspan="6"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const tipo = document.getElementById('filter-infra-tipo').value;
      const path = tipo ? `/infraestruturas?tipo=${tipo}` : '/infraestruturas';
      const r = await apiCall('GET', path);
      if (!r.ok) { tbody.innerHTML = errRow(6, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(6, 'Nenhuma infraestrutura encontrada.'); return; }
      tbody.innerHTML = list.map(i => `
    <tr>
      <td class="td-mono">#${i.idinfraestrutura_urbana || '—'}</td>
      <td>${i.nome || '—'}</td>
      <td>${i.tipo || '—'}</td>
      <td>${i.localizacao || '—'}</td>
      <td>${i.idarea_risco || '—'}</td>
      <td>${actions(`editInfra(${i.idinfraestrutura_urbana})`, `apagarInfra(${i.idinfraestrutura_urbana})`)}</td>
    </tr>
  `).join('');
    }

    async function criarInfraestrutura() {
      const body = {
        nome:        document.getElementById('m-infra-nome').value,
        tipo:        document.getElementById('m-infra-tipo').value,
        localizacao: document.getElementById('m-infra-local').value,
        idarea_risco:parseInt(document.getElementById('m-infra-area').value) || undefined,
      };
      const r = await apiCall('POST', '/infraestruturas', body);
      showResponse('modal-infra-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-nova-infra'), 1200); loadInfraestruturas(); }
    }

    async function editInfra(id) {
      const loc = prompt('Nova localização:');
      if (!loc) return;
      const r = await apiCall('PATCH', `/infraestruturas/${id}`, { localizacao: loc });
      alert(r.ok ? 'Atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadInfraestruturas();
    }

    async function apagarInfra(id) {
      if (!confirm(`Apagar infraestrutura #${id}?`)) return;
      const r = await apiCall('DELETE', `/infraestruturas/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadInfraestruturas();
    }

    // ─── PREVISÕES ─────────────────────────────────────────
    async function loadPrevisoes() {
      const tbody = document.getElementById('previsoes-tbody');
      tbody.innerHTML = `<tr><td colspan="8"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const area = document.getElementById('filter-previsao-area').value;
      const path = area ? `/previsoes?idarea_risco=${area}` : '/previsoes';
      const r = await apiCall('GET', path);
      if (!r.ok) { tbody.innerHTML = errRow(8, 'Erro: ' + (r.data.message || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(8, 'Nenhuma previsão encontrada.'); return; }
      tbody.innerHTML = list.map(p => `
    <tr>
      <td class="td-mono">#${p.idprevisao || '—'}</td>
      <td>${p.idarea_risco || '—'}</td>
      <td>${p.fonte || '—'}</td>
      <td class="td-mono">${p.precipitacao_prevista_mm ?? '—'}</td>
      <td class="td-mono">${p.horizonte_horas ?? '—'}</td>
      <td class="td-mono">${fmtDate(p.data_inicio_previsao)}</td>
      <td><div class="progress" style="width:80px"><div class="progress-bar" style="width:${((p.confianca || 0) * 100).toFixed(0)}%;background:var(--accent)"></div></div> <span style="font-family:var(--font-mono);font-size:.65rem">${((p.confianca || 0) * 100).toFixed(0)}%</span></td>
      <td>${actions(`''`, `apagarPrevisao(${p.idprevisao})`)}</td>
    </tr>
  `).join('');
    }

    async function criarPrevisao() {
      const body = {
        idarea_risco:          parseInt(document.getElementById('m-prev-area').value),
        fonte:                 document.getElementById('m-prev-fonte').value || 'IPMA',
        precipitacao_prevista_mm: parseFloat(document.getElementById('m-prev-precip').value),
        confianca:             parseFloat(document.getElementById('m-prev-conf').value),
        horizonte_horas:       parseInt(document.getElementById('m-prev-horizonte').value),
        data_inicio_previsao:  document.getElementById('m-prev-inicio').value || undefined,
        data_fim_previsao:     document.getElementById('m-prev-fim').value || undefined,
      };
      const r = await apiCall('POST', '/previsoes', body);
      showResponse('modal-prev-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-nova-previsao'), 1200); loadPrevisoes(); }
    }

    async function apagarPrevisao(id) {
      if (!confirm(`Apagar previsão #${id}?`)) return;
      const r = await apiCall('DELETE', `/previsoes/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadPrevisoes();
    }

    // ─── DESTINATÁRIOS ─────────────────────────────────────
    async function loadDestinatarios() {
      const tbody = document.getElementById('destin-tbody');
      tbody.innerHTML = `<tr><td colspan="6"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/destinatarios');
      if (!r.ok) { tbody.innerHTML = errRow(6, 'Erro: ' + (r.data.message || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(6, 'Nenhum destinatário.'); return; }
      tbody.innerHTML = list.map(d => `
    <tr>
      <td class="td-mono">#${d.iddestinatario || d.id || '—'}</td>
      <td>${d.nome || '—'}</td>
      <td>${d.email || '—'}</td>
      <td class="td-mono">${d.contato || '—'}</td>
      <td>${d.tipo || '—'}</td>
      <td>${actions(`''`, `apagarDestinatario(${d.iddestinatario || d.id})`)}</td>
    </tr>
  `).join('');
    }

    async function criarDestinatario() {
      const body = {
        nome: document.getElementById('m-dest-nome').value,
        email: document.getElementById('m-dest-email').value,
        contato: document.getElementById('m-dest-tel').value,
        tipo: document.getElementById('m-dest-tipo').value,
      };
      const r = await apiCall('POST', '/destinatarios', body);
      showResponse('modal-dest-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-destinatario'), 1200); loadDestinatarios(); }
    }

    async function apagarDestinatario(id) {
      if (!confirm(`Apagar destinatário #${id}?`)) return;
      const r = await apiCall('DELETE', `/destinatarios/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadDestinatarios();
    }

    // ─── NOTIFICAÇÕES ──────────────────────────────────────
    async function loadNotificacoes() {
      const tbody = document.getElementById('notif-tbody');
      tbody.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/notificacoes');
      if (!r.ok) { tbody.innerHTML = errRow(7, 'Erro: ' + (r.data.message || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(7, 'Sem notificações.'); return; }
      tbody.innerHTML = list.map(n => {
        // Destinatário: mostra nome se disponível, ID se não, "Admin" se null (notificação automática a administrador)
        const dest = n.Destinatario?.nome
          ? n.Destinatario.nome
          : n.iddestinatario
            ? `#${n.iddestinatario}`
            : '<span style="color:var(--accent);font-size:.7rem">Admin</span>';
        // Mensagem truncada para não ocupar demasiado espaço na tabela
        const msg = n.mensagem
          ? `<span title="${n.mensagem}">${n.mensagem.substring(0, 50)}${n.mensagem.length > 50 ? '…' : ''}</span>`
          : '—';
        return `
        <tr>
          <td class="td-mono">#${n.idnotificacao || '—'}</td>
          <td class="td-mono">${n.idalerta ? `#${n.idalerta}` : '—'}</td>
          <td>${dest}</td>
          <td>${n.canal || '—'}</td>
          <td>${estadoBadge(n.estado_envio)}</td>
          <td class="td-mono">${fmtDate(n.data_envio)}</td>
          <td style="max-width:180px;overflow:hidden">${msg}</td>
        </tr>`;
      }).join('');
    }

    async function criarNotificacao() {
      const body = {
        idalerta: parseInt(document.getElementById('m-notif-alerta').value),
        iddestinatario: parseInt(document.getElementById('m-notif-dest').value),
        canal: document.getElementById('m-notif-canal').value,
        estado_envio: document.getElementById('m-notif-estado').value,
        mensagem: document.getElementById('m-notif-msg').value,
      };
      const r = await apiCall('POST', '/notificacoes', body);
      showResponse('modal-notif-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-nova-notif'), 1200); loadNotificacoes(); }
    }

    async function apagarNotificacao(id) {
      if (!confirm(`Apagar notificação #${id}?`)) return;
      const r = await apiCall('DELETE', `/notificacoes/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadNotificacoes();
    }

    // ─── PLANOS ────────────────────────────────────────────
    async function loadPlanos() {
      const tbody = document.getElementById('planos-tbody');
      tbody.innerHTML = `<tr><td colspan="9"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/alertas-planos');
      if (!r.ok) { tbody.innerHTML = errRow(9, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(9, 'Sem planos associados.'); return; }
      tbody.innerHTML = list.map(p => {
        // infra_nome vem directamente do backend (campo calculado para evitar nested access)
        const infraNome    = p.infra_nome                         || '—';
        const descPlano    = p.plano_acao?.descricao              || `Plano #${p.idplano_acao}`;
        const destinatario = p.plano_acao?.tipo_destinatario       || '—';
        // data_inicio preenchida automaticamente ao passar para 'ativo'
        // data_conclusao preenchida automaticamente ao passar para 'concluido'
        const dataInicio    = p.data_inicio    ? fmtDate(p.data_inicio)    : '—';
        const dataConclusao = p.data_conclusao ? fmtDate(p.data_conclusao) : '—';
        return `
    <tr>
      <td class="td-mono">#${p.idalerta || '—'}</td>
      <td title="${infraNome}">${infraNome}</td>
      <td title="${descPlano}" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${descPlano}</td>
      <td><span class="badge badge-info">${destinatario}</span></td>
      <td>${estadoBadge(p.estado)}</td>
      <td class="td-mono">${dataInicio}</td>
      <td class="td-mono">${dataConclusao}</td>
      <td>${p.observacoes || '—'}</td>
      <td style="display:flex;gap:.4rem">
        <button class="btn btn-sm btn-outline" title="Alterar estado" onclick="abrirEditarEstadoPlano(${p.idalerta},${p.idplano_acao},'${p.estado}')"><i class="fa fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" title="Apagar" onclick="apagarPlano(${p.idalerta},${p.idplano_acao})"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`;
      }).join('');
    }

    async function criarPlano() {
      const body = {
        idalerta:    parseInt(document.getElementById('m-plano-alerta').value),
        idplano_acao:parseInt(document.getElementById('m-plano-id').value),
        responsavel: document.getElementById('m-plano-resp').value,
        estado:      document.getElementById('m-plano-estado').value,
        observacoes: document.getElementById('m-plano-obs').value || undefined,
      };
      const r = await apiCall('POST', '/alertas-planos', body);
      showResponse('modal-plano-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-plano'), 1200); loadPlanos(); }
    }

    async function apagarPlano(idAlerta, idPlano) {
      if (!confirm(`Apagar associação alerta #${idAlerta} - plano #${idPlano}?`)) return;
      const r = await apiCall('DELETE', `/alertas-planos/${idAlerta}/${idPlano}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadPlanos();
    }

    function abrirEditarEstadoPlano(idAlerta, idPlano, estadoAtual) {
      document.getElementById('edit-plano-idalerta').value = idAlerta;
      document.getElementById('edit-plano-idplano').value  = idPlano;
      document.getElementById('edit-plano-obs').value      = '';
      document.getElementById('modal-editar-plano-resp').innerHTML = '';
      // pré-seleccionar o estado actual
      const sel = document.getElementById('edit-plano-estado');
      sel.value = estadoAtual || 'pendente';
      openModal('modal-editar-plano-estado');
    }

    async function guardarEstadoPlano() {
      const idAlerta = document.getElementById('edit-plano-idalerta').value;
      const idPlano  = document.getElementById('edit-plano-idplano').value;
      const estado   = document.getElementById('edit-plano-estado').value;
      const obs      = document.getElementById('edit-plano-obs').value || undefined;
      const body     = { estado };
      if (obs) body.observacoes = obs;
      const r = await apiCall('PATCH', `/alertas-planos/${idAlerta}/${idPlano}`, body);
      showResponse('modal-editar-plano-resp', r);
      if (r.ok) { setTimeout(() => { closeModal('modal-editar-plano-estado'); loadPlanos(); }, 1200); }
    }

    // ─── CALIBRAÇÃO ────────────────────────────────────────
    async function calibrarSensor(id) {
      const dataProx = prompt('Data próxima manutenção (YYYY-MM-DD, opcional):');
      const obs      = prompt('Observações (opcional):');
      const body = { canal: 'email' };
      if (dataProx) body.data_proxima_manutencao = dataProx;
      if (obs)      body.observacoes = obs;
      const r = await apiCall('POST', `/sensores/${id}/calibracao`, body);
      alert(r.ok ? 'Calibração registada! Notificação enviada.' : 'Erro: ' + (r.data.error_description || JSON.stringify(r.data)));
      loadSensores();
    }

    // ─── PLANOS DE AÇÃO (autónomos) ────────────────────────
    async function loadPlanosAuton() {
      const tbody = document.getElementById('planosauton-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="4"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/planos-acao');
      if (!r.ok) { tbody.innerHTML = errRow(4, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(4, 'Nenhum plano registado.'); return; }
      tbody.innerHTML = list.map(p => `
        <tr>
          <td class="td-mono">#${p.idplano_acao || '—'}</td>
          <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.descricao || ''}">${p.descricao || '—'}</td>
          <td>${p.tipo_destinatario || '—'}</td>
          <td>${actions(`editPlanoAuton(${p.idplano_acao})`, `apagarPlanoAuton(${p.idplano_acao})`)}</td>
        </tr>
      `).join('');
    }

    async function criarPlanoAuton() {
      const body = {
        descricao:        document.getElementById('m-plauton-desc').value,
        tipo_destinatario:document.getElementById('m-plauton-tipo').value,
      };
      const r = await apiCall('POST', '/planos-acao', body);
      showResponse('modal-plauton-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-plano-auton'), 1200); loadPlanosAuton(); }
    }

    async function editPlanoAuton(id) {
      const desc = prompt('Nova descrição:');
      if (!desc) return;
      const r = await apiCall('PATCH', `/planos-acao/${id}`, { descricao: desc });
      alert(r.ok ? 'Atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadPlanosAuton();
    }

    async function apagarPlanoAuton(id) {
      if (!confirm(`Apagar plano de ação #${id}?`)) return;
      const r = await apiCall('DELETE', `/planos-acao/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadPlanosAuton();
    }

    // ─── RELATÓRIOS ────────────────────────────────────────
    async function loadRelatorios() {
      const tbody = document.getElementById('relatorios-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="4"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      // Filtro opcional por alerta — ordenação por data feita no backend (DESC)
      const idalert = document.getElementById('filter-rel-alerta')?.value;
      const path = '/relatorios' + (idalert ? `?idalerta=${idalert}` : '');
      const r = await apiCall('GET', path);
      if (!r.ok) { tbody.innerHTML = errRow(4, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(4, 'Nenhum relatório encontrado.'); return; }
      tbody.innerHTML = list.map(rel => `
        <tr>
          <td class="td-mono">${rel.idalerta ? '#' + rel.idalerta : '—'}</td>
          <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${rel.descricao || ''}">${rel.descricao || '—'}</td>
          <td class="td-mono">${fmtDate(rel.data)}</td>
          <td>${actions(`editRelatorio(${rel.idrelatorio})`, `apagarRelatorio(${rel.idrelatorio})`)}</td>
        </tr>
      `).join('');
    }

    async function criarRelatorio() {
      const idalerta = parseInt(document.getElementById('m-rel-alerta').value);
      const body = {
        descricao:    document.getElementById('m-rel-desc').value,
        idutilizador: parseInt(document.getElementById('m-rel-utilizador').value),
        idalerta:     idalerta || undefined,
      };
      const r = await apiCall('POST', '/relatorios', body);
      showResponse('modal-rel-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-relatorio'), 1200); loadRelatorios(); }
    }

    async function editRelatorio(id) {
      const desc = prompt('Nova descrição:');
      if (!desc) return;
      const r = await apiCall('PATCH', `/relatorios/${id}`, { descricao: desc });
      alert(r.ok ? 'Atualizado!' : 'Erro: ' + JSON.stringify(r.data));
      loadRelatorios();
    }

    async function apagarRelatorio(id) {
      if (!confirm(`Apagar relatório #${id}?`)) return;
      const r = await apiCall('DELETE', `/relatorios/${id}`);
      alert(r.ok ? 'Apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadRelatorios();
    }

    // ─── UTILIZADORES ──────────────────────────────────────
    async function loadUtilizadores() {
      const tbody = document.getElementById('utilizadores-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="4"><div class="loading"><div class="spinner"></div>A carregar...</div></td></tr>`;
      const r = await apiCall('GET', '/utilizadores');
      if (!r.ok) { tbody.innerHTML = errRow(4, 'Erro: ' + (r.data.error_description || r.status)); return; }
      const list = getList(r);
      if (!list.length) { tbody.innerHTML = emptyRow(4, 'Nenhum utilizador encontrado.'); return; }
      tbody.innerHTML = list.map(u => `
        <tr>
          <td class="td-mono">#${u.idutilizador || '—'}</td>
          <td>${u.email || '—'}</td>
          <td>${u.tipo || '—'}</td>
          <td>
            <div style="display:flex;gap:.3rem">
              <button class="btn btn-sm btn-danger" onclick="apagarUtilizador(${u.idutilizador})"><i class="fa fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    async function criarUtilizador() {
      const body = {
        email:    document.getElementById('m-util-email').value,
        password: document.getElementById('m-util-pass').value,
        tipo:     document.getElementById('m-util-tipo').value,
      };
      const r = await apiCall('POST', '/utilizadores', body);
      showResponse('modal-util-resp', r);
      if (r.ok) { setTimeout(() => closeModal('modal-novo-utilizador'), 1200); loadUtilizadores(); }
    }

    async function apagarUtilizador(id) {
      if (!confirm(`Apagar utilizador #${id}? Esta acção é irreversível.`)) return;
      const r = await apiCall('DELETE', `/utilizadores/${id}`);
      alert(r.ok ? 'Utilizador apagado!' : 'Erro: ' + JSON.stringify(r.data));
      loadUtilizadores();
    }

    // ─── LOGIN ─────────────────────────────────────────────
    async function doLogin() {
      const body = {
        email: document.getElementById('login-user').value,
        password: document.getElementById('login-pass').value,
      };
      const r = await apiCall('POST', '/utilizadores/login', body);
      showResponse('login-response', r);
      if (r.ok && r.data.accessToken) {
        authToken = r.data.accessToken;
        const banner = document.getElementById('login-response');
        if (banner) banner.textContent = '✅ Login efetuado com sucesso! Tipo: ' + r.data.tipo + '. A redirecionar...';
        setTimeout(() => navigate('alertas'), 1000);
      }
    }

    // ─── ENDPOINTS EXPLORER ────────────────────────────────
    const ENDPOINTS = [
      // AUTENTICAÇÃO / UTILIZADORES
      { method: 'POST',   path: '/utilizadores/login',   desc: 'Login — devolve JWT',                      body: { email: 'admin@example.com', password: 'pass' } },
      { method: 'POST',   path: '/utilizadores',         desc: 'Criar utilizador',                         body: { email: 'novo@example.com', password: 'pass', tipo: 'operador_municipal' } },
      { method: 'GET',    path: '/utilizadores/{id}',    desc: 'Obter utilizador por ID',                  body: null },
      { method: 'DELETE', path: '/utilizadores/{id}',    desc: 'Apagar utilizador (admin)',                 body: null },
      // SENSORES
      { method: 'GET',    path: '/sensores',             desc: 'Listar sensores',                          body: null },
      { method: 'GET',    path: '/sensores/{id}',        desc: 'Sensor por ID',                            body: null },
      { method: 'POST',   path: '/sensores',             desc: 'Criar sensor',                             body: { tipo: 'nivel_agua', localizacao: 'Porto', status: 'online', idinfraestrutura_urbana: 1 } },
      { method: 'PATCH',  path: '/sensores/{id}',        desc: 'Atualizar sensor (estado, localização...)',  body: { status: 'manutencao' } },
      { method: 'DELETE', path: '/sensores/{id}',        desc: 'Apagar sensor',                            body: null },
      // LEITURAS
      { method: 'GET',    path: '/leituras',             desc: 'Listar todas as leituras (?page=&limit=)',  body: null },
      { method: 'GET',    path: '/leituras/sensor/{idsensor}', desc: 'Leituras de um sensor específico',   body: null },
      { method: 'GET',    path: '/leituras/{id}',        desc: 'Leitura por ID',                           body: null },
      { method: 'POST',   path: '/leituras',             desc: 'Registar leitura (pode gerar alerta)',      body: { idsensor: 1, tipo_variavel: 'nivel_agua', valor: 75.5, unidade: '%', data_observacao: new Date().toISOString() } },
      { method: 'DELETE', path: '/leituras/{id}',        desc: 'Apagar leitura',                           body: null },
      // ALERTAS
      { method: 'GET',    path: '/alertas',              desc: 'Listar alertas (?estado=ativo&nivel=2)',    body: null },
      { method: 'GET',    path: '/alertas/{id}',         desc: 'Alerta por ID',                            body: null },
      { method: 'POST',   path: '/alertas',              desc: 'Criar alerta manualmente',                  body: { idnivel_alerta: 2, idarea_risco: 1, descricao: 'Nível elevado' } },
      { method: 'PATCH',  path: '/alertas/{id}',         desc: 'Atualizar alerta',                         body: { estado: 'resolvido' } },
      { method: 'DELETE', path: '/alertas/{id}',         desc: 'Apagar alerta',                            body: null },
      // ÁREAS DE RISCO
      { method: 'GET',    path: '/areas-risco',          desc: 'Listar áreas (?vulnerabilidade=1-5)',       body: null },
      { method: 'GET',    path: '/areas-risco/{id}',     desc: 'Área de risco por ID',                     body: null },
      { method: 'POST',   path: '/areas-risco',          desc: 'Criar área de risco',                      body: { nome: 'Zona Ribeirinha', localizacao: 'Porto Norte', vulnerabilidade_base: 3 } },
      { method: 'PATCH',  path: '/areas-risco/{id}',     desc: 'Atualizar área de risco',                  body: { vulnerabilidade_base: 4 } },
      { method: 'DELETE', path: '/areas-risco/{id}',     desc: 'Apagar área de risco',                     body: null },
      // INFRAESTRUTURAS
      { method: 'GET',    path: '/infraestruturas',      desc: 'Listar infraestruturas (?idarea_risco=&tipo=)', body: null },
      { method: 'GET',    path: '/infraestruturas/{id}', desc: 'Infraestrutura por ID',                    body: null },
      { method: 'POST',   path: '/infraestruturas',      desc: 'Criar infraestrutura',                     body: { nome: 'Bueiro Central', tipo: 'bueiro', localizacao: 'Rua A', idarea_risco: 1 } },
      { method: 'PATCH',  path: '/infraestruturas/{id}', desc: 'Atualizar infraestrutura',                 body: { tipo: 'vala' } },
      { method: 'DELETE', path: '/infraestruturas/{id}', desc: 'Apagar infraestrutura',                    body: null },
      // PREVISÕES METEOROLÓGICAS
      { method: 'GET',    path: '/previsoes',            desc: 'Listar previsões (?idarea_risco=1)',        body: null },
      { method: 'GET',    path: '/previsoes/{id}',       desc: 'Previsão por ID',                          body: null },
      { method: 'POST',   path: '/previsoes',            desc: 'Criar previsão meteorológica',              body: { idarea_risco: 1, precipitacao_prevista: 25.0, confianca: 0.85, horizonte_horas: 24 } },
      { method: 'PATCH',  path: '/previsoes/{id}',       desc: 'Atualizar previsão',                       body: { confianca: 0.9 } },
      { method: 'DELETE', path: '/previsoes/{id}',       desc: 'Apagar previsão',                          body: null },
      // PLANOS DE AÇÃO
      { method: 'GET',    path: '/planos-acao',          desc: 'Listar planos de ação',                    body: null },
      { method: 'GET',    path: '/planos-acao/{id}',     desc: 'Plano de ação por ID',                     body: null },
      { method: 'POST',   path: '/planos-acao',          desc: 'Criar plano de ação',                      body: { descricao: 'Evacuação Zona A', tipo_destinatario: 'tecnico' } },
      { method: 'PATCH',  path: '/planos-acao/{id}',     desc: 'Atualizar plano de ação',                  body: { descricao: 'Nova descrição' } },
      { method: 'DELETE', path: '/planos-acao/{id}',     desc: 'Apagar plano de ação',                     body: null },
      // ALERTA ↔ PLANO DE AÇÃO
      { method: 'GET',    path: '/alertas-planos',       desc: 'Listar associações (?estado=&idalerta=)',   body: null },
      { method: 'GET',    path: '/alertas-planos/{idalerta}/{idplano_acao}', desc: 'Associação por IDs',   body: null },
      { method: 'POST',   path: '/alertas-planos',       desc: 'Criar associação alerta-plano',            body: { idalerta: 1, idplano_acao: 1, estado: 'pendente', responsavel: 'João Silva' } },
      { method: 'PATCH',  path: '/alertas-planos/{idalerta}/{idplano_acao}', desc: 'Atualizar associação', body: { estado: 'concluido' } },
      { method: 'DELETE', path: '/alertas-planos/{idalerta}/{idplano_acao}', desc: 'Remover associação',   body: null },
      // DESTINATÁRIOS
      { method: 'GET',    path: '/destinatarios',        desc: 'Listar destinatários (?tipo=)',             body: null },
      { method: 'GET',    path: '/destinatarios/{id}',   desc: 'Destinatário por ID',                      body: null },
      { method: 'POST',   path: '/destinatarios',        desc: 'Criar destinatário',                       body: { nome: 'João Silva', email: 'joao@ex.pt', tipo: 'tecnico' } },
      { method: 'PATCH',  path: '/destinatarios/{id}',   desc: 'Atualizar destinatário',                   body: { contato: '+351912345678' } },
      { method: 'DELETE', path: '/destinatarios/{id}',   desc: 'Apagar destinatário',                      body: null },
      // NOTIFICAÇÕES
      { method: 'GET',    path: '/notificacoes',         desc: 'Listar notificações (?iddestinatario=&idalerta=&estado=)', body: null },
      { method: 'GET',    path: '/notificacoes/{id}',    desc: 'Notificação por ID',                       body: null },
      { method: 'POST',   path: '/notificacoes',         desc: 'Notificar destinatário específico',         body: { iddestinatario: 1, canal: 'email', estado_envio: 'pendente', mensagem: 'Texto da notificação' } },
      { method: 'POST',   path: '/notificacoes',         desc: 'Notificar responsáveis por sensor',         body: { idsensor: 1, canal: 'email', observacoes: 'Calibração prevista' } },
      { method: 'PATCH',  path: '/notificacoes/{id}',    desc: 'Atualizar estado da notificação',           body: { estado_envio: 'enviado' } },
      { method: 'DELETE', path: '/notificacoes/{id}',    desc: 'Apagar notificação',                       body: null },
      // RELATÓRIOS
      { method: 'GET',    path: '/relatorios',           desc: 'Listar relatórios (?idalerta=&idutilizador=)', body: null },
      { method: 'GET',    path: '/relatorios/{id}',      desc: 'Relatório por ID',                         body: null },
      { method: 'POST',   path: '/relatorios',           desc: 'Criar relatório',                          body: { descricao: 'Análise de ocorrência', idalerta: 1 } },
      { method: 'DELETE', path: '/relatorios/{id}',      desc: 'Apagar relatório',                         body: null },
    ];

    function renderEndpoints() {
      const list = document.getElementById('endpoint-list');
      list.innerHTML = ENDPOINTS.map((ep, i) => `
    <li class="endpoint-item" onclick="selectEndpoint(${i})">
      <span class="method-badge method-${ep.method.toLowerCase()}">${ep.method}</span>
      <span class="endpoint-path">${ep.path}</span>
      <span class="endpoint-desc">${ep.desc}</span>
    </li>
  `).join('');
    }

    function selectEndpoint(i) {
      const ep = ENDPOINTS[i];
      document.getElementById('endpoint-placeholder').style.display = 'none';
      document.getElementById('endpoint-detail-card').style.display = 'block';
      document.getElementById('ep-detail-title').textContent = `${ep.method} ${ep.path}`;
      const body = ep.body ? `
    <div class="form-group" style="margin-bottom:1rem">
      <label>Request Body (JSON)</label>
      <textarea id="ep-body" style="font-family:var(--font-mono);font-size:.75rem" rows="6">${JSON.stringify(ep.body, null, 2)}</textarea>
    </div>
  ` : '';
      const pathInputs = (ep.path.match(/\{(\w+)\}/g) || []).map(p => {
        const name = p.replace(/[{}]/g, '');
        return `<div class="form-group" style="margin-bottom:.75rem"><label>${name}</label><input type="text" id="ep-param-${name}" placeholder="${name}" /></div>`;
      }).join('');
      document.getElementById('ep-detail-body').innerHTML = `
    <p style="font-size:.75rem;color:var(--text-dim);margin-bottom:1rem">${ep.desc}</p>
    ${pathInputs}
    ${body}
    <button class="btn btn-primary btn-sm" onclick="testEndpoint(${i})"><i class="fa fa-play"></i> Testar</button>
    <div class="api-response" id="ep-response"></div>
  `;
    }

    async function testEndpoint(i) {
      const ep = ENDPOINTS[i];
      let path = ep.path;
      const params = path.match(/\{(\w+)\}/g) || [];
      params.forEach(p => {
        const name = p.replace(/[{}]/g, '');
        const val = document.getElementById('ep-param-' + name)?.value || '1';
        path = path.replace(p, val);
      });
      let body = null;
      if (ep.body) {
        try { body = JSON.parse(document.getElementById('ep-body').value); }
        catch { alert('JSON inválido'); return; }
      }
      const r = await apiCall(ep.method, path, body);
      showResponse('ep-response', r);
    }

    // ─── INIT ──────────────────────────────────────────────
    // Load Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    script.onload = () => loadDashboard();
    document.head.appendChild(script);
