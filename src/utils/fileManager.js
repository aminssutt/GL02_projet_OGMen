const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../data/questions.json");
const examsFilePath = path.join(__dirname, "../data/exams.json");

const { parseVCard } = require("./vCardParser");

/**
 * Lit la banque de questions depuis le fichier JSON.
 * @returns {Array} - Tableau de questions stockées dans le fichier JSON.
 */
function readQuestions() {
  if (!fs.existsSync(dataFilePath)) {
    console.warn(
      "Fichier questions.json introuvable. Retour d'une liste vide.",
    );
    return []; // Retourne un tableau vide si le fichier JSON est inexistant.
  }
  const data = fs.readFileSync(dataFilePath, "utf-8");
  try {
    return JSON.parse(data); // Parse le contenu JSON et retourne les questions.
  } catch (error) {
    console.error("Erreur lors du parsing de questions.json :", error.message);
    return []; // Retourne un tableau vide en cas d'erreur de parsing.
  }
}

/**
 * Sauvegarde la banque de questions dans le fichier JSON, tout en attribuant des titres uniques.
 * @param {Array} questions - Tableau de questions à sauvegarder.
 */
function saveQuestions(questions) {
  const questionsWithTitles = assignTitlesToQuestions(questions);
  try {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(questionsWithTitles, null, 2),
    );
    console.log("Questions sauvegardées avec succès !");
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des questions :",
      error.message,
    );
  }
}

/**
 * Attribue des titres uniques aux questions, si elles n'en possèdent pas déjà.
 * @param {Array} questions - Tableau de questions.
 * @returns {Array} - Tableau de questions avec des titres uniques attribués.
 */
function assignTitlesToQuestions(questions) {
  return questions.map((question, index) => {
    if (!question.title || question.title.trim() === "") {
      question.title = `Question ${index + 1}`; // Génère un titre basé sur l'index si aucun n'existe.
    }
    return question;
  });
}

/**
 * Supprime une question spécifique de la banque en se basant sur son titre exact.
 * @param {string} title - Titre exact de la question à supprimer.
 * @returns {boolean} - Retourne true si au moins une question a été supprimée, sinon false.
 */
function deleteQuestion(title) {
  const questions = readQuestions();

  if (questions.length === 0) {
    console.warn("Aucune question disponible dans la base pour suppression.");
    return false;
  }

  console.log(`Tentative de suppression pour le titre exact : "${title}"`);
  console.log(`Questions disponibles avant suppression : ${questions.length}`);

  // Filtrer les questions qui ne correspondent pas au titre exact
  const filteredQuestions = questions.filter((q) => q.title !== title);

  // Vérifie si une suppression a eu lieu
  if (filteredQuestions.length === questions.length) {
    console.warn(`Aucune question trouvée avec le titre exact : "${title}"`);
    return false;
  }

  // Sauvegarde la nouvelle liste après suppression
  saveQuestions(filteredQuestions);
  console.log(
    `Suppression effectuée. Nombre de questions restantes : ${filteredQuestions.length}`,
  );
  return true;
}

/**
 * Sauvegarde un examen nouvellement créé dans le fichier exams.json.
 * @param {Object} exam - Objet représentant un examen à sauvegarder.
 */
function saveExam(exam) {
  const exams = fs.existsSync(examsFilePath)
    ? JSON.parse(fs.readFileSync(examsFilePath, "utf-8"))
    : [];
  exams.push(exam);
  fs.writeFileSync(examsFilePath, JSON.stringify(exams, null, 2));
  console.log("Examen sauvegardé avec succès !");
}

/**
 * Supprime les doublons de questions dans la banque, en se basant sur leurs titres.
 * @returns {boolean} - Retourne true si des doublons ont été supprimés, sinon false.
 */
