(function() {
  const originalShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
  Blockly.FieldDropdown.prototype.showEditor_ = function() {
    originalShowEditor.call(this);

    const dropdownDiv = Blockly.DropDownDiv.getContentDiv();
    if (!dropdownDiv) return;
    if (dropdownDiv.querySelector('.dropdown-search-input')) return;

    dropdownDiv.style.maxHeight = '';
    dropdownDiv.style.overflow = 'hidden';

    setTimeout(() => {
      const menu = dropdownDiv.querySelector('.goog-menu');
      if (menu) {
        menu.style.paddingTop = '5px';
        menu.style.marginTop = '5px';
        menu.style.maxHeight = '380px';
        menu.style.overflow = 'hidden';
        menu.style.boxSizing = 'border-box';
      }
      dropdownDiv.style.height = 'auto';
      dropdownDiv.style.maxHeight = '99999px';
      dropdownDiv.style.overflow = 'hidden';
    }, 0);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search...';
    input.classList.add('dropdown-search-input');
    input.style.cssText = `
      width: calc(100% - 10px);
      margin: 5px;
      padding: 6px;
      border-radius: 5px;
      border: 1px solid #aaa;
      outline: none;
      font-size: 13px;
      color: #000;
      box-sizing: border-box;
      display: block;
    `;
    dropdownDiv.prepend(input);

    const options = Array.from(dropdownDiv.querySelectorAll('.blocklyMenuItem'));
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase();
      options.forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    });

    setTimeout(() => input.focus(), 50);
  };
})();

//
// TAB MANAGEMENT 
//
const TABS_KEY = "jokerblocks_tabs";
const ACTIVE_TAB_KEY = "jokerblocks_active_tab";

function generateTabId() {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

function getDefaultTabs() {
  return [{ id: generateTabId(), name: "Main", xml: "" }];
}

window.tabs = [];
window.activeTabId = null;

function loadTabsFromStorage() {
  try {
    const saved = localStorage.getItem(TABS_KEY);
    if (saved) {
      window.tabs = JSON.parse(saved);
      if (!Array.isArray(window.tabs) || window.tabs.length === 0) throw new Error("bad tabs");
    } else {
      // Migrate legacy single workspace if present
      const legacy = localStorage.getItem("jokerblocks_workspace");
      window.tabs = getDefaultTabs();
      if (legacy) window.tabs[0].xml = legacy;
    }
    const savedActive = localStorage.getItem(ACTIVE_TAB_KEY);
    window.activeTabId = (savedActive && window.tabs.find(t => t.id === savedActive))
      ? savedActive : window.tabs[0].id;
  } catch (e) {
    window.tabs = getDefaultTabs();
    window.activeTabId = window.tabs[0].id;
  }
}

function persistTabs() {
  localStorage.setItem(TABS_KEY, JSON.stringify(window.tabs));
  localStorage.setItem(ACTIVE_TAB_KEY, window.activeTabId);
}

function getCurrentTab() {
  return window.tabs.find(t => t.id === window.activeTabId);
}

function snapshotCurrentTab() {
  const tab = getCurrentTab();
  if (!tab || !window.workspace) return;
  const xml = Blockly.Xml.workspaceToDom(window.workspace);
  tab.xml = Blockly.Xml.domToText(xml);
}

function applyTabToWorkspace(tab) {
  if (!window.workspace) return;
  window.workspace.clear();
  if (tab && tab.xml) {
    try {
      const xml = Blockly.utils.xml.textToDom(tab.xml);
      Blockly.Xml.domToWorkspace(xml, window.workspace);
    } catch (e) { console.error("Tab load error:", e); }
  }
}

function switchToTab(id) {
  if (id === window.activeTabId) return;
  snapshotCurrentTab();
  persistTabs();
  window.activeTabId = id;
  localStorage.setItem(ACTIVE_TAB_KEY, id);
  applyTabToWorkspace(getCurrentTab());
  renderTabs();
  setTimeout(() => { refreshVariableDropdowns(); }, 100);
}

function addNewTab() {
  snapshotCurrentTab();
  const id = generateTabId();
  const num = window.tabs.length + 1;
  window.tabs.push({ id, name: `Tab ${num}`, xml: "" });
  window.activeTabId = id;
  window.workspace.clear();
  persistTabs();
  renderTabs();
}

function deleteTab(id) {
  if (window.tabs.length <= 1) { alert("Can't delete the only tab!"); return; }
  const tab = window.tabs.find(t => t.id === id);
  if (!confirm(`Delete tab "${tab?.name}"? Blocks inside will be lost.`)) return;
  const idx = window.tabs.findIndex(t => t.id === id);
  window.tabs.splice(idx, 1);
  if (window.activeTabId === id) {
    window.activeTabId = window.tabs[Math.max(0, idx - 1)].id;
    applyTabToWorkspace(getCurrentTab());
  }
  persistTabs();
  renderTabs();
  setTimeout(() => { refreshVariableDropdowns(); }, 100);
}

function renameTab(id, newName) {
  const tab = window.tabs.find(t => t.id === id);
  if (tab) { tab.name = newName || tab.name; persistTabs(); }
}

function renderTabs() {
  const bar = document.getElementById("tabBar");
  if (!bar) return;
  bar.innerHTML = "";

  // Instantiate the search input once so it doesn't drop active text input focus on re-renders
  if (!window.tabSearchInput) {
    const input = document.createElement('input');
    input.id = 'tabSearchInput';
    input.type = 'text';
    input.placeholder = 'Search...';
    input.style.cssText = `
      margin-left: 8px;
      margin-right: 6px;
      padding: 4px 8px;
      border: 1px solid #444;
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      background: #1e1e1e;
      color: #fff;
      z-index: 100;
      min-width: 140px;
    `;

    // Block keystrokes from bubbling up to Blockly hotkeys
    input.addEventListener('keydown', e => e.stopPropagation());
    input.addEventListener('keyup', e => e.stopPropagation());
    
    // Filter logic
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      Array.from(bar.children).forEach(child => {
        if (child === input || child.id === 'addTabBtn') return;
        
        const tabText = child.textContent || '';
        if (query) {
          if (tabText.toLowerCase().includes(query)) {
            child.style.setProperty('display', '', 'important');
          } else {
            child.style.setProperty('display', 'none', 'important');
          }
        } else {
          child.style.display = '';
        }
      });
    });
    window.tabSearchInput = input;
  }

  // Render Search Input first on the left
  bar.appendChild(window.tabSearchInput);

  // Render the "+" button immediately next to it
  const addBtn = document.createElement("button");
  addBtn.id = "addTabBtn";
  addBtn.textContent = "+";
  addBtn.title = "New tab";
  addBtn.style.marginRight = "10px";
  addBtn.addEventListener("click", addNewTab);
  bar.appendChild(addBtn);

  // Render the active tab list elements
  window.tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = "tab-item" + (tab.id === window.activeTabId ? " active" : "");

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = tab.name;
    label.title = "Click to switch · Double-click to rename";

    label.addEventListener("click", () => switchToTab(tab.id));
    label.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = tab.name;
      inp.style.cssText = "width:90px;border:none;outline:1px solid #1a73e8;background:transparent;color:inherit;font-size:13px;font-weight:bold;border-radius:3px;padding:0 2px;";
      label.replaceWith(inp);
      inp.focus(); inp.select();
      const commit = () => { renameTab(tab.id, inp.value.trim()); renderTabs(); };
      inp.addEventListener("blur", commit);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") commit(); if (e.key === "Escape") renderTabs(); });
    });

    tabEl.appendChild(label);

    if (window.tabs.length > 1) {
      const x = document.createElement("span");
      x.className = "tab-close";
      x.textContent = "×";
      x.title = "Delete tab";
      x.addEventListener("click", (e) => { e.stopPropagation(); deleteTab(tab.id); });
      tabEl.appendChild(x);
    }

    bar.appendChild(tabEl);
  });

  // Re-apply existing filter state query automatically on structural transformations
  const activeQuery = window.tabSearchInput.value.trim().toLowerCase();
  if (activeQuery) {
    Array.from(bar.children).forEach(child => {
      if (child === window.tabSearchInput || child.id === 'addTabBtn') return;
      const tabText = child.textContent || '';
      if (tabText.toLowerCase().includes(activeQuery)) {
        child.style.setProperty('display', '', 'important');
      } else {
        child.style.setProperty('display', 'none', 'important');
      }
    });
  }
}

// Helper: merge all tabs into combined XML for code generation
function getAllTabsXml() {
  snapshotCurrentTab();
  let allBlocks = '';
  window.tabs.forEach(tab => {
    if (tab.xml) {
      const m = tab.xml.match(/<xml[^>]*>([\s\S]*?)<\/xml>/);
      if (m) allBlocks += m[1];
    }
  });
  return `<xml xmlns="https://developers.google.com/blockly/xml">${allBlocks}</xml>`;
}

// load vars from localStorage
window.customVariables = JSON.parse(localStorage.getItem("customVariables") || "[]");

// Balatro built-in variable names
const BALATRO_RESERVED_VARS = [
  "hands"
];
window.defaultVarScope = localStorage.getItem("jokerblocks_default_var_scope") || "global"; // Make this global

// save to localStorage
function saveVariables() {
  localStorage.setItem("customVariables", JSON.stringify(window.customVariables));
}
function saveVariableScopes() {
  localStorage.setItem("variableScopes", JSON.stringify(window.variableScopes || {}));
}
function loadVariableScopes() {
  window.variableScopes = JSON.parse(localStorage.getItem("variableScopes") || "{}");
}

