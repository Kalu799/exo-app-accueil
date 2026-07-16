/*********************************************************************
 * main.js
 *
 * Point d'entrée du JavaScript.
 *
 * Son rôle est simple :
 * - regarder sur quelle page on se trouve ;
 * - lancer le bon fichier JavaScript.
 *********************************************************************/

import { initAccueil } from './pages/accueil.js';

// Dans le HTML, le body contient par exemple : data-page="index"
// dataset.page permet de récupérer cette valeur.
const page = document.body.dataset.page;

// Si on est sur la page index, on initialise la page index.
if (page === 'accueil') {
  initAccueil();
}