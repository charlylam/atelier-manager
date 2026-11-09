# Atelier Manager : User stories

## Hypothèses

- Un membre peut créer des devis et des chantiers. Seul l'admin gère les utilisateurs.
- Un devis a une date de validité facultative. Un devis dépassé passe à `expired` quand on le consulte ou qu'on tente de l'accepter, sans tâche automatique.
- L'adresse d'un chantier est facultative : si elle est vide, le chantier a lieu à l'adresse du client.

## Acteurs

- **Visiteur** : personne non connectée.
- **Membre** : utilisateur d'un atelier.
- **Admin** : membre avec tous les droits, y compris la gestion des utilisateurs.

Priorité : **M** = MVP, **S** = si le temps le permet.

## Compte et atelier

| ID  | User story                                                                                                | Prio |
| --- | --------------------------------------------------------------------------------------------------------- | ---- |
| US1 | En tant que visiteur, je veux créer un compte et mon atelier, afin de commencer à utiliser l'application. | M    |
| US2 | En tant que visiteur, je veux me connecter, afin d'accéder aux données de mon atelier.                    | M    |
| US3 | En tant que membre, je veux me déconnecter, afin de protéger mon compte.                                  | M    |
| US4 | En tant qu'admin, je veux ajouter un membre à mon atelier, afin qu'il travaille avec moi.                 | M    |
| US5 | En tant qu'admin, je veux retirer un membre, afin de gérer qui a accès.                                   | S    |

## Clients

| ID   | User story                                                                                                 | Prio |
| ---- | ---------------------------------------------------------------------------------------------------------- | ---- |
| US6  | En tant que membre, je veux créer un client, afin de lui associer des devis.                               | M    |
| US7  | En tant que membre, je veux modifier la fiche d'un client, afin de garder ses coordonnées à jour.          | M    |
| US8  | En tant que membre, je veux rechercher un client par son nom, afin de le retrouver vite.                   | M    |
| US9  | En tant que membre, je veux voir les devis et les chantiers d'un client, afin de connaître son historique. | M    |
| US10 | En tant que membre, je veux supprimer un client sans devis ni chantier, afin de nettoyer ma liste.         | S    |

## Devis

| ID   | User story                                                                                                                            | Prio |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| US11 | En tant que membre, je veux créer un devis pour un client, afin de chiffrer un ouvrage.                                               | M    |
| US12 | En tant que membre, je veux ajouter, modifier et supprimer des lignes (matériaux, main-d'œuvre, services), afin de détailler le prix. | M    |
| US13 | En tant que membre, je veux voir les totaux HT, TVA et TTC calculés automatiquement, afin d'éviter les erreurs.                       | M    |
| US14 | En tant que membre, je veux passer un devis à « envoyé », afin de le figer.                                                           | M    |
| US15 | En tant que membre, je veux marquer un devis comme accepté ou refusé, afin de suivre la décision du client.                           | M    |
| US16 | En tant que membre, je veux dupliquer un devis, afin de le corriger après l'envoi ou de réutiliser un modèle.                         | S    |
| US17 | En tant que membre, je veux télécharger un devis en PDF, afin de l'envoyer au client.                                                 | M    |

## Chantiers et phases

| ID   | User story                                                                                                                                                                           | Prio |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| US18 | En tant que membre, je veux transformer un devis accepté en chantier, sans ressaisie, afin de lancer la fabrication.                                                                 | M    |
| US19 | En tant que membre, je veux définir la date de livraison prévue et, si besoin, une adresse de chantier différente de celle du client, afin de planifier.                             | M    |
| US20 | En tant que membre, je veux ajouter, ordonner et supprimer des phases (débit, usinage, assemblage, finition, livraison ou pose) avec un temps estimé, afin de décomposer le travail. | M    |
| US21 | En tant que membre, je veux affecter une phase à un utilisateur, afin de répartir le travail.                                                                                        | S    |
| US22 | En tant que membre, je veux changer le statut d'une phase et saisir le temps réel passé, afin de suivre l'avancement.                                                                | M    |
| US23 | En tant que membre, je veux faire avancer le statut d'un chantier, afin de refléter l'état réel.                                                                                     | M    |
| US24 | En tant que membre, je veux annuler un chantier non livré, afin de gérer les désistements.                                                                                           | M    |

## Tableau de bord

| ID   | User story                                                                                                                              | Prio |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| US25 | En tant que membre, je veux voir le nombre de chantiers par statut et ceux en retard, afin de savoir quoi traiter.                      | M    |
| US26 | En tant que membre, je veux voir les devis en attente et le chiffre d'affaires des chantiers livrés du mois, afin de suivre l'activité. | S    |

## Critères d'acceptation des stories clés

### US2 : connexion

- Les identifiants valides donnent accès à l'application.
- Après 5 échecs en peu de temps, les tentatives sont bloquées temporairement.

### US13 : totaux

- Total ligne = quantité × prix unitaire. TVA calculée par ligne. Arrondi à 2 décimales.
- Le total du devis est la somme des lignes.

### US14 : envoi

- Un devis sans ligne ne peut pas être envoyé.
- Un devis envoyé n'est plus modifiable.

### US15 : acceptation

- Seul un devis `sent` peut passer à `accepted` ou `rejected`.
- Un devis dont la date de validité est dépassée passe à `expired` et ne peut plus être accepté.

### US18 : création du chantier

- Le devis doit être `accepted`. Sinon l'action est refusée.
- Un devis ne produit qu'un seul chantier : une seconde demande renvoie le chantier existant.
- Le chantier reprend le client et le titre du devis, avec le statut `pending`.
- Les phases par défaut sont créées avec le chantier, avec un temps estimé à 0.

### US20 : phases

- Les phases d'un chantier ont des positions uniques.
- Une phase peut passer de `done` à `in_progress` tant que le chantier n'est ni `ready` ni `delivered`.

### US23 : avancement

- Passage à `ready` refusé si une phase n'est pas `done`.
- Un chantier `delivered` ne peut plus être annulé.

### Toutes les stories

- Un utilisateur ne peut jamais lire ni modifier les données d'un autre atelier.
