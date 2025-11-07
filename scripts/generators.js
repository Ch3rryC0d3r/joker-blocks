Blockly.Lua = new Blockly.Generator('Lua');
Blockly.Lua.hooks = [];

function generateRandomString(length) {
  const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function indentLua(code, level = 1) {
  const indent = ' '.repeat(level * 4);
  return code
    .split('\n')
    .map(line => (line.trim() ? indent + line.trimEnd() : line))
    .join('\n');
}

function genLuaFromTemplate(template, block) {
  
  let result = template;

  block.inputList.forEach(inp => {
    inp.fieldRow.forEach(f => {
      if (f.name && !(block.type.includes('loc_txt') && f.name === 'b')) {
        let val = f.getValue();
        if (val === 'None') val = ''; // treat "None" as empty
        result = result.replaceAll(`[[${f.name}]]`, val);
      }
    });
  });

  block.inputList.forEach(inp => {
    if (inp.type === Blockly.NEXT_STATEMENT || inp.type === Blockly.INPUT_STATEMENT) {
      const firstChild = block.getInputTargetBlock(inp.name);
      let childCode = '';
      let current = firstChild;
      
      while (current) {
        let generated = Blockly.Lua.blockToCode(current) || '';
        if (Array.isArray(generated)) generated = generated[0];
        childCode += generated;
        current = current.getNextBlock();
      }

      const indentedChild = indentLua(childCode, 1);
      result = result.replaceAll(`[[${inp.name}]]`, '\n' + indentedChild);
    }
  });
      
  // Handle value inputs (like condition blocks)
  block.inputList.forEach(inp => {
      if (inp.type === Blockly.INPUT_VALUE) {
          const valueBlock = block.getInputTargetBlock(inp.name);
          let valueCode = '';
          
          if (valueBlock) {
              const generated = Blockly.Lua.blockToCode(valueBlock);
              // If it returns an array [code, order], take just the code
              valueCode = Array.isArray(generated) ? generated[0] : generated;
              // Remove trailing newline if present
              valueCode = valueCode.replace(/\n$/, '');
          }
          
          result = result.replaceAll(`[[${inp.name}]]`, valueCode);
      }
  });
    
  const next = block.getNextBlock();
  const nextCode = next ? Blockly.Lua.blockToCode(next) : '';
  result = result.replaceAll('[[children]]', nextCode ?? '');

  if (block.type.includes('loc_txt')) {
      let textField = block.getFieldValue('b') || '';
      
      if (!textField.trim()) {
          result = result.replace(/\{\s*"\[\[b\]\]"\s*\}/g, `{}`);
      } else {
          // Split on \n and create separate quoted strings
          const lines = textField.split('\\n');
          const quotedLines = lines.map(line => `"${line.trim().replace(/"/g, '\\"')}"`).join(', ');
          
          result = result.replace(/"\[\[b\]\]"/g, quotedLines);
      }
  }

  // Auto-indent any nested statement placeholders
  result = result
    .split('\n')
    .map(line => {
      // make sure children blocks or inner templates are indented properly
      if (line.trim().startsWith('if ') || line.trim().startsWith('for ') || line.trim().endsWith('then')) {
        // if line has then, indent the next lines until "end"
        return line;
      }
      return line;
    })
    .join('\n');

  // clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // --- merge multiple "return { ..x }" blocks if they exist ---
  {
    const returnMatches = [...result.matchAll(/return\s*\{([^}]*)\}/g)];
    if (returnMatches.length > 1) {
      const mergedContent = returnMatches
        .map(m => m[1].trim())
        .filter(Boolean)
        .join(', ');
      
      // Remove ALL return statements first
      result = result.replace(/return\s*\{[^}]*\}\n?/g, '');
      
      // Add merged return at the end, but respect existing indentation
      // Check if we're inside a function by looking for 'end,'
      if (result.includes('end,')) {
        // Insert before the closing 'end,'
        result = result.replace(/(\s+)end,/, `$1return { ${mergedContent} }\n$1end,`);
      } else if (result.includes('end\n')) {
        // Insert before 'end\n'
        result = result.replace(/(\s+)end\n/, `$1return { ${mergedContent} }\n$1end\n`);
      } else {
        // Fallback: just append at the end
        result += `\nreturn { ${mergedContent} }\n`;
      }
    }
  }

  return result;
}

