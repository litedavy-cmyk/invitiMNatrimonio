# Guida alla Pubblicazione su Netlify 🚀

Questo progetto include già tutti i file di configurazione pronti per la pubblicazione diretta su **Netlify**.

---

## 📁 File di configurazione inclusi

1. **`netlify.toml`**: Configurazione del build (`npm run build`), della cartella di output (`dist`) e delle funzioni serverless (`netlify/functions`).
2. **`netlify/functions/api.ts`**: Funzione serverless per gestire tutte le chiamate API backend (RSVP, lista invitati, area riservata sposi).
3. **`public/_redirects`**: Regola di fallback per il Single Page Application (SPA).

---

## 🛠️ Come pubblicare su Netlify (in 3 passaggi)

### Opzione A: Tramite GitHub / Git (Consigliata)
1. Carica il codice del progetto sul tuo account **GitHub**, **GitLab** o **Bitbucket**.
2. Accedi a [Netlify](https://www.netlify.com/) e clicca su **"Add new site" > "Import an existing project"**.
3. Seleziona il tuo repository. Netlify leggerà in automatico il file `netlify.toml` impostando:
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Clicca su **"Deploy site"**.

---

### Opzione B: Tramite Netlify CLI
1. Installa la CLI di Netlify:
   ```bash
   npm install -g netlify-cli
   ```
2. Effettua il login e pubblica:
   ```bash
   netlify login
   netlify deploy --build --prod
   ```

---

## 🔑 Variabili d'ambiente su Netlify (Opzionale)
Se desideri personalizzare la password dell'area riservata anche su Netlify:
- Vai su Netlify: **Site settings > Environment variables**
- Aggiungi la variabile: `ADMIN_PASSWORD` = `sposi2026` (o la password desiderata).
