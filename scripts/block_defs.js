function GameObjectBlocks() {
    return [
        {
            type: 'blind_object',
            title: 'Blind',
            category: 'Game Objects',
            color: '#a55b80',
            lua: 'SMODS.Blind{[[body]]}\n',
            fields: [],
            statementInput: 'body',
            tooltip: 'Creates a Blind Game Object.',
            bodyCheck: ['blind_function']
        },
        {
            type: 'sound_object',
            title: 'Sound',
            category: 'Game Objects',
            color: '#a55b80',
            lua: 'SMODS.Sound{[[body]]}\n',
            fields: [],
            statementInput: 'body',
            tooltip: 'Creates a Sound Game Object.',
            bodyCheck: ['joker_function']
        },
        {
            type: 'atlas_object',
            title: 'Atlas',
            category: 'Game Objects',
            color: '#a55b80',
            lua: 'SMODS.Atlas{[[body]]}\n',
            fields: [],
            statementInput: 'body',
            tooltip: 'Creates an Atlas Game Object.'
        },
        {
            type: 'joker_object',
            title: 'Joker',
            category: 'Game Objects',
            color: '#a55b80',
            lua: 'SMODS.Joker{[[body]]}\n',
            fields: [],
            statementInput: 'body',
            tooltip: 'Creates a Joker Game Object.'
        },        
    ];
}

function ConditionBlocks() {
    return [
        {
            type: 'blind_conditions',
            title: 'Blind condition',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'Blind-related conditions',
            fields: [
                { 
                    name: 'condition', 
                    label: 'is', 
                    type: 'dropdown', 
                    options: [
                        ['Just entered', 'entered'],
                        ['Disabled', 'disabled'],
                    ]
                }
            ]
        },
        {
            type: 'joker_conditions',
            title: 'Joker condition',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'Joker-related conditions',
            fields: [
                { 
                    name: 'condition', 
                    label: 'is', 
                    type: 'dropdown', 
                    options: [
                        ['Joker\'s turn', 'joker\'s turn'],
                        ['Before Joker\'s turn', 'before joker\'s turn'],
                        ['After Joker\'s turn', 'after joker\'s turn'],
                    ]
                }
            ]
        },          
        {
            type: 'card_conditions',
            title: 'Card condition',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'Card-related (Jokers, Spectrals, Tarots, etc.) conditions',
            fields: [
                { 
                    name: 'condition', 
                    label: 'is', 
                    type: 'dropdown', 
                    options: [
                        ['Selling self', 'selling self'],
                        ['Buying a card','buying a card'],
                    ]
                }
            ]
        },                   
        {
            type: 'game_conditions',
            title: 'Game condition',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'General/Game conditions, `Not Blueprint` is used if you don\'t want Blueprint/Brainstorm to copy that area of code.',
            fields: [
                { 
                    name: 'condition', 
                    label: 'is', 
                    type: 'dropdown', 
                    options: [
                        ['Run was won.', 'run was won'],
                        ['Card held in hand was triggered','card trigger'],
                        ['After scoring','after scoring'],
                        ['A card was sold','card sold'],
                        ['A card is scoring','card score'],   
                        ['Is Game Over','context.game_over == true'],
                        ['Round End','context.end_of_round'],
                        ['Shop exited','shop exited'],
                        ['Shop rerolled','shop rerolled'],
                        ['Before total score', 'before total score'],
                        ['Before scoring', 'before scoring'],
                        ['After scoring', 'after scoring'],
                        ['First hand drawn','first hand drawn'],
                        ['Skipping blind','skipping blind'],
                    ]
                }
            ]
        },      
        {
            type: 'context_check',
            title: 'Context',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            lua: '[[condition]]',
            fields: [
                { 
                    name: 'condition', 
                    label: 'is', 
                    type: 'dropdown', 
                    options: [
                        ['Playing Card Repetition','context.repetition and context.cardarea == G.play'],
                        ['Modifying Chances','context.mod_probability'],
                        ['Not Blueprint','not context.blueprint'],  
                        ['Pre-Discard','context.pre_discard'],
                        ['Discard','context.discard'],
                        ['Card Area = Jokers','context.cardarea == G.jokers'],
                        ['Card Area = Play','context.cardarea == G.play'],
                        ['Card Area = Hand','context.cardarea == G.hand'],
                        ['Affecting a Playing Card','context.individual'],
                        ['Skipping Booster Pack','context.skipping_booster'],
                        ['Using Consumable','context.using_consumeable'],
                    ]
                }
            ],
            tooltip: 'Check for various context checks.'
        },       
        {
            type: 'cards_stuff',
            title: 'Context',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Object',
        },                        
        {
            type: 'contain_hand_type',
            title: 'Hand Type',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'Checks if played hand contains a specific poker hand',
            fields: [
                { name: 'condition', label: 'contains', type: 'dropdown', options: ["High Card","Flush","Flush Five","Full House","Pair","Three of a Kind","Four of a Kind","Straight","Straight Flush","Two Pair","Five of a Kind","Flush House","Most Played Hand","Least Played Hand"] },
            ]
        }, 
        {
            type: 'exact_hand_type',
            title: 'Played Poker Hand',
            category: 'Conditions',
            color: '#725cb8',
            output: 'Boolean',
            tooltip: 'Checks if the type of played poker hand is a poker hand',
            fields: [
                { name: 'condition', label: 'is', type: 'dropdown', options: ["High Card","Flush","Flush Five","Full House","Pair","Three of a Kind","Four of a Kind","Straight","Straight Flush","Two Pair","Five of a Kind","Flush House","Most Played Hand","Least Played Hand"] },
            ]
        },
        {
            type: 'card_issuit',
            title: 'is suit',
            category: 'Conditions',
            color: '#725cb8',
            lua: '[[card]]:is_suit([[suit]])',
            output: 'Boolean',
            tooltip: 'Whether or not `card` is `suit` (`card` is the left input socket, `suit` is on the right)',
        },  
        {
            type: 'card_isrank',
            title: 'is rank',
            category: 'Conditions',
            color: '#725cb8',
            lua: '[[card]]:get_id() == [[rank]]',
            output: 'Boolean',
            tooltip: 'Whether or not `card` is `rank` (`card` is the left input socket, `rank` is on the right)',
        }, 
        {
            type: 'card_hasnorank',
            title: 'has no rank',
            category: 'Conditions',
            color: '#725cb8',
            lua: 'SMODS.has_no_rank([[card]])',
            output: 'Boolean',
            tooltip: 'Whether or not a card has NO rank'
        }, 
        {
            type: 'card_isdebuffed',
            title: 'is debuffed?',
            category: 'Conditions',
            color: '#725cb8',
            lua: '[[card]].debuffed',
            output: 'Boolean',
            tooltip: 'Whether or not a card is debuffed.'
        },                                     
        {
            // most properties changed in blocks.js
            type: 'in_blind',
            title: 'In [] Blind',
            category: 'Conditions',
        },                                     
    ]
}