Blockly.Lua.forBlock['not'] = function(block) {
    const condition = block.getInputTargetBlock('condition');
    let conditionCode = '';
    
    if (condition) {
        const generated = Blockly.Lua.blockToCode(condition);
        conditionCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `(not (${conditionCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['and'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) and (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['or'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) or (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['givex'] = function(block) {
  const varName = block.getFieldValue('var') || 'Mult';
  
  // get amount from 'amt' input
  const amtBlock = block.getInputTargetBlock('amt');
  let amt = '0';
  
  if (amtBlock) {
    const generated = Blockly.Lua.blockToCode(amtBlock);
    amt = Array.isArray(generated) ? generated[0] : generated;
    amt = amt.replace(/\n$/, '');
  }

  const varMap = {
    'Mult': 'mult',
    'Chips': 'chips',
    'XChips': 'xchips',
    'XMult': 'xmult',
    'Dollars': 'dollars'
  };
  const key = varMap[varName] || varName;

  // check if parent is a dollar_bonus block
  let parent = block.getSurroundParent();
  let insideDollarBonus = false;
  while (parent) {
    if (parent.type === 'joker_dollar_bonus') {
      insideDollarBonus = true;
      break;
    }
    parent = parent.getSurroundParent();
  }

  // next block if chained
  const nextBlock = block.getNextBlock();
  let nextCode = '';
  if (nextBlock) {
    const generated = Blockly.Lua.blockToCode(nextBlock);
    nextCode = Array.isArray(generated) ? generated[0] : generated;
  }

  if (key === 'dollars' && insideDollarBonus) {
    return `return ${amt}\n${nextCode}`;
  }

  // default (normal table return)
  if (nextCode.trim().startsWith('return {')) {
    return nextCode.replace('return {', `return { ${key} = ${amt},`);
  } else {
    return `return { ${key} = ${amt} }\n`;
  }
};

Blockly.Lua.forBlock['check_suit'] = function(block) {
  const suit = block.getFieldValue('suit');
  return [`context.other_card:is_suit('${suit}')`, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['pseudorandom'] = function(block) {
  const a = block.getFieldValue('a') || 'nil';
  const b = block.getFieldValue('b') || 'nil';
  const seed = generateRandomString(10);

  return [`psuedorandom("${seed}" .. G.GAME.round, ${a}, ${b})`, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['minus'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) - (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['add'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) + (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['multiply'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) * (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['divide'] = function(block) {
    const leftBlock = block.getInputTargetBlock('left');
    const rightBlock = block.getInputTargetBlock('right');
    
    let leftCode = '';
    let rightCode = '';
    
    if (leftBlock) {
        const generated = Blockly.Lua.blockToCode(leftBlock);
        leftCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    if (rightBlock) {
        const generated = Blockly.Lua.blockToCode(rightBlock);
        rightCode = Array.isArray(generated) ? generated[0] : generated;
    }
    
    const code = `((${leftCode}) / (${rightCode}))`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['blind_conditions'] = function(block) {
    const condition = block.getFieldValue('condition');

    switch (condition) {
        case 'entered':
            return ['context.setting_blind', Blockly.Lua.ORDER_ATOMIC];
        case 'disabled':
            return ['G.GAME.blind.disabled', Blockly.Lua.ORDER_ATOMIC];
        default:
            return ['false', Blockly.Lua.ORDER_ATOMIC];
    }
};

Blockly.Lua.forBlock['game_value'] = function(block) {
    const val = block.getFieldValue('var') || '0';
    return [val, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['compare'] = function(block) {
    const op = block.getFieldValue('OP') || '==';
    
    const aBlock = block.getInputTargetBlock('A');
    const bBlock = block.getInputTargetBlock('B');

    let aCode = aBlock ? Blockly.Lua.blockToCode(aBlock) : ['0', Blockly.Lua.ORDER_ATOMIC];
    let bCode = bBlock ? Blockly.Lua.blockToCode(bBlock) : ['0', Blockly.Lua.ORDER_ATOMIC];
    
    if (Array.isArray(aCode)) aCode = aCode[0];
    if (Array.isArray(bCode)) bCode = bCode[0];
    
    const code = `(${aCode} ${op} ${bCode})`;
    return [code, Blockly.Lua.ORDER_ATOMIC];
};

Blockly.Lua.forBlock['text_value'] = function(block) {
  let val = block.getFieldValue('val') || '';

  // auto-handle quotes & literals
  if (/^\d+(\.\d+)?$/.test(val)) {
    // number
    return [val, Blockly.Lua.ORDER_ATOMIC];
  } else if (['true', 'false', 'nil'].includes(val)) {
    // literal
    return [val, Blockly.Lua.ORDER_ATOMIC];
  } else if (val.trim() === '') {
    // empty – treat as nil
    return ['nil', Blockly.Lua.ORDER_ATOMIC];
  } else {
    // otherwise, treat as string or variable
    // if it looks like G.GAME.something, don't quote
    if (/^[A-Za-z0-9_.]+$/.test(val)) {
      return [val, Blockly.Lua.ORDER_ATOMIC];
    }
    
    // Remove any quotes that match the outer quote we'll use
    // Use double quotes as outer, so remove any unmatched double quotes
    let cleaned = val.replace(/"/g, '');
    
    // But keep single/backticks if they exist (nested quotes)
    // e.g., "'Hello'" stays as "'Hello'"
    if (val.includes("'") || val.includes('`')) {
      cleaned = val; // Keep original if it has different quote types
    }
    
    // else, just return the raw input
    return [`${cleaned}`, Blockly.Lua.ORDER_ATOMIC];
  }
};

