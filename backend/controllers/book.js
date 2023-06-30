const { Long } = require('mongodb');
const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  /*
  delete bookObject._id;
  delete bookObject._userId;
  */
  const book= new Book({
      ...bookObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};


exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;
  Book.findOne({_id: req.params.id})
      .then((book) => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Livre modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteBook = (req, res, next) => {
  console.error("delete")
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllBook = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getTopRatedBook = (req, res, next) => {
  Book.find()
  .then((books) => {
    books.sort((a, b) => b.averageRating - a.averageRating);
    const top3 = books.slice(0, 3);
    res.status(200).json(top3);
  })
  .catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );

};

exports.setRatingBook = (req, res, next) => {
  const { userId, rating } = req.body;
  console.log(rating);
  // Vérifier si la note est valide (comprise entre 0 et 5)
  // if (grade < 0 && grade >= 5) {
  //   return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5.' });
  // }

  // // Rechercher le livre correspondant à l'ID fourni
  // Book.findOne({ _id: req.params.id})  
  //   .then(book => {
  //     if (!book) {
  //       return res.status(404).json({ error: 'Livre non trouvé.' });
  //     }
  //     // Vérifier si l'utilisateur a déjà noté ce livre
  //     const userRating = book.ratings.find(grade => grade.userId === userId);
  //     if (userRating) {
  //       return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
  //     }
  //     console.log({ userId, grade });
  //     // Ajouter la note et l'ID de l'utilisateur au tableau "ratings" du livre
  //     book.ratings.push({ userId, grade });
  //     // console.log(book.ratings);

  //     // Mettre à jour la note moyenne "averageRating"
  //     const totalRating = book.ratings.reduce((sum, grade) => sum + grade.grade, 0);
  //     console.log(totalRating);
  //     book.averageRating = totalRating / book.ratings.length;

  //     return book.save();
  //   })
  //   .then(book => {
  //     // Réponse réussie avec le livre mis à jour
  //     res.json({ message: 'Note définie avec succès.', book });
  //   })
  //   .catch(error => {
  //     res.status(400).json({ error });
  //   });
};
