const CATEGORIES = ['Equitazione', 'Formula 1', 'MotoGP', 'Sky Calcio', 'Tennis', 'Basket', 'Golf', 'Sport'];

export function mainKeyboard() {
  return {
    reply_markup: {
      keyboard: CATEGORIES.map(category => [{ text: category }]),
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

export function categoryKeyboard(categories = CATEGORIES) {
  const visible = categories.filter(category => CATEGORIES.includes(category));
  return {
    reply_markup: {
      inline_keyboard: visible.map(category => [{ text: category, callback_data: `category:${category}` }])
    }
  };
}

export { CATEGORIES };
