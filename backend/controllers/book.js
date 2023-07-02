const Book = require('../models/Book');
const fs = require('fs');

// Function création de livre
exports.createBook = (req, res, next) => {
  // Parsing de l'objet JSON contenu dans la requête
  const bookObject = JSON.parse(req.body.book);  
  // Suppression des propriétés "_id" et "_userId" de l'objet bookObject
  delete bookObject._id;
  delete bookObject._userId;  
  // Création d'une nouvelle instance de Book avec les données fournies
  const book= new Book({
    ...bookObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  // Enregistrement du livre dans la base de données
  book.save()
  .then(() => {
    // Envoi d'une réponse avec un code de statut 201 (Créé) et un message de succès
    res.status(201).json({message: 'Livre enregistré !'});
  })
  .catch(error => {
    // Envoi d'une réponse avec un code de statut 400 (Requête incorrecte) et l'erreur rencontrée
    res.status(400).json({ error });
  });
};

// Function récupération d'un livre
exports.getBook = (req, res, next) => {
  // Récupérer un livre en fonction de l'ID fourni dans les paramètres de la requête
  Book.findOne({_id: req.params.id})
  .then((book) => {
    // Si le livre est trouvé, renvoyer une réponse JSON avec le livre et un statut 200 (OK)
    res.status(200).json(book);
  })
  .catch(error => {
    // Si une erreur se produit lors de la recherche du livre, renvoyer une réponse JSON avec l'erreur et un statut 400 (Bad Request)
    res.status(400).json({ error });
  });
};

// Function modification d'un livre
exports.modifyBook = (req, res, next) => {
  // Crée un nouvel objet 'bookObject' en utilisant les données de la requête
  // Si un fichier est inclus dans la requête, l'URL de l'image est également ajoutée à 'imageUrl'
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  // Supprime la clé '_userId' de 'bookObject'
  delete bookObject._userId;
  // Récupérer un livre en fonction de l'ID fourni dans les paramètres de la requête
  Book.findOne({_id: req.params.id})
  .then((book) => {
    // Vérifie si l'utilisateur authentifié est autorisé à modifier le livre
    if (book.userId != req.auth.userId) {
      // Si l'utilisateur n'est pas autorisé, renvoie une réponse d'erreur 401
      res.status(401).json({ message : 'Not authorized'});
    } else {
      // Met à jour le livre avec les nouvelles données de 'bookObject'
      // Utilise également l'identifiant de la requête pour identifier le livre à mettre à jour
      Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
      .then(() => {
        // Renvoie une réponse de succès 200 avec un message indiquant que le livre a été modifié
        res.status(200).json({message : 'Livre modifié!'})
      })
      .catch(error => {
        // Renvoie une réponse d'erreur 401 avec l'erreur rencontrée lors de la mise à jour
        res.status(401).json({ error })
      });
    }
  })
  .catch((error) => {
    // Renvoie une réponse d'erreur 400 avec l'erreur rencontrée lors de la recherche du livre
    res.status(400).json({ error });
  });
};

// Function modification d'un livre
exports.deleteBook = (req, res, next) => {
  // Récupérer un livre en fonction de l'ID fourni dans les paramètres de la requête
  Book.findOne({ _id: req.params.id})
  .then( book => {
    // Vérifie si l'utilisateur authentifié est autorisé à supprimer le livre
    if (book.userId != req.auth.userId) {
      // Si l'utilisateur n'est pas autorisé, renvoie une réponse d'erreur 401
      res.status(401).json({message: 'Not authorized'});
    } else {
      // Récupère le nom du fichier à supprimer à partir de l'URL de l'image
      const filename = book.imageUrl.split('/images/')[1];
      // Supprime le fichier d'image associé au livre
      fs.unlink(`images/${filename}`, () => {
        // Supprime le livre de la base de données
        Book.deleteOne({_id: req.params.id})
        .then(() => {
          // Suppression réussie, retourne une réponse avec un message de succès
          res.status(200).json({message: 'Livre supprimé !'})
        })
        .catch(error => { 
          // Erreur lors de la suppression du livre
          res.status(401).json({ error }) 
        });
      });
    }
  })
  .catch( error => {
    // Erreur lors de la recherche du livre dans la base de données
    res.status(500).json({ error });
  });
};

// Function récupération de tous les livres
exports.getAllBook = (req, res, next) => {
  // Récupère tous les livres dans la base de données
  Book.find()
  .then( books => {
    // Renvoie les livres en tant que réponse JSON avec le code de statut 200 (OK)
    res.status(200).json(books);
  })
  .catch( error => {
    // Renvoie une réponse JSON avec une erreur et le code de statut 400 (Bad Request)
    res.status(400).json({ error: error });
  });
};

// Function top 3 de tous les livres
exports.getTopRatedBook = (req, res, next) => {  
  // Récupère tous les livres dans la base de données
  Book.find()
  .then((books) => {
    // Trie les livres par note moyenne de la plus élevée à la plus basse
    books.sort((a, b) => b.averageRating - a.averageRating);
    // Récupère les 3 premiers livres de la liste triée
    const top3 = books.slice(0, 3);
    // Envoie une réponse JSON avec les 3 livres les mieux notés
    res.status(200).json(top3);
  })
  .catch(error => {
    // En cas d'erreur, renvoie une réponse d'erreur avec l'erreur spécifique
    res.status(400).json({ error });
  });
};      

// Function ajout de note à un livre
exports.setRatingBook = (req, res, next) => {  
  // Rechercher le livre correspondant à l'ID fourni
  Book.findOne({ _id: req.params.id})
  .then(book => {          
    // Vérifier si le live existe
    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé.' });        
    } 
    // Vérifier si l'utilisateur a déjà noté ce livre
    else if (book.ratings.includes(rating => rating.userId == req.body.userId)) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
    }
    // Vérifier que la note est comprise entre 1 et 5
    else if (1 > req.body.rating > 5) {
      return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5.' });        
    } 
    // Push dans le book
    else {
      book.ratings.push({
        userId: req.auth.userId,
        grade: req.body.rating
      });
    }
    // Mettre à jour la note moyenne "averageRating"
    let sum = 0;
    // Copie du tableau book.ratings
    let ratingsCopy = [...book.ratings]; 
    // Calcul de la somme totale de book.ratings.grade
    while (ratingsCopy.length != 0) {
      sum += ratingsCopy.pop().grade
    };
    // Somme / par le nombre note 
    let calc = sum / book.ratings.length;
    // Note avec seulement 1 chiffres apres la virgule
    let result = calc.toFixed(1);
    // Passe le result de string a nombre
    book.averageRating = Number(result)
    return book.save();
  })
  .then(book => {
    // Réponse réussie avec le livre mis à jour
    res.status(201).json(book);
  })
  .catch(error => {
    res.status(400).json({ error });
  });
};
