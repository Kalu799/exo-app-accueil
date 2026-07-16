<?php
/**
 * Plugin Name: QuiVaLa API - Gestion des Visites
 * Description: API REST pour application tablette accueil.
 * Version: 1.0
 * Author: Adrien (edit par Lukas et Chat)
 */

if (!defined('ABSPATH')) {
    exit;
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

add_action('init', 'quivala_cors');

function quivala_cors(){

    header("Access-Control-Allow-Origin: http://127.0.0.1:5500/app/accueil.html");

    header(
        "Access-Control-Allow-Methods: GET, POST, OPTIONS"
    );

    header(
        "Access-Control-Allow-Headers: Content-Type"
    );

}

/*
|--------------------------------------------------------------------------
| ROUTES API
|--------------------------------------------------------------------------
*/

add_action(
    'rest_api_init',
    'quivala_register_routes'
);

function quivala_register_routes(){

    register_rest_route(
        'quivala/v1',
        '/entree',
        array(

            'methods'=>'POST',

            'callback'=>'quivala_entree',

            'permission_callback'=>'__return_true'

        )
    );

    register_rest_route(
        'quivala/v1',
        '/sortie',
        array(

            'methods'=>'POST',

            'callback'=>'quivala_sortie',

            'permission_callback'=>'__return_true'

        )
    );

    register_rest_route(
        'quivala/v1',
        '/retour',
        array(

            'methods'=>'POST',

            'callback'=>'quivala_retour',

            'permission_callback'=>'__return_true'

        )
    );

}

/*
|--------------------------------------------------------------------------
| GENERATION ID VISITEUR
|--------------------------------------------------------------------------
*/

function generer_id_visiteur(){

    do {

        $id = 'VIS-' . strtoupper(
            substr(
                bin2hex(random_bytes(3)),
                0,
                6
            )
        );

        $existe = get_posts(array(

            'post_type'=>'visiteur',

            'posts_per_page'=>1,

            'meta_query'=>array(

                array(

                    'key'=>'id-visiteur',

                    'value'=>$id
                )
            )

        ));

    } while(!empty($existe));

    return $id;

}

/*
|--------------------------------------------------------------------------
| TROUVER VISITEUR PAR EMAIL
|--------------------------------------------------------------------------
*/

function trouver_visiteur_email($email){

    $visiteurs = get_posts(array(

        'post_type'=>'visiteur',

        'posts_per_page'=>1,

        'meta_query'=>array(

            array(

                'key'=>'visiteurs-email',

                'value'=>$email
            )
        )

    ));

    if(empty($visiteurs)){

        return false;

    }

    return $visiteurs[0]->ID;

}

/*
|--------------------------------------------------------------------------
| TROUVER VISITEUR PAR ID VISITEUR
|--------------------------------------------------------------------------
*/

function trouver_visiteur_id($id){

    $visiteurs = get_posts(array(

        'post_type'=>'visiteur',

        'posts_per_page'=>1,

        'meta_query'=>array(

            array(

                'key'=>'id-visiteur',

                'value'=>$id
            )
        )

    ));

    if(empty($visiteurs)){

        return false;

    }

    return $visiteurs[0]->ID;

}

/*
|--------------------------------------------------------------------------
| VERIFIER SI VISITE EN COURS
|--------------------------------------------------------------------------
*/

function trouver_visite_en_cours($visiteur_id){

    $visites = get_posts(array(

        'post_type'=>'visite',

        'posts_per_page'=>1,

        'meta_query'=>array(

            array(

                'key'=>'visite-visiteur',

                'value'=>$visiteur_id,

                'compare'=>'='
            ),

            array(

                'key'=>'visite-status',

                'value'=>1,

                'compare'=>'='
            )

        )

    ));

    if(empty($visites)){

        return false;

    }

    return $visites[0]->ID;

}

/*
|--------------------------------------------------------------------------
| CREATION D'UN VISITEUR
|--------------------------------------------------------------------------
*/

function creer_visiteur($nom, $prenom, $email){

    $visiteur_id = wp_insert_post(array(

        'post_title'=>$prenom.' '.$nom,

        'post_type'=>'visiteur',

        'post_status'=>'publish'

    ));

    if(is_wp_error($visiteur_id)){

        return false;

    }

    update_field(

        'visiteurs-nom',

        $nom,

        $visiteur_id

    );

    update_field(

        'visiteurs-prenom',

        $prenom,

        $visiteur_id

    );

    update_field(

        'visiteurs-email',

        $email,

        $visiteur_id

    );

    update_field(

        'id-visiteur',

        generer_id_visiteur(),

        $visiteur_id

    );

    return $visiteur_id;

}

/*
|--------------------------------------------------------------------------
| CREATION D'UNE VISITE
|--------------------------------------------------------------------------
*/

function creer_visite(
    $visiteur_id,
    $type,
    $details,
    $date,
    $heure_entree
){

    $nom = get_field(
        'visiteurs-nom',
        $visiteur_id
    );

    $prenom = get_field(
        'visiteurs-prenom',
        $visiteur_id
    );

    $visite_id = wp_insert_post(array(

        'post_title'=>$prenom.' '.$nom.' - '.$date,

        'post_type'=>'visite',

        'post_status'=>'publish'

    ));

    if(is_wp_error($visite_id)){

        return false;

    }

    update_field(

        'visite-visiteur',

        $visiteur_id,

        $visite_id

    );

    update_field(

        'visite-type',

        $type,

        $visite_id

    );

    update_field(

        'visite-details',

        $details,

        $visite_id

    );

    update_field(

        'visite-date',

        $date,

        $visite_id

    );

    update_field(

        'visite-heure_entree',

        $heure_entree,

        $visite_id

    );

    update_field(

        'visite-heure_sortie',

        '',

        $visite_id

    );

    update_field(

        'visite-status',

        1,

        $visite_id

    );

    return $visite_id;

}

/*
|--------------------------------------------------------------------------
| ENDPOINT ENTREE
|--------------------------------------------------------------------------
*/

function quivala_entree($request){

    $data = $request->get_json_params();

    $nom = sanitize_text_field(
        $data['nom']
    );

    $prenom = sanitize_text_field(
        $data['prenom']
    );

    $email = sanitize_email(
        $data['email']
    );

    $type = sanitize_text_field(
        $data['type']
    );

    $details = intval(
        $data['details']
    );

    $date = sanitize_text_field(
        $data['date']
    );

    $heure_entree = sanitize_text_field(
        $data['heure_entree']
    );

    if(empty($email)){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Email obligatoire.'

        ),400);

    }

    /*
    Recherche visiteur existant
    */

    $visiteur_id = trouver_visiteur_email($email);

    if(!$visiteur_id){

        $visiteur_id = creer_visiteur(

            $nom,

            $prenom,

            $email

        );

        if(!$visiteur_id){

            return new WP_REST_Response(array(

                'success'=>false,

                'message'=>'Erreur création visiteur.'

            ),500);

        }

    }

    /*
    Récupération infos si visiteur existant
    */

    $nom = get_field(
        'visiteurs-nom',
        $visiteur_id
    );

    $prenom = get_field(
        'visiteurs-prenom',
        $visiteur_id
    );

    /*
    Vérification présence actuelle
    */

    $ancienne_visite = trouver_visite_en_cours(
        $visiteur_id
    );

    if($ancienne_visite){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Cette personne est déjà présente.',

            'visite_id'=>$ancienne_visite

        ),400);

    }

    /*
    Création visite
    */

    $visite_id = creer_visite(

        $visiteur_id,

        $type,

        $details,

        $date,

        $heure_entree

    );

    if(!$visite_id){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Erreur création visite.'

        ),500);

    }

    return new WP_REST_Response(array(

        'success'=>true,

        'message'=>'Entrée enregistrée.',

        'visite'=>array(

            'id_visite'=>$visite_id,

            'id-visiteur'=>get_field(
                'id-visiteur',
                $visiteur_id
            ),

            'nom'=>$nom,

            'prenom'=>$prenom,

            'type'=>$type,

            'details'=>$details,

            'heure_entree'=>$heure_entree

        )

    ),200);

}

