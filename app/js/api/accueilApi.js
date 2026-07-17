/*********************************************************************
 * accueilApi.js
 *
 * Regroupe les appels API liés à l'accueil.
 *********************************************************************/

import { request } from './request.js';

export const accueilApi = {
  getAllFormations() {
    return request('/wp/v2/formation?_fields=id,title,status,acf');
  },

  getAllPresonnels() {
    return request('/wp/v2/personnel?_fields=id,title,status,acf,personnel-fonction');
  },

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
  }
}