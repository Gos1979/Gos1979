const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Chemin du fichier pour stocker le nombre de visiteurs
const counterFilePath = 'visitorCount.txt';

// Lire le nombre de visiteurs depuis le fichier ou initialiser à 0
let visitorCount = 0;
if (fs.existsSync(counterFilePath)) {
  visitorCount = parseInt(fs.readFileSync(counterFilePath, 'utf8'), 10);
}

// Configuration de Multer pour conserver le nom d'origine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier de destination
    },
    filename: (req, file, cb) => {
        // Conserver le nom d'origine du fichier
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// Stockage des codes de partage et des fichiers
const fileCodeMap = {};

// Route pour uploader un fichier
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('Aucun fichier uploadé.');
    }

    // Générer un code de partage unique
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    fileCodeMap[code] = file.filename;

    // Renvoyer le code de partage
    res.send({ code });
});

// Route pour télécharger un fichier
app.get('/download/:code', (req, res) => {
    const code = req.params.code;
    const filename = fileCodeMap[code];

    if (!filename) {
        return res.status(404).send('Code invalide ou fichier non trouvé.');
    }

    const filePath = path.join(__dirname, 'uploads', filename);

    // Télécharger le fichier avec son nom d'origine
    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Erreur lors du téléchargement :', err);
            res.status(500).send('Erreur lors du téléchargement du fichier.');
        }
    });
});

// Route pour récupérer le nombre de visiteurs (API)
app.get('/api/visitors', (req, res) => {
    res.json({ visitors: visitorCount });
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
    // Incrémenter le compteur de visiteurs
    visitorCount++;

    // Sauvegarder le nouveau nombre de visiteurs dans le fichier
    fs.writeFileSync(counterFilePath, visitorCount.toString(), 'utf8');

    // Servir la page HTML
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static('public'));

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});