function LogicBlocks() {
    return [
        {
            type: 'text_value',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'String',
            tooltip: 'Outputs whatever text you type.',
            fields: [
                { name: 'val', label: '', type: 'text', default: '     ' }
            ]
        },        
                   
        {
            type: 'not',
            title: 'not',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Boolean',
            valueInputs: [
                { name: 'condition', label: '', check: 'Boolean' }
            ],
            tooltip: 'Negates a condition'
        },
        {
            type: 'and',
            title: '',
            inlineInputs: true,
            category: 'Logic',
            color: '#5cb85c',
            output: 'Boolean',
            valueInputs: [
                { name: 'left', label: '', check: 'Boolean' },
                { name: 'right', label: 'and', check: 'Boolean' }
            ],
            tooltip: 'Both conditions must be true'
        },
        {
            type: 'compare',
            title: 'Comparison',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Number',
            tooltip: 'Compares two values (A == B).'
        },         
        {
            type: 'minus',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Number',
            valueInputs: [
                { name: 'left', label: '' },
                { name: 'right', label: '-' }
            ],
            tooltip: 'Returns `A - B` (A being left value, B being right value)'
        },      
        {
            type: 'add',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Number',
            valueInputs: [
                { name: 'left', label: '' },
                { name: 'right', label: '+' }
            ],
            tooltip: 'Returns `A + B` (A being left value, B being right value)'
        },    
        {
            type: 'multiply',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Number',
            valueInputs: [
                { name: 'left', label: '' },
                { name: 'right', label: '*' }
            ],
            tooltip: 'Returns `A * B` (A being left value, B being right value)'
        }, 
        {
            type: 'divide',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Number',
            valueInputs: [
                { name: 'left', label: '' },
                { name: 'right', label: '/' }
            ],
            tooltip: 'Returns `A / B` (A being left value, B being right value)'
        },                         
        {
            type: 'or',
            title: '',
            category: 'Logic',
            color: '#5cb85c',
            output: 'Boolean',
            valueInputs: [
                { name: 'left', label: '', check: 'Boolean' },
                { name: 'right', label: 'or', check: 'Boolean' }
            ],
            tooltip: 'At least one condition must be true'
        },     
        {
            type: 'game_value',
            title: 'Game Value',
            category: 'Logic',
            color: '#4079aa',
            output: 'String',
            tooltip: 'Gets various game state values.',
            fields: [
                { 
                    name: 'var', 
                    label: '', 
                    type: 'dropdown', 
                    options: [
                        ['Round', 'G.GAME.round'],
                        ['Money', 'G.GAME.dollars'],
                        ['Current Chips','hand_chips'],
                        ['Current Mult','mult'],
                        ['Unused Discards','G.GAME.unused_discards'],
                        ['Discards Left','G.GAME.current_round.discards_left'],
                        ['Hands Left','G.GAME.current_round.hands_left'],
                        ['(Amount of) Cards in Play','#G.play.cards'],
                        ['(Amount of) Cards in Hand','#G.hand.cards'],
                        ['Empty Joker Slots','(G.jokers.config.card_limit - #G.jokers.cards)'],
                        ['Maximum Bankruptcy','G.GAME.bankrupt_at'],
                        ['Chance Numerator','context.numerator'],
                        ['Chance Denominator','context.denominator'],
                    ]
                }
            ]
        },
        {
            type: 'joker_amt',
            title: 'Amount',
            category: 'Logic',
            color: '#4079aa',
            output: 'Number',
            lua: '#SMODS.find_card("[[a]]", true)'
        },   
        {
            type: 'base_id',
            title: 'Base ID of',
            category: 'Logic',
            color: '#4079aa',
            lua: '[[card]].base.id',
            output: 'String',
            tooltip: 'Returns .base.id of a card',
            valueInputs: [
                { name: 'card', label: '', check: null }
            ],
        },      
        {
            type: 'localize',
            title: 'localize',
            category: 'General',
            color: '#4079aa',
            lua: 'localize("[[input]]")',
            output: 'String'
        },         
        {
            type: 'base_nominal',
            title: 'Base Nominal of',
            category: 'Logic',
            color: '#4079aa',
            lua: '[[card]].base.nominal',
            output: 'String',
            tooltip: 'Returns .base.nominal of a card',
            valueInputs: [
                { name: 'card', label: '', check: null }
            ],
        },              
        {
            type: 'card_amt',
            title: 'Amount',
            category: 'Logic',
            color: '#4079aa',
            output: 'Number',
        },        
        {
            type: 'modulo',
            title: 'modulo',
            category: 'Logic',
            color: '#4079aa',
            output: 'Number',
        },                  
        {
            // most properties are in blocks.js
            type: 'pseudorandom',
            category: 'Logic',
            color: '#4079aa',
        },        
        {
            type: 'rand_suit',
            title: 'Random Suit',
            category: 'Logic',
            color: '#4079aa',
            output: 'Suit',
            lua: `(function()
    if G.playing_cards then
        local valid_suitvar_cards = {}
        for _, v in ipairs(G.playing_cards) do
            if not SMODS.has_no_suit(v) then
                valid_suitvar_cards[#valid_suitvar_cards + 1] = v
            end
        end
        if valid_suitvar_cards[1] then
            local suitvar_card = pseudorandom_element(valid_suitvar_cards, pseudoseed('suitvar' .. G.GAME.round_resets.ante))
            return suitvar_card
        end
    end
end)()`,
            tooltip: 'Returns a valid random suit (Valid means in your deck)'
        },      
        {
            type: 'rand_rank',
            title: 'Random Rank',
            category: 'Logic',
            color: '#4079aa',
            output: 'Rank',
            lua: `(function()
    if G.playing_cards then
        local valid_rankvar_cards = {}
        for _, v in ipairs(G.playing_cards) do
            if not SMODS.has_no_rank(v) then
                valid_rankvar_cards[#valid_rankvar_cards + 1] = v
            end
        end
        if valid_rankvar_cards[1] then
            local rankvar_card = pseudorandom_element(valid_rankvar_cards, pseudoseed('rankvar' .. G.GAME.round_resets.ante))
            return rankvar_card
        end
    end
end)()`,
            tooltip: 'Returns a valid random rank (Valid means in your deck)',
        },                  
        {
            type: 'sc_card',
            title: 'Currently scoring card',
            category: 'Logic',
            color: '#4079aa',
            output: 'Card',
            lua: 'context.other_card',
            tooltip: 'Returns the currently scoring card, usually.',
        },    
        
        {
            type: 'card_count',
            title: 'Amount of played cards',
            category: 'Logic',
            color: '#4079aa',
            lua: '#context.full_hand',
            output: 'Number',
            tooltip: 'Returns the amount of cards played.',
        },    
        {
            type: 'suit_return',
            title: '',
            category: 'Logic',
            color: '#4079aa',
            lua: '[[suit]]',
            output: 'Suit',
            tooltip: 'Returns a suit.',
            fields: [
                { name: 'suit', label: 'Suit', type: 'dropdown', options: [
                    [`Clubs`,`'Clubs'`],
                    [`Diamonds`,`'Diamonds'`],
                    [`Spades`,`'Spades'`],
                    [`Hearts`,`'Hearts'`],
                ]
            }
            ]
        },            
        {
            type: 'rank_return',
            title: '',
            category: 'Logic',
            color: '#4079aa',
            lua: '[[rank]]',
            output: 'Rank',
            tooltip: 'Returns a rank.',
            fields: [
                { name: 'rank', label: 'Rank', type: 'dropdown', options: [
                    [`10`,`'10'`],
                    [`9`,`'9'`],
                    [`8`,`'8'`],
                    [`7`,`'7'`],
                    [`6`,`'6'`],
                    [`5`,`'5'`],
                    [`4`,`'4'`],
                    [`3`,`'3'`],
                    [`2`,`'2'`],
                    [`Ace`,`'14'`],
                    [`King`,`'13'`],
                    [`Queen`,`'12'`],
                    [`Jack`,`'11'`],                                                         
                ]
            }
            ]
        },                                      
        {
            type: 'limit',
            title: 'Limit',
            category: 'Logic',
            color: '#4079aa',
            output: 'Number',
            valueInputs: [
                { name: 'val', label: 'Value', check: null },
                { name: 'lim', label: 'to', check: null }
            ],
            lua: 'math.max([[lim]], [[val]])',
            tooltip: 'Limits a value to a maximum by returning the higher of the two (math.max).'
        },      
                
         
    ]
}

