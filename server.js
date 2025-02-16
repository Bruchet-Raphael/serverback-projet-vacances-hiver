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
    host: '127.0.0.1', // Adresse du serveur MySQL
    user: '', // Nom d'utilisateur MySQL
    password: '', // Mot de passe MySQL
    database: '', // Nom de la base de données
});

// Vérifier si la connexion à la base de données est réussie
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('✅ Connecté à MySQL');
});

// Route pour gérer la connexion
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            const user = results[0];

            // Vérifier le mot de passe
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
            }

            res.status(200).json({
                message: 'Connexion réussie',
                userId: user.id,  // Envoi de l'ID de l'utilisateur
                username: user.username
            });
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
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Nom d\'utilisateur déjà pris' });
            }

            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
            // Hacher l'id
            const hashedusername = await bcrypt.hash(username, 10);
            const id = hashedusername.replace(/\//g, '_').replace(/\+/g, '-');
            const defaultrole = 0;

            db.query('INSERT INTO users (id, username, password, Role) VALUES (?, ?, ?, ?)', [id ,username, hashedPassword, defaultrole], (err, result) => {
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

// Route pour créer un emprunt
app.post('/emprunt', async (req, res) => {
    const { id_user, materielle, date_emprunt } = req.body;

    if (!id_user || !materielle || !date_emprunt) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        db.query('INSERT INTO emprunt (id_user, materielle, date_emprunt) VALUES (?, ?, ?)', 
        [id_user, materielle, date_emprunt], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            res.status(201).json({ 
                message: 'Emprunt créé avec succès',
                emprunt: {
                    id: result.insertId,
                    id_user,
                    materielle,
                    date_emprunt
                }
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Route pour récupérer tous les emprunts d'un utilisateur
app.get('/emprunt/:id_user', async (req, res) => {
    const { id_user } = req.params;

    try {
        // Vérifier le rôle de l'utilisateur
        const [userResults] = await db.promise().query(
            'SELECT role FROM users WHERE id = ?',
            [id_user]
        );

        if (userResults.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        const role = userResults[0].role;

        let query, params;

        // Si admin (rôle = 1), récupérer tous les emprunts
        if (role === 1) {
            query = 'SELECT e.id, u.username, e.materielle, e.date_emprunt FROM emprunt e JOIN users u ON e.id_user = u.id;';
            params = [];
        } else {
            // Sinon, récupérer les emprunts de l'utilisateur spécifique
            query = 'SELECT id, materielle, date_emprunt FROM emprunt WHERE id_user = ?';
            params = [id_user];
        }

        const [results] = await db.promise().query(query, params);

        return res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// Route pour supprimer un emprunt
app.delete('/emprunt/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.promise().query(
            'DELETE FROM emprunt WHERE id = ?',
            [id]
        );

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Emprunt introuvable." });
        }

        return res.status(200).json({ message: "Emprunt supprimé avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
