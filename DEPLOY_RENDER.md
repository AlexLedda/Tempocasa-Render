# Deploy Vision3D su Render

## Prerequisiti

1. Account Render (https://render.com)
2. Repository GitHub con il codice
3. MongoDB Atlas account (per database production)

## Setup MongoDB Atlas

1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito
3. Crea un database user
4. Aggiungi IP 0.0.0.0/0 alla whitelist (per Render)
5. Copia la connection string (es: mongodb+srv://user:password@cluster.mongodb.net/)

## Deploy Backend su Render

### Opzione 1: Usando render.yaml (Raccomandato)

1. Vai su Render Dashboard
2. Clicca "New" → "Blueprint"
3. Connetti repository GitHub
4. Render rileverà automaticamente il file `render.yaml`
5. Configura le variabili d'ambiente:
   - `MONGO_URL`: la tua MongoDB Atlas connection string
   - `CORS_ORIGINS`: URL del frontend (es: https://vision3d-frontend.onrender.com)
   - `OPENAI_API_KEY`: La tua chiave OpenAI (o EMERGENT_LLM_KEY)
   - `ANTHROPIC_API_KEY`: La tua chiave Anthropic (o EMERGENT_LLM_KEY)
   - `CLOUDINARY_CLOUD_NAME`: dywaykio8
   - `CLOUDINARY_API_KEY`: 936424415516613
   - `CLOUDINARY_API_SECRET`: 0cJj36XbwhjwSJ8fuOoYv1arQfA
6. Clicca "Apply"

### Opzione 2: Deploy Manuale

#### Backend:

1. Vai su Render Dashboard
2. Clicca "New" → "Web Service"
3. Connetti repository GitHub
4. Configura:
   - **Name**: vision3d-backend
   - **Region**: Frankfurt (o la più vicina)
   - **Root Directory**: backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Aggiungi variabili d'ambiente (vedi sopra)
6. Clicca "Create Web Service"

#### Frontend:

1. Clicca "New" → "Web Service"
2. Connetti stesso repository GitHub
3. Configura:
   - **Name**: vision3d-frontend
   - **Region**: Frankfurt
   - **Root Directory**: frontend
   - **Environment**: Node
   - **Build Command**: `yarn install && yarn build`
   - **Start Command**: `npx serve -s build -p $PORT`
4. Aggiungi variabile d'ambiente:
   - `REACT_APP_BACKEND_URL`: URL del backend (es: https://vision3d-backend.onrender.com)
5. Clicca "Create Web Service"

## Note Importanti

### Free Tier Limitations:
- I servizi gratuiti su Render vanno in "sleep" dopo 15 minuti di inattività
- Il primo caricamento può richiedere 30-60 secondi
- Per evitare questo, considera il piano paid ($7/mese per servizio)

### CORS Configuration:
- Assicurati che `CORS_ORIGINS` nel backend includa l'URL del frontend
- Formato: `https://vision3d-frontend.onrender.com`

### MongoDB Connection:
- Usa MongoDB Atlas per production (free tier disponibile)
- Non usare MongoDB locale

### Variabili d'Ambiente Critiche:
```
Backend:
- MONGO_URL
- DB_NAME=vision3d_production
- CORS_ORIGINS
- OPENAI_API_KEY (o EMERGENT_LLM_KEY per GPT)
- ANTHROPIC_API_KEY (o EMERGENT_LLM_KEY per Claude)
- CLOUDINARY_CLOUD_NAME=dywaykio8
- CLOUDINARY_API_KEY=936424415516613
- CLOUDINARY_API_SECRET=0cJj36XbwhjwSJ8fuOoYv1arQfA

Frontend:
- REACT_APP_BACKEND_URL
```

## Verifica Deploy

1. Aspetta che entrambi i servizi siano "Live" (può richiedere 5-10 minuti)
2. Visita l'URL del frontend
3. Testa:
   - Homepage caricamento
   - Upload file
   - Chat AI
   - Conversione 3D

## Troubleshooting

### Backend non si avvia:
- Controlla i logs su Render
- Verifica che MONGO_URL sia corretto
- Verifica che tutte le dipendenze siano in requirements.txt

### Frontend non si connette al backend:
- Verifica REACT_APP_BACKEND_URL
- Verifica CORS_ORIGINS nel backend
- Controlla i logs del browser (F12)

### MongoDB connection failed:
- Verifica la connection string
- Controlla che l'IP 0.0.0.0/0 sia nella whitelist di MongoDB Atlas
- Verifica username e password

## Costi Stimati

**Free Tier:**
- Backend: $0 (con limitazioni)
- Frontend: $0 (con limitazioni)
- MongoDB Atlas: $0 (512MB storage)

**Paid (Raccomandato per production):**
- Backend: $7/mese
- Frontend: $7/mese
- MongoDB Atlas: $0 (free tier sufficiente)
- **Totale**: ~$14/mese

## Prossimi Passi

1. Configura dominio personalizzato (opzionale)
2. Aggiungi SSL certificate (automatico su Render)
3. Configura monitoring e alerts
4. Setup backup MongoDB
