export const sportKeyboard = () => ({ inline_keyboard: [
  [{ text: '⚽ Calcio', callback_data: 'sport:calcio' }, { text: '🎾 Tennis', callback_data: 'sport:tennis' }],
  [{ text: '🏎 Formula 1', callback_data: 'sport:f1' }, { text: '🏍 MotoGP', callback_data: 'sport:motogp' }],
  [{ text: '🏀 Basket', callback_data: 'sport:basket' }, { text: '🏐 Volley', callback_data: 'sport:volley' }],
  [{ text: '🐎 Equitazione', callback_data: 'sport:equitazione' }],
  [{ text: '📅 Domani', callback_data: 'day:tomorrow' }, { text: '🔄 Aggiorna', callback_data: 'day:today' }]
] });

export const footballKeyboard = () => ({ inline_keyboard: [
  [{ text: '🏆 Serie A', callback_data: 'football:serie-a' }],
  [{ text: '🥈 Serie B', callback_data: 'football:serie-b' }],
  [{ text: '🥉 Serie C', callback_data: 'football:serie-c' }],
  [{ text: '⬅️ Sport', callback_data: 'menu:sports' }]
] });

export const backKeyboard = () => ({ inline_keyboard: [
  [{ text: '⬅️ Sport', callback_data: 'menu:sports' }, { text: '📅 Domani', callback_data: 'day:tomorrow' }]
] });
