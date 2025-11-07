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

  // Handle fields AFTER (so they appear on the right)
  def.fields?.forEach((f) => {
    if (def.json && !f.name) f.name = 'value';

    argCount++;
    if (f.label) {
    json.message0 += ` ${f.label}: %${argCount}`;
    } else {
    json.message0 += ` %${argCount}`;
    }

        if (f.type === 'dropdown') {
        // handle both ['Label','Value'] and 'String' formats
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
      // Output blocks (like condition blocks that return values)
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

Blockly.defineBlocksWithJsonArray(jsonBlocks);

Blockly.Blocks = Blockly.Blocks || {};
Object.keys(Blockly.Blocks).forEach(blockType => {
    const block = Blockly.Blocks[blockType];
    if (block && block.init) {
        const originalInit = block.init;
        block.init = function() {
            originalInit.call(this);
            
            // Get the definition for this block type
            const def = blockDefMap[blockType];
            
            // Check hardcoded list first
            if (["or", "not", "compare","limit","minus","add","multiply","divide","givex","var_get","var_set","var_change","adv_repeat","repeat"].includes(blockType)) {
                this.setInputsInline(true);
            } 
            // Then check the definition's inlineInputs property
            else if (def && def.inlineInputs === true) {
                this.setInputsInline(true);
            } 
            else if (def && def.inlineInputs === false) {
                this.setInputsInline(false);
            } 
            else {
                this.setInputsInline(false);
            }

            // Set up dynamic tooltips if defined
            if (def && def.dynamic_tooltip && Array.isArray(def.dynamic_tooltip)) {
                let fieldName = null;
                def.fields?.forEach(f => {
                    if (f.type === 'dropdown') {
                        fieldName = f.name;
                    }
                });
                
                if (fieldName) {
                    const field = this.getField(fieldName);
                    if (field) {
                        // Create tooltip map from dynamic_tooltip array
                        const tooltipMap = {};
                        def.dynamic_tooltip.forEach(item => {
                            // Support both option value and option label (first element of tuple)
                            let optionKey = item.option;
                            
                            // If option is a number, find the corresponding dropdown value
                            if (typeof optionKey === 'number') {
                                const dropdownDef = def.fields?.find(f => f.type === 'dropdown' && f.name === fieldName);
                                if (dropdownDef && dropdownDef.options[optionKey]) {
                                    const opt = dropdownDef.options[optionKey];
                                    optionKey = Array.isArray(opt) ? opt[1] : opt; // Get the value (second element)
                                }
                            } else if (typeof optionKey === 'string') {
                                // Check if it's a label (first element of tuple) and convert to value
                                const dropdownDef = def.fields?.find(f => f.type === 'dropdown' && f.name === fieldName);
                                if (dropdownDef) {
                                    const found = dropdownDef.options.find(opt => {
                                        const label = Array.isArray(opt) ? opt[0] : opt;
                                        return label === optionKey;
                                    });
                                    if (found) {
                                        optionKey = Array.isArray(found) ? found[1] : found;
                                    }
                                }
                            }
                            
                            tooltipMap[optionKey] = item.tooltip;
                        });
                        
                        // Set initial tooltip
                        const initialValue = field.getValue();
                        this.setTooltip(tooltipMap[initialValue] || def.tooltip || 'No description available');
                        
                        // Update tooltip when dropdown changes
                        field.setValidator((newValue) => {
                            this.setTooltip(tooltipMap[newValue] || def.tooltip || 'No description available');
                            return newValue;
                        });
                    }
                }
            }
        };
    }
});

Blockly.Blocks['compare'].init = function() {
  this.setColour('#5cb85c');
  this.setOutput(true, 'Boolean');

  this.appendValueInput('A')
      .setCheck(null);

  this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['==', '=='],
        ['!=', '~='],
        ['>', '>'],
        ['<', '<'],
        ['>=', '>='],
        ['<=', '<=']
      ]), 'OP');

  this.appendValueInput('B')
      .setCheck(null)
      .appendField(''); 

  this.setInputsInline(true);
  this.setTooltip('Compares two values.');
};

Blockly.Blocks['givex'].init = function() {
  this.setColour('#26aa96');
  this.appendDummyInput()
      .appendField('Add')
      .appendField(new Blockly.FieldDropdown([
        ['Mult','Mult'],
        ['Chips','Chips'],
        ['XChips','XChips'],
        ['XMult','XMult'],
        ['Dollars','Dollars']
      ]), 'var')
      .appendField('=');
      
  this.appendValueInput('amt')
      .setCheck(null);
  this.setPreviousStatement(true, '');
  this.setNextStatement(true, '');
  this.setInputsInline(true);
};

Blockly.Blocks['game_value_set'].init = function() {
  this.setColour('#286b9e');
  this.appendDummyInput()
      .appendField('Set Game value')
      .appendField(new Blockly.FieldDropdown([
        ['Maximum Bankruptcy','G.GAME.bankrupt_at']
      ]), 'var')
      .appendField('to');
      
  this.appendValueInput('val')
      .setCheck(null);
  this.setPreviousStatement(true, '');
  this.setNextStatement(true, '');
  this.setInputsInline(true);
};

