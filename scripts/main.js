// === Dropdown search patch ===
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

// load vars from localStorage
window.customVariables = JSON.parse(localStorage.getItem("customVariables") || "[]");
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
  const overlay = document.createElement("div");
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
    
    // Show success message
    alert("All data cleared! The page will reload.");
    
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
    zoom: { controls: true, wheel: true, startScale: 0.5 }
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
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    localStorage.setItem(WORKSPACE_KEY, xmlText);
  }
  
  function loadWorkspace() {
      const xmlText = localStorage.getItem(WORKSPACE_KEY);
      if (xmlText) {
        try {
          const xml = Blockly.utils.xml.textToDom(xmlText);
          Blockly.Xml.domToWorkspace(xml, workspace);
        } catch (e) {
          console.error("Error loading workspace:", e);
        }
      }

      // wait a bit before refreshing to avoid triple popup glitch
      setTimeout(() => {
        refreshVariableDropdowns();
        updateModPrefix();  //  update prefix after loading
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
    
    // Add categories in defined order
    categoryOrder.forEach(cat => {
      if (categories[cat]) {
        const color = BLOCK_DEFS.find(b => b.category === cat)?.color || "#ccc";
        toolboxXml += `<category name="${cat}" colour="${color}">`;
        categories[cat].forEach(type => {
          toolboxXml += `<block type="${type}"></block>`;
        });
        toolboxXml += `</category>`;
      }
    });

    // Add any new categories at the bottom (before Variables)
    Object.keys(categories).forEach(cat => {
      if (!categoryOrder.includes(cat)) {
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
        window.variableScopes[v] = scopeDropdown.value;
        saveVariableScopes();
        refreshVariableDropdowns();
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
    window.customVariables.push(name);
    
    // Apply the default scope to new variables
    if (!window.variableScopes) {
      window.variableScopes = {};
    }
    window.variableScopes[name] = defaultVarScope;
    
    newVarName.value = '';
    refreshVariableDropdowns();
    renderVarList();
    saveVariables();
    saveVariableScopes();
  };  

  // --- Buttons ---
  function saveProjectFile() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xml);
    const name = (projectInput.value || "MyMod").replace(/[^a-z0-9_\-]/gi, "_");
    const blob = new Blob([xmlText], { type: "text/plain" });
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
          const xmlText = ev.target.result.trim();
          if (!xmlText.startsWith("<xml")) throw new Error("Invalid XML");
          setTimeout(() => {
            const xml = Blockly.utils.xml.textToDom(xmlText);
            workspace.clear();
            window.customVariables = [];
            saveVariables();
            refreshVariableDropdowns();
            Blockly.Xml.domToWorkspace(xml, workspace);
            projectInput.value = file.name.replace(/\.bf$/i, "");
            saveProjectName(projectInput.value);
            updateModPrefix();
          }, 200);
        } catch (err) { alert("Failed to load project."); console.error(err); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function generateLua() {
    // reset hook list before generation
    Blockly.Lua.hooks = [];
    let code = Blockly.Lua.workspaceToCode(workspace);

    // append any collected hooks at the end
    if (Blockly.Lua.hooks.length > 0) {
      code += '\n' + Blockly.Lua.hooks.join('\n');
    }

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
    // reset hook list before generation
    Blockly.Lua.hooks = [];
    let code = Blockly.Lua.workspaceToCode(workspace);

    // append any collected hooks at the end
    if (Blockly.Lua.hooks.length > 0) {
      code += '\n' + Blockly.Lua.hooks.join('\n');
    }

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

    const zip = new JSZip();
    const folder = zip.folder(projName);

    // main.lua
    folder.file("main.lua", Blockly.Lua.workspaceToCode(workspace));

    // mod.json
    const blocks = workspace.getAllBlocks();
    const jsonBlocks = blocks.filter(b => BLOCK_DEFS.find(d => d.type === b.type)?.json);
    const modJson = {};
    

    // fill from blocks first
    jsonBlocks.forEach(b => {
      const def = BLOCK_DEFS.find(d => d.type === b.type);
      if (!def?.jsonField) return;
      let val = b.getFieldValue('value');
      if (def.jsonField === 'author') val = val.split(',').map(a => a.trim());
      if (val !== null && val !== undefined) modJson[def.jsonField] = val;
    });

    // fallback to options inputs if not already set
    if (!modJson.name) modJson.name = projName;
    if (!modJson.author) modJson.author = authorInput.split(',').map(a => a.trim());
    if (!modJson.description) modJson.description = descInput;
    if (!modJson.main_file) modJson.main_file = "main.lua";

    // --- auto-generate id and prefix ---
    if (!modJson.id) {
      modJson.id = projName
        .replace(/[^a-zA-Z0-9 ]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '_')          // spaces > underscore
        .toLowerCase();
    }
    if (!modJson.prefix) {
      modJson.prefix = projName
        .replace(/[^a-zA-Z0-9]/g, '')  // remove non-alphanum
        .toLowerCase();                // lowercase, no spaces
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
    if (confirm("Start new project? This will clear the workspace.")) {
      workspace.clear();
      window.customVariables = [];
      saveVariables();
      refreshVariableDropdowns();      
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
    top: 0;
    right: 400px;
    width: 4px;
    height: 100%;
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

    codeElement.innerHTML = hljs.highlight(
      code,
      { language: 'lua' }
    ).value

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