// popup for creating new variables
function createNewVariablePopup(onDone) {
  const existingOverlay = document.getElementById("variable-popup-overlay");
  if (existingOverlay) {
    existingOverlay.querySelector('#varNameInput')?.focus();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "variable-popup-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background: #222; padding: 20px; border-radius: 10px;
    color: white; font-family: sans-serif; min-width: 250px; text-align: center;
  `;
  box.innerHTML = `
    <h3 style="margin-bottom: 10px;">New Variable</h3>
    <input type="text" id="varNameInput" placeholder="Variable name" 
      style="padding:5px;width:100%;margin-bottom:10px;border-radius:5px;border:none;outline:none;">
    <div>
      <button id="okBtn" style="padding:6px 12px;border:none;border-radius:5px;background:#4caf50;color:white;margin-right:10px;">OK</button>
      <button id="cancelBtn" style="padding:6px 12px;border:none;border-radius:5px;background:#666;color:white;">Cancel</button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const input = box.querySelector('#varNameInput');
  input.focus();

  box.querySelector('#okBtn').onclick = () => {
    const name = input.value.trim();
    if (name && !window.customVariables.includes(name)) {
      if (BALATRO_RESERVED_VARS.includes(name) && window.defaultVarScope === 'global') {
        const proceed = confirm(
          `⚠️ Warning: "${name}" already exists in Balatro.\n\n` +
          `Modifying or resetting this variable could result in crashes.\n\n` +
          `Only continue if you know what you're doing.\n\nAdd it anyway?`
        );
        if (!proceed) return;
      }
      window.customVariables.push(name);
      
      // Apply the default scope to new variables
      if (!window.variableScopes) {
        window.variableScopes = {};
      }
      window.variableScopes[name] = window.defaultVarScope;
      
      saveVariables(); // persist to localStorage
      saveVariableScopes(); // persist scopes to localStorage
      refreshVariableDropdowns();
      if (onDone) onDone(name);
    }
    overlay.remove();
  };
  box.querySelector('#cancelBtn').onclick = () => overlay.remove();
}

// refresh all variable dropdowns
function refreshVariableDropdowns() {
  if (!window.workspace) return;
  const blocks = window.workspace.getAllBlocks(false);
  blocks.forEach(block => {
    if (block.type === 'var_get' || block.type === 'var_set' || block.type === 'var_change') {
      const field = block.getField('VAR');
      if (field) {
        const currentVal = field.getValue();
        const options = window.customVariables.map(v => [v, v]);
        options.push(['<Create new variable>', '__create__']);
        field.menuGenerator_ = options;

        // if no vars exist, skip setting a bad one
        if (!window.customVariables.length) return;

        if (!window.customVariables.includes(currentVal)) {
          field.setValue(window.customVariables[0]);
        }
      }
    }
  });
}

// === Main setup ===
window.addEventListener("load", () => {
  // clean up popups
  const existingOverlay = document.getElementById("variable-popup-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  const DEFAULT_VAR_SCOPE_KEY = "jokerblocks_default_var_scope";
  window.defaultVarScope = localStorage.getItem(DEFAULT_VAR_SCOPE_KEY) || "global";

  const defaultVarScopeSelect = document.getElementById("defaultVarScopeSelect");
  defaultVarScopeSelect.value = window.defaultVarScope;

  defaultVarScopeSelect.addEventListener("change", () => {
    window.defaultVarScope = defaultVarScopeSelect.value;
    localStorage.setItem(DEFAULT_VAR_SCOPE_KEY, window.defaultVarScope);
  });
  const updateBlocklyTheme = () => {
    if (!window.workspace) return;
    
    if (document.body.classList.contains("dark")) {
      window.workspace.setTheme(Blockly.Theme.defineTheme("darkMode", {
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: "#121212",
          toolboxBackgroundColour: "#1f1f1f",
          toolboxForegroundColour: "#fff",
          flyoutBackgroundColour: "#1a1a1a",
          flyoutForegroundColour: "#fff",
          flyoutOpacity: 1,
          scrollbarColour: "#555",
          insertionMarkerColour: "#fff",
          insertionMarkerOpacity: 0.3,
          scrollbarOpacity: 0.6,
          cursorColour: "#fff",
          textColour: "#fff"
        }
      }));
    } else {
      window.workspace.setTheme(Blockly.Themes.Classic);
    }
  };

  const clearAllDataBtn = document.getElementById("clearAllDataBtn");

  clearAllDataBtn.onclick = () => {
    // First confirmation
    if (!confirm("Are you sure you want to clear ALL saved data?\n\nThis includes: projects, variables, settings, and workspace.")) {
      return;
    }
    
    // Second confirmation
    if (!confirm("This action CANNOT be undone. Clear everything?")) {
      return;
    }
    
    // Clear all localStorage
    localStorage.clear();
    
    // Optionally, also clear session storage
    sessionStorage.clear();
    
    //alert("All data cleared! The page will reload.");
    
    // Reload the page to reset everything
    location.reload();
  };

  // --- Blockly workspace ---
  const toolbox = document.getElementById("toolbox");
  const workspace = Blockly.inject("blocklyDiv", {
    toolbox,
    scrollbars: true,
    trashcan: true,
    media: './blockly/media',
    renderer: 'zelos',
    move: { scrollbars: true, drag: true, wheel: false },
    zoom: { controls: true, wheel: true, startScale: 0.5, pinch: true }
  });
  window.workspace = workspace;
  updateBlocklyTheme();
  loadVariableScopes();

  // --- Project persistence ---
  const WORKSPACE_KEY = "jokerblocks_workspace";
  const PROJECT_NAME_KEY = "jokerblocks_project_name";
  let projectName = localStorage.getItem(PROJECT_NAME_KEY) || "MyMod";

  function saveProjectName(name) {
    projectName = name;
    localStorage.setItem(PROJECT_NAME_KEY, name);
  }

  function saveWorkspace() {
    snapshotCurrentTab();
    persistTabs();
  }
  
  function loadWorkspace() {
    loadTabsFromStorage();
    applyTabToWorkspace(getCurrentTab());
    renderTabs();
    setTimeout(() => {
      refreshVariableDropdowns();
      updateModPrefix();
    }, 100);
  }

  function updateModPrefix() {
      const projName = projectInput?.value || "MyMod";

      const prefix = projName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();

      Blockly.Lua.modPrefix = prefix;
      
      // Also manually update live lua if enabled
      if (liveLuaEnabled) {
          updateLiveLua();
      }
  }

  workspace.addChangeListener(saveWorkspace);
  loadWorkspace();

  // export/mport system
  let lastWorkspaceCoords = { x: 50, y: 50 };
  document.getElementById('blocklyDiv').addEventListener('contextmenu', (e) => {
    if (window.workspace) {
      try {
        lastWorkspaceCoords = Blockly.utils.svgMath.screenToWsCoordinates(
          window.workspace,
          new Blockly.utils.Coordinate(e.clientX, e.clientY)
        );
      } catch (err) {}
    }
  });

  // export option in menu
  Blockly.ContextMenuRegistry.registry.register({
    id: 'export_block_chunk',
    displayText: 'Export Chunk (.block.json)',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    weight: 2, 
    preconditionFn: () => 'enabled',
    callback: (scope) => {
      const xmlDom = Blockly.Xml.blockToDom(scope.block);
      const xmlText = Blockly.Xml.domToText(xmlDom);
      
      // Convert XML string to completely safe Base64 (removes all quotes, backticks, and slashes)
      const base64Xml = btoa(unescape(encodeURIComponent(xmlText)));

      const data = { type: 'jokerblocks_block', xml: base64Xml, isBase64: true };
      const name = (scope.block.type || 'block') + '_chunk';
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.block.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  });

  // imprt option in menu
  Blockly.ContextMenuRegistry.registry.register({
    id: 'import_block_chunk',
    displayText: 'Import Chunk (.block.json)',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    weight: 2, 
    preconditionFn: () => 'enabled',
    callback: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.block.json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data && data.xml) {
              let cleanXml = data.xml;
              
              // if in base64, decode to xml
              if (data.isBase64) {
                cleanXml = decodeURIComponent(escape(atob(data.xml)));
              }

              const xmlDom = Blockly.utils.xml.textToDom(cleanXml);
              const block = Blockly.Xml.domToBlock(xmlDom, window.workspace);
              if (block && lastWorkspaceCoords) {
                block.moveBy(lastWorkspaceCoords.x, lastWorkspaceCoords.y);
                block.select();
              }
            } else {
              alert('Invalid block chunk format.');
            }
          } catch (err) {
            alert('Error importing block: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  });

  // Global Cross-Tab Clipboard Variable
  window.__crossTabBlockClipboard = null;

  // Copy Block Menu Option
  Blockly.ContextMenuRegistry.registry.register({
    id: 'custom_copy_block',
    displayText: 'Copy Block',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    weight: 2.1,
    preconditionFn: () => 'enabled',
    callback: (scope) => {
      const xmlDom = Blockly.Xml.blockToDom(scope.block);
      window.__crossTabBlockClipboard = Blockly.Xml.domToText(xmlDom);
    }
  });

  // Cut Block Menu Option
  Blockly.ContextMenuRegistry.registry.register({
    id: 'custom_cut_block',
    displayText: 'Cut Block',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    weight: 2.2,
    preconditionFn: (scope) => scope.block.isDeletable() ? 'enabled' : 'disabled',
    callback: (scope) => {
      const xmlDom = Blockly.Xml.blockToDom(scope.block);
      window.__crossTabBlockClipboard = Blockly.Xml.domToText(xmlDom);
      scope.block.dispose(true);
    }
  });

  // Paste Block Menu Option
  Blockly.ContextMenuRegistry.registry.register({
    id: 'custom_paste_block',
    displayText: 'Paste Block',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    weight: 2.3,
    preconditionFn: () => window.__crossTabBlockClipboard ? 'enabled' : 'disabled',
    callback: () => {
      if (!window.__crossTabBlockClipboard || !window.workspace) return;
      try {
        const xmlDom = Blockly.utils.xml.textToDom(window.__crossTabBlockClipboard);
        const block = Blockly.Xml.domToBlock(xmlDom, window.workspace);
        if (block && lastWorkspaceCoords) {
          block.moveBy(lastWorkspaceCoords.x, lastWorkspaceCoords.y);
          block.select();
        }
      } catch (err) {
        console.error('Failed to paste block:', err);
      }
    }
  });

  // === Toolbox Search ===
  function initToolboxSearch() {
    const toolboxEl = document.getElementById('toolbox');

    // Snapshot the normal toolbox XML (blocks.js already set it)
    window._normalToolboxXml = toolboxEl.innerHTML;

    setTimeout(() => {
      const toolboxDiv = document.querySelector('.blocklyToolboxDiv');
      if (!toolboxDiv) return;

      // --- Build the search bar DOM ---
      const searchWrap = document.createElement('div');
      searchWrap.id = 'toolboxSearchWrap';
      searchWrap.style.cssText = `
        padding: 6px 8px;
        border-bottom: 1px solid rgba(128,128,128,0.25);
        position: sticky;
        top: 0;
        z-index: 10;
        background: inherit;
        box-sizing: border-box;
      `;

      const searchInput = document.createElement('input');
      searchInput.id = 'toolboxSearchInput';
      searchInput.type = 'text';
      searchInput.placeholder = '🔍 Search blocks...';
      searchInput.style.cssText = `
        width: 100%;
        padding: 5px 8px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        background: rgba(128,128,128,0.2);
        color: inherit;
        outline: none;
        box-sizing: border-box;
      `;

      searchWrap.appendChild(searchInput);
      toolboxDiv.prepend(searchWrap);

      // --- Search logic ---
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const query = searchInput.value.trim().toLowerCase();

          if (!query) {
            // Restore normal categories
            toolboxEl.innerHTML = window._normalToolboxXml;
            workspace.updateToolbox(toolboxEl);
            return;
          }

          const matches = BLOCK_DEFS.filter(def =>
            def.title?.toLowerCase().includes(query) ||
            def.type?.toLowerCase().includes(query) ||
            def.category?.toLowerCase().includes(query) ||
            def.tooltip?.toLowerCase().includes(query)
          );

          const resultsXml = matches.length > 0
            ? `<category name="🔍 Results (${matches.length})" colour="#e8a020">
                ${matches.map(d => `<block type="${d.type}"></block>`).join('')}
               </category>`
            : `<category name="No results" colour="#888"></category>`;

          toolboxEl.innerHTML = resultsXml;
          workspace.updateToolbox(toolboxEl);
        }, 150);
      });

      // Stop Blockly from swallowing keystrokes while typing in the search bar
      searchInput.addEventListener('keydown', e => e.stopPropagation());
      searchInput.addEventListener('keyup',   e => e.stopPropagation());
    }, 150);
  }

  initToolboxSearch();

  // --- UI Elements ---
  const optionsBtn = document.getElementById("optionsBtn");
  const optionsMenu = document.getElementById("optionsMenu");
  const closeOptions = document.getElementById("closeOptions");
  const projectInput = document.getElementById("projectNameField");
  const generateLuaBtn = document.getElementById("generateLuaBtn");
  const previewLuaBtn = document.getElementById("previewLuaBtn");
  const generateJsonBtn = document.getElementById("generateJsonBtn");
  const previewJsonBtn = document.getElementById("previewJsonBtn");
  const newProjectBtn = document.getElementById("newProjectBtn");
  const saveProjectBtn = document.getElementById("saveProjectBtn");
  const loadProjectBtn = document.getElementById("loadProjectBtn");
  const exportModBtn = document.getElementById("exportModBtn");
  // --- Dark Mode Toggle ---
  const DARK_MODE_KEY = "jokerblocks_dark_mode";
  const darkModeToggle = document.getElementById("darkModeToggle");
  let darkModeEnabled = localStorage.getItem(DARK_MODE_KEY) === "true";

  if (darkModeEnabled) {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  }
  updateBlocklyTheme();


  // call it whenever dark mode changes
  darkModeToggle.addEventListener("change", () => {
    darkModeEnabled = darkModeToggle.checked;
    localStorage.setItem(DARK_MODE_KEY, darkModeEnabled);
    document.body.classList.toggle("dark", darkModeEnabled);
    updateBlocklyTheme();
  });  
  const liveLuaToggle = document.getElementById("liveLuaToggle");
  const liveLuaArea = document.getElementById("liveLuaArea");

  const testBlockBtn = document.getElementById("testBlockBtn");

  // === Custom Block Adder ===
  function openCustomBlockAdder() {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background: #222; padding: 20px; border-radius: 10px;
      color: white; font-family: monospace; width: 90%; max-width: 600px; height: 90vh; display: flex; flex-direction: column;
    `;

    box.innerHTML = `
      <h2 style="margin-top: 0; color: #4caf50;">➕ Add Custom Block</h2>
      <p style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Paste your block definition object:</p>
      <textarea id="customBlockInput" style="
        flex: 1; padding: 10px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42;
        border-radius: 5px; font-family: monospace; font-size: 12px; resize: none; margin-bottom: 10px;
      " placeholder="{ type: 'myBlock', title: 'My Block', ... }"></textarea>
      
      <div style="display: flex; gap: 10px;">
        <button id="addBlockBtn" style="
          flex: 1; padding: 10px; background: #4caf50; color: white; border: none; 
          border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;
        ">✓ Add Block</button>
        <button id="cancelBlockBtn" style="
          flex: 1; padding: 10px; background: #666; color: white; border: none; 
          border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;
        ">Cancel</button>
      </div>

      <div id="blockStatus" style="
        margin-top: 10px; padding: 10px; border-radius: 5px; display: none;
        font-size: 13px;
      "></div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const textarea = box.querySelector('#customBlockInput');
    const addBtn = box.querySelector('#addBlockBtn');
    const cancelBtn = box.querySelector('#cancelBlockBtn');
    const status = box.querySelector('#blockStatus');

    textarea.focus();

    addBtn.onclick = () => {
      const input = textarea.value.trim();
      
      if (!input) {
        status.style.display = 'block';
        status.style.background = '#cc3333';
        status.textContent = '❌ Please paste a block definition';
        return;
      }

      try {
        // Parse the block definition
        let cleaned = input.replace(/,\s*$/, '');
        let blockDef = eval(`(${cleaned})`);

        // Validate required fields
        const required = ['type', 'title', 'category', 'color'];
        const missing = required.filter(f => !blockDef[f]);
        
        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Add to BLOCK_DEFS
        BLOCK_DEFS.push(blockDef);

        // Rebuild the block system
        rebuildBlockSystem();

        status.style.display = 'block';
        status.style.background = '#339933';
        status.innerHTML = `✅ Block added! <strong>"${blockDef.type}"</strong> in category <strong>"${blockDef.category}"</strong>`;

        // Close after 2 seconds
        setTimeout(() => {
          overlay.remove();
        }, 2000);

      } catch (e) {
        status.style.display = 'block';
        status.style.background = '#cc3333';
        status.textContent = `❌ Error: ${e.message}`;
      }
    };

    cancelBtn.onclick = () => overlay.remove();
  }

  function rebuildBlockSystem() {
    // Clear old definitions
    const jsonBlocks = [];
    const categories = {};
    const blockDefMap = {};

    BLOCK_DEFS.forEach(def => {
      blockDefMap[def.type] = def;
    });

    BLOCK_DEFS.forEach(def => {
      (categories[def.category] ??= []).push(def.type);

      const json = {
        type: def.type,
        message0: def.title,
        colour: def.color,
        args0: [],
        inputsInline: false
      };

      if (def.tooltip) json.tooltip = def.tooltip;

      let argCount = 0;

      // Handle value inputs FIRST
      def.valueInputs?.forEach((inp) => {
        argCount++;
        if (inp.label) {
          json.message0 += ` ${inp.label} %${argCount}`;
        } else {
          json.message0 += ` %${argCount}`;
        }
        
        json.args0.push({
          type: 'input_value',
          name: inp.name,
          check: inp.check || null
        });
      });

      // Handle fields AFTER
      def.fields?.forEach((f) => {
        if (def.json && !f.name) f.name = 'value';

        argCount++;
        if (f.label) {
          json.message0 += ` ${f.label}: %${argCount}`;
        } else {
          json.message0 += ` %${argCount}`;
        }

        if (f.type === 'dropdown') {
          const sortedOptions = [...f.options].sort((a, b) => {
            const labelA = Array.isArray(a) ? a[0] : a;
            const labelB = Array.isArray(b) ? b[0] : b;
            if (labelA === 'None') return -1;
            if (labelB === 'None') return 1;
            return labelA.toLowerCase().localeCompare(labelB.toLowerCase());
          });

          json.args0.push({
            type: 'field_dropdown',
            name: f.name,
            options: sortedOptions.map(opt => 
              Array.isArray(opt) ? opt : [opt, opt]
            )
          });
        } else {
          json.args0.push({
            type: 'field_input',
            name: f.name,
            text: f.default || ''
          });
        }
      });

      if (def.statementInput) {
        json.message1 = '%1';
        json.args1 = [{
          type: 'input_statement',
          name: def.statementInput,
          check: 'BlindFunction'
        }];
      }

      if (def.output) {
        json.output = def.output;
      } else if (def.category === 'Game Objects' || def.type === 'json_holder') {
        json.hat = 'cap';
        json.nextStatement = null;
      } else if (def.json) {
        json.previousStatement = null;
        json.nextStatement = null;
      } else {
        json.previousStatement = null;
        json.nextStatement = null;
      }

      jsonBlocks.push(json);
    });

    // Redefine blocks
    Blockly.defineBlocksWithJsonArray(jsonBlocks);

    // Reapply init handlers
    Object.keys(Blockly.Blocks).forEach(blockType => {
      const block = Blockly.Blocks[blockType];
      if (block && block.init) {
        const originalInit = block.init;
        block.init = function() {
          originalInit.call(this);
          
          const def = blockDefMap[blockType];
          
          if (["and", "or", "not", "compare","limit","minus","add","multiply","divide","givex","var_get","var_set","var_change","adv_repeat","repeat"].includes(blockType)) {
            this.setInputsInline(true);
          } 
          else if (def && def.inlineInputs === true) {
            this.setInputsInline(true);
          } 
          else if (def && def.inlineInputs === false) {
            this.setInputsInline(false);
          } 
          else {
            this.setInputsInline(false);
          }
        };
      }
    });

    // Register custom generators if they have lua
    BLOCK_DEFS.forEach(def => {
      if (def.lua && !Blockly.Lua.forBlock[def.type]) {
        Blockly.Lua.forBlock[def.type] = function (block) {
          return genLuaFromTemplate(def.lua, block);
        };
      }
    });

    // Rebuild toolbox - preserve order from BLOCK_DEFS
    const categoryOrder = [
      'General',
      'Game Objects',
      'Creation',
      'Control',
      'Tags',
      'Joker',
      'Logic',
      'Atlas',
      'Blind',
      'Sound',
      'Variables'
    ];

    let toolboxXml = '';
    
    // Subcategories nested inside a parent: { child: parent }
    const subcategoryMap = {
      'Consumeables': 'General',
      'Scoring':      'General',
      'Cards':        'General',
      'Game Values':  'General',
      'Values':       'Logic',
	  'Hooks': 'General',
	  'Debuffs': 'Blind'
    };

    // Add categories in defined order
    categoryOrder.forEach(cat => {
      if (categories[cat]) {
        const color = BLOCK_DEFS.find(b => b.category === cat)?.color || "#ccc";
        toolboxXml += `<category name="${cat}" colour="${color}">`;
        categories[cat].forEach(type => {
          toolboxXml += `<block type="${type}"></block>`;
        });
        // Inject subcategories that belong to this parent
        Object.entries(subcategoryMap).forEach(([child, parent]) => {
          if (parent === cat && categories[child]) {
            const childColor = BLOCK_DEFS.find(b => b.category === child)?.color || color;
            toolboxXml += `<category name="${child}" colour="${childColor}">`;
            categories[child].forEach(type => {
              toolboxXml += `<block type="${type}"></block>`;
            });
            toolboxXml += `</category>`;
          }
        });
        toolboxXml += `</category>`;
      }
    });

    // Add any new categories at the bottom (before Variables)
    Object.keys(categories).forEach(cat => {
      if (!categoryOrder.includes(cat) && !subcategoryMap[cat]) {
        const color = BLOCK_DEFS.find(b => b.category === cat)?.color || "#ccc";
        toolboxXml += `<category name="${cat}" colour="${color}">`;
        categories[cat].forEach(type => {
          toolboxXml += `<block type="${type}"></block>`;
        });
        toolboxXml += `</category>`;
      }
    });

    const toolbox = document.getElementById("toolbox");
    toolbox.innerHTML = toolboxXml;
    workspace.updateToolbox(toolbox);
    // Keep search restore XML in sync after rebuilds (e.g. custom block added)
    window._normalToolboxXml = toolboxXml;
  }

  // Add button to options menu
  testBlockBtn.onclick = openCustomBlockAdder;

  // --- Options Menu ---
  optionsBtn.onclick = () => optionsMenu.style.display = 'block';
  closeOptions.onclick = () => optionsMenu.style.display = 'none';
  projectInput.value = projectName;
  projectInput.addEventListener('input', e => {
    saveProjectName(e.target.value);
    updateModPrefix();

  });

  // remakes / templates manager
  const remakesBtn = document.getElementById("remakesBtn");
  const remakesModal = document.getElementById("remakesModal");
  const closeRemakes = document.getElementById("closeRemakes");
  const remakesList = document.getElementById("remakesList");

  // define vanilla remakes
  const VANILLA_REMAKES = [
    { name: "Joker", file: "Joker.block.js" },
    { name: "Greedy Joker", file: "Greedy_Joker.block.js" },
    { name: "Lusty Joker", file: "Lusty_Joker.block.js" },
    { name: "Wrathful Joker", file: "Wrathful_Joker.block.js" },
    { name: "Gluttonous Joker", file: "Gluttonous_Joker.block.js" },
    { name: "Jolly Joker", file: "Jolly_Joker.block.js" },
    { name: "Zany Joker", file: "Zany_Joker.block.js" },
    { name: "Mad Joker", file: "Mad_Joker.block.js" },
    { name: "Crazy Joker", file: "Crazy_Joker.block.js" },
    { name: "Droll Joker", file: "Droll_Joker.block.js" },
    { name: "Sly Joker", file: "Sly_Joker.block.js" },
    { name: "Wily Joker", file: "Wily_Joker.block.js" },
    { name: "Clever Joker", file: "Clever_Joker.block.js" },
    { name: "Devious Joker", file: "Devious_Joker.block.js" },
    { name: "Crafty Joker", file: "Crafty_Joker.block.js" },
    { name: "Half Joker", file: "Half_Joker.block.js" },
    { name: "Joker Stencil", file: "Joker_Stencil.block.js" },
    { name: "Four Fingers", file: "Four_Fingers.block.js" },
    { name: "Mime", file: "Mime.block.js" },
    { name: "Credit Card", file: "Credit_Card.block.js" },
    { name: "Ceremonial Dagger", file: "Ceremonial_Dagger.block.js" },
  ];

  function extractTemplateDesc(blockData) {
    // fallback
    const fallback = { desc: "No description.", x: 0, y: 0 };
    if (!blockData) return fallback;

    if (blockData.xml) {
      try {
        let rawXml = blockData.xml;
        if (blockData.isBase64 || !rawXml.trim().startsWith('<')) {
          rawXml = decodeURIComponent(escape(atob(blockData.xml)));
        }
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawXml, "text/xml");
        let posX = 0;
        let posY = 0;
        const atlasBlock = xmlDoc.querySelector('block[type="atlaspos"]');
        if (atlasBlock) {
          const xField = atlasBlock.querySelector('field[name="x"]');
          const yField = atlasBlock.querySelector('field[name="y"]');
          if (xField) posX = parseInt(xField.textContent, 10) || 0;
          if (yField) posY = parseInt(yField.textContent, 10) || 0;
        }
        
        //locate desc field
        const locBlock = xmlDoc.querySelector('block[type="gen_loc_txt"]');
        if (!locBlock) return { desc: "", x: posX, y: posY };
        
        const textField = locBlock.querySelector('field[name="b"]');
        let desc = textField ? textField.textContent : '';
        
        // discover conf entries
        const configBlocks = xmlDoc.querySelectorAll('block[type="add_to_config"]');
        const configValues = [];
        
        configBlocks.forEach(block => {
          const valueNode = block.querySelector('value[name="value"]');
          if (valueNode) {
            const innerBlockNode = valueNode.querySelector('block');
            if (innerBlockNode) {
              let val = '';
              const valField = innerBlockNode.querySelector('field[name="val"]') || innerBlockNode.querySelector('field[name="v"]');
              val = valField ? valField.textContent : '';
              if (val && ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"')))) {
                val = val.slice(1, -1);
              }
              configValues.push(val);
            }
          }
        });

        // fallback
        if (configValues.length === 0) {
          const locVarsBlock = xmlDoc.querySelector('block[type="loc_vars"]');
          if (locVarsBlock) {
            // Helper function to extract a human-readable snippet from complex structural math blocks
            const parseExpressionText = (rootNode) => {
              if (!rootNode) return '';
              
              // Check for basic text fields first
              const field = rootNode.querySelector('field[name="val"]') || rootNode.querySelector('field[name="v"]') || rootNode.querySelector('field[name="var"]');
              if (field && field.parentNode === rootNode) {
                return field.textContent;
              }
              
              // Fallbacks for standard dynamic block definitions
              const type = rootNode.getAttribute('type');
              if (type === 'is_true') {
                return parseExpressionText(rootNode.querySelector('value[name="truthy"] > block'));
              }
              if (type === 'limit') {
                return parseExpressionText(rootNode.querySelector('value[name="val"] > block')) || "1";
              }
              if (type === 'add') {
                return "X"; // Placeholder character for calculation previews (e.g. "X Mult")
              }
              if (type === 'game_value') {
                return "X";
              }
              
              // Deep text lookup query loop if nothing matched
              const anyField = rootNode.querySelector('field');
              return anyField ? anyField.textContent : '';
            };

            const returnBlock = locVarsBlock.querySelectorAll('block[type="return_loc_var"]');
            returnBlock.forEach(rBlock => {
              const varValueNode = rBlock.querySelector('value[name="var"] > block');
              if (varValueNode) {
                let exprText = parseExpressionText(varValueNode);
                // Clean up expression syntax characters for tidy tooltips
                exprText = exprText.replace(/[\(\)]/g, '').replace('G.jokers.config.card_limit - G.jokers.cards', 'Slots');
                if (exprText === 'X') exprText = '1'; // Clean default preview display fallback
                configValues.push(exprText);
              }
            });
          }
        }
        
        //replace the loc things (like #1#)
        configValues.forEach((val, idx) => {
          desc = desc.replaceAll(`#${idx + 1}#`, val);
        });
        
        return { desc: desc, x: posX, y: posY };
      } catch(e) {
        console.error("XML Parsing Error: ", e);
        return { desc: "Error parsing XML layout description.", x: 0, y: 0 };
      }
    }
    return { desc: "", x: 0, y: 0 };
  }

  function loadRemakeDescriptionsSequential(remakes, callback) {
    let index = 0;

    function loadNext() {
      if (index >= remakes.length) {
        delete window.registerTemplate;
        callback();
        return;
      }

      const t = remakes[index];
      window.registerTemplate = (data) => {
        const extracted = extractTemplateDesc(data);
        
        t.cachedDesc = extracted.desc;
        t.x = extracted.x;
        t.y = extracted.y;
      };

      const script = document.createElement('script');
      script.src = `./templates/${t.file}`;
      
      script.onload = () => {
        script.remove();
        index++;
        loadNext(); 
      };
      
      script.onerror = () => {
        console.error(`Failed to execute template file: ${t.file}`);
        t.cachedDesc = "Failed to load template file.";
        script.remove();
        index++;
        loadNext();
      };

      document.body.appendChild(script);
    }

    loadNext();
  }

  remakesBtn.onclick = () => {
    remakesModal.style.display = 'block';

    // chgeck if we have already indexed descs once. If so, skip loading
    const descriptionsCached = VANILLA_REMAKES.every(t => t.hasOwnProperty('cachedDesc'));

    if (descriptionsCached) {
      renderRemakesUI();
      return;
    }

    remakesList.innerHTML = '<div style="color:#aaa; font-family:sans-serif; font-size:14px; grid-column:span 5; padding:12px;">Reading templates...</div>';
    
    // trigger load thing once per app load
    loadRemakeDescriptionsSequential(VANILLA_REMAKES, () => {
      renderRemakesUI();
    });
  };

  function renderRemakesUI() {
    remakesList.innerHTML = '';
    let checkboxWrapper = document.getElementById('remakeCheckboxWrapper');
    if (!checkboxWrapper) {
      checkboxWrapper = document.createElement('div');
      checkboxWrapper.id = 'remakeCheckboxWrapper';
      checkboxWrapper.style.cssText = `
        display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
        font-family: sans-serif; font-size: 13px; color: #ccc; user-select: none;
      `;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'remakeDescCheckbox';
      checkbox.style.cssText = `cursor: pointer; margin: 0;`;
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.htmlFor = 'remakeDescCheckbox';
      checkboxLabel.textContent = 'Filter through descriptions';
      checkboxLabel.style.cssText = `cursor: pointer;`;
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(checkboxLabel);
      remakesList.parentNode.insertBefore(checkboxWrapper, remakesList);
    }
    
    // search inpt
    let searchInput = document.getElementById('remakeSearchInput');
    if (!searchInput) {
      searchInput = document.createElement('input');
      searchInput.id = 'remakeSearchInput';
      searchInput.type = 'text';
      searchInput.placeholder = 'Search remakes...';
      searchInput.style.cssText = `
        width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #444;
        border-radius: 4px; background: #1e1e1e; color: #fff; font-size: 14px;
        box-sizing: border-box; outline: none;
      `;
      searchInput.addEventListener('keydown', e => e.stopPropagation());
      searchInput.addEventListener('keyup', e => e.stopPropagation());
      remakesList.parentNode.insertBefore(searchInput, remakesList);
    }
    searchInput.value = '';
    searchInput.style.display = 'block';

    // result num
    let counterLabel = document.getElementById('remakeCounterLabel');
    if (!counterLabel) {
      counterLabel = document.createElement('div');
      counterLabel.id = 'remakeCounterLabel';
      counterLabel.style.cssText = `
        font-family: sans-serif; font-size: 12px; color: #888; margin-bottom: 12px; padding-left: 2px;
      `;
      remakesList.parentNode.insertBefore(counterLabel, remakesList);
    }

    remakesList.style.cssText = `
      max-height: 400px;
      min-width: 600px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      padding: 8px 6px 8px 2px;
      box-sizing: border-box;
    `;

    let globalTooltip = document.getElementById('remakeGlobalTooltip');
    if (!globalTooltip) {
      globalTooltip = document.createElement('div');
      globalTooltip.id = 'remakeGlobalTooltip';
      document.body.appendChild(globalTooltip);
    }
    globalTooltip.style.cssText = `
      display: none; position: fixed; background: #ffffff; border: 2px solid #cdcdcd;
      border-radius: 6px; padding: 8px 12px; z-index: 10000; pointer-events: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-family: monospace, sans-serif;
      font-size: 13px; line-height: 1.4; color: #333333;
    `;

    const cardsTrack = [];
    const BALATRO_FALLBACK_PALETTE = {
      red: '#ef4747', mult: '#fe5f55', blue: '#4f63cc', chips: '#00a2ff',
      green: '#76ae55', money: '#f3b954', gold: '#e1b333', attention: '#e1b333',
      purple: '#8847cf', orange: '#f7934c'
    };

    VANILLA_REMAKES.forEach(t => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #232323; border: 2px solid #3c3c3c; border-radius: 6px;
        padding: 12px 8px; display: flex; flex-direction: column; align-items: center;
        position: relative; cursor: pointer; transition: transform 0.1s ease; user-select: none;
      `;
      
      const spriteWrapper = document.createElement('div');
      spriteWrapper.style.cssText = `width: 71px; height: 95px; overflow: hidden; position: relative; background: #151515; border-radius: 4px; margin-bottom: 8px;`;

      const img = document.createElement('img');
      img.src = window.VANILLA_SPRITESHEET || 'data:image/png;base64,';
      img.style.cssText = `position: absolute; left: -${(t.x || 0) * 71}px; top: -${(t.y || 0) * 95}px; image-rendering: pixelated;`;
      spriteWrapper.appendChild(img);

      const label = document.createElement('div');
      label.textContent = t.name;
      label.style.cssText = `color: #ffffff; font-weight: bold; font-size: 12px; text-align: center; text-overflow: ellipsis; width: 100%; overflow: hidden;`;

      card.appendChild(spriteWrapper);
      card.appendChild(label);

      card.onmouseenter = () => {
        card.style.transform = 'scale(1.03)';
        card.style.borderColor = '#ff4444';
        card.style.background = '#2d2d2d';
        
        globalTooltip.innerHTML = '';
        const descValue = t.cachedDesc || "No description provided.";
        
        try {
          if (typeof tsLocTextToLines === 'function') {
            const lines = tsLocTextToLines(descValue);
            lines.forEach(lineSegs => {
              const lineDiv = document.createElement('div');
              lineDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 2px; align-items: center; min-height: 18px;';
              
              lineSegs.forEach(seg => {
                const span = document.createElement('span');
                span.textContent = seg.text || '';
                let style = 'white-space: pre-wrap; ';
                if (seg.tags) {
                  if (seg.tags.C) {
                    let colorHex = BALATRO_FALLBACK_PALETTE[seg.tags.C] || '#333333';
                    const customColor = (typeof TEXT_STYLE_COLOURS !== 'undefined' && TEXT_STYLE_COLOURS.find(cc => cc.key === seg.tags.C));
                    if (customColor) colorHex = customColor.hex;
                    style += `color:${colorHex}; font-weight: bold;`;
                  }
                  if (seg.tags.X) {
                    let bgHex = BALATRO_FALLBACK_PALETTE[seg.tags.X] || '#333333';
                    style += `background:${bgHex}; color:#fff; padding:1px 4px; border-radius:3px; display: inline-block;`;
                  }
                }
                span.style.cssText = style;
                lineDiv.appendChild(span);
              });
              globalTooltip.appendChild(lineDiv);
            });
          }
        } catch (err) {
          globalTooltip.textContent = descValue;
        }
        globalTooltip.style.display = 'block';
      };

      card.onmousemove = (e) => {
        globalTooltip.style.left = (e.clientX + 15) + 'px';
        globalTooltip.style.top = (e.clientY + 15) + 'px';
      };

      card.onmouseleave = () => {
        card.style.transform = 'none';
        card.style.borderColor = '#3c3c3c';
        card.style.background = '#232323';
        globalTooltip.style.display = 'none';
      };

      card.onclick = () => {
        globalTooltip.style.display = 'none';
        
        window.registerTemplate = (data) => {
          if (data && data.xml) {
            try {
              let rawXml = data.xml;
              if (data.isBase64 || !rawXml.trim().startsWith('<')) {
                rawXml = decodeURIComponent(escape(atob(data.xml)));
              }
              const xmlDom = Blockly.utils.xml.textToDom(rawXml);
              const block = Blockly.Xml.domToBlock(xmlDom, window.workspace);
              if (block) {
                block.moveTo(new Blockly.utils.Coordinate(150, 150)); 
                block.select();
              }
              remakesModal.style.display = 'none';
            } catch(err) {
              console.error(err);
            }
          }
          clickScript.remove();
          delete window.registerTemplate;
        };

        const clickScript = document.createElement('script');
        clickScript.src = `./templates/${t.file}`;
        document.body.appendChild(clickScript);
      };
      
      remakesList.appendChild(card);
      
      // store desc vals
      cardsTrack.push({ 
        element: card, 
        name: t.name.toLowerCase(), 
        desc: (t.cachedDesc || '').toLowerCase() 
      });
    });

    // filtering/counting logic
    const updateSearchFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      const searchDescriptions = document.getElementById('remakeDescCheckbox').checked;
      let visibleCount = 0;

      cardsTrack.forEach(item => {
        let isMatch = false;
        if (searchDescriptions) {
          // Match text against name OR layout descriptions
          isMatch = item.name.includes(query) || item.desc.includes(query);
        } else {
          // Standard filter matching against names only
          isMatch = item.name.includes(query);
        }
        if (isMatch) {
          item.element.style.display = 'flex';
          visibleCount++;
        } else {
          item.element.style.display = 'none';
        }
      });
      //update text
      counterLabel.textContent = `Showing ${visibleCount} of ${cardsTrack.length} remakes`;
    };

    // attcah updates
    searchInput.oninput = updateSearchFilter;
    document.getElementById('remakeDescCheckbox').onchange = updateSearchFilter;

    // trigger cacl loop
    updateSearchFilter();

    setTimeout(() => { searchInput.focus(); }, 50);
  }
  closeRemakes.onclick = () => remakesModal.style.display = 'none';

  // === Variable Manager ===
  const manageVarsBtn = document.getElementById("manageVarsBtn");
  const varManager = document.getElementById("varManager");
  const varList = document.getElementById("varList");
  const addVarBtn = document.getElementById("addVarBtn");
  const closeVarManager = document.getElementById("closeVarManager");
  const newVarName = document.getElementById("newVarName");

  function renderVarList() {
    varList.innerHTML = '';
    if (window.customVariables.length === 0) {
      varList.innerHTML = '<p style="text-align:center;color:#aaa;">No variables yet.</p>';
      return;
    }
    
    // Initialize variable scopes if not exists
    if (!window.variableScopes) {
      window.variableScopes = {};
    }
    
    window.customVariables.forEach((v, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:3px 0;padding:4px 6px;border-bottom:1px solid #333;gap:8px;';
      
      // Name input
      const nameInput = document.createElement('input');
      nameInput.value = v;
      nameInput.style.cssText = 'flex:1;padding:4px;border:none;border-radius:4px;min-width:100px;';
      nameInput.onchange = () => {
        const newName = nameInput.value.trim().replace(/\s+/g, '_');
        nameInput.value = newName;

        if (!newName) return;
        if (window.customVariables.includes(newName)) return alert('That name already exists.');
        
        // Preserve scope when renaming
        const oldScope = window.variableScopes[v] || 'global';
        delete window.variableScopes[v];
        window.variableScopes[newName] = oldScope;
        
        window.customVariables[i] = newName;
        refreshVariableDropdowns();
        saveVariables();
        renderVarList();
      };
      
      // Scope dropdown
      const scopeDropdown = document.createElement('select');
      scopeDropdown.style.cssText = 'padding:4px;border:none;border-radius:4px;background:#333;color:#fff;cursor:pointer;';
      scopeDropdown.innerHTML = `
        <option value="global">Global</option>
        <option value="local">Local</option>
      `;
      
      // Set current scope
      const currentScope = window.variableScopes[v] || 'global';
      scopeDropdown.value = currentScope;
      
      scopeDropdown.onchange = () => {
        const newScope = scopeDropdown.value;
        if (newScope === 'global' && BALATRO_RESERVED_VARS.includes(v)) {
          const proceed = confirm(
            `⚠️ Warning: "${v}" already exists in Balatro.\n\n` +
            `Setting it to Global scope could result in crashes.\n\n` +
            `Only continue if you know what you're doing.\n\nSwitch to Global anyway?`
          );
          if (!proceed) {
            scopeDropdown.value = window.variableScopes[v] || 'local'; // revert dropdown
            return;
          }
        }
        window.variableScopes[v] = newScope;
        saveVariableScopes();
        refreshVariableDropdowns();
        renderVarList();
      };
      
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑';
      delBtn.style.cssText = 'background:#f44336;color:white;border:none;border-radius:5px;padding:4px 6px;cursor:pointer;';
      delBtn.onclick = () => {
        if (confirm(`Delete variable "${v}"?`)) {
          window.customVariables.splice(i, 1);
          delete window.variableScopes[v];
          refreshVariableDropdowns();
          renderVarList();
          saveVariables();
          saveVariableScopes();
        }
      };
      
      row.appendChild(nameInput);
      row.appendChild(scopeDropdown);
      row.appendChild(delBtn);
      varList.appendChild(row);
    });
  }

  manageVarsBtn.onclick = () => {
    renderVarList();
    varManager.style.display = 'block';
  };

  closeVarManager.onclick = () => varManager.style.display = 'none';

  addVarBtn.onclick = () => {
    const name = newVarName.value.trim().replace(/\s+/g, '_');

    if (!name) return;
    if (window.customVariables.includes(name)) {
      alert('That variable already exists.');
      return;
    }
    if (BALATRO_RESERVED_VARS.includes(name) && window.defaultVarScope === 'global') {
      const proceed = confirm(
        `⚠️ Warning: "${name}" already exists in Balatro.\n\n` +
        `Modifying or resetting this variable could result in crashes.\n\n` +
        `Only continue if you know what you're doing.\n\nAdd it anyway?`
      );
      if (!proceed) return;
    }
    window.customVariables.push(name);
    
    // Apply the default scope to new variables
    if (!window.variableScopes) {
      window.variableScopes = {};
    }
    window.variableScopes[name] = window.defaultVarScope;
    
    newVarName.value = '';
    refreshVariableDropdowns();
    renderVarList();
    saveVariables();
    saveVariableScopes();
  };  

  // --- Buttons ---
  function saveProjectFile() {
    snapshotCurrentTab();
    const data = {
      version: 2,
      tabs: window.tabs,
      activeTabId: window.activeTabId
    };
    const name = (projectInput.value || "MyMod").replace(/[^a-z0-9_\-]/gi, "_");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.bf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function loadProjectFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".bf";
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const text = ev.target.result.trim();
          workspace.clear();
          window.customVariables = [];
          saveVariables();
          refreshVariableDropdowns();

          if (text.startsWith("<xml")) {
            // Legacy single-workspace format
            window.tabs = [{ id: generateTabId(), name: "Main", xml: text }];
            window.activeTabId = window.tabs[0].id;
          } else {
            const data = JSON.parse(text);
            if (data.version === 2 && Array.isArray(data.tabs) && data.tabs.length > 0) {
              window.tabs = data.tabs;
              window.activeTabId = (data.activeTabId && data.tabs.find(t => t.id === data.activeTabId))
                ? data.activeTabId : data.tabs[0].id;
            } else {
              throw new Error("Unknown .bf format");
            }
          }

          persistTabs();
          applyTabToWorkspace(getCurrentTab());
          renderTabs();
          projectInput.value = file.name.replace(/\.bf$/i, "");
          saveProjectName(projectInput.value);
          setTimeout(() => { refreshVariableDropdowns(); updateModPrefix(); }, 200);
        } catch (err) { alert("Failed to load project."); console.error(err); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function generateLua() {
    // Load all tabs into a temp workspace for generation
    const combinedXml = getAllTabsXml();
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;visibility:hidden;';
    document.body.appendChild(tempDiv);
    const tempWs = Blockly.inject(tempDiv, { readOnly: false });

    try {
      const xml = Blockly.utils.xml.textToDom(combinedXml);
      Blockly.Xml.domToWorkspace(xml, tempWs);
    } catch(e) { console.error("Export load error:", e); }

    Blockly.Lua.hooks = [];
    let code = Blockly.Lua.workspaceToCode(tempWs);
    if (Blockly.Lua.hooks.length > 0) code += '\n' + Blockly.Lua.hooks.join('\n');
    tempWs.dispose(); tempDiv.remove();

    const projName = projectInput.value || "MyMod";
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "main.lua";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function generateModJson() {
    const blocks = workspace.getAllBlocks();
    const jsonBlocks = blocks.filter(b => BLOCK_DEFS.find(d => d.type === b.type)?.json);
    const modJson = {};
    jsonBlocks.forEach(b => {
      const def = BLOCK_DEFS.find(d => d.type === b.type);
      if (!def?.jsonField) return;
      let val = b.getFieldValue('value');
      if (def.jsonField === 'author') val = val.split(',').map(a => a.trim());
      if (val !== null && val !== undefined) modJson[def.jsonField] = val;
    });
    const blob = new Blob([JSON.stringify(modJson, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mod.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function previewLua() {
    const combinedXml = getAllTabsXml();
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;visibility:hidden;';
    document.body.appendChild(tempDiv);
    const tempWs = Blockly.inject(tempDiv, { readOnly: false });
    try {
      const xml = Blockly.utils.xml.textToDom(combinedXml);
      Blockly.Xml.domToWorkspace(xml, tempWs);
    } catch(e) {}
    Blockly.Lua.hooks = [];
    let code = Blockly.Lua.workspaceToCode(tempWs);
    if (Blockly.Lua.hooks.length > 0) code += '\n' + Blockly.Lua.hooks.join('\n');
    tempWs.dispose(); tempDiv.remove();

    const newTab = window.open();
    newTab.document.write('<pre>' + code.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre>');
    newTab.document.close();
  }

  function previewJson() {
    const blocks = workspace.getAllBlocks();
    const jsonBlocks = blocks.filter(b => BLOCK_DEFS.find(d => d.type === b.type)?.json);
    const modJson = {};
    jsonBlocks.forEach(b => {
      const def = BLOCK_DEFS.find(d => d.type === b.type);
      if (!def?.jsonField) return;
      let val = b.getFieldValue('value');
      if (def.jsonField === 'author') val = val.split(',').map(a => a.trim());
      if (val !== null && val !== undefined) modJson[def.jsonField] = val;
    });
    const newTab = window.open();
    newTab.document.write('<pre>' + JSON.stringify(modJson, null, 2) + '</pre>');
    newTab.document.close();
  }

  function exportModZip() {
    const projName = projectInput.value || "MyMod";
    const authorInput = document.getElementById("projectAuthorField").value || "YourName";
    const descInput = document.getElementById("projectDescField").value || "My awesome mod";

    // Build a temp workspace from all tabs
    const combinedXml = getAllTabsXml();
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;visibility:hidden;';
    document.body.appendChild(tempDiv);
    const tempWs = Blockly.inject(tempDiv, { readOnly: false });
    try {
      const xml = Blockly.utils.xml.textToDom(combinedXml);
      Blockly.Xml.domToWorkspace(xml, tempWs);
    } catch(e) { console.error("Export load error:", e); }

    const zip = new JSZip();
    const folder = zip.folder(projName);

    // main.lua
    Blockly.Lua.hooks = [];
    let luaCode = Blockly.Lua.workspaceToCode(tempWs);
    if (Blockly.Lua.hooks.length > 0) luaCode += '\n' + Blockly.Lua.hooks.join('\n');
    folder.file("main.lua", luaCode);

    // mod.json
    const blocks = tempWs.getAllBlocks();
    tempWs.dispose(); tempDiv.remove();

    const jsonBlocks = blocks.filter(b => BLOCK_DEFS.find(d => d.type === b.type)?.json);
    const modJson = {};

    jsonBlocks.forEach(b => {
      const def = BLOCK_DEFS.find(d => d.type === b.type);
      if (!def?.jsonField) return;
      let val = b.getFieldValue('value');
      if (def.jsonField === 'author') val = val.split(',').map(a => a.trim());
      if (val !== null && val !== undefined) modJson[def.jsonField] = val;
    });

    if (!modJson.name) modJson.name = projName;
    if (!modJson.author) modJson.author = authorInput.split(',').map(a => a.trim());
    if (!modJson.description) modJson.description = descInput;
    if (!modJson.main_file) modJson.main_file = "main.lua";

    if (!modJson.id) {
      modJson.id = projName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
    }
    if (!modJson.prefix) {
      modJson.prefix = projName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    Blockly.Lua.modPrefix = modJson.prefix;
    folder.file("mod.json", JSON.stringify(modJson, null, 2));

    zip.generateAsync({ type: "blob" }).then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${projName}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  saveProjectBtn.onclick = saveProjectFile;
  loadProjectBtn.onclick = loadProjectFile;
  newProjectBtn.onclick = () => {
    if (confirm("Start new project? This will clear the workspace and all tabs.")) {
      workspace.clear();
      window.customVariables = [];
      saveVariables();
      refreshVariableDropdowns();
      window.tabs = getDefaultTabs();
      window.activeTabId = window.tabs[0].id;
      persistTabs();
      renderTabs();
      localStorage.removeItem(WORKSPACE_KEY);
      projectInput.value = "MyMod";
      saveProjectName("MyMod");
      updateModPrefix();
    }
  };
  exportModBtn.onclick = exportModZip;

  // --- Live Lua preview ---
  const LIVE_LUA_KEY = "jokerblocks_live_lua";
  let liveLuaEnabled = localStorage.getItem(LIVE_LUA_KEY) === "true";
  liveLuaToggle.checked = liveLuaEnabled;
  liveLuaArea.style.display = liveLuaEnabled ? "block" : "none";

  function resizeWorkspace() {
    const liveWidth = liveLuaEnabled ? 400 : 0;
    document.getElementById("blocklyDiv").style.width = `calc(100% - ${liveWidth}px)`;
    Blockly.svgResize(workspace);
  }
  resizeWorkspace();

  liveLuaToggle.addEventListener("change", () => {
    liveLuaEnabled = liveLuaToggle.checked;
    localStorage.setItem(LIVE_LUA_KEY, liveLuaEnabled);
    liveLuaArea.style.display = liveLuaEnabled ? "block" : "none";
    resizeWorkspace();
    if (liveLuaEnabled) updateLiveLua();
  });
  
  let isDraggingDivider = false;

  const divider = document.createElement('div');
  divider.id = 'luaDivider';
  divider.style.cssText = `
    position: absolute;
    top: 36px;
    right: 400px;
    width: 4px;
    height: calc(100% - 36px);
    background: #444;
    cursor: col-resize;
    user-select: none;
    z-index: 15;
    transition: background 0.2s;
  `;

  divider.addEventListener('mouseenter', () => {
    if (liveLuaEnabled) divider.style.background = '#0084ff';
  });

  divider.addEventListener('mouseleave', () => {
    if (!isDraggingDivider) divider.style.background = '#444';
  });

  divider.addEventListener('mousedown', (e) => {
    isDraggingDivider = true;
    divider.style.background = '#0084ff';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingDivider || !liveLuaEnabled) return;

    const container = document.body;
    const newRightWidth = Math.max(200, container.clientWidth - e.clientX - 8);
    
    liveLuaArea.style.width = newRightWidth + 'px';
    divider.style.right = newRightWidth + 'px';
    
    document.getElementById("blocklyDiv").style.width = `calc(100% - ${newRightWidth}px)`;
    Blockly.svgResize(workspace);
    updateOptionsBtnPosition();
  });

  document.addEventListener('mouseup', () => {
    if (isDraggingDivider) {
      isDraggingDivider = false;
      divider.style.background = '#444';
    }
  });

  document.body.appendChild(divider);

  // Set initial divider visibility
  divider.style.display = liveLuaEnabled ? 'block' : 'none';

  // Save and load width preference
  const LUA_WIDTH_KEY = "jokerblocks_lua_width";
  const savedWidth = localStorage.getItem(LUA_WIDTH_KEY);
  if (savedWidth) {
    liveLuaArea.style.width = savedWidth + 'px';
    divider.style.right = savedWidth + 'px';
  } else {
    liveLuaArea.style.width = '400px';
    divider.style.right = '400px';
  }

  // Update resize observer to save width
  const luaResizeObserver = new ResizeObserver(() => {
    const width = liveLuaArea.offsetWidth;
    if (width > 0) {
      localStorage.setItem(LUA_WIDTH_KEY, width);
    }
  });

  luaResizeObserver.observe(liveLuaArea);

  liveLuaToggle.addEventListener("change", () => {
    divider.style.display = liveLuaToggle.checked ? 'block' : 'none';
  });

  let highlightBlock = null;
  workspace.addChangeListener(() => { if (liveLuaEnabled) updateLiveLua(); });
  workspace.addChangeListener(e => { if (e.type === Blockly.Events.SELECTED) highlightBlock = e.newElementId; updateLiveLua(); });

  function updateLiveLua() {
    Blockly.Lua.hooks = [];
    let code = Blockly.Lua.workspaceToCode(workspace);
    if (Blockly.Lua.hooks.length > 0) code += '\n' + Blockly.Lua.hooks.join('\n');

    const codeElement = document.querySelector('#liveLuaArea code');
    if (!codeElement) return;

    codeElement.innerHTML = hljs.highlight(code, { language: 'lua' }).value;

    // Highlight selected block if any
    const selected = highlightBlock ? workspace.getBlockById(highlightBlock) : null;
    if (selected) {
      const blockCode = Blockly.Lua.blockToCode(selected);
      let snippet = Array.isArray(blockCode) ? blockCode[0] : blockCode;
      const snippetLines = snippet.split("\n").map(l => l.trim()).filter(l => l);
      
      let lines = codeElement.innerHTML.split("\n");
      let start = lines.findIndex(l => l.includes(snippetLines[0]));
      
      if (start >= 0) {
        snippetLines.forEach((line, i) => { 
          if (lines[start+i]) {
            lines[start+i] = `<span class="hljs-selected">${lines[start+i]}</span>`;
          }
        });
        codeElement.innerHTML = lines.join("\n");
      }
    }
  }

  // --- Smart options button positioning ---
  function updateOptionsBtnPosition() {
    const luaWidth = liveLuaEnabled ? liveLuaArea.offsetWidth : 0;
    optionsBtn.style.right = (luaWidth + 10) + "px";
  }
  
  liveLuaToggle.addEventListener("change", updateOptionsBtnPosition);
  window.addEventListener("resize", updateOptionsBtnPosition);
  updateOptionsBtnPosition();
});

// the text styling modal
const TEXT_STYLE_COLOURS = [
  { key: 'mult', label: 'Mult', hex: '#FE5F55' },
  { key: 'chips', label: 'Chips', hex: '#009dff' },
  { key: 'money', label: 'Money', hex: '#f3b958' },
  { key: 'attention', label: 'Attention', hex: '#ff9a00' },
  { key: 'blue', label: 'Blue', hex: '#009dff' },
  { key: 'red', label: 'Red', hex: '#FE5F55' },
  { key: 'green', label: 'Green', hex: '#4BC292' },
  { key: 'orange', label: 'Orange', hex: '#fda200' },
  { key: 'gold', label: 'Gold', hex: '#eac058' },
  { key: 'purple', label: 'Purple', hex: '#8867a5' },
  { key: 'default', label: 'Default', hex: '#4f6367' },
  { key: 'white', label: 'White', hex: '#ffffff' },
  { key: 'inactive', label: 'Inactive', hex: '#888888' },
  { key: 'tarot', label: 'Tarot', hex: '#a782d1' },
  { key: 'planet', label: 'Planet', hex: '#13afce' },
  { key: 'spectral', label: 'Spectral', hex: '#4584fa' },
  { key: 'common', label: 'Common', hex: '#009dff' },
  { key: 'uncommon', label: 'Uncommon', hex: '#4BC292' },
  { key: 'rare', label: 'Rare', hex: '#FE5F55' },
  { key: 'legendary', label: 'Legendary', hex: '#b26cbb' },
  { key: 'enhanced', label: 'Enhanced', hex: '#8389DD' },
  { key: 'hearts', label: 'Hearts', hex: '#FE5F55' },
  { key: 'diamonds', label: 'Diamonds', hex: '#FE5F55' },
  { key: 'spades', label: 'Spades', hex: '#374649' },
  { key: 'clubs', label: 'Clubs', hex: '#424e54' },
  { key: 'hearts_hc', label: 'Hearts (HC)', hex: '#f03464' },
  { key: 'diamonds_hc', label: 'Diamonds (HC)', hex: '#f06b3f' },
  { key: 'spades_hc', label: 'Spades (HC)', hex: '#403995' },
  { key: 'clubs_hc', label: 'Clubs (HC)', hex: '#235955' },
  { key: 'hearts_alt', label: 'Hearts (Alt)', hex: '#f83b2f' },
  { key: 'diamonds_alt', label: 'Diamonds (Alt)', hex: '#e29000' },
  { key: 'spades_alt', label: 'Spades (Alt)', hex: '#4f31b9' },
  { key: 'clubs_alt', label: 'Clubs (Alt)', hex: '#008ee6' },
];
const TEXT_STYLE_MODES = [
  { key: 'C', label: 'Color', kind: 'palette' },
  { key: 'X', label: 'BG Color', kind: 'palette' },
  { key: 's', label: 'Scale', kind: 'value', placeholder: 'e.g. 0.8' },
  { key: 'u', label: 'Underline', kind: 'palette' },
  { key: 'st', label: 'Strike', kind: 'palette' },
  { key: 'f', label: 'Font', kind: 'value', placeholder: 'e.g. 1' },
  { key: 'E', label: 'Motion', kind: 'value', placeholder: '1 or 2' },
];

// ---- encode/decode between segment-lines and the loc_txt string ----
// segment: { tags: {C:'mult', X:'gold', ...}, text: '...' }

function tsBuildTagString(tags) {
  const parts = [];
  ['C', 'X', 'V', 'B', 's', 'u', 'st', 'f', 'E'].forEach(k => {
    if (tags[k]) parts.push(`${k}:${tags[k]}`);
  });
  return parts.join(',');
}

function tsSegmentsToLocText(lines) {
  return lines.map(line => {
    return line.map((seg, idx) => {
      const tagStr = Object.entries(seg.tags || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      
      if (tagStr) {
        const nextSeg = line[idx + 1];
        // Balatro conventions require a closing '{}' if the next chunk is unstyled, 
        // OR if this styled chunk ends right at a variable expression sequence like '#2#'
        const isNextUnstyled = nextSeg && (!nextSeg.tags || Object.keys(nextSeg.tags).length === 0);
        const endsInVariable = seg.text.trim().endsWith('#');
        
        const needsReset = isNextUnstyled || endsInVariable || !nextSeg;
        return `{${tagStr}}${seg.text}${needsReset ? '{}' : ''}`;
      }
      return seg.text;
    }).join('');
  }).join('\\n');
}

function tsLocTextToLines(raw) {
  if (!raw) return [[{ tags: {}, text: '' }]];
  
  const lineStrs = raw.split(/\r?\n|\\n/);
  return lineStrs.map(lineStr => {
    const segs = [];
    // Matches BOTH filled tag markers like {C:red} AND empty style-reset sequences like {}
    const re = /\{([^}]*)\}([^{]*)/g;
    let lastIdx = 0;
    let m;

    while ((m = re.exec(lineStr)) !== null) {
      // Capture any unstyled plain text leading up to this tag sequence
      if (m.index > lastIdx) {
        const plainText = lineStr.slice(lastIdx, m.index);
        segs.push({ tags: {}, text: plainText });
      }

      const tags = {};
      const tagContent = m[1].trim();
      
      // If the bracket has content (e.g., C:red), parse its styles
      if (tagContent) {
        tagContent.split(',').forEach(pair => {
          const [k, v] = pair.split(':');
          if (k && v !== undefined) tags[k.trim()] = v.trim();
        });
      }

      let segmentText = m[2] || '';
      
      // Only push the segment if tags exist or text content isn't empty
      if (Object.keys(tags).length > 0 || segmentText) {
        segs.push({ tags, text: segmentText });
      }
      
      lastIdx = re.lastIndex;
    }
    
    // Catch remaining trailing unstyled text at the end of the line
    if (lastIdx < lineStr.length) {
      segs.push({ tags: {}, text: lineStr.slice(lastIdx) });
    }

    return segs.length ? segs : [{ tags: {}, text: '' }];
  });
}

// ---- modal DOM ----

function ensureTextStyleModalDom() {
  if (document.getElementById('textStyleModal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'textStyleModal';
  overlay.style.cssText = `
    display:none;
    position:fixed;
    top:0; left:0; right:0; bottom:0;
    background:rgba(0,0,0,0.55);
    z-index:200;
    align-items:center;
    justify-content:center;
  `;

  overlay.innerHTML = `
    <div id="tsModalBox" style="
      background:#222;
      color:#fff;
      width:680px;
      max-width:94vw;
      max-height:88vh;
      border-radius:10px;
      box-shadow:0 0 20px rgba(0,0,0,0.6);
      display:flex;
      flex-direction:column;
      overflow:hidden;
      font-family:sans-serif;
    ">
      <div style="padding:14px 16px; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;font-size:16px;">Text Styler</h3>
        <span id="tsCloseX" style="cursor:pointer;color:#aaa;font-size:18px;line-height:1;">&#10005;</span>
      </div>

      <div style="display:flex; flex:1; min-height:0;">
        <div id="tsPaletteCol" style="
          width:170px;
          flex-shrink:0;
          border-right:1px solid #444;
          display:flex;
          flex-direction:column;
          min-height:0;
        ">
          <div id="tsModeTabs" style="
            display:flex;
            flex-wrap:wrap;
            gap:3px;
            padding:8px;
            border-bottom:1px solid #444;
            flex-shrink:0;
          "></div>
          <div id="tsModeValueRow" style="display:none; padding:8px; border-bottom:1px solid #444;">
            <input id="tsModeValueInput" type="text" placeholder="" style="
              width:100%;
              padding:6px;
              border-radius:4px;
              border:1px solid #555;
              background:#111;
              color:#fff;
              box-sizing:border-box;
              font-size:12px;
            ">
          </div>
          <div id="tsPaletteSwatches" style="
            flex:1;
            overflow-y:auto;
            padding:8px;
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:6px;
            align-content:start;
          "></div>
        </div>

        <div id="tsLinesCol" style="
          flex:1;
          min-width:0;
          display:flex;
          flex-direction:column;
          padding:12px;
          overflow-y:auto;
        ">
          <div style="font-size:11px;color:#999;margin-bottom:8px;">
            Currently typing in: <span id="tsActiveSwatchLabel" style="font-weight:bold;color:#fff;">Default</span>
          </div>
          <div id="tsLinesList" style="display:flex; flex-direction:column; gap:6px;"></div>
          <button id="tsAddLineBtn" style="
            margin-top:8px;
            align-self:flex-start;
            background:#2196F3;
            color:#fff;
            border:none;
            border-radius:5px;
            padding:6px 12px;
            cursor:pointer;
            font-size:13px;
          ">+ Add Line</button>

          <div style="margin-top:14px;">
            <div style="font-size:11px;color:#999;margin-bottom:4px;">Preview</div>
            <div id="tsPreviewBox" style="
              background:#fff;
              color:#222;
              border-radius:6px;
              padding:10px 12px;
              font-size:14px;
              line-height:1.5;
              min-height:40px;
            "></div>
          </div>
        </div>
      </div>

      <div style="padding:12px 16px; border-top:1px solid #444; display:flex; justify-content:space-between;">
        <button id="tsCancelBtn" style="
          background:#555;
          color:#fff;
          border:none;
          border-radius:5px;
          padding:8px 18px;
          cursor:pointer;
        ">Cancel</button>
        <button id="tsSaveBtn" style="
          background:#4caf50;
          color:#fff;
          border:none;
          border-radius:5px;
          padding:8px 18px;
          cursor:pointer;
          font-weight:bold;
        ">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTextStyleModal();
  });
  document.getElementById('tsCloseX').onclick = closeTextStyleModal;
  document.getElementById('tsCancelBtn').onclick = closeTextStyleModal;
}

window.tsState = {
  lines: [[{ tags: {}, text: '' }]],
  activeMode: 'C', // which tab the palette is currently showing
  modeValues: {}, // e.g. { C: 'attention', X: 'mult' } - every mode that's currently turned on
  targetField: null,
};

// X and B fight over the background, C and V fight over the text color.
// turning one of these on switches off the other in its group.
const TEXT_STYLE_EXCLUSIVE_GROUPS = [['C', 'V'], ['X', 'B']];

function tsClearConflicts(modeKey) {
  const group = TEXT_STYLE_EXCLUSIVE_GROUPS.find(g => g.includes(modeKey));
  if (!group) return;
  group.forEach(k => { if (k !== modeKey) delete window.tsState.modeValues[k]; });
}

function tsRenderModeTabs() {
  const wrap = document.getElementById('tsModeTabs');
  wrap.innerHTML = '';
  TEXT_STYLE_MODES.forEach(mode => {
    const btn = document.createElement('button');
    btn.dataset.mode = mode.key;
    const viewing = window.tsState.activeMode === mode.key;
    const isSet = !!window.tsState.modeValues[mode.key];
    btn.style.cssText = `
      border:none;
      border-radius:4px;
      padding:5px 8px;
      font-size:11px;
      cursor:pointer;
      background:${viewing ? '#2196F3' : '#333'};
      color:#fff;
      position:relative;
    `;
    btn.textContent = mode.label;
    if (isSet) {
      const dot = document.createElement('span');
      dot.style.cssText = 'display:inline-block;width:6px;height:6px;border-radius:50%;background:#4caf50;margin-left:5px;';
      btn.appendChild(dot);
    }
    btn.onclick = () => {
      window.tsState.activeMode = mode.key;
      tsRenderModeTabs();
      tsRenderModeValueRow();
      tsRenderPalette();
      tsUpdateActiveLabel();
    };
    wrap.appendChild(btn);
  });
}

function tsRenderModeValueRow() {
  const mode = TEXT_STYLE_MODES.find(m => m.key === window.tsState.activeMode);
  const row = document.getElementById('tsModeValueRow');
  const input = document.getElementById('tsModeValueInput');
  if (mode && mode.kind === 'value') {
    row.style.display = 'block';
    input.placeholder = mode.placeholder || '';
    input.value = window.tsState.modeValues[mode.key] || '';
    input.oninput = () => {
      if (input.value) {
        window.tsState.modeValues[mode.key] = input.value;
      } else {
        delete window.tsState.modeValues[mode.key];
      }
      tsRenderModeTabs();
      tsUpdateActiveLabel();
    };
  } else {
    row.style.display = 'none';
  }
}

function tsRenderPalette() {
  const mode = TEXT_STYLE_MODES.find(m => m.key === window.tsState.activeMode);
  const grid = document.getElementById('tsPaletteSwatches');
  grid.innerHTML = '';

  if (!mode || mode.kind === 'value') {
    grid.style.display = 'none';
    return;
  }
  grid.style.display = 'grid';

  const currentValue = window.tsState.modeValues[mode.key] || null;

  // reset swatch always first
  const resetCell = document.createElement('div');
  resetCell.style.cssText = `
    display:flex; flex-direction:column; align-items:center; gap:3px;
    cursor:pointer; padding:4px; border-radius:6px;
    border:2px solid ${currentValue === null ? '#fff' : 'transparent'};
  `;
  resetCell.innerHTML = `
    <div style="
      width:32px;height:32px;border-radius:6px;
      background:repeating-conic-gradient(#666 0% 25%, #333 0% 50%) 50% / 10px 10px;
      border:1px solid #555;
    "></div>
    <span style="font-size:9px;color:#ccc;text-align:center;">Reset</span>
  `;
  resetCell.onclick = () => {
    delete window.tsState.modeValues[mode.key];
    tsRenderModeTabs();
    tsRenderPalette();
    tsUpdateActiveLabel();
  };
  grid.appendChild(resetCell);

  TEXT_STYLE_COLOURS.forEach(c => {
    const cell = document.createElement('div');
    const active = currentValue === c.key;
    cell.style.cssText = `
      display:flex; flex-direction:column; align-items:center; gap:3px;
      cursor:pointer; padding:4px; border-radius:6px;
      border:2px solid ${active ? '#fff' : 'transparent'};
    `;
    cell.innerHTML = `
      <div style="width:32px;height:32px;border-radius:6px;background:${c.hex};border:1px solid #0003;"></div>
      <span style="font-size:9px;color:#ccc;text-align:center;line-height:1.1;">${c.label}</span>
    `;
    cell.onclick = () => {
      window.tsState.modeValues[mode.key] = c.key;
      tsClearConflicts(mode.key);
      tsRenderModeTabs();
      tsRenderPalette();
      tsUpdateActiveLabel();
    };
    grid.appendChild(cell);
  });
}

function tsUpdateActiveLabel() {
  const label = document.getElementById('tsActiveSwatchLabel');
  const entries = Object.entries(window.tsState.modeValues);
  if (!entries.length) {
    label.textContent = 'Default';
    return;
  }
  label.textContent = entries.map(([key, val]) => {
    const mode = TEXT_STYLE_MODES.find(m => m.key === key);
    const modeLabel = mode ? mode.label : key;
    if (mode && mode.kind === 'value') return `${modeLabel}: ${val}`;
    const c = TEXT_STYLE_COLOURS.find(col => col.key.toLowerCase() === (val || '').toLowerCase());
    return `${modeLabel}: ${c ? c.label : val}`;
  }).join(', ');
}

function tsCurrentTags() {
  return { ...window.tsState.modeValues };
}

function tsTagsEqual(a, b) {
  const ak = Object.keys(a || {});
  const bk = Object.keys(b || {});
  if (ak.length !== bk.length) return false;
  return ak.every(k => a[k] === b[k]);
}

function tsRenderLines() {
  const list = document.getElementById('tsLinesList');
  list.innerHTML = '';

  window.tsState.lines.forEach((segs, lineIdx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:6px;';

    const lineLabel = document.createElement('span');
    lineLabel.textContent = `${lineIdx + 1}`;
    lineLabel.style.cssText = 'width:18px;color:#777;font-size:11px;text-align:right;flex-shrink:0;';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = segs.map(s => s.text).join('');
    input.dataset.lineIdx = lineIdx;
    input.style.cssText = `
      flex:1;
      padding:7px 8px;
      border-radius:4px;
      border:1px solid #555;
      background:#111;
      color:#fff;
      font-size:13px;
      box-sizing:border-box;
    `;

    // Tracks character-level metadata by calculating a structural diff 
    // between old and new text states to prevent whole-line styling overrides.
    input.addEventListener('input', (e) => {
      const newText = e.target.value;
      const oldSegs = window.tsState.lines[lineIdx];
      const oldText = oldSegs.map(s => s.text).join('');
      const currentTags = tsCurrentTags();

      //explode
      const chars = [];
      oldSegs.forEach(seg => {
        for (let i = 0; i < seg.text.length; i++) {
          chars.push({ char: seg.text[i], tags: seg.tags });
        }
      });

      // identify
      let start = 0;
      while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
        start++;
      }

      // identify
      let oldEnd = oldText.length;
      let newEnd = newText.length;
      while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
        oldEnd--;
        newEnd--;
      }

      // create new char entries
      const addedText = newText.slice(start, newEnd);
      const addedChars = [];
      for (let i = 0; i < addedText.length; i++) {
        addedChars.push({ char: addedText[i], tags: { ...currentTags } });
      }

      // spslce
      chars.splice(start, oldEnd - start, ...addedChars);

      // comopress
      const newSegs = [];
      if (chars.length === 0) {
        newSegs.push({ tags: {}, text: '' });
      } else {
        let currentSeg = { tags: chars[0].tags, text: chars[0].char };
        for (let i = 1; i < chars.length; i++) {
          if (tsTagsEqual(chars[i].tags, currentSeg.tags)) {
            currentSeg.text += chars[i].char;
          } else {
            newSegs.push(currentSeg);
            currentSeg = { tags: chars[i].tags, text: chars[i].char };
          }
        }
        newSegs.push(currentSeg);
      }

      window.tsState.lines[lineIdx] = newSegs;
      tsUpdatePreview();
    });

    const delBtn = document.createElement('span');
    delBtn.textContent = '\u{1F5D1}';
    delBtn.title = 'Delete line';
    delBtn.style.cssText = 'cursor:pointer; opacity:0.6; flex-shrink:0; font-size:13px;';
    delBtn.onmouseenter = () => delBtn.style.opacity = '1';
    delBtn.onmouseleave = () => delBtn.style.opacity = '0.6';
    delBtn.onclick = () => {
      if (window.tsState.lines.length <= 1) {
        window.tsState.lines = [[{ tags: {}, text: '' }]];
      } else {
        window.tsState.lines.splice(lineIdx, 1);
      }
      tsRenderLines();
      tsUpdatePreview();
    };

    row.appendChild(lineLabel);
    row.appendChild(input);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function tsAddLine() {
  window.tsState.lines.push([{ tags: {}, text: '' }]);
  tsRenderLines();
  tsUpdatePreview();
  const inputs = document.querySelectorAll('#tsLinesList input');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

function tsColourForTags(tags) {
  if (tags.C) {
    const c = TEXT_STYLE_COLOURS.find(cc => cc.key === tags.C);
    return c ? c.hex : '#4f6367';
  }
  return '#4f6367';
}

function tsUpdatePreview() {
  const box = document.getElementById('tsPreviewBox');
  box.innerHTML = '';
  window.tsState.lines.forEach((segs) => {
    const lineDiv = document.createElement('div');
    segs.forEach(seg => {
      if (!seg.text) return;
      const span = document.createElement('span');
      span.textContent = seg.text;
      let style = `color:${tsColourForTags(seg.tags)};`;
      if (seg.tags.X) {
        const bg = TEXT_STYLE_COLOURS.find(cc => cc.key === seg.tags.X);
        if (bg) {
          style += `background:${bg.hex};padding:1px 4px;border-radius:3px;`;
          if (!seg.tags.C) {
            style += `color:#4f6367;`;
          }
        }
      }
      if (seg.tags.u) style += 'text-decoration:underline;';
      if (seg.tags.st) style += 'text-decoration:line-through;';
      if (seg.tags.s) style += `font-size:${parseFloat(seg.tags.s) * 14}px;`;
      span.style.cssText = style;
      lineDiv.appendChild(span);
    });
    if (!segs.some(s => s.text)) lineDiv.innerHTML = '&nbsp;';
    box.appendChild(lineDiv);
  });
}

function openTextStyleModal(textField) {
  ensureTextStyleModalDom();
  window.tsState.targetField = textField;
  window.tsState.activeMode = 'C';
  window.tsState.activeColorKey = null;
  window.tsState.activeModeValue = '';
  window.tsState.lines = tsLocTextToLines(textField.getValue() || '');

  tsRenderModeTabs();
  tsRenderModeValueRow();
  tsRenderPalette();
  tsUpdateActiveLabel();
  tsRenderLines();
  tsUpdatePreview();

  document.getElementById('textStyleModal').style.display = 'flex';

  document.getElementById('tsAddLineBtn').onclick = tsAddLine;
  document.getElementById('tsSaveBtn').onclick = () => {
    const result = tsSegmentsToLocText(window.tsState.lines);
    if (window.tsState.targetField) {
      window.tsState.targetField.setValue(result);
    }
    closeTextStyleModal();
  };
}

function closeTextStyleModal() {
  const overlay = document.getElementById('textStyleModal');
  if (overlay) overlay.style.display = 'none';
}