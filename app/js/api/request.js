/*********************************************************************
 * request.js
 *
 * Fonction centrale pour envoyer des requêtes à l'API WordPress.
 *
 * Au lieu d'écrire fetch() partout dans le projet, on utilise cette
 * fonction. Cela permet de gérer au même endroit :
 * - l'URL de base ;
 * - les headers ;
 * - les erreurs.
 *********************************************************************/

import { config } from '../config.js';

/**
 * Envoie une requête HTTP vers l'API WordPress.
 *
 * @param {string} endpoint - Partie de l'URL après /wp-json.
 * @param {object} options - Options de fetch : method, body, headers...
 * @returns {Promise<object|null>} Données JSON renvoyées par WordPress.
 */
export async function request(endpoint, options = {}) {

  // FormData est utilisé pour l'upload de fichiers.
  // Dans ce cas, il ne faut PAS mettre Content-Type: application/json.
  // Le navigateur ajoute lui-même le bon Content-Type.
  const isFormData = options.body instanceof FormData;

  // Construction de l'URL complète.
  const url = `${config.apiBaseUrl}${endpoint}`;

  // Envoi de la requête HTTP.
  const response = await fetch(url, {
    ...options,

    headers: {
      // Si ce n'est pas un fichier, on annonce qu'on envoie du JSON.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),

      // Permet quand même d'ajouter d'autres headers si nécessaire.
      ...options.headers,
    },
  });

  // Certaines réponses peuvent ne pas contenir de JSON.
  // Le catch évite que le programme plante dans ce cas.
  const data = await response.json().catch(() => null);

  // response.ok vaut true pour les codes 200 à 299.
  // Si WordPress renvoie une erreur, on crée une vraie erreur JavaScript.
  if (!response.ok) {
    throw new Error(data?.message || `Erreur API : ${response.status}`);
  }

  // On renvoie les données au fichier qui a appelé request().
  return data;
}