/*
|--------------------------------------------------------------------------
| RECUPERATION INFOS VISITEUR
|--------------------------------------------------------------------------
*/

function recuperer_infos_visiteur($visiteur_id){

    return array(

        'id'=>$visiteur_id,

        'id-visiteur'=>get_field(

            'id-visiteur',

            $visiteur_id

        ),

        'nom'=>get_field(

            'visiteurs-nom',

            $visiteur_id

        ),

        'prenom'=>get_field(

            'visiteurs-prenom',

            $visiteur_id

        ),

        'email'=>get_field(

            'visiteurs-email',

            $visiteur_id

        )

    );

}

/*
|--------------------------------------------------------------------------
| ENDPOINT SORTIE
|--------------------------------------------------------------------------
*/

function quivala_sortie($request){

    $data = $request->get_json_params();

    $id_visiteur = sanitize_text_field(
      $data['id_visiteur'] ?? ''
    );

    $email = sanitize_email(
      $data['email'] ?? ''
    );

    if(empty($id_visiteur) && empty($email)){

      return new WP_REST_Response(array(

          'success'=>false,

          'message'=>'ID visiteur ou email obligatoire.'

      ),400);

    }

    /*
    Recherche du visiteur
    */

    if(!empty($id_visiteur)){

        $visiteur_id = trouver_visiteur_id(
            $id_visiteur
        );

    }
    else {

        $visiteur_id = trouver_visiteur_email(
            $email
        );

    }

    if(!$visiteur_id){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Visiteur inconnu.'

        ),404);

    }

    /*
    Recherche visite ouverte
    */

    $visite_id = trouver_visite_en_cours(

        $visiteur_id

    );

    if(!$visite_id){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Aucune visite en cours.'

        ),404);

    }

    /*
    Fermeture visite
    */

    $heure_sortie = current_time('H:i');

    update_field(

        'visite-heure_sortie',

        $heure_sortie,

        $visite_id

    );

    update_field(

        'visite-status',

        0,

        $visite_id

    );

    return new WP_REST_Response(array(

        'success'=>true,

        'message'=>'Sortie enregistrée.',

        'heure_sortie'=>$heure_sortie

    ),200);

}

