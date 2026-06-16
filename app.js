// Cargado globalmente desde icons.js en el index.html para compatibilidad con file://

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let state = {
  theme: 'slate',
  tematicas: [],
  unassignedPieces: []
};

let activeDragType = null; // 'piece' o 'theme'
let activeThemeId = null;

// --- ESTRUCTURAS PREDEFINIDAS (DE DEMOSTRACIÓN) ---
const DEFAULT_TEMATICAS = [
  {
    id: 'theme-1',
    title: 'Cuerpo Sano',
    desc: 'Mis pautas de entrenamiento físico y movimiento semanal.',
    icon: 'activity',
    items: [
      { id: 'item-1-1', text: 'Completar un mínimo de 8,000 pasos al día.', important: true },
      { id: 'item-1-2', text: 'Realizar 30 minutos de ejercicio cardiovascular diario.', important: false },
      { id: 'item-1-3', text: 'Entrenamiento de fuerza enfocado (3 veces por semana).', important: false }
    ]
  },
  {
    id: 'theme-2',
    title: 'Mente Clara',
    desc: 'Hábitos para mantener el enfoque, paz mental y aprendizaje constante.',
    icon: 'book',
    items: [
      { id: 'item-2-1', text: 'Meditar 10 minutos al despertar.', important: true },
      { id: 'item-2-2', text: 'Leer 15 páginas de un libro al día.', important: false }
    ]
  },
  {
    id: 'theme-3',
    title: 'Alimentación Consciente',
    desc: 'Principios de nutrición y salud para mantener una energía óptima.',
    icon: 'utensils',
    items: [
      { id: 'item-3-1', text: 'Beber al menos 2 litros de agua al día.', important: true },
      { id: 'item-3-2', text: 'Evitar azúcares procesados de lunes a viernes.', important: false }
    ]
  },
  {
    id: 'theme-4',
    title: 'Finanzas Fuertes',
    desc: 'Leyes personales para el control, ahorro e inversión inteligente del capital.',
    icon: 'dollar',
    items: [
      { id: 'item-4-1', text: 'Ahorrar o invertir el 20% de los ingresos mensuales.', important: true },
      { id: 'item-4-2', text: 'Esperar 48 horas antes de realizar un gasto no planificado.', important: false }
    ]
  }
];

const DEFAULT_UNASSIGNED = [
  { id: 'item-loose-1', text: 'Estirar 5 minutos antes de dormir.', important: false },
  { id: 'item-loose-2', text: 'Llamar o visitar a un familiar una vez por semana.', important: false },
  { id: 'item-loose-3', text: 'Agradecer por 3 cosas al final del día.', important: false }
];

const AVAILABLE_ICONS = ['target', 'checkCircle', 'activity', 'utensils', 'dollar', 'book', 'heart', 'calendar', 'briefcase', 'home'];
let selectedIconInModal = 'target';

// --- ELEMENTOS DEL DOM ---
const unassignedPiecesContainer = document.getElementById('unassignedPiecesContainer');
const quickAddPieceForm = document.getElementById('quickAddPieceForm');
const newPieceTextInput = document.getElementById('newPieceTextInput');
const canvasBoard = document.getElementById('canvasBoard');
const connectorMenu = document.getElementById('connectorMenu');
// Modales
const themeModalBackdrop = document.getElementById('themeModalBackdrop');
const themeForm = document.getElementById('themeForm');
const themeFormMode = document.getElementById('themeFormMode');
const themeFormId = document.getElementById('themeFormId');
const themeNameInput = document.getElementById('themeNameInput');
const themeDescInput = document.getElementById('themeDescInput');
const btnOpenNewThemeModal = document.getElementById('btnOpenNewThemeModal');
const btnCloseThemeModal = document.getElementById('btnCloseThemeModal');
const btnCancelThemeForm = document.getElementById('btnCancelThemeForm');
const iconSelectionGrid = document.getElementById('iconSelectionGrid');

const pieceModalBackdrop = document.getElementById('pieceModalBackdrop');
const pieceForm = document.getElementById('pieceForm');
const pieceFormId = document.getElementById('pieceFormId');
const pieceFormThemeId = document.getElementById('pieceFormThemeId');
const pieceTextInput = document.getElementById('pieceTextInput');
const btnClosePieceModal = document.getElementById('btnClosePieceModal');
const btnCancelPieceForm = document.getElementById('btnCancelPieceForm');

const customDialogBackdrop = document.getElementById('customDialogBackdrop');
const btnCloseCustomDialog = document.getElementById('btnCloseCustomDialog');
const btnCancelCustomDialog = document.getElementById('btnCancelCustomDialog');
const btnConfirmCustomDialog = document.getElementById('btnConfirmCustomDialog');

// --- CARGAR ICONOS ESTÁTICOS ---
function initStaticIcons() {
  document.getElementById('logoIcon').innerHTML = window.getIconSvg('target', 24);
  document.getElementById('plusIconSpan').innerHTML = window.getIconSvg('plus', 16);
  document.getElementById('addIconSpan').innerHTML = window.getIconSvg('plus', 14);
  btnCloseThemeModal.innerHTML = window.getIconSvg('x', 20);
  btnClosePieceModal.innerHTML = window.getIconSvg('x', 20);
  if (btnCloseCustomDialog) btnCloseCustomDialog.innerHTML = window.getIconSvg('x', 20);

  const matrixIconSpan = document.getElementById('matrixIconSpan');
  const calendarIconSpan = document.getElementById('calendarIconSpan');
  if (matrixIconSpan) matrixIconSpan.innerHTML = window.getIconSvg('target', 14);
  if (calendarIconSpan) calendarIconSpan.innerHTML = window.getIconSvg('calendar', 14);
}

// --- DETECCION DE MODO (SERVIDOR VS LOCAL FILE) ---
const isServerMode = window.location.protocol.startsWith('http');

// --- PERSISTENCIA DE DATOS ---
function saveToLocalStorage() {
  // Guardar siempre en LocalStorage como respaldo local/offline
  localStorage.setItem('matrix_puzzle_state', JSON.stringify(state));
  
  if (isServerMode) {
    saveToServer();
  }
}

function saveToServer() {
  fetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(state)
  })
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      console.error("Error al guardar en el archivo data.json de disco:", data.error);
    }
  })
  .catch(err => {
    console.error("No se pudo conectar con el servidor local para guardar:", err);
  });
}