function removeDuplicateQuestions() {
  const questions = readQuestions();

  if (questions.length === 0) {
    console.warn("Aucune question disponible pour vérifier les doublons.");
    return false;
  }

  console.log(
    `Vérification des doublons dans ${questions.length} questions...`,
  );

  const seenTitles = new Set();
  const uniqueQuestions = [];
  const duplicateQuestions = [];

  questions.forEach((question) => {
    if (seenTitles.has(question.title)) {
      duplicateQuestions.push(question);
    } else {
      seenTitles.add(question.title);
      uniqueQuestions.push(question);
    }
  });

  if (duplicateQuestions.length === 0) {
    console.log("Aucun doublon trouvé.");
    return false;
  }

  // Sauvegarder la liste de questions sans doublons
  saveQuestions(uniqueQuestions);

  console.log(
    `Suppression des doublons terminée. ${duplicateQuestions.length} doublon(s) supprimé(s).`,
  );
  return true;
}

/**
 * Détecte le type d'une question à partir de son texte.
 * @param {string} questionText
 * @returns {string}
 */
function detectQuestionType(questionText) {
  
    if (/{T|F}/.test(questionText)) {
      return "TF"; // Retourne "TF" pour les questions Vrai/Faux
    }
  
    if (/{1:MC:|~/.test(questionText)) {
      return "Multiple Choice"; // Retourne "Multiple Choice" pour les questions à choix multiples
    }

    if (/{#/.test(questionText)) {
      return "Numeric"; // Retourne "Numeric" pour les questions numériques
    }
 
    if (/{=/.test(questionText)) {
      return "Fill"; // Retourne "Fill" pour les questions à compléter
    }
  

    if (/{.*->.*}/.test(questionText)) {
      return "Matching"; // Retourne "Matching" pour les questions d'association
    }
  
    if (questionText.length > 150) {
      return "Essay"; // Retourne "Essay" pour les questions longues
    }
  
    return "Unknown"; // Si aucun type ne correspond, retourne "Unknown"
  }
  


function createNewContact(contactInfo) {
  const { firstName, lastName, phone, email } = contactInfo;

  if (!firstName || !lastName) {
    console.error("Le prénom et le nom sont requis pour créer un contact.");
    return false;
  }

  const vCardContent = `BEGIN:VCARD
VERSION:3.0
FN:${firstName} ${lastName}
N:${lastName};${firstName};;;
TEL;TYPE=HOME,VOICE:${phone || ""}
EMAIL;TYPE=HOME,INTERNET:${email || ""}
END:VCARD`;

  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(__dirname, "../data/contacts", fileName);

  try {
    fs.writeFileSync(filePath, vCardContent, "utf-8");
    console.log(`Contact sauvegardé avec succès dans ${fileName}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du contact :", error.message);
    return false;
  }
}

function findContact(contactName) {
  const { firstName, lastName } = contactName;
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);

  // Vérifier si le fichier existe
  return fs.existsSync(filePath);
}

const deleteContact = (contactName) => {
  const { firstName, lastName } = contactName;
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);
  if (findContact(contactName)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    console.warn(`Le fichier ${fileName} n'existe pas.`);
    return false;
  }
};

function displayContactInfos(contactName) {
  const { firstName, lastName } = contactName;
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);

  if (findContact(contactName)) {
    const vCardContent = fs.readFileSync(filePath, "utf-8");
    const contactInfos = parseVCard(vCardContent);
    console.log(`Informations du contact ${firstName} ${lastName} :`);
    console.log(`Prénom : ${contactInfos.firstName}`);
    console.log(`Nom : ${contactInfos.lastName}`);
    console.log(`Téléphone : ${contactInfos.phone}`);
    console.log(`Email : ${contactInfos.email}`);
  } else {
    console.log(`Aucun contact trouvé avec le nom ${firstName} ${lastName}.`);
  }
}

module.exports = {
  readQuestions,
  saveQuestions,
  deleteQuestion,
  saveExam,
  removeDuplicateQuestions,
  detectQuestionType,
  createNewContact,
  findContact,
  deleteContact,
  displayContactInfos,
};