Blockly.Lua.forBlock['joker_conditions'] = function(block) {
    const condition = block.getFieldValue('condition');

    switch (condition) {
        case "joker's turn":
            return ['context.joker_main', Blockly.Lua.ORDER_ATOMIC];
        case "card trigger":
            return ['context.repetition and context.cardarea == G.hand and (next(context.card_effects[1]) or #context.card_effects > 1)', Blockly.Lua.ORDER_ATOMIC];
        case "after scoring":
            return ['context.after and context.cardarea == G.play', Blockly.Lua.ORDER_ATOMIC];           
        default:
            return ['false', Blockly.Lua.ORDER_ATOMIC];
    }
};

Blockly.Lua.forBlock['card_conditions'] = function(block) {
    const condition = block.getFieldValue('condition');

    switch (condition) {
        case "selling self":
          return ['context.selling_self', Blockly.Lua.ORDER_ATOMIC];      
           
        default:
          return ['false', Blockly.Lua.ORDER_ATOMIC];
    }
}

Blockly.Lua.forBlock['game_conditions'] = function(block) {
    const condition = block.getFieldValue('condition');

    switch (condition) {
        case "run was won":
            return ['G.GAME.won', Blockly.Lua.ORDER_ATOMIC];
        case "card trigger":
            return ['context.repetition and context.cardarea == G.hand and (next(context.card_effects[1]) or #context.card_effects > 1)', Blockly.Lua.ORDER_ATOMIC];
        case 'card sold':
            return ['context.selling_card', Blockly.Lua.ORDER_ATOMIC];   
        case 'card score':
            return ['context.individual and context.cardarea == G.play', Blockly.Lua.ORDER_ATOMIC]; 
        case 'ready repeat':
            return ['context.repetition and context.cardarea == G.play', Blockly.Lua.ORDER_ATOMIC];                                    
        default:
            return [condition, Blockly.Lua.ORDER_ATOMIC];
    }
};

Blockly.Lua.forBlock['change'] = function(block) {
    const type = block.getFieldValue('t');
    const value = block.getFieldValue('v');
    
    // Map dropdown to Lua functions
    const functionMap = {
        "Ante": "ease_ante",
        "Dollars": "ease_dollars",
        "Temp. Discards": "ease_discards",
        "Temp. Hands": "ease_hands",
        "Hand Size": "G.hand:change_size",
        "Hands": "",
        "Discards": ""
    };
    
    const func = functionMap[type] || "--";
    
    if (type == "Hands") {
        return `G.GAME.round_resets.hands = G.GAME.round_resets.hands + (${value})\n`;
    } else if (type == "Discards") {
        return `G.GAME.round_resets.discards = G.GAME.round_resets.discards + (${value})\n`;
    } else {
        return `${func}(${value})\n`;
    }
    
};

Blockly.Lua.forBlock['copy_consumeable'] = function(block) {
    const idx = block.getInputTargetBlock('idx');
    let idxCode = null;
    
    if (idx) {
        const generated = Blockly.Lua.blockToCode(idx);
        idxCode = Array.isArray(generated) ? generated[0] : generated;
        idxCode = idxCode.replace(/\n$/, '');
    }
    
    let edition = block.getFieldValue('edition') || 'None';
    const seed = generateRandomString(10);
    
    let editionLine = '';
    if (edition && edition !== 'None') {
        editionLine = `copied_card:set_edition("e_${edition}", true)\n            `;
    }
    
    let cardToObtainLine = '';
    if (idxCode && idxCode !== 'random') {
        cardToObtainLine = `local card_to_copy = G.consumeables.cards[${idxCode}]`;
    } else {
        cardToObtainLine = `local card_to_copy = pseudorandom_element(G.consumeables.cards, pseudoseed('copy_${seed}'))`;
    }
    
    const code = `if G.consumeables.cards[1] then
    G.E_MANAGER:add_event(Event({
        func = function()
            ${cardToObtainLine}
            local copied_card = copy_card(card_to_copy)
            ${editionLine}copied_card:add_to_deck()
            G.consumeables:emplace(copied_card)
            return true
        end
    }))
end\n`;
    
    return code;
};

