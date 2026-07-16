/*********************************************************************
 * accueilApi.js
 *
 * Regroupe les appels API liés à l'accueil.
 *********************************************************************/

import { request } from './request.js';

export const accueilApi = {
  /**
   * Récupère toutes les formations.
   */
  getAllFormations() {
    return request('/wp/v2/formation?_fields=id,title,status,acf');
  },

  /**
  * Récupère tous les membres du personnel.
  */
  getAllPresonnels() {
    return request('/wp/v2/personnel?_fields=id,title,status,acf,personnel-fonction');
  },

  /**
   * Requête avec method POST.
   *
   * @param {object} payload - Données envoyées à WordPress.
   */
  postEntree(payload) {
    return request('/quivala/v1/entree', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  postSortie(payload) {
    return request('/quivala/v1/sortie', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  postRetour(payload) {
    return request('/quivala/v1/retour', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
}