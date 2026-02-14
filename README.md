# 🎱 Biliardo Tracker

App per tracciare partite di biliardo con statistiche avanzate.

## 🚀 Deploy su Netlify (SOLUZIONE CONSIGLIATA)

### Metodo 1: Deploy via GitHub (Automatico)

1. **Carica il progetto su GitHub:**
   - Vai su https://github.com/new
   - Crea un nuovo repository (es. "biliardo-tracker")
   - Scarica questa cartella `biliardo-app` sul tuo computer
   - Apri il terminale nella cartella e esegui:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/TUO_USERNAME/biliardo-tracker.git
     git push -u origin main
     ```

2. **Deploy su Netlify:**
   - Vai su https://app.netlify.com
   - Clicca "Add new site" → "Import an existing project"
   - Scegli "GitHub" e autorizza
   - Seleziona il repository "biliardo-tracker"
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `build`
   - Clicca "Deploy site"

Il sito sarà online in 2-3 minuti!

### Metodo 2: Deploy Manuale (Drag & Drop)

1. **Installa le dipendenze localmente:**
   ```bash
   npm install
   ```

2. **Crea il build:**
   ```bash
   npm run build
   ```

3. **Deploy su Netlify:**
   - Vai su https://app.netlify.com/drop
   - Trascina la cartella `build` nella finestra
   - Il sito sarà online immediatamente!

## 🚀 Deploy su Vercel

1. **Carica su GitHub** (come sopra)

2. **Deploy su Vercel:**
   - Vai su https://vercel.com
   - Clicca "Add New..." → "Project"
   - Importa da GitHub
   - Seleziona il repository
   - Clicca "Deploy"

Il sito sarà online automaticamente!

## 💻 Sviluppo Locale

Per testare in locale:

```bash
npm install
npm start
```

L'app si aprirà su http://localhost:3000

## ✅ Funzionalità

- ✅ Modalità Duo, Trio, Quartetto, Torneo
- ✅ Palla 9 e "Tutti contro tutti"
- ✅ Tracking giocatori e statistiche globali
- ✅ Timer di gioco in tempo reale
- ✅ Funzione Annulla
- ✅ Salvataggio statistiche (localStorage)
- ✅ Design responsive