Blockly.Lua.forBlock['exact_hand_type'] = function(block) {
    const condition = block.getFieldValue('condition');
    
    if (condition == "Most Played Hand") {
        return `(function()
    local current_played = G.GAME.hands[context.scoring_name].played or 0
    for handname, values in pairs(G.GAME.hands) do
        if handname ~= context.scoring_name and values.played > current_played and values.visible then
            return false
        end
    end
    return true
end)()`;
    } else if (condition == "Least Played Hand") {
        return `(function()
    local current_played = G.GAME.hands[context.scoring_name].played or 0
    for handname, values in pairs(G.GAME.hands) do
        if handname ~= context.scoring_name and values.played < current_played and values.visible then
            return false
        end
    end
    return true
end)()`;
    } else {
        return `context.scoring_name == ${condition}`
    }
    
};

Blockly.Lua.forBlock['contain_hand_type'] = function(block) {
    const condition = block.getFieldValue('condition');
    
    if (condition == "Most Played Hand") {
        return `(function()
    local current_played = G.GAME.hands[context.scoring_name].played or 0
    for handname, values in pairs(G.GAME.hands) do
        if handname ~= context.scoring_name and values.played > current_played and values.visible then
            return false
        end
    end
    return true
end)()`;
    } else if (condition == "Least Played Hand") {
        return `(function()
    local current_played = G.GAME.hands[context.scoring_name].played or 0
    for handname, values in pairs(G.GAME.hands) do
        if handname ~= context.scoring_name and values.played < current_played and values.visible then
            return false
        end
    end
    return true
end)()`;
    } else {
        return `context.scoring_name == ${condition}`
    }
    
};

Blockly.Lua.forBlock['calc'] = function(block) {
  let body = Blockly.Lua.statementToCode(block, 'body');
  body = indentLua(body, 1); 

  let parent = block.getSurroundParent();
  let insideBlind = false;

  while (parent) {
    if (parent.type === 'blind') {
      insideBlind = true;
      break;
    }
    parent = parent.getSurroundParent();
  }

  if (insideBlind) {
    return `    calculate = function(self, blind, context)\n${body}\n    end,\n`;
  } else {
    return `    calculate = function(self, card, context)\n${body}\n    end,\n`;
  }
};


Blockly.Lua.forBlock['boss_type'] = function(block) {
    const type = block.getFieldValue('type');
    const min = block.getFieldValue('min');

    if (type === 'Showdown') {
        return '    boss = { showdown = true },\n';
    } else if (type === 'Boss Blind' && min !== 'None') {
        return `    boss = { min = ${min} },\n`;
    } else {
        return '    boss = {},\n'; // fallback if neither
    }
};

Blockly.Lua['repeat_block'] = function(block) {
  const start = Blockly.Lua.valueToCode(block, 'START', Blockly.Lua.ORDER_NONE) || '1';
  const end = Blockly.Lua.valueToCode(block, 'END', Blockly.Lua.ORDER_NONE) || '10';
  const branch = Blockly.Lua.statementToCode(block, 'DO');
  
  let code = `for i = ${start}, ${end} do\n${branch}end\n`;
  return code;
};

Blockly.Lua.forBlock['change_sfreq'] = function(block) {
    const req = block.getFieldValue('a') || '4';
    const rawId = (block.getFieldValue('id') || 'four_fingers').trim();
    const prefix = (Blockly.Lua && Blockly.Lua.modPrefix) ? String(Blockly.Lua.modPrefix) : '';
    
    let fullId = rawId;
    if (!/^j_/.test(rawId)) {
        fullId = prefix ? `j_${prefix}_${rawId}` : `j_${rawId}`;
    }

    const code =
`_smods_four_fingers_ref = SMODS.four_fingers
SMODS.four_fingers = function(hand_type)
    if next(SMODS.find_card('${fullId}')) then
        return ${req}
    end
    return _smods_four_fingers_ref(hand_type)
end
`;

    // Instead of returning, collect it for the end
    Blockly.Lua.hooks.push(code);

    // Return nothing here (we append later)
    return '';
};


BLOCK_DEFS.forEach(def => {
    if (def.lua) {
        Blockly.Lua.forBlock[def.type] = function (block) {
            return genLuaFromTemplate(def.lua, block);
        };
    }
});