function ensureStateDefaults() {
  if (!state.activeView) {
    state.activeView = 'matrix';
  }
  if (!state.weeklyRoutine) {
    state.weeklyRoutine = {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
      domingo: []
    };
  }
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('matrix_puzzle_state');
  if (data) {
    try {
      state = JSON.parse(data);
    } catch (e) {
      console.error("Error cargando localStorage, usando defaults", e);
      state = { theme: 'slate', tematicas: DEFAULT_TEMATICAS, unassignedPieces: DEFAULT_UNASSIGNED };
    }
  } else {
    state = {
      theme: 'slate',
      tematicas: DEFAULT_TEMATICAS,
      unassignedPieces: DEFAULT_UNASSIGNED
    };
    saveToLocalStorage();
  }
  ensureStateDefaults();
}

function loadFromServer(callback) {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      if (data && !data.empty) {
        state = data;
      } else {
        // Servidor activo pero archivo vacío (primer inicio): poblar con defaults
        state = {
          theme: 'slate',
          tematicas: DEFAULT_TEMATICAS,
          unassignedPieces: DEFAULT_UNASSIGNED
        };
        saveToServer();
      }
      ensureStateDefaults();
      callback();
    })
    .catch(err => {
      console.error("Error cargando del servidor local, recurriendo a LocalStorage:", err);
      loadFromLocalStorage();
      callback();
    });
}

// --- GESTIÓN DE TEMAS VISUALES ---
function initThemes() {
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-select-theme');
      applyTheme(selectedTheme);
    });
  });
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.body.setAttribute('data-theme', themeName);
  
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    if (btn.getAttribute('data-select-theme') === themeName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  saveToLocalStorage();
  renderAll(); // Re-renderizar para ajustar los fondos de sockets de puzzle
}

// --- RENDERIZADO GLOBAL ---
function renderAll() {
  // Sincronizar clases activas de pestañas de vista
  const btnViewMatrix = document.getElementById('btnViewMatrix');
  const btnViewCalendar = document.getElementById('btnViewCalendar');
  if (btnViewMatrix && btnViewCalendar) {
    if (state.activeView === 'matrix') {
      btnViewMatrix.classList.add('active');
      btnViewCalendar.classList.remove('active');
    } else {
      btnViewMatrix.classList.remove('active');
      btnViewCalendar.classList.add('active');
    }
  }

  renderUnassignedPieces();
  
  if (state.activeView === 'matrix') {
    canvasBoard.classList.remove('kanban-view-active');
    renderCanvasBoard();
  } else {
    renderCalendarBoard();
  }
  
  adjustPieceFontSizes();
}

// --- RENDERIZADO DEL BANCO DE PIEZAS SUELTAS ---
function renderUnassignedPieces() {
  unassignedPiecesContainer.innerHTML = '';
  
  state.unassignedPieces.forEach(item => {
    const pieceEl = document.createElement('div');
    pieceEl.className = `puzzle-piece ${item.important ? 'important' : ''}`;
    pieceEl.setAttribute('data-id', item.id);
    pieceEl.setAttribute('draggable', 'true');
    
    pieceEl.innerHTML = `
      <div class="puzzle-piece-content">
        <span class="puzzle-piece-text" id="text-${item.id}">${escapeHtml(item.text)}</span>
        <div class="piece-actions">
          <button class="btn-piece-tool" onclick="event.stopPropagation(); showConnectorMenu(event, '${item.id}', null)" title="Conectar a una temática">
            ${window.getIconSvg('plus', 14)}
          </button>
          <button class="btn-piece-tool ${item.important ? 'active' : ''}" onclick="event.stopPropagation(); togglePieceImportant('${item.id}', null)" title="Importante">
            ${window.getIconSvg('star', 12)}
          </button>
          <button class="btn-piece-tool" onclick="event.stopPropagation(); startEditPiece('${item.id}', null)" title="Editar">
            ${window.getIconSvg('edit', 12)}
          </button>
          <button class="btn-piece-tool" onclick="event.stopPropagation(); deletePiece('${item.id}', null)" title="Eliminar">
            ${window.getIconSvg('trash', 12)}
          </button>
        </div>
      </div>
    `;

    // Eventos Drag
    pieceEl.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      activeDragType = 'piece';
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.setData('source-theme', 'unassigned');
      pieceEl.classList.add('dragging');
    });

    pieceEl.addEventListener('dragend', () => {
      activeDragType = null;
      pieceEl.classList.remove('dragging');
    });

    // Hacer que al hacer clic en cualquier parte de la pieza suelta también abra el menú de conexión
    pieceEl.addEventListener('click', (e) => {
      // Evitar abrir si hizo clic en botones específicos
      if (e.target.closest('.btn-piece-tool')) return;
      showConnectorMenu(e, item.id, null);
    });

    unassignedPiecesContainer.appendChild(pieceEl);
  });
}

// --- ACTUALIZACIÓN DE LA CABECERA DEL LIENZO ---
function updateCanvasHeader() {
  const canvasTitle = document.querySelector('.canvas-title');
  const canvasDesc = document.querySelector('.canvas-desc');
  const canvasActions = document.querySelector('.canvas-actions');
  
  if (!canvasTitle || !canvasDesc || !canvasActions) return;
  
  if (activeThemeId) {
    const activeTheme = state.tematicas.find(t => t.id === activeThemeId);
    if (activeTheme) {
      canvasTitle.textContent = activeTheme.title;
      canvasDesc.textContent = activeTheme.desc || 'Sin descripción.';
      canvasActions.innerHTML = `
        <button class="btn-secondary" id="btnBackToBoard" onclick="exitThemeFullPage()">
          ${window.getIconSvg('arrowLeft', 14)}
          Volver al Tablero
        </button>
      `;
      return;
    }
  }
  
  // Estado por defecto
  canvasTitle.textContent = 'Mi Vida';
  canvasDesc.textContent = 'Conecta y acopla tus hábitos y reglas para estructurar tu matriz de vida.';
  canvasActions.innerHTML = `
    <button class="btn-primary" id="btnOpenNewThemeModal" onclick="openThemeModal('create')">
      ${window.getIconSvg('plus', 16)}
      Nueva Temática
    </button>
  `;
}