function VarBlocks() {
    return [
        {
            type: 'var_get',
            title: 'get',
            category: 'Variables',
            color: '#f0ad4e',
            output: 'Number',
            tooltip: 'Returns the value of a variable.',
            fields: [
                { name: 'VAR', label: '', type: 'dropdown_dynamic', source: 'variables' }
            ]
        },
        {
            type: 'var_set',
            title: 'set',
            category: 'Variables',
            color: '#f0ad4e',
            tooltip: 'Sets a variable to a specific value.',
            fields: [
                { name: 'VAR', label: '', type: 'dropdown_dynamic', source: 'variables' }
            ],
            valueInputs: [
                { name: 'VALUE', label: 'to', check: 'Number' }
            ]
        },
        {
            type: 'var_change',
            title: 'change',
            category: 'Variables',
            color: '#f0ad4e',
            tooltip: 'Adds a value to a numeric variable.',
            fields: [
                { name: 'VAR', label: '', type: 'dropdown_dynamic', source: 'variables' }
            ],
            valueInputs: [
                { name: 'DELTA', label: 'by', check: 'Number' }
            ]
        }
    ]
}

function ControlBlocks() {
    return [
        {
            type: 'if',
            title: 'If',
            category: 'Control',
            color: '#d07046',
            lua: 'if [[condition]] then[[body]]\nend\n',
            statementInput: 'body',
            valueInputs: [
                { name: 'condition', label: '', check: 'Boolean' }
            ],
            tooltip: 'Triggers blocks if condition is met.'
        },
        {
            type: 'iterator',
            title: 'iterator',
            category: 'Control',
            color: '#d07046',
            output: 'String',
            lua: 'i',
            tooltip: 'Returns the current iterator in a (normal/adv) repeat block'
        },        
        {
            type: 'if_else',
            title: 'If',
            category: 'Control',
            color: '#d07046',
            tooltip: 'Triggers blocks if condition is met, otherwise triggers else blocks.',
            valueInputs: [
                { name: 'condition', label: '', check: 'Boolean' }
            ],
            // other stuff is handled in blocks.js
        },        
        {
            type: 'repeat',
            title: 'Repeat',
            category: 'Control',
            color: '#d07046',
            lua: 'for i=1, [[length]] do\n[[body]]\nend\n',
            statementInput: 'body',
            valueInputs: [
                { name: 'length', label: '', check: '' }
            ],
            tooltip: 'Repeats the contained blocks from 1 up to the length value, Increasing by 1 each time.'
        },
        {
            type: 'adv_repeat',
            title: 'Advanced Repeat:',
            category: 'Control',
            color: '#d07046',
            lua: 'for i=[[start]], [[end]], [[step]] do\n[[body]]\nend\n',
            statementInput: 'body',
            valueInputs: [
                { name: 'start', label: 'Start', check: '' },
                { name: 'end', label: 'End', check: '' },
                { name: 'step', label: 'Step', check: '' }
            ],
            tooltip: 'Repeats the contained blocks from the start value up to the end value, increasing by the step value each time.'
        }

    ]
}

