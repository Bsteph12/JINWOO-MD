const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables globales pour stocker les codes et sessions
let currentPairingCode = null;
let pairingRequests = new Map(); // Map pour stocker les demandes de pairing par numéro
let activeSessions = new Map(); // Map pour stocker les sessions actives

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route pour servir la page principale
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WhatsApp Bot - Générateur de Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            .phone-input {
                width: 100%;
                padding: 15px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                margin: 15px 0;
                box-sizing: border-box;
            }
            .generate-btn {
                background: #25D366;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin: 10px 0;
            }
            .generate-btn:hover {
                background: #1eb853;
            }
            .generate-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .code-display {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #2196F3;
            }
            .code-text {
                font-size: 24px;
                font-weight: bold;
                color: #1976D2;
                margin: 10px 0;
                letter-spacing: 2px;
            }
            .instructions {
                background: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }
            .status {
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .warning { background: #fff3cd; color: #856404; }
            .loading { background: #d1ecf1; color: #0c5460; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🤖 WhatsApp Bot - Générateur de Code</h2>
            
            <input type="text" 
                   class="phone-input" 
                   id="phoneNumber" 
                   placeholder="Votre numéro WhatsApp (ex: 237698711207)"
                   pattern="[0-9]+"
                   maxlength="15">
            
            <button class="generate-btn" onclick="generateCode()">
                Générer le code de pairing
            </button>
            
            <div id="status"></div>
            
            <div id="codeDisplay" style="display: none;">
                <div class="code-display">
                    <h3>Code de pairing généré !</h3>
                    <div class="code-text" id="pairingCode">----</div>
                </div>
                
                <div class="instructions">
                    <h4>Instructions :</h4>
                    <ol style="text-align: left;">
                        <li>Ouvrez WhatsApp sur votre téléphone</li>
                        <li>Allez dans <strong>Paramètres > Appareils liés</strong></li>
                        <li>Appuyez sur <strong>Lier un appareil</strong></li>
                        <li>Entrez le code : <strong id="codeInstructions">----</strong></li>
                        <li>Attendez la confirmation...</li>
                    </ol>
                </div>
            </div>
            
            <div id="downloadSection" style="display: none;">
                <div class="status success">
                    ✅ Connexion réussie ! Téléchargez votre fichier de session.
                </div>
                <button class="generate-btn" onclick="downloadCreds()">
                    📥 Télécharger creds.json
                </button>
            </div>
        </div>

        <script>
            let pollInterval;
            
            async function generateCode() {
                const phoneNumber = document.getElementById('phoneNumber').value.trim();
                const statusDiv = document.getElementById('status');
                const codeDisplay = document.getElementById('codeDisplay');
                const downloadSection = document.getElementById('downloadSection');
                
                if (!phoneNumber) {
                    statusDiv.innerHTML = '<div class="status error">⚠️ Veuillez entrer votre numéro WhatsApp</div>';
                    return;
                }
                
                if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
                    statusDiv.innerHTML = '<div class="status error">⚠️ Format de numéro invalide (10-15 chiffres)</div>';
                    return;
                }
                
                statusDiv.innerHTML = '<div class="status loading">🔄 Génération du code en cours...</div>';
                codeDisplay.style.display = 'none';
                downloadSection.style.display = 'none';
                
                try {
                    const response = await fetch('/generate-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        document.getElementById('pairingCode').textContent = data.code;
                        document.getElementById('codeInstructions').textContent = data.code;
                        codeDisplay.style.display = 'block';
                        statusDiv.innerHTML = '<div class="status success">✅ Code généré avec succès !</div>';
                        
                        // Commencer à vérifier le statut de connexion
                        startStatusCheck(phoneNumber);
                    } else {
                        statusDiv.innerHTML = \`<div class="status error">❌ \${data.error}</div>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<div class="status error">❌ Erreur de connexion au serveur</div>';
                    console.error('Erreur:', error);
                }
            }
            
            function startStatusCheck(phoneNumber) {
                if (pollInterval) clearInterval(pollInterval);
                
                pollInterval = setInterval(async () => {
                    try {
                        const response = await fetch(\`/check-status/\${phoneNumber}\`);
                        const data = await response.json();
                        
                        if (data.connected) {
                            clearInterval(pollInterval);
                            document.getElementById('status').innerHTML = '<div class="status success">🎉 Connexion établie !</div>';
                            document.getElementById('downloadSection').style.display = 'block';
                        }
                    } catch (error) {
                        console.error('Erreur lors de la vérification:', error);
                    }
                }, 2000); // Vérifier toutes les 2 secondes
            }
            
            async function downloadCreds() {
                const phoneNumber = document.getElementById('phoneNumber').value.trim();
                try {
                    const response = await fetch(\`/download-creds/\${phoneNumber}\`);
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'creds.json';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        alert('Erreur lors du téléchargement');
                    }
                } catch (error) {
                    alert('Erreur: ' + error.message);
                }
            }
            
            // Permettre la génération avec la touche Entrée
            document.getElementById('phoneNumber').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    generateCode();
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Route pour générer un code de pairing
app.post('/generate-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !/^[0-9]{10,15}$/.test(phoneNumber)) {
      return res.json({ success: false, error: 'Numéro de téléphone invalide' });
    }

    // Nettoyer les anciennes sessions pour ce numéro
    if (pairingRequests.has(phoneNumber)) {
      const oldRequest = pairingRequests.get(phoneNumber);
      if (oldRequest.sock) {
        oldRequest.sock.end();
      }
    }

    const { version } = await fetchLatestBaileysVersion();
    
    // Créer un dossier de session temporaire pour ce numéro
    const sessionPath = path.join(__dirname, 'temp_sessions', phoneNumber);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      logger: pino({ level: 'silent' })
    });

    let pairingCode = null;
    let isConnected = false;

    // Écouter les mises à jour des credentials
    sock.ev.on('creds.update', saveCreds);

    // Écouter les mises à jour de connexion
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        console.log(`✅ Connexion établie pour ${phoneNumber}`);
        isConnected = true;
        
        // Mettre à jour le statut dans la map
        const request = pairingRequests.get(phoneNumber);
        if (request) {
          request.connected = true;
          request.sessionPath = sessionPath;
        }
      } else if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log(`📵 Connexion fermée pour ${phoneNumber}, code:`, code);
        
        if (code !== DisconnectReason.loggedOut) {
          // Tentative de reconnexion si ce n'est pas une déconnexion volontaire
          setTimeout(() => {
            console.log(`🔄 Tentative de reconnexion pour ${phoneNumber}`);
          }, 5000);
        }
      }
    });

    // Générer le code de pairing
    if (!sock.authState.creds.registered) {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        pairingCode = code.match(/.{1,4}/g).join("-");
        console.log(`🔗 Code de pairage généré pour ${phoneNumber}:`, pairingCode);
        
        // Stocker les informations de la demande
        pairingRequests.set(phoneNumber, {
          sock,
          code: pairingCode,
          timestamp: Date.now(),
          connected: false,
          sessionPath: sessionPath
        });
        
        res.json({ success: true, code: pairingCode });
      } catch (error) {
        console.error(`❌ Erreur lors de la génération du code pour ${phoneNumber}:`, error);
        res.json({ success: false, error: 'Erreur lors de la génération du code' });
      }
    } else {
      res.json({ success: false, error: 'Appareil déjà enregistré' });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    res.json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// Route pour vérifier le statut de connexion
app.get('/check-status/:phoneNumber', (req, res) => {
  const { phoneNumber } = req.params;
  const request = pairingRequests.get(phoneNumber);
  
  if (!request) {
    return res.json({ connected: false, error: 'Aucune demande trouvée' });
  }
  
  res.json({ connected: request.connected });
});

// Route pour télécharger le fichier creds.json
app.get('/download-creds/:phoneNumber', (req, res) => {
  const { phoneNumber } = req.params;
  const request = pairingRequests.get(phoneNumber);
  
  if (!request || !request.connected) {
    return res.status(404).json({ error: 'Session non trouvée ou non connectée' });
  }
  
  const credsPath = path.join(request.sessionPath, 'creds.json');
  
  if (!fs.existsSync(credsPath)) {
    return res.status(404).json({ error: 'Fichier creds.json non trouvé' });
  }
  
  res.download(credsPath, 'creds.json', (err) => {
    if (err) {
      console.error('Erreur lors du téléchargement:', err);
      res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
  });
});

// Nettoyage périodique des anciennes sessions
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [phoneNumber, request] of pairingRequests.entries()) {
    if (now - request.timestamp > maxAge && !request.connected) {
      console.log(`🧹 Nettoyage de la session expirée pour ${phoneNumber}`);
      if (request.sock) {
        request.sock.end();
      }
      pairingRequests.delete(phoneNumber);
      
      // Supprimer le dossier de session temporaire
      const sessionPath = path.join(__dirname, 'temp_sessions', phoneNumber);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    }
  }
}, 5 * 60 * 1000); // Nettoyage toutes les 5 minutes

app.listen(PORT, () => {
  console.log(`🚀 Serveur de pairing WhatsApp démarré sur le port ${PORT}`);
  console.log(`🌐 Accédez à votre service : http://localhost:${PORT}`);
});

// Gérer l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  for (const [phoneNumber, request] of pairingRequests.entries()) {
    if (request.sock) {
      request.sock.end();
    }
  }
  process.exit(0);
});