// --- CONTROLES DE PANTALLA COMPLETA ---
window.viewThemeFullPage = function(themeId) {
  activeThemeId = themeId;
  renderAll();
};

window.exitThemeFullPage = function() {
  activeThemeId = null;
  renderAll();
};

// --- AJUSTE AUTOMÁTICO DE TAMAÑO DE FUENTE EN PIEZAS ---
function adjustPieceFontSizes() {
  const pieces = document.querySelectorAll('.puzzle-piece');
  pieces.forEach(pieceEl => {
    if (pieceEl.closest('.sidebar') || pieceEl.closest('.kanban-column-list')) {
      const textSpan = pieceEl.querySelector('.puzzle-piece-text');
      if (textSpan) textSpan.style.fontSize = '';
      return;
    }
    
    const textSpan = pieceEl.querySelector('.puzzle-piece-text');
    if (!textSpan) return;
    
    let fontSize = 14.4; // Base ~0.9rem
    textSpan.style.fontSize = `${fontSize}px`;
    
    // Altura máxima disponible de la pieza (70px alto - 16px padding = 54px, seguridad a 46px)
    const maxHeight = 46;
    
    let iterations = 0;
    while (textSpan.offsetHeight > maxHeight && fontSize > 8.5 && iterations < 15) {
      fontSize -= 0.5;
      textSpan.style.fontSize = `${fontSize}px`;
      iterations++;
    }
  });
}

// --- RENDERIZADO DEL LIENZO PRINCIPAL (Temáticas y Puzzle Lanes) ---
function renderCanvasBoard() {
  updateCanvasHeader();
  canvasBoard.innerHTML = '';

  const themesToRender = activeThemeId
    ? state.tematicas.filter(t => t.id === activeThemeId)
    : state.tematicas;

  if (themesToRender.length === 0) {
    if (activeThemeId) {
      activeThemeId = null;
      updateCanvasHeader();
    }
    
    canvasBoard.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: var(--text-secondary); grid-column: 1/-1;">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🧩</div>
        <h3>No hay Temáticas creadas</h3>
        <p style="font-weight: 300; margin-top: 0.5rem; font-size: 0.95rem;">Crea una nueva temática arriba a la derecha para empezar a conectar tus piezas.</p>
      </div>
    `;
    return;
  }

  themesToRender.forEach(tematica => {
    const laneCard = document.createElement('section');
    laneCard.className = `tematica-lane ${activeThemeId ? 'maximized' : ''}`;
    laneCard.setAttribute('data-theme-id', tematica.id);
    
    // Header de la Temática
    const isFullPage = activeThemeId === tematica.id;
    const maximizeButtonHtml = isFullPage ? '' : `
      <button class="btn-secondary" onclick="viewThemeFullPage('${tematica.id}')" title="Abrir en pantalla completa">
        ${window.getIconSvg('maximize', 14)}
      </button>
    `;

    let headerHtml = `
      <div class="tematica-header">
        <div class="tematica-info">
          <div class="tematica-icon-box">${window.getIconSvg(tematica.icon, 20)}</div>
          <div>
            <h4 class="tematica-title">${escapeHtml(tematica.title)}</h4>
            <p class="tematica-desc">${escapeHtml(tematica.desc || 'Sin descripción.')}</p>
          </div>
        </div>
        <div class="tematica-actions">
          ${maximizeButtonHtml}
          <button class="btn-secondary" onclick="openThemeModal('edit', '${tematica.id}')" title="Editar Temática">
            ${window.getIconSvg('edit', 14)}
          </button>
          <button class="btn-danger" onclick="deleteTematica('${tematica.id}')" title="Eliminar Temática">
            ${window.getIconSvg('trash', 14)}
          </button>
        </div>
      </div>
    `;

    // Carril de piezas del rompecabezas
    const items = tematica.items || [];
    let puzzleItemsHtml = '';

    if (items.length === 0) {
      puzzleItemsHtml = `<div class="puzzle-lane-empty">La temática está vacía. Arrastra piezas aquí.</div>`;
    } else {
      items.forEach((item, index) => {
        // Calcular clases de conexión de rompecabezas
        let connectionClass = '';
        if (items.length > 1) {
          if (index === 0) {
            connectionClass = 'connect-right';
          } else if (index === items.length - 1) {
            connectionClass = 'connect-left';
          } else {
            connectionClass = 'connect-left connect-right';
          }
        }

        // Determinar si mostrar flechas de reordenamiento
        const showLeftArrow = index > 0;
        const showRightArrow = index < items.length - 1;

        puzzleItemsHtml += `
          <div class="puzzle-piece ${connectionClass} ${item.important ? 'important' : ''}" data-id="${item.id}" draggable="true">
            <div class="puzzle-piece-content">
              <span class="puzzle-piece-text" id="text-${item.id}">${escapeHtml(item.text)}</span>
              <div class="piece-actions">
                ${showLeftArrow ? `
                  <button class="btn-piece-tool" onclick="event.stopPropagation(); movePieceOrder('${tematica.id}', ${index}, -1)" title="Mover izquierda">
                    ◀
                  </button>
                ` : ''}
                ${showRightArrow ? `
                  <button class="btn-piece-tool" onclick="event.stopPropagation(); movePieceOrder('${tematica.id}', ${index}, 1)" title="Mover derecha">
                    ▶
                  </button>
                ` : ''}
                <button class="btn-piece-tool" onclick="event.stopPropagation(); showConnectorMenu(event, '${item.id}', '${tematica.id}')" title="Cambiar conexión">
                  🧩
                </button>
                <button class="btn-piece-tool ${item.important ? 'active' : ''}" onclick="event.stopPropagation(); togglePieceImportant('${item.id}', '${tematica.id}')" title="Importante">
                  ${window.getIconSvg('star', 12)}
                </button>
                <button class="btn-piece-tool" onclick="event.stopPropagation(); startEditPiece('${item.id}', '${tematica.id}')" title="Editar">
                  ${window.getIconSvg('edit', 12)}
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    laneCard.innerHTML = `
      ${headerHtml}
      <div class="puzzle-lane-wrapper">
        <div class="puzzle-lane" id="lane-${tematica.id}">
          ${puzzleItemsHtml}
        </div>
      </div>
    `;

    canvasBoard.appendChild(laneCard);

    // Hacer la temática draggable
    laneCard.setAttribute('draggable', 'true');

    laneCard.addEventListener('dragstart', (e) => {
      // Si se arrastra desde los botones de acción o el carril del puzzle, no arrastrar la temática
      if (e.target.closest('.tematica-actions') || e.target.closest('.puzzle-lane-wrapper') || e.target.closest('button') || e.target.closest('.puzzle-piece')) {
        e.preventDefault();
        return;
      }
      activeDragType = 'theme';
      e.dataTransfer.setData('text/plain', tematica.id);
      laneCard.classList.add('dragging-theme');
    });

    laneCard.addEventListener('dragend', () => {
      activeDragType = null;
      laneCard.classList.remove('dragging-theme');
    });

    laneCard.addEventListener('dragover', (e) => {
      if (activeDragType !== 'theme') return;
      e.preventDefault();
    });

    laneCard.addEventListener('dragenter', (e) => {
      if (activeDragType !== 'theme') return;
      e.preventDefault();
      laneCard.classList.add('drag-over-theme');
    });

    laneCard.addEventListener('dragleave', () => {
      if (activeDragType !== 'theme') return;
      laneCard.classList.remove('drag-over-theme');
    });

    laneCard.addEventListener('drop', (e) => {
      if (activeDragType !== 'theme') return;
      e.preventDefault();
      laneCard.classList.remove('drag-over-theme');
      const draggedThemeId = e.dataTransfer.getData('text/plain');
      reorderThemes(draggedThemeId, tematica.id);
    });

    // Vincular eventos Drag & Drop para cada pieza de la temática (reordenamiento o inserción)
    const pieces = laneCard.querySelectorAll('.puzzle-lane .puzzle-piece');
    pieces.forEach((pieceEl, idx) => {
      const item = items[idx];
      
      pieceEl.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        activeDragType = 'piece';
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setData('source-theme', tematica.id);
        pieceEl.classList.add('dragging');
      });

      pieceEl.addEventListener('dragend', () => {
        activeDragType = null;
        pieceEl.classList.remove('dragging');
      });

      pieceEl.addEventListener('dragover', (e) => {
        if (activeDragType === 'theme') return;
        e.preventDefault();
        e.stopPropagation();
      });

      pieceEl.addEventListener('drop', (e) => {
        if (activeDragType === 'theme') return;
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        const sourceThemeId = e.dataTransfer.getData('source-theme');
        movePieceToPosition(draggedId, sourceThemeId, tematica.id, idx);
      });
    });

    // Vincular eventos Drag & Drop para el carril (añadir al final)
    const laneEl = laneCard.querySelector('.puzzle-lane');
    
    laneEl.addEventListener('dragover', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
    });

    laneEl.addEventListener('dragenter', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
      laneEl.classList.add('drag-over');
    });

    laneEl.addEventListener('dragleave', () => {
      if (activeDragType === 'theme') return;
      laneEl.classList.remove('drag-over');
    });

    laneEl.addEventListener('drop', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
      laneEl.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      const sourceThemeId = e.dataTransfer.getData('source-theme');
      
      // Si se suelta en el carril vacío o espacio libre del carril, añadir al final
      if (e.target === laneEl || e.target.classList.contains('puzzle-lane-empty')) {
        movePiece(draggedId, sourceThemeId === 'unassigned' ? null : sourceThemeId, tematica.id);
      }
    });
  });
}

