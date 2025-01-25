const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();
const PORT = 8080;

// Middleware pour parser le JSON
app.use(express.json());
app.use(cors());

// Connexion à la base de données MySQL
const db = mysql.createConnection({
    host: '127.0.0.1', // ou l'adresse IP du serveur
    user: 'Axb521@', // votre nom d'utilisateur MySQL
    password: '?j]D3J8^8PvtSS,', // votre mot de passe MySQL
    database: 'projethiver', // votre base de données
});

// Vérifier si la connexion à la base de données est réussie
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à MySQL');
});

// Route pour gérer la connexion
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Rechercher l'utilisateur dans la base de données
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            const user = results[0];

            // Vérifier le mot de passe avec bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            res.status(200).json({ message: 'Connexion réussie' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Route d'inscription
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Nom d\'utilisateur déjà pris' });
            }

            // Hacher le mot de passe avant de le stocker
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insérer l'utilisateur dans la base de données
            db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                }

                res.status(201).json({ message: 'Utilisateur créé avec succès' });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
