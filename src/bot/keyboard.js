export const sportKeyboard = (day = 'today') => ({ inline_keyboard: [
  [{ text: '⚽ Calcio', callback_data: `sport:calcio:${day}` }, { text: '🎾 Tennis', callback_data: `sport:tennis:${day}` }],
  [{ text: '🏎 Formula 1', callback_data: `sport:f1:${day}` }, { text: '🏍 MotoGP', callback_data: `sport:motogp:${day}` }],
  [{ text: '🏀 Basket', callback_data: `sport:basket:${day}` }, { text: '🏐 Volley', callback_data: `sport:volley:${day}` }],
  [{ text: '🐎 Equitazione', callback_data: `sport:equitazione:${day}` }],
  [{ text: '📅 Domani', callback_data: 'day:tomorrow' }, { text: '🔄 Aggiorna', callback_data: 'day:today' }]
] });

export const footballKeyboard = (day = 'today') => ({ inline_keyboard: [  
  [{ text: '⬅️ Sport', callback_data: `menu:sports:${day}` }]
] });

export const backKeyboard = (day = 'today') => ({ inline_keyboard: [
  [{ text: '⬅️ Sport', callback_data: `menu:sports:${day}` }, { text: '📅 Domani', callback_data: 'day:tomorrow' }]
] });