// --- VISTA CALENDARIO: CAMBIO DE VISTA ---
window.switchView = function(viewName) {
  state.activeView = viewName;
  saveToLocalStorage();
  renderAll();
};

const DAYS_OF_WEEK = {
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miércoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sábado',
  domingo: 'domingo'
};

// --- RENDERIZADO DEL TABLERO DE RUTINA SEMANAL (KANBAN) ---
function renderCalendarBoard() {
  const canvasTitle = document.querySelector('.canvas-title');
  const canvasDesc = document.querySelector('.canvas-desc');
  const canvasActions = document.querySelector('.canvas-actions');
  
  if (canvasTitle) canvasTitle.textContent = 'Rutina Semanal';
  if (canvasDesc) canvasDesc.textContent = 'Organiza tus hábitos y tareas diarias en un tablero Kanban semanal.';
  if (canvasActions) canvasActions.innerHTML = '';
  
  canvasBoard.classList.add('kanban-view-active');
  canvasBoard.innerHTML = '';
  
  const boardEl = document.createElement('div');
  boardEl.className = 'kanban-board';
  
  Object.keys(DAYS_OF_WEEK).forEach(dayKey => {
    const dayName = DAYS_OF_WEEK[dayKey];
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.setAttribute('data-day', dayKey);
    
    const items = state.weeklyRoutine[dayKey] || [];
    const itemsCount = items.length;
    
    columnEl.innerHTML = `
      <div class="kanban-column-header">
        <span>${dayName}</span>
        <span style="font-size: 0.8rem; opacity: 0.6; font-weight: normal;">${itemsCount}</span>
      </div>
      <div class="kanban-column-list" id="list-${dayKey}"></div>
      <div class="kanban-creator-container" id="creator-container-${dayKey}">
        <button class="btn-add-kanban" onclick="showKanbanCreator('${dayKey}')">
          ${window.getIconSvg('plus', 14)} Añadir pieza
        </button>
      </div>
    `;
    
    const listEl = columnEl.querySelector('.kanban-column-list');
    
    if (items.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 1.5rem; font-size: 0.8rem; color: var(--text-secondary); opacity: 0.5; border: 1px dashed var(--border-color); border-radius: var(--border-radius-sm);">Vacío. Arrastra piezas aquí.</div>`;
    } else {
      items.forEach((item, index) => {
        const pieceEl = document.createElement('div');
        pieceEl.className = `puzzle-piece ${item.important ? 'important' : ''}`;
        pieceEl.setAttribute('data-id', item.id);
        pieceEl.setAttribute('draggable', 'true');
        
        const timeHtml = item.time ? `
          <div class="puzzle-piece-time">
            ${window.getIconSvg('clock', 11, 'time-icon')}
            <span>${escapeHtml(item.time)}</span>
          </div>
        ` : '';

        pieceEl.innerHTML = `
          <div class="puzzle-piece-content">
            <div class="puzzle-piece-main-info">
              ${timeHtml}
              <span class="puzzle-piece-text" id="text-${item.id}">${escapeHtml(item.text)}</span>
            </div>
            <div class="piece-actions">
              <button class="btn-piece-tool ${item.important ? 'active' : ''}" onclick="event.stopPropagation(); togglePieceImportant('${item.id}', '${dayKey}')" title="Importante">
                ${window.getIconSvg('star', 12)}
              </button>
              <button class="btn-piece-tool" onclick="event.stopPropagation(); startEditPiece('${item.id}', '${dayKey}')" title="Editar">
                ${window.getIconSvg('edit', 12)}
              </button>
              <button class="btn-piece-tool" onclick="event.stopPropagation(); deletePiece('${item.id}', '${dayKey}')" title="Eliminar">
                ${window.getIconSvg('trash', 12)}
              </button>
            </div>
          </div>
        `;
        
        // Eventos Drag
        pieceEl.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          activeDragType = 'piece';
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.setData('source-theme', dayKey);
          pieceEl.classList.add('dragging');
        });
        
        pieceEl.addEventListener('dragend', () => {
          activeDragType = null;
          pieceEl.classList.remove('dragging');
        });
        
        // Vincular eventos de reordenación de piezas dentro de la columna
        pieceEl.addEventListener('dragover', (e) => {
          if (activeDragType === 'theme') return;
          e.preventDefault();
          e.stopPropagation();
        });
        
        pieceEl.addEventListener('drop', (e) => {
          if (activeDragType === 'theme') return;
          e.preventDefault();
          e.stopPropagation();
          
          const draggedId = e.dataTransfer.getData('text/plain');
          const sourceThemeId = e.dataTransfer.getData('source-theme');
          window.movePieceToPosition(draggedId, sourceThemeId, dayKey, index);
        });
        
        listEl.appendChild(pieceEl);
      });
    }
    
    // Drag & Drop para la columna (añadir al final)
    listEl.addEventListener('dragover', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
    });
    
    listEl.addEventListener('dragenter', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
      listEl.classList.add('drag-over');
    });
    
    listEl.addEventListener('dragleave', () => {
      if (activeDragType === 'theme') return;
      listEl.classList.remove('drag-over');
    });
    
    listEl.addEventListener('drop', (e) => {
      if (activeDragType === 'theme') return;
      e.preventDefault();
      listEl.classList.remove('drag-over');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const sourceThemeId = e.dataTransfer.getData('source-theme');
      
      // Si se suelta en la lista (vacía o espacio libre), añadir al final
      if (e.target === listEl || e.target.closest('.kanban-column-list') === listEl) {
        window.movePiece(draggedId, sourceThemeId, dayKey);
      }
    });
    
    boardEl.appendChild(columnEl);
  });
  
  canvasBoard.appendChild(boardEl);
}

