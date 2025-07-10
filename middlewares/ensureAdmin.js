export const ensureAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "administrateur") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs." })
  }
  next()
}