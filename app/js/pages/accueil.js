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

let activeScanner = null;

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
  const scanRetourBtn = qs('#scanRetourBtn')
  const scanSortieBtn = qs('#scanSortieBtn')

  // On connecte les événements de la page.
  bindSessionActions(showRetourBtn, showEntreeBtn, showSortieBtn, enterWrapper, retourForm, exitWrapper)
  bindEnterForm(loader, enterForm, retourForm)
  bindRetourForm(loader, retourForm, enterForm)
  bindExitForm(loader, exitForm, enterWrapper, exitWrapper)

  bindQrScanner(scanRetourBtn, retourForm, 'reader-retour');
  bindQrScanner(scanSortieBtn, exitForm, 'reader-sortie');

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
  formations = await accueilApi.getAllFormations()

  if (!formations.length) {
    container.innerHTML = '<option disabled >Aucunes formations</option>';
    return;
  }

  //console.log("formations : " + JSON.stringify(formations))

  let formationsAuj = []
  let date = new Date().toLocaleDateString('fr-BE')

  formations.forEach((formation) => {
    if (formation.acf['formations-date'] === date) {
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
          formationKey: formation.key,
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
          personnelKey: personnel.key
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
 */
export function buildExitRetourPayload(formData) {
  // On nettoie la valeur pour éviter qu'un espace invisible venant du scanner fasse planter l'API
  const idVisiteur = formData['id-visiteur'] ? formData['id-visiteur'].trim() : '';
  const email = formData.email ? formData.email.trim() : '';

  if (idVisiteur !== '') {
    return { 'id-visiteur': idVisiteur };
  }

  if (email !== '') {
    return { 'email': email };
  }

  throw new Error("Veuillez saisir un email ou scanner un badge.");
}

/**
 * Gère le formulaire d'entrée.
 */
function bindEnterForm(loader, form, retourForm) {
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
      //console.log(payload)
      printBadge(payload, visite.visite)

      // 6. On cache le form de retour si il était ouvert
      hide(retourForm)

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
function bindExitForm(loader, form, enterWrapper, exitWrapper) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    show(loader);

    try {
      const formData = getFormData(form);
      const payload = buildExitRetourPayload(formData);
      
      console.log("Payload envoyé à l'API (Sortie) :", payload);
      
      const sortie = await accueilApi.postSortie(payload);

      form.reset();
      alert('Sortie enregistrée');
      hide(exitWrapper);
      show(enterWrapper);

    } catch (error) {
      alert(error.message || 'Impossible de clôturer cette visite.');
    } finally {
      hide(loader);
    }
  });
}

/**
 * Gère le formulaire de retour (uniquement pour pré-remplir).
 */
function bindRetourForm(loader, retourForm, enterForm) {
  retourForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // Empêche le rechargement

    show(loader);

    try {
      const emailValue = retourForm.elements["email"]?.value.trim() || '';
      const idVisiteurValue = retourForm.elements["id-visiteur"]?.value.trim() || '';

      let payload = {};
      if (idVisiteurValue) {
        payload["id-visiteur"] = idVisiteurValue;
      } else if (emailValue) {
        payload["email"] = emailValue;
      } else {
        throw new Error("Veuillez saisir un email ou scanner un badge.");
      }

      // 1. On appelle uniquement l'API de retour (qui renvoie les infos visiteur)
      const retour = await accueilApi.postRetour(payload);

      // 2. On remplit les champs du formulaire d'entrée
      enterForm.elements["nom"].value = retour.visiteur.nom;
      enterForm.elements["prenom"].value = retour.visiteur.prenom;
      enterForm.elements["email"].value = retour.visiteur.email;

      // 3. On ferme le formulaire de recherche/retour
      retourForm.reset();
      hide(retourForm);
      
      alert('Informations chargées ! Vous pouvez maintenant valider l\'entrée.');

    } catch (error) {
      alert(error.message || 'Visiteur inconnu.');
    } finally {
      hide(loader);
    }
  });
}

/**
 * Gère le print.
 */
function printBadge(infos, visite) {

  const page = qs('.content')

  const badge = qs('#badge')
  const badgeNom = qs('#badge-nom');
  const badgeInfo = qs('#badge-info');
  const badgeLocal = qs('#badge-local');
  const qr = qs('.qr');

  badgeNom.textContent = `${visite.nom} ${visite.prenom}`;

  if (visite.type === 'formation') {

    const formation = formations.find(f => f.id == visite.details);

    badgeInfo.textContent =
      formation.acf['formations-intitule'];

    badgeLocal.textContent =
      formation.acf['formations-local'];
  }

  if (visite.type === 'visite') {

    const personnel = personnels.find(p => p.id == visite.details);

    badgeInfo.textContent =
      `${personnel.acf['personnels-nom']} ${personnel.acf['personnels-prenom']}`;

    badgeLocal.textContent =
      `${personnel.acf['personnels-local']} - +${personnel.acf['personnels-telephone']}`;
  }

  // génération du QR
  qr.innerHTML = '';

  new QRCode(qr, {
    text: visite['id-visiteur'],
    width: 120,
    height: 120
  });

  hide(page)
  show(badge)
  window.print();
  hide(badge)
  show(page)
}

/**
 * Gère le scan d'un QR Code avec la caméra (Correction du crash Stop)
 */
function bindQrScanner(button, form, readerId) {
  if (!button) return;

  button.addEventListener('click', async () => {
    if (activeScanner) {
      // Si un scanner tourne déjà, on l'arrête avant d'en faire un autre
      try {
        await activeScanner.stop();
        activeScanner = null;
        const oldReader = document.getElementById(readerId);
        if (oldReader) oldReader.remove();
      } catch (e) {
        console.log("Erreur lors du reset du scanner précédent", e);
      }
      return;
    }

    const input = form.querySelector('input[name="id-visiteur"]');
    const reader = document.createElement('div');
    reader.id = readerId;
    form.appendChild(reader);

    // On stocke l'unique instance dans la variable globale
    activeScanner = new Html5Qrcode(readerId);

    try {
      await activeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          console.log("QR détecté :", decodedText);

          input.value = decodedText;

          // On stoppe l'instance globale qui est bien en train de tourner !
          await activeScanner.stop();
          activeScanner = null;
          reader.remove();
        }
      );
    } catch (error) {
      console.error(error);
      alert("Impossible d'utiliser la caméra.");
      if (activeScanner) activeScanner = null;
      reader.remove();
    }
  });
}