// --- CONTROLES DE CREACIÓN INLINE EN KANBAN ---
window.showKanbanCreator = function(dayKey) {
  const container = document.getElementById(`creator-container-${dayKey}`);
  if (!container) return;
  
  container.innerHTML = `
    <div class="kanban-inline-creator">
      <div class="kanban-inline-time-container">
        <span class="inline-time-icon">${window.getIconSvg('clock', 12)}</span>
        <input type="time" class="kanban-inline-time-input" id="input-time-kanban-${dayKey}" title="Hora">
      </div>
      <textarea class="kanban-inline-input" id="input-kanban-${dayKey}" placeholder="Nueva tarea para este día..." required autocomplete="off" rows="2"></textarea>
      <div class="kanban-inline-actions">
        <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="cancelKanbanCreator('${dayKey}')">Cancelar</button>
        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="saveKanbanPiece('${dayKey}')">Añadir</button>
      </div>
    </div>
  `;
  
  const textarea = document.getElementById(`input-kanban-${dayKey}`);
  if (textarea) {
    textarea.focus();
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveKanbanPiece(dayKey);
      } else if (e.key === 'Escape') {
        cancelKanbanCreator(dayKey);
      }
    });
  }
};

window.cancelKanbanCreator = function(dayKey) {
  const container = document.getElementById(`creator-container-${dayKey}`);
  if (!container) return;
  
  container.innerHTML = `
    <button class="btn-add-kanban" onclick="showKanbanCreator('${dayKey}')">
      ${window.getIconSvg('plus', 14)} Añadir pieza
    </button>
  `;
};

window.saveKanbanPiece = function(dayKey) {
  const input = document.getElementById(`input-kanban-${dayKey}`);
  const timeInput = document.getElementById(`input-time-kanban-${dayKey}`);
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    cancelKanbanCreator(dayKey);
    return;
  }
  
  const time = timeInput ? timeInput.value.trim() : '';
  
  const newPiece = {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text,
    time: time,
    important: false
  };
  
  if (!state.weeklyRoutine[dayKey]) {
    state.weeklyRoutine[dayKey] = [];
  }
  
  state.weeklyRoutine[dayKey].push(newPiece);
  saveToLocalStorage();
  renderAll();
};

// --- CREAR / ELIMINAR PIEZAS (BANCO DE IDEAS) ---
quickAddPieceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = newPieceTextInput.value.trim();
  if (!text) return;

  const newPiece = {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text,
    important: false
  };

  state.unassignedPieces.push(newPiece);
  newPieceTextInput.value = '';
  
  saveToLocalStorage();
  renderAll();
});

// --- EDITAR TEXTO DE PIEZA (MODAL POPUP) ---
window.startEditPiece = function(itemId, themeId) {
  let piece = null;
  if (!themeId || themeId === 'null') {
    piece = state.unassignedPieces.find(p => p.id === itemId);
  } else {
    if (state.weeklyRoutine && state.weeklyRoutine[themeId]) {
      piece = state.weeklyRoutine[themeId].find(p => p.id === itemId);
    } else {
      const theme = state.tematicas.find(t => t.id === themeId);
      if (theme) {
        piece = theme.items.find(i => i.id === itemId);
      }
    }
  }

  if (!piece) return;

  pieceFormId.value = itemId;
  pieceFormThemeId.value = themeId || '';
  pieceTextInput.value = piece.text;

  // Mostrar u ocultar el campo de hora según corresponda (solo para rutina semanal/calendario)
  const isWeeklyRoutine = themeId && state.weeklyRoutine && state.weeklyRoutine[themeId];
  const pieceTimeFormGroup = document.getElementById('pieceTimeFormGroup');
  const pieceTimeInput = document.getElementById('pieceTimeInput');
  if (pieceTimeFormGroup && pieceTimeInput) {
    if (isWeeklyRoutine) {
      pieceTimeFormGroup.style.display = 'block';
      pieceTimeInput.value = piece.time || '';
    } else {
      pieceTimeFormGroup.style.display = 'none';
      pieceTimeInput.value = '';
    }
  }

  pieceModalBackdrop.classList.add('active');
  
  setTimeout(() => {
    pieceTextInput.focus();
    pieceTextInput.select();
  }, 100);
};

