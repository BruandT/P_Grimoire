const sharp = require('sharp');
const fs = require('fs');

module.exports = (req, res, next) => {
    if (req.file) {
        // Supprime l'ancienne extension pour mettre webp
        const newFilename = `${req.file.filename.split('.')[0]}.webp`;
        // Nouveau chemin, ajout du prefixe '/modidied_'
        const newPath = `${req.file.destination}/modified_${newFilename}`;
        // Instance sharp avec le chemin du fichier d'origine    
        sharp(`${req.file.destination}/${req.file.filename}`)
        // Changement de size
        .resize(500, 400)
        // Conversion en WebP, reduit la qualité et force la conversion, même si le fichier de sortie existe déjà
        .webp({ quality: 80, force: true })
        // Enregistre l'image traité et supprime l'ancienne 
        .toFile(newPath, () => {
            fs.unlink(`${req.file.destination}/${req.file.filename}`, () => {
                console.log('Image traitée');
            })
        });
        // Desactive le cache interne a Sharp
        sharp.cache(false);
    }
    
    next();
};