function GeneralBlocks() {
  return [    
        {
            type: 'gen_loc_txt',
            title: 'Properties: ',
            category: 'General',
            color: '#2a8997',
            lua: 'loc_txt = { name = "[[a]]", text = {"[[b]]"} },\n',
            fields: [
                { name: 'a', label: 'Name', type: 'text' },
                { name: 'b', label: 'Text', type: 'text' }
            ],
            tooltip: 'Name and Description for a Game Object.'
        },     
        {
            type: 'calc',
            title: 'Calculate',
            category: 'General',
            color: '#537787',
            lua: 'calculate = function(self, blind, context)[[body]]end,\n',
            statementInput: 'body',
            tooltip: 'Creates a calculate function. Usually called after most actions.'
        },
        {
            type: 'change',
            title: '',
            category: 'General',
            color: '#26aa96',
            fields: [
              { name: 't', label: 'Change', type: 'dropdown', options: ["Ante", "Dollars","Temp. Discards","Temp. Hands","Hand Size","Hands","Discards"] },
              { name: 'v', label: 'by', type: 'text', default: 1 },
            ],
            tooltip: 'Changes a game variable by a specified value.'
        },       
        {
            type: 'givex',
            title: '',
            category: 'General',
            color: '#26aa96',
            fields: [
                { name: 'var', label: '', type: 'dropdown', options: ['Mult','Chips','XChips','XMult','Dollars','Message']  }
            ],            
            valueInputs: [
                { name: 'amt', label: 'Add', check: null }
            ],

            tooltip: 'Sets a value for a Game Object.',
            previousStatement: 'BlindFunction',
            nextStatement: 'BlindFunction',
        },     
        {
            type: 'create',
            title: 'Add Card',
            category: 'General',
            color: '#78944e',
            lua: 'SMODS.add_card({[[body]]\n})',
            nextStatement: 'BlindFunction',
            statementInput: 'body',
            tooltip: 'Generates a new card with the specified properties. Use Creation blocks inside to define its details.'
        },   
        {
            type: 'copy_consumeable',
            title: 'Copy Consumeable',
            category: 'General',
            color: '#599855', // doesn't change here, modification is located in blocks.js
            tooltip: 'Copies a specified indexed or random consumeable (If you have atleast 1.)' // doesn't change here, modification is located in blocks.js
        },        
        {
            // most modifications are in blocks.js
            type: 'destroy_card',
            title: 'Destroy Card(s)', 
            category: 'General',
            color: '#599855', 
            tooltip: 'Copies a specified indexed or random consumeable (If you have atleast 1.)'
        },  
        {
            type: 'disable_blind',
            title: 'Disable Boss Blind', 
            category: 'General',
            color: '#98556c', 
            tooltip: 'Disables the Boss Blind effect',
            lua: 'G.GAME.blind:disable()'
        },
        {
            type: 'atlaskey',
            title: 'Atlas',
            category: 'General',
            color: '#3f7c69',
            lua: 'atlas = "[[a]]",\n',
            fields: [
                { name: 'a', label: 'Key', type: 'text', default: 'centers' }
            ],
            tooltip: 'Sets Atlas Key for a Game Object.',
            previousStatement: 'BlindFunction',
            nextStatement: 'BlindFunction',
        },
        {
            type: 'atlaspos',
            title: 'Atlas Pos:',
            category: 'General',
            color: '#3f7c69',
            lua: 'pos = { x = [[x]], y = [[y]] },\n',
            fields: [
                { name: 'x', label: 'X', type: 'text', default: '0' },
                { name: 'y', label: 'Y', type: 'text', default: '0' }
            ],
            tooltip: 'Sets Atlas Position for a Game Object.',
            previousStatement: 'BlindFunction',
            nextStatement: 'BlindFunction',
        },   
  
        {
            type: 'play_sound',
            title: 'Play',
            category: 'Sound',
            color: '#d263de',
            lua: 'play_sound("[[s]]",[[p]],[[v]])',
            fields: [
                { name: 's', label: 'Sound', type: 'text' },
                { name: 'p', label: 'Pitch', type: 'text', default: 1 },
                { name: 'v', label: 'Volume', type: 'text', default: 1 },
            ],
            tooltip: 'Plays a sound with pitch and volume.'
        },      
        {
            type: 'change_sfreq', // sfreq = straight/flush requirement
            title: 'Change Straight/Flush Req.',
            category: 'General',
            color: '#a93db5',
            fields: [
                { name: 'a', label: 'to', type: 'text', default: '4' },
                { name: 'id', label: 'when card id', type: 'text', default: 'myJoker' }
            ],
            tooltip: 'Changes the minimum number of cards required to make Straights/Flushes when a card with the given id is present. This block can be put anywhere, it doesn\'t change anything'
        },
        {
            type: 'repeater',
            title: 'Add repetitions:',
            category: 'General',
            color: '#2e8f2e',
            tooltip: 'Add repititions to cards',
            lua: 'return {\n    repetitions = [[a]],\n}',
            fields: [
                { name: 'a', label: '', type: 'text', default: 5 }
            ]
        },   
        {
            type: 'mod_numerator',
            title: 'Set Numerators of Chances',
            category: 'General',
            color: '#5a5094',
            tooltip: 'Modify the numerators in chances, like how `Oops! All 6s` does. Numerator is the first number: >1< in 5.',
            lua: 'return {\n    numerator = [[val]]\n}',
            valueInputs: [
                { name: 'val', label: 'to', check: null }
            ]
        },    
        {
            type: 'mod_denominator',
            title: 'Set Denominator of Chances',
            category: 'General',
            color: '#5a5094',
            tooltip: 'Modify the denominator in chances. Denominator is the second number: 1 in >5<.',
            lua: 'return {\n    denominator = [[val]]\n}',
            valueInputs: [
                { name: 'val', label: 'to', check: null }
            ]
        },   
        {
            type: 'game_value_set',
            title: 'Set Game Value',
            category: 'General',
            color: '#286b9e',
            lua: '[[var]] = [[val]]',
            tooltip: 'Sets various game values.',
        },                                                               
  ];
}