Blockly.Blocks['repeater'].init = function() {
  this.setColour('#2e8f2e');
  this.appendDummyInput()
      .appendField('Add');
      
  this.appendValueInput('a')
      .setCheck(null);

  this.appendDummyInput()
      .appendField('repetitions');   

  this.setPreviousStatement(true, '');
  this.setNextStatement(true, '');
  this.setInputsInline(true);
};

Blockly.Blocks['card_issuit'].init = function() {
  this.setColour('#725cb8');
  this.setOutput(true, 'Boolean');

  this.appendValueInput('card')
      .setCheck('Card');

  this.appendDummyInput()
      .appendField('is suit')

  this.appendValueInput('suit')
      .setCheck('Suit');     

  this.setInputsInline(true);
};

Blockly.Blocks['copy_consumeable'].init = function() {
  this.setColour('#459340');

  this.appendDummyInput()
      .appendField('Copy consumeable, Index:')

  this.appendValueInput('idx')
      .setCheck(null);     

  this.appendDummyInput()
      .appendField('Edition:');    

  this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['Don\'t Change','None'],
        ['Base','base'],
        ['Negative','negative'],
        ['Foil','foil'],
        ['Holographic','holographic'],
        ['Polychrome','polychrome'],
      ]), 'edition');

  this.setPreviousStatement(true, null);
  this.setNextStatement(true, null);
  this.setInputsInline(true);
  this.setTooltip('Copies a specified indexed or random consumeable. (If you have atleast 1). Set `Index` to the string \'random\' for random Index, if blank (no input socket) then it\'ll resort to random consumeable');
};

Blockly.Blocks['card_isrank'].init = function() {
  this.setColour('#725cb8');
  this.setOutput(true, 'Boolean');

  this.appendValueInput('card')
      .setCheck('Card');

  this.appendDummyInput()
      .appendField('is rank')

  this.appendValueInput('rank')
      .setCheck('Rank');     

  this.setInputsInline(true);
};

Blockly.Blocks['joker_amt'].init = function() {
  this.setColour('#40a5aa');
  this.setOutput(true, 'Number');

  this.appendDummyInput()
      .appendField('Amount of')

  this.appendValueInput('a')
      .setCheck(null);

  this.appendDummyInput()
      .appendField('Jokers held')
      
  this.setInputsInline(true);
  this.setTooltip('Calculates how many jokers of the given `id` is currently held.');
};

Blockly.Blocks['pseudorandom'].init = function() {
  this.setColour('#40a5aa');
  this.setOutput(true, 'Number');

  this.appendDummyInput()
      .appendField('Pick random')

  this.appendValueInput('a')
      .setCheck(null);

  this.appendDummyInput()
      .appendField('to')

  this.appendValueInput('b')
      .setCheck(null);

  this.setInputsInline(true);
  this.setTooltip('Returns a random value between two (Random Seed).');
};

// helper to build dropdown menu
function getVariableOptions() {
  const vars = window.customVariables.map(v => [v, v]);
  vars.push(['<Create new variable>', '__create__']);
  return vars;
}

// helper to attach "create variable" validator AFTER init
function attachVarValidator(block, fieldName) {
  const field = block.getField(fieldName);
  if (!field) return;
  field.setValidator((newVal) => {
    if (newVal === '__create__') {
      createNewVariablePopup((name) => {
        if (name) {
          block.setFieldValue(name, fieldName);
        }
      });
      return null; // cancel setting "__create__"
    }
    return newVal;
  });
}

// get variable value
Blockly.Blocks['var_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(getVariableOptions), 'VAR');
    this.setOutput(true, null);
    this.setColour('#f5b942');
    this.setTooltip('Get variable value');
    this.setHelpUrl('');

    attachVarValidator(this, 'VAR');
  }
};

// set variable to value
Blockly.Blocks['var_set'] = {
  init: function() {
    this.appendValueInput('VALUE')
      .setCheck(null)
      .appendField('set')
      .appendField(new Blockly.FieldDropdown(getVariableOptions), 'VAR')
      .appendField('to');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f5b942');
    this.setTooltip('Set variable to a value');
    this.setHelpUrl('');
    this.setInputsInline(true);

    attachVarValidator(this, 'VAR');
  }
};

// change variable by value
Blockly.Blocks['var_change'] = {
  init: function() {
    this.appendValueInput('DELTA')
      .setCheck(null)
      .appendField('change')
      .appendField(new Blockly.FieldDropdown(getVariableOptions), 'VAR')
      .appendField('by');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f5b942');
    this.setTooltip('Add or subtract from variable');
    this.setHelpUrl('');
    this.setInputsInline(true);

    attachVarValidator(this, 'VAR');
  }
};

// toolbox
let toolboxXml = '';
Object.keys(categories).forEach(cat => {
  const color = BLOCK_DEFS.find(b => b.category === cat)?.color || "#ccc";
  toolboxXml += `<category name="${cat}" colour="${color}">`;
  categories[cat].forEach(type => {
    toolboxXml += `<block type="${type}"></block>`;
  });
  toolboxXml += `</category>`;
});

document.getElementById("toolbox").innerHTML = toolboxXml;