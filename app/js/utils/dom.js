/*********************************************************************
 * dom.js
 *
 * Petites fonctions utilitaires pour manipuler le DOM.
 *
 * Le DOM est la représentation HTML de la page côté JavaScript.
 *********************************************************************/

/**
 * Raccourci pour document.querySelector().
 *
 * @param {string} selector - Sélecteur CSS.
 * @param {ParentNode} parent - Élément dans lequel chercher.
 * @returns {Element|null}
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Affiche un élément caché.
 */
export function show(element) {
  element?.classList.remove('hidden');
}

/**
 * Cache un élément.
 */
export function hide(element) {
  element?.classList.add('hidden');
}

/**
 * Protège une chaîne de caractères avant de l'injecter dans innerHTML.
 *
 * Pourquoi ?
 * Si une donnée vient d'un utilisateur ou d'une API, elle pourrait contenir
 * du HTML ou du JavaScript. Cette fonction transforme les caractères dangereux.
 *
 * @param {unknown} value - Valeur à sécuriser.
 * @returns {string}
 */
export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}