function CreationBlocks() {
    return [
        {
            type: 'set',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'set = "[[a]]",\n',
            fields: [
                { name: 'a', label: 'Type', type: 'dropdown', options: [
                    'Joker', 
                    'Spectral', 
                    ['(Base/Enhanced) Playing Card','Playing Card'], 
                    ['(Base) Playing Card','Base'],
                    ['(Enhanced) Playing Card','Enhanced'],
                    'Tarot', 
                    'Planet',
                ]},
            ],
            tooltip: 'The card type to be generated.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'area',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'area = [[a]],\n',
            fields: [
                { 
                    name: 'a', 
                    label: 'Area', 
                    type: 'dropdown', 
                    options: [
                        ['Jokers', 'G.jokers'],
                        ['Consumeables', 'G.consumeables'],
                        ['Hand', 'G.hand'],
                        ['Deck', 'G.deck'],
                        ['Pack Cards', 'G.pack_cards']
                    ]
                }
            ],
            tooltip: 'The card area this will be emplaced into.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'legendary',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'legendary = [[a]],\n',
            fields: [
                { name: 'a', label: 'Legendary?', type: 'dropdown', options: ['false', 'true'], default: 'false' }
            ],
            tooltip: 'If true, generates a card of Legendary rarity.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'rarity',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'rarity = [[a]],\n',
            fields: [
                { name: 'a', label: 'Rarity Value (0-1)', type: 'text', default: '0.5' }
            ],
            tooltip: 'If specified, overrides rarity polling. Values up to 0.7=Common, 0.95=Uncommon, above=Rare.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'skip_materialize',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'skip_materialize = [[a]],\n',
            fields: [
                { name: 'a', label: 'Skip Materialize', type: 'dropdown', options: ['false', 'true'], default: 'false' }
            ],
            tooltip: 'If true, no materialize animation is shown.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'soulable',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'soulable = [[a]],\n',
            fields: [
                { name: 'a', label: 'Soulable?', type: 'dropdown', options: ['false', 'true'], default: 'false' }
            ],
            tooltip: 'If true, allows hidden Soul-type cards to replace the generated card.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        },
        {
            type: 'card_sr',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'front = G.P_CARDS["[[suit]][[rank]]"],\n',
            fields: [
                { name: 'rank', label: 'Card Rank', type: 'dropdown', options: [
                    ['Random','r'],
                    ['Ace','A'],
                    ['Jack','J'],
                    ['King','K'],
                    ['Queen','Q'],
                    ['10','1'],
                    ['9','9'],
                    ['8','8'],
                    ['7','7'],
                    ['6','6'],
                    ['5','5'],
                    ['4','4'],
                    ['3','3'],
                    ['2','2']
                ]},
                { name: 'suit', label: 'Card Suit', type: 'dropdown', options: [
                    ['Random','r'],
                    ['Hearts','H'],
                    ['Clubs','C'],
                    ['Diamonds','D'],
                    ['Spades','S'],
                ]},
            ],
            tooltip: "Define Rank and Suit of the playing card."
        },
        {
            type: 'card_en',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'enhancement = [[enhance]],\n',
            fields: [
                { name: 'enhance', label: 'Card Enhancement', type: 'dropdown', options: [
                    ['Random',`pseudorandom_element({G.P_CENTERS.m_gold, G.P_CENTERS.m_steel, G.P_CENTERS.m_glass, G.P_CENTERS.m_wild, G.P_CENTERS.m_mult, G.P_CENTERS.m_lucky, G.P_CENTERS.m_stone}, pseudoseed('add_card_enhancement'))`],
                    ['Gold','m_gold'],
                    ['Steel','m_steel'],
                    ['Glass','m_glass'],
                    ['Wild','m_wild'],
                    ['Mult','m_mult'],
                    ['Lucky','m_lucky'],
                    ['Stone','m_stone'],
                    
                ]},
            ],
            tooltip: "Define Rank and Suit of the playing card."
        },        
        {
            type: 'enhanced_poll',
            title: '',
            category: 'Creation',
            color: '#83b735',
            lua: 'enhanced_poll = [[a]],\n',
            fields: [
                { name: 'a', label: 'Enhanced Poll Chance', type: 'text', default: '0.6' }
            ],
            tooltip: 'Chance to pick Base over Enhanced (for Playing Cards). Default 0.6.',
            previousStatement: 'CreationFunction',
            nextStatement: 'CreationFunction',
        }
    ];
}


function JokerFunctionBlocks() {
  return [
        {
            type: 'joker_key',
            title: '',
            category: 'Joker',
            color: '#4495a1',
            lua: 'key = "[[key]]",\n',
            fields: [
                { name: 'key', label: 'Key', type: 'text' },
            ],
            tooltip: 'Unique key for this Joker.'
        }, 
        {
            type: 'joker_rarity',
            title: '',
            category: 'Joker',
            color: '#4495a1',
            lua: 'rarity = [[a]],\n',
            fields: [
                { name: 'a', label: 'Rarity', type: 'text', default: 1 }
            ],
            tooltip: 'Rarity for this Joker. 1 = Common, 2 = Uncommon, 3 = Rare, 4 = Legendary. For custom rarities use "modprefix_Rarity"'
        },     
        {
            type: 'joker_pos',
            title: 'My Position',
            category: 'Joker',
            color: '#40a5aa',
            output: 'String',
            tooltip: 'Gets the index of this Joker.',
            lua: `(function()
    local my_pos = nil
    for i = 1, #G.jokers.cards do
        if G.jokers.cards[i] == card then
            my_pos = i
            return my_pos
            break
        end
    end
end)()`,
        },        
        {
            type: 'joker_status',
            title: 'Status:',
            category: 'Joker',
            color: '#4495a1',
            lua: 'unlocked = [[unlocked]],\ndiscovered = [[discovered]],\n',
            fields: [
                { name: 'unlocked', label: 'Unlocked?', type: 'dropdown', options: ['true','false'] },
                { name: 'discovered', label: 'Discovered?', type: 'dropdown', options: ['true','false'] }, 
            ],
            tooltip: 'Discovered = shows in collection by default. Unlocked = must meet conditions to obtain.'
        },    
        {
            type: 'joker_cost',
            title: '',
            category: 'Joker',
            color: '#4495a1',
            lua: 'cost = [[cost]],\n',
            fields: [
                { name: 'cost', label: 'Cost $', type: 'text', default: 1}
            ],
            tooltip: 'Shop cost in $ for Joker Game Object.'
        },         
        {
            type: 'joker_compat',
            title: 'Compat:',
            category: 'Joker',
            color: '#4495a1',
            lua: 'blueprint_compat = [[compat_a]],\neternal_compat = [[compat_b]],\nperishable_compat = [[compat_c]],\n',
            fields: [
                { name: 'compat_a', label: 'Blueprint', type: 'dropdown', options: ['true','false'] },
                { name: 'compat_b', label: 'Eternal', type: 'dropdown', options: ['true','false'] },
                { name: 'compat_c', label: 'Perishable', type: 'dropdown', options: ['true','false'] },
            ],
            tooltip: 'Compatibilities for Joker Game Object. (Blueprint compatibility is also for Brainstorm)'
        },       
        {
            type: 'joker_add_to_deck',
            title: 'Add to deck',
            category: 'Joker',
            color: '#4495a1',
            lua: 'add_to_deck = function(self, card, from_debuff)[[body]]\nend,\n',
            statementInput: 'body',
            tooltip: 'Triggered when this Joker is bought or obtained.'
        }, 
        {
            type: 'joker_remove_from_deck',
            title: 'Remove from deck',
            category: 'Joker',
            color: '#4495a1',
            lua: 'remove_from_deck = function(self, card, from_debuff)[[body]]\nend,\n',
            statementInput: 'body',
            tooltip: 'Triggered when this Joker is sold or removed.'
        },        
        {
            type: 'joker_dollar_bonus',
            title: 'Dollar bonus',
            category: 'Joker',
            color: '#4da144',
            lua: 'calc_dollar_bonus = function(self, card)[[body]]end\n',
            statementInput: 'body',
            tooltip: 'Triggered during round cashout.'
        },                                                 
  ];
}


function SoundFunctionBlocks() {
  return [
        {
            type: 'soundkey',
            title: 'Register Sound:',
            category: 'Sound',
            color: '#d263de',
            lua: 'key = "[[a]]",\npath = "[[b]]",\n',
            fields: [
                { name: 'a', label: 'Key', type: 'text' },
                { name: 'b', label: 'Path', type: 'text' }
            ],
            tooltip: 'Adds a key and path to a Sound object.'
        }, 
      
  ];
}

function AtlasFunctionBlocks() {
  return [
        {
            type: 'atlas-afb',
            title: '',
            category: 'Atlas',
            color: '#a366cc',
            lua: 'key = "[[a]]",\npath = "[[b]]",\n',
            fields: [
                { name: 'a', label: 'Key', type: 'text' },
                { name: 'b', label: 'Path', type: 'text' }
            ],
            tooltip: 'Adds a key and path to an Atlas object.'
        },
        {
            type: 'atlas-frames',
            title: '',
            category: 'Atlas',
            color: '#a366cc',
            lua: 'frames = [[a]],\n',
            fields: [
                { name: 'a', label: 'Frames', type: 'text' }
            ],
            tooltip: 'Defines how many frames are in this atlas. Usually for Blind Chip Animations'
        },  
        {
            type: 'atlas-raw_key',
            title: '',
            category: 'Atlas',
            color: '#a366cc',
            lua: 'raw_key = [[a]],\n',
            fields: [
                { name: 'a', label: 'Raw Key', type: 'dropdown', options: ['true','false'] }
            ],
            tooltip: 'Set this to `true` to prevent the loader from adding your mod prefix to the `key`. Useful for replacing sprites from the base game or other mods.'
        },       
        {
            type: 'atlas-language',
            title: '',
            category: 'Atlas',
            color: '#a366cc',
            lua: 'language = [[a]],\n',
            fields: [
                { name: 'a', label: 'Language', type: 'text' }
            ],
            tooltip: 'Restrict your atlas to a specific locale. Useful for introducing localized sprites while leaving other languages intact.'
        },      
        {
            type: 'atlas-dimensions',
            title: 'Dimensions:',
            category: 'Atlas',
            color: '#a366cc',
            lua: 'px = [[x]],\npy = [[y]],\n',
            fields: [
                { name: 'x', label: 'X', type: 'text' },
                { name: 'y', label: 'Y', type: 'text' },
            ],
            tooltip: 'The width and height of each individual sprite at single resolution, in pixels.'
        },     
                    
  ];
}

function BlindFunctionBlocks() {
    return [
        {
            type: 'debuffs',
            title: 'Debuffs: ',
            category: 'Blind',
            color: '#cc6666',
            lua: 'debuff = { value = "[[a]]", suit = "[[b]]", hand = { ["[[c]]"] = true },\n',
            fields: [
                { name: 'a', label: 'Value', type: 'dropdown', options: ["None","Ace","King","Queen","Jack","10","9","8","7","6","5","4","3","2"] },
                { name: 'b', label: 'Suit', type: 'dropdown', options: ["None","Hearts","Clubs","Spades","Diamonds"] },
                { name: 'c', label: 'Hand', type: 'dropdown', options: ["None","High Card","Flush","Flush Five","Full House","Pair","Three of a Kind","Four of a Kind","Straight","Straight Flush","Two Pair","Five of a Kind","Flush House"] },
            ],
            tooltip: 'The debuffed card value & suit, and debuffed poker hand.'
        },
        {
            type: 'boss_type',
            title: '',
            category: 'Blind',
            color: '#cc6666',
            lua: 'boss = {[[boss_content]]},\n',
            fields: [
                { name: 'type', label: 'Type', type: 'dropdown', options: ['Boss Blind', 'Showdown'] },
                { name: 'min', label: 'Min Ante', type: 'dropdown', options: ['1','2','3','4','5','6','7'], default: 'None' }
            ],
            tooltip: 'Sets the Blind as a Boss or Showdown. Min Ante applies only to Boss Blinds.'
        },
        {
            type: 'keyb',
            title: '',
            category: 'Blind',
            color: '#cc6666',
            lua: 'key = "[[a]]",\nname = "[[a]]",\n',
            fields: [
                { name: 'a', label: 'Key', type: 'text' },
            ],
            tooltip: 'Sets the Blind\'s key and name',
            previousStatement: 'BlindFunction',
            nextStatement: 'BlindFunction',
        },
        {
            type: 'defeat',
            title: 'Defeat',
            category: 'Blind',
            color: '#537787',
            lua: 'defeat = function(self)\n[[body]]\nend,\n',
            statementInput: 'body',
            tooltip: 'Creates a defeat function. Called when Blind is defeated.'
        },        
        {
            type: 'disable',
            title: 'Disable',
            category: 'Blind',
            color: '#537787',
            lua: 'disable = function(self)\n[[body]]\nend,\n',
            statementInput: 'body',
            tooltip: 'Creates a defeat function. Called when Blind is disabled. From Jokers for example.'
        },        
        {
            type: 'discovered',
            title: 'Discovered',
            category: 'Blind',
            color: '#cc6666',
            lua: 'discovered = [[v]],\n',
            fields: [ { name: 'v', label: '?', type: 'dropdown', options: ['true','false'], default: 'true' } ],
            tooltip: 'Is this blind discovered by default?'
        },     
        {
            type: 'reward',
            title: 'Reward',
            category: 'Blind',
            color: '#cc6666',
            lua: 'dollars = [[v]],\n',
            fields: [ { name: 'v', label: '$', type: 'number', default: 5 } ],
            tooltip: 'Dollars earned when defeating this blind. Usually $8 for Showdowns and $5 for Boss Blinds.'
        },       
        {
            type: 'base',
            title: 'Base',
            category: 'Blind',
            color: '#cc6666',
            lua: 'mult = [[v]],\n',
            fields: [ { name: 'v', label: 'Blind Size', type: 'text', default: 2 } ],
            tooltip: 'Base Blind Size. Usually 2.'
        },            
        {
            type: 'boss_colour',
            title: 'Boss',
            category: 'Blind',
            color: '#cc6666',
            lua: 'boss_colour = HEX("[[v]]"),\n',
            fields: [ { name: 'v', label: 'Colour', type: 'text', default: 'ff0000' } ],
            tooltip: 'Hex Color Code for Boss Blind background.'
        },                               
    ];
}

function TagBlocks() {
    return [
        {
            type: 'remove_tags',
            title: 'Remove all tags',
            category: 'Tags',
            color: '#0f5a33',
            lua: 'for k, v in pairs(G.GAME.tags) do\n    v:remove()\nend',
            tooltip: 'Removes all tags.'
        }

    ]
}

// finally merge all
const BLOCK_DEFS = [
    ...GeneralBlocks(),
    ...GameObjectBlocks(),
    ...CreationBlocks(),
    ...ControlBlocks(),
    ...TagBlocks(),
    ...JokerFunctionBlocks(),
    ...LogicBlocks(),
    ...ConditionBlocks(),
    
    ...AtlasFunctionBlocks(),
    ...BlindFunctionBlocks(),
    ...SoundFunctionBlocks(),
    ...VarBlocks(),
];
