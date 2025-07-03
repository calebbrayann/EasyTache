import jwt from 'jsonwebtoken';

// Fonction pour générer un token JWT
export function generateToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) {
        return reject(new Error('Erreur lors de la génération du token.'));
      }
      resolve(token);
    });
  });
}

// Fonction pour vérifier un token JWT
export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(new Error('Token invalide ou expiré.'));
      }
      resolve(decoded);
    });
  });
}