/*
|--------------------------------------------------------------------------
| ENDPOINT RETOUR
|--------------------------------------------------------------------------
*/

function quivala_retour($request){

    $data = $request->get_json_params();

    $id_visiteur = sanitize_text_field(

        $data['id_visiteur'] ?? ''

    );


    $email = sanitize_email(

        $data['email'] ?? ''

    );

    if(empty($id_visiteur) && empty($email)){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'ID visiteur ou email obligatoire.'

        ),400);

    }

    /*
    Recherche visiteur
    */

    if(!empty($id_visiteur)){

        $visiteur_id = trouver_visiteur_id(
            $id_visiteur
        );

    }
    else {

        $visiteur_id = trouver_visiteur_email(
            $email
        );

    }

    if(!$visiteur_id){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Visiteur inconnu.'

        ),404);

    }

    /*
    Vérifie qu'il est sorti
    */

    $visite_en_cours = trouver_visite_en_cours(

        $visiteur_id

    );

    if($visite_en_cours){

        return new WP_REST_Response(array(

            'success'=>false,

            'message'=>'Cette personne est déjà dans le bâtiment.'

        ),400);

    }

    /*
    Retour des infos pour pré-remplir le formulaire
    */

    return new WP_REST_Response(array(

        'success'=>true,

        'message'=>'Visiteur retrouvé.',

        'visiteur'=>recuperer_infos_visiteur(

            $visiteur_id

        )

    ),200);

}