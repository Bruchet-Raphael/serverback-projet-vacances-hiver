const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(cors());

app.use(express.json());

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'password') {
        res.status(200).json({ message: 'Connexion réussie' });
    } else {
        res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port : ${PORT}`);
});