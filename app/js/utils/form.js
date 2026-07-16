/*********************************************************************
 * form.js
 *
 * Fonctions utilitaires liées aux formulaires.
 *********************************************************************/

/**
 * Transforme les champs d'un formulaire en objet JavaScript.
 *
 * Exemple :
 * <input name="username" value="admin">
 *
 * devient :
 * { username: "admin" }
 *
 * @param {HTMLFormElement} form - Formulaire HTML.
 * @returns {object}
 */
export function getFormData(form) {
  const formData = new FormData(form);

  // Object.fromEntries transforme une liste de paires clé/valeur en objet.
  return Object.fromEntries(formData.entries());
}