function closePieceModal() {
  pieceModalBackdrop.classList.remove('active');
}

// --- ELIMINAR PIEZA ---
window.deletePiece = async function(itemId, themeId) {
  const confirmed = await window.showCustomConfirm(
    "Eliminar Pieza",
    "¿Estás seguro de que deseas eliminar esta pieza de rompecabezas definitivamente?"
  );
  if (!confirmed) return;

  if (!themeId || themeId === 'null') {
    state.unassignedPieces = state.unassignedPieces.filter(p => p.id !== itemId);
  } else {
    if (state.weeklyRoutine && state.weeklyRoutine[themeId]) {
      state.weeklyRoutine[themeId] = state.weeklyRoutine[themeId].filter(p => p.id !== itemId);
    } else {
      const theme = state.tematicas.find(t => t.id === themeId);
      if (theme) {
        theme.items = theme.items.filter(i => i.id !== itemId);
      }
    }
  }

  saveToLocalStorage();
  renderAll();
};

// --- MARCAR IMPORTANTE ---
window.togglePieceImportant = function(itemId, themeId) {
  let piece = null;
  if (!themeId || themeId === 'null') {
    piece = state.unassignedPieces.find(p => p.id === itemId);
  } else {
    if (state.weeklyRoutine && state.weeklyRoutine[themeId]) {
      piece = state.weeklyRoutine[themeId].find(p => p.id === itemId);
    } else {
      const theme = state.tematicas.find(t => t.id === themeId);
      if (theme) {
        piece = theme.items.find(i => i.id === itemId);
      }
    }
  }

  if (piece) {
    piece.important = !piece.important;
    saveToLocalStorage();
    renderAll();
  }
};

// --- GESTIÓN DE MODALES DE TEMÁTICAS ---
window.openThemeModal = function(mode = 'create', id = null) {
  themeFormMode.value = mode;
  themeFormId.value = id || '';

  if (mode === 'create') {
    themeModalTitle.textContent = 'Nueva Temática';
    themeNameInput.value = '';
    themeDescInput.value = '';
    selectedIconInModal = 'target';
  } else {
    const theme = state.tematicas.find(t => t.id === id);
    if (!theme) return;

    themeModalTitle.textContent = 'Editar Temática';
    themeNameInput.value = theme.title;
    themeDescInput.value = theme.desc || '';
    selectedIconInModal = theme.icon || 'target';
  }

  renderIconSelectionGrid();
  themeModalBackdrop.classList.add('active');
}

function closeThemeModal() {
  themeModalBackdrop.classList.remove('active');
}

function renderIconSelectionGrid() {
  iconSelectionGrid.innerHTML = '';
  
  AVAILABLE_ICONS.forEach(iconName => {
    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.className = `icon-option ${iconName === selectedIconInModal ? 'active' : ''}`;
    iconBtn.innerHTML = window.getIconSvg(iconName, 18);

    iconBtn.addEventListener('click', () => {
      const active = iconSelectionGrid.querySelector('.icon-option.active');
      if (active) active.classList.remove('active');

      iconBtn.classList.add('active');
      selectedIconInModal = iconName;
    });

    iconSelectionGrid.appendChild(iconBtn);
  });
}

// Enviar formulario del modal
themeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const mode = themeFormMode.value;
  const name = themeNameInput.value.trim();
  const desc = themeDescInput.value.trim();
  const id = themeFormId.value;

  if (!name) return;

  if (mode === 'create') {
    const newId = `theme-${Date.now()}`;
    const newTheme = {
      id: newId,
      title: name,
      desc: desc,
      icon: selectedIconInModal,
      items: []
    };
    state.tematicas.push(newTheme);
  } else {
    const theme = state.tematicas.find(t => t.id === id);
    if (theme) {
      theme.title = name;
      theme.desc = desc;
      theme.icon = selectedIconInModal;
    }
  }

  saveToLocalStorage();
  renderAll();
  closeThemeModal();
});

// --- ELIMINAR TEMÁTICA ---
window.deleteTematica = async function(themeId) {
  const theme = state.tematicas.find(t => t.id === themeId);
  if (!theme) return;

  const confirmed = await window.showCustomConfirm(
    "Eliminar Temática",
    `¿Estás seguro de que deseas eliminar la temática "${theme.title}"?\n\nTodas las piezas que tenía acopladas volverán automáticamente al Banco de Piezas para que no las pierdas.`
  );
  if (!confirmed) return;

  // Devolver las piezas acopladas al banco de sueltas
  if (theme.items && theme.items.length > 0) {
    state.unassignedPieces.push(...theme.items);
  }

  // Filtrar
  state.tematicas = state.tematicas.filter(t => t.id !== themeId);

  saveToLocalStorage();
  renderAll();
};

// --- MENÚ CONTEXTUAL DE CONEXIÓN RÁPIDA ---
window.showConnectorMenu = function(e, itemId, currentThemeId) {
  e.stopPropagation();
  
  // Limpiar/Cerrar menú previo si existía
  closeConnectorMenu();

  const rect = e.currentTarget.getBoundingClientRect();
  connectorMenu.style.top = `${rect.bottom + window.scrollY}px`;
  connectorMenu.style.left = `${rect.left + window.scrollX}px`;
  connectorMenu.style.display = 'flex';

  let html = '';

  state.tematicas.forEach(theme => {
    if (theme.id !== currentThemeId) {
      html += `
        <button class="connector-menu-item" onclick="movePiece('${itemId}', ${currentThemeId ? `'${currentThemeId}'` : 'null'}, '${theme.id}')">
          ${window.getIconSvg(theme.icon, 14)} Conectar a "${escapeHtml(theme.title)}"
        </button>
      `;
    }
  });

  if (currentThemeId && currentThemeId !== 'null') {
    html += `
      <button class="connector-menu-item action-disconnect" onclick="movePiece('${itemId}', '${currentThemeId}', null)">
        ${window.getIconSvg('trash', 14)} Desconectar al Banco
      </button>
    `;
  }

  if (!html) {
    html = `<div style="padding: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); text-align: center;">No hay otras temáticas disponibles</div>`;
  }

  connectorMenu.innerHTML = html;
};

