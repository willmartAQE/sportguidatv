# Sport Guida TV

MVP di un bot Telegram che mostra gli eventi sportivi live in programmazione su Sky.

## Sport

Calcio Serie A/B/C, tennis, Formula 1, MotoGP, basket e volley.

## Deploy

1. Collega questa repository a Netlify.
2. Imposta `TELEGRAM_BOT_TOKEN` nelle variabili ambiente.
3. Deploya il progetto.
4. Configura il webhook Telegram verso `/.netlify/functions/telegram-webhook`.

Il token non deve mai essere inserito nel repository.
