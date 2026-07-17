/*********************************************************************
 * accueil.js
 *
 * Gère la page d'accueil.
 *********************************************************************/

import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';
import { accueilApi } from '../api/accueilApi.js';

let personnels = null
let formations = null

export async function initAccueil() {

  // On récupère une seule fois les éléments HTML importants.
  const loader = qs('#loader');
  const listingPersonnels = qs('.details-personnel');
  const listingFormations = qs('.details-formation');
  const enterForm = qs('#enter-form');
  const retourForm = qs('#retour-form');
  const exitForm = qs('#exit-form');
  const enterWrapper = qs('.enter-wrapper')
  const exitWrapper = qs('.exit-wrapper')
  const showRetourBtn = qs('#showRetourBtn')
  const showEntreeBtn = qs('.tab-btn_entree')
  const showSortieBtn = qs('.tab-btn_sortie')

  // On connecte les événements de la page.
  bindSessionActions(showRetourBtn, showEntreeBtn, showSortieBtn, enterWrapper, retourForm, exitWrapper)
  bindEnterForm(loader, enterForm)
  bindRetourForm(loader, retourForm)
  bindExitForm(loader, exitForm)

  // On charge les données de départ.
  await optionFormations(listingFormations)
  await optionPersonnels(listingPersonnels)
}

/**
 * Gère les boutons.
 */
function bindSessionActions(showRetourBtn, showEntreeBtn, showSortieBtn, enterWrapper, retourForm, exitWrapper) {

  showRetourBtn.addEventListener('click', function (event) {
    event.preventDefault();
    //console.log('click retour')
    retourForm.classList.toggle('hidden')
  });

  showEntreeBtn.addEventListener('click', function (event) {
    event.preventDefault();
    //console.log('click entree')
    hide(exitWrapper)
    show(enterWrapper)
  });

  showSortieBtn.addEventListener('click', function (event) {
    event.preventDefault();
    //console.log('click sortie')
    hide(enterWrapper)
    show(exitWrapper)
  });
}

/**
 * Gère l'affichage des formateurs dans le select.
 */

async function optionFormations(container) {
  formations =  await accueilApi.getAllFormations()

  if (!formations.length) {
    container.innerHTML = '<option disabled >Aucunes formations</option>';
    return;
  }

  //console.log("formations : " + JSON.stringify(formations))

  let formationsAuj = []
  let date = new Date().toLocaleDateString('fr-BE')

  formations.forEach((formation) => {
    if(formation.acf['formations-date'] === date) {
        formationsAuj.push(formation)
      }
  })

  try {
    const html = await Promise.all(
      formationsAuj.map(async function (formation, index) {

        let infos = {}

        infos = {
          formationIntitule: formation.acf['formations-intitule'],
          formationId: formation.id,
        };

        return `
        <option value="${infos.formationId}">${infos.formationIntitule}</option>
      `;
      })
    );

    container.innerHTML += html.join('');
  }
  catch (error) {
    alert(error.message || 'Impossible de charger les formations.');
  }
}


/**
 * Gère l'affichage des membres du personnel dans le select.
 */

async function optionPersonnels(container) {
  personnels = await accueilApi.getAllPresonnels()

  if (!personnels.length) {
    container.innerHTML = '<option disabled >Aucuns membres</option>';
    return;
  }

  //console.log("personnels : " + JSON.stringify(personnels))

    try {
    const html = await Promise.all(
      personnels.map(async function (personnel, index) {

        let infos = {}

        infos = {
          personnelNom: personnel.acf['personnels-nom'],
          personnelPrenom: personnel.acf['personnels-prenom'],
          personnelLocal: personnel.acf['personnels-local'],
          personnelId: personnel.id,
        };

        return `
        <option value="${infos.personnelId}">${infos.personnelNom} ${infos.personnelPrenom} - ${infos.personnelLocal}</option>
      `;
      })
    );

    container.innerHTML += html.join('');
  }
  catch (error) {
    alert(error.message || 'Impossible de charger les formations.');
  }
}

/**
 * Gère les select et l'affichage en fonction de l'input radio
 */
const radios = document.querySelectorAll('input[name="type"]');

const formationSelect = document.querySelector('.details-formation');
const personnelSelect = document.querySelector('.details-personnel');

radios.forEach(radio => {

    radio.addEventListener('change', () => {

        if (radio.value === 'formation' && radio.checked) {

            formationSelect.classList.remove('hidden');
            personnelSelect.classList.add('hidden');

            formationSelect.required = true;
            personnelSelect.required = false;

            personnelSelect.selectedIndex = 0;

        }

        if (radio.value === 'visite' && radio.checked) {

            personnelSelect.classList.remove('hidden');
            formationSelect.classList.add('hidden');

            personnelSelect.required = true;
            formationSelect.required = false;

            formationSelect.selectedIndex = 0;

        }

    });

});

/**
 * Prépare les données attendues par WordPress pour entrer un visiteur / une visite
 *
 * @param {object} formData - Données venant du formulaire.
 * @returns {object} Objet compatible avec l'API REST WordPress.
 */
export function buildEnterPayload(formData) {

  const now = new Date();

  formData.date = now.toISOString().split('T')[0];

  formData.heure_entree = now.toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const payload = {
    nom: formData.nom,
    prenom: formData.prenom,
    email: formData.email,
    type: formData.type,
    details: Number(formData.details),
    date: formData.date,
    heure_entree: formData.heure_entree
  };

  //console.log(payload)

  return payload;
}

/**
 * Prépare les données attendues par WordPress pour entrer une sortie / un retour
 *
 * @param {object} formData - Données venant du formulaire.
 * @returns {object} Objet compatible avec l'API REST WordPress.
 */
export function buildExitRetourPayload(formData) {

  const payload = {
    email: formData.email,
  };

  //console.log(payload)

  return payload;
}

/**
 * Gère le formulaire d'entrée.
 */
function bindEnterForm(loader, form) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // 1. Récupérer les données du formulaire.
      const formData = getFormData(form);

      // 2. Construire l'objet attendu par WordPress.
      const payload = buildEnterPayload(formData);

      // 3. Créer le visiteur (si inexistant) et la visite dans WordPress.
      const visite = await accueilApi.postEntree(payload);

      // 4. Nettoyer le formulaire
      form.reset();

      // 5. On confirme la visite et on lance le print de l'étiquette
      alert('Visite enregistrée')

    } catch (error) {
      alert(error.message || 'Impossible de créer ce visiteur / cette visite.');

    } finally {
      hide(loader);
    }
  });
}

/**
 * Gère le formulaire de sortie.
 */
function bindExitForm(loader, form) {
    form.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // 1. Récupérer les données du formulaire.
      const formData = getFormData(form);

      // 2. Construire l'objet attendu par WordPress.
      const payload = buildExitRetourPayload(formData);

      // 3. Modifie la sortie dans WordPress.
      const sortie = await accueilApi.postSortie(payload);

      // 4. Nettoyer le formulaire
      form.reset();

      // 5. On confirme la sortie
      alert('Sortie enregistrée')

    } catch (error) {
      alert(error.message || 'Impossible de clôturer cette visite.');

    } finally {
      hide(loader);
    }
  });
}

/**
 * Gère le formulaire de retour.
 */
function bindRetourForm(loader, form) {

}