function closeConnectorMenu() {
  connectorMenu.style.display = 'none';
}

// Clic fuera del menú lo cierra
document.addEventListener('click', (e) => {
  if (!e.target.closest('#connectorMenu') && !e.target.closest('.btn-piece-tool')) {
    closeConnectorMenu();
  }
});

// --- ENCADENAR / MOVER PIEZA ---
window.movePiece = function(itemId, fromThemeId, toThemeId) {
  let piece = null;

  // Remover de origen
  if (!fromThemeId || fromThemeId === 'null') {
    const index = state.unassignedPieces.findIndex(p => p.id === itemId);
    if (index !== -1) {
      piece = state.unassignedPieces.splice(index, 1)[0];
    }
  } else if (state.weeklyRoutine && state.weeklyRoutine[fromThemeId]) {
    const index = state.weeklyRoutine[fromThemeId].findIndex(p => p.id === itemId);
    if (index !== -1) {
      piece = state.weeklyRoutine[fromThemeId].splice(index, 1)[0];
    }
  } else {
    const theme = state.tematicas.find(t => t.id === fromThemeId);
    if (theme) {
      const index = theme.items.findIndex(p => p.id === itemId);
      if (index !== -1) {
        piece = theme.items.splice(index, 1)[0];
      }
    }
  }

  if (!piece) {
    closeConnectorMenu();
    return;
  }

  // Añadir a destino
  if (!toThemeId || toThemeId === 'null') {
    state.unassignedPieces.push(piece);
  } else if (state.weeklyRoutine && state.weeklyRoutine[toThemeId]) {
    if (!state.weeklyRoutine[toThemeId]) state.weeklyRoutine[toThemeId] = [];
    state.weeklyRoutine[toThemeId].push(piece);
  } else {
    const theme = state.tematicas.find(t => t.id === toThemeId);
    if (theme) {
      if (!theme.items) theme.items = [];
      theme.items.push(piece);
    }
  }

  saveToLocalStorage();
  renderAll();
  closeConnectorMenu();
};

// --- POSICIONAR PIEZA EN ÍNDICE (DRAG & DROP REORDER/INSERT) ---
window.movePieceToPosition = function(itemId, fromThemeId, toThemeId, targetIndex) {
  let piece = null;

  // Remover de origen
  if (!fromThemeId || fromThemeId === 'null' || fromThemeId === 'unassigned') {
    const index = state.unassignedPieces.findIndex(p => p.id === itemId);
    if (index !== -1) {
      piece = state.unassignedPieces.splice(index, 1)[0];
    }
  } else if (state.weeklyRoutine && state.weeklyRoutine[fromThemeId]) {
    const index = state.weeklyRoutine[fromThemeId].findIndex(p => p.id === itemId);
    if (index !== -1) {
      piece = state.weeklyRoutine[fromThemeId].splice(index, 1)[0];
    }
  } else {
    const theme = state.tematicas.find(t => t.id === fromThemeId);
    if (theme) {
      const index = theme.items.findIndex(p => p.id === itemId);
      if (index !== -1) {
        piece = theme.items.splice(index, 1)[0];
      }
    }
  }

  if (!piece) return;

  // Añadir a destino en posición específica
  if (!toThemeId || toThemeId === 'null' || toThemeId === 'unassigned') {
    state.unassignedPieces.push(piece);
  } else if (state.weeklyRoutine && state.weeklyRoutine[toThemeId]) {
    if (!state.weeklyRoutine[toThemeId]) state.weeklyRoutine[toThemeId] = [];
    state.weeklyRoutine[toThemeId].splice(targetIndex, 0, piece);
  } else {
    const theme = state.tematicas.find(t => t.id === toThemeId);
    if (theme) {
      if (!theme.items) theme.items = [];
      // Insertar en la posición indicada
      theme.items.splice(targetIndex, 0, piece);
    }
  }

  saveToLocalStorage();
  renderAll();
};

// --- REORDENAR TEMÁTICAS (DRAG & DROP) ---
window.reorderThemes = function(draggedThemeId, targetThemeId) {
  if (draggedThemeId === targetThemeId) return;
  const fromIndex = state.tematicas.findIndex(t => t.id === draggedThemeId);
  const toIndex = state.tematicas.findIndex(t => t.id === targetThemeId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [removed] = state.tematicas.splice(fromIndex, 1);
  state.tematicas.splice(toIndex, 0, removed);

  saveToLocalStorage();
  renderAll();
};

// --- ORDENAR PIEZAS (DESPLAZAMIENTO DENTRO DEL PUZZLE) ---
window.movePieceOrder = function(themeId, currentIndex, direction) {
  const theme = state.tematicas.find(t => t.id === themeId);
  if (!theme || !theme.items) return;

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= theme.items.length) return;

  // Intercambiar
  const temp = theme.items[currentIndex];
  theme.items[currentIndex] = theme.items[targetIndex];
  theme.items[targetIndex] = temp;

  saveToLocalStorage();
  renderAll();
};

// --- EVENT LISTENERS GENERALES ---
btnCloseThemeModal.addEventListener('click', closeThemeModal);
btnCancelThemeForm.addEventListener('click', closeThemeModal);

// Cerrar modal al hacer clic fuera
themeModalBackdrop.addEventListener('click', (e) => {
  if (e.target === themeModalBackdrop) {
    closeThemeModal();
  }
});

// Eventos de cerrar para el modal de piezas
btnClosePieceModal.addEventListener('click', closePieceModal);
btnCancelPieceForm.addEventListener('click', closePieceModal);
pieceModalBackdrop.addEventListener('click', (e) => {
  if (e.target === pieceModalBackdrop) {
    closePieceModal();
  }
});

// Formulario de edición de piezas
pieceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const itemId = pieceFormId.value;
  const themeId = pieceFormThemeId.value;
  const newText = pieceTextInput.value.trim();

  if (!newText) return;

  let piece = null;
  if (!themeId || themeId === 'null') {
    piece = state.unassignedPieces.find(p => p.id === itemId);
  } else {
    if (state.weeklyRoutine && state.weeklyRoutine[themeId]) {
      piece = state.weeklyRoutine[themeId].find(p => p.id === itemId);
    } else {
      const theme = state.tematicas.find(t => t.id === themeId);
      if (theme) {
        piece = theme.items.find(i => i.id === itemId);
      }
    }
  }

  if (piece) {
    piece.text = newText;
    const isWeeklyRoutine = themeId && state.weeklyRoutine && state.weeklyRoutine[themeId];
    if (isWeeklyRoutine) {
      const pieceTimeInput = document.getElementById('pieceTimeInput');
      if (pieceTimeInput) {
        piece.time = pieceTimeInput.value || '';
      }
    }
    saveToLocalStorage();
    renderAll();
  }

  closePieceModal();
});

// --- HELPERS ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// --- DIÁLOGOS PERSONALIZADOS (ALERT / CONFIRM) ---
window.showCustomConfirm = function(title, message) {
  return new Promise((resolve) => {
    const titleEl = document.getElementById('customDialogTitle');
    const msgEl = document.getElementById('customDialogMessage');
    
    titleEl.textContent = title;
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    
    btnCancelCustomDialog.style.display = 'inline-flex';
    customDialogBackdrop.classList.add('active');
    
    function cleanup(result) {
      customDialogBackdrop.classList.remove('active');
      btnConfirmCustomDialog.removeEventListener('click', onConfirm);
      btnCancelCustomDialog.removeEventListener('click', onCancel);
      btnCloseCustomDialog.removeEventListener('click', onCancel);
      resolve(result);
    }
    
    function onConfirm() { cleanup(true); }
    function onCancel() { cleanup(false); }
    
    btnConfirmCustomDialog.addEventListener('click', onConfirm);
    btnCancelCustomDialog.addEventListener('click', onCancel);
    btnCloseCustomDialog.addEventListener('click', onCancel);
  });
};

window.showCustomAlert = function(title, message) {
  return new Promise((resolve) => {
    const titleEl = document.getElementById('customDialogTitle');
    const msgEl = document.getElementById('customDialogMessage');
    
    titleEl.textContent = title;
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    
    btnCancelCustomDialog.style.display = 'none';
    customDialogBackdrop.classList.add('active');
    
    function cleanup() {
      customDialogBackdrop.classList.remove('active');
      btnConfirmCustomDialog.removeEventListener('click', onConfirm);
      btnCloseCustomDialog.removeEventListener('click', onConfirm);
      resolve();
    }
    
    function onConfirm() { cleanup(); }
    
    btnConfirmCustomDialog.addEventListener('click', onConfirm);
    btnCloseCustomDialog.addEventListener('click', onConfirm);
  });
};

// Cerrar diálogo al hacer clic fuera del modal
customDialogBackdrop.addEventListener('click', (e) => {
  if (e.target === customDialogBackdrop) {
    if (btnCancelCustomDialog.style.display !== 'none') {
      btnCancelCustomDialog.click();
    } else {
      btnConfirmCustomDialog.click();
    }
  }
});

// --- GESTIÓN DE RESPALDOS MANUALES (JSON) ---
function initBackupControls() {
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const importJsonInput = document.getElementById('importJsonInput');

  if (!btnExportJson || !btnImportJson || !importJsonInput) return;

  btnExportJson.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `matrix_puzzle_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  btnImportJson.addEventListener('click', () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
      try {
        const importedState = JSON.parse(evt.target.result);
        if (importedState && (importedState.tematicas || importedState.unassignedPieces)) {
          state = {
            theme: importedState.theme || 'slate',
            tematicas: importedState.tematicas || [],
            unassignedPieces: importedState.unassignedPieces || []
          };
          saveToLocalStorage();
          applyTheme(state.theme);
          renderAll();
          await window.showCustomAlert("Importación Exitosa", "¡Respaldo local importado correctamente!");
        } else {
          await window.showCustomAlert("Error de Formato", "El archivo JSON seleccionado no tiene un formato válido para Matrix Puzzle.");
        }
      } catch (err) {
        await window.showCustomAlert("Error de Importación", "Error al leer o procesar el archivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  });
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  initStaticIcons();
  initThemes();
  initBackupControls();

  // Vincular eventos Drag & Drop al contenedor del banco de piezas (desconexión)
  unassignedPiecesContainer.addEventListener('dragover', (e) => {
    if (activeDragType === 'theme') return;
    e.preventDefault();
  });

  unassignedPiecesContainer.addEventListener('dragenter', (e) => {
    if (activeDragType === 'theme') return;
    e.preventDefault();
    unassignedPiecesContainer.classList.add('drag-over');
  });

  unassignedPiecesContainer.addEventListener('dragleave', () => {
    if (activeDragType === 'theme') return;
    unassignedPiecesContainer.classList.remove('drag-over');
  });

  unassignedPiecesContainer.addEventListener('drop', (e) => {
    if (activeDragType === 'theme') return;
    e.preventDefault();
    unassignedPiecesContainer.classList.remove('drag-over');
    const draggedId = e.dataTransfer.getData('text/plain');
    const sourceThemeId = e.dataTransfer.getData('source-theme');
    
    if (sourceThemeId && sourceThemeId !== 'unassigned') {
      movePiece(draggedId, sourceThemeId, null);
    }
  });

  // Inicialización según modo
  if (isServerMode) {
    // Ocultar sección de respaldos en modo servidor (ya se auto-persiste en data.json)
    const backupSection = document.getElementById('backupSection');
    if (backupSection) backupSection.style.display = 'none';

    loadFromServer(() => {
      applyTheme(state.theme);
      renderAll();
    });
  } else {
    loadFromLocalStorage();
    applyTheme(state.theme);
    renderAll();
  }

  // Escuchar redimensionamiento para ajustar tamaño de fuente de las piezas
  window.addEventListener('resize', adjustPieceFontSizes);
});
