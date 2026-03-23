# Ma bibliothéque

## idée

Aplication de gestion (simple) de ma bibliothèque perso.
Le but de cette APP est de pouvoir visualiser les livres de ma bibliothèque simplement / rapidement et pour les collections de voir les livres manquants.
Les donnée seront stocké dans un JSON (proposer une architecture)

### Liste des livres

Liste des livres classé par ordre alphabétique présenté en liste avec les infos suivantes pour chaque livre :

- Titre
- Auteur(s)
- EAN / ISBN
- Collection (si le livre fait partie d'un collection)
- Couverture (si disponible sinon placeholder)
- état : possédé / manquant (pour les collections)

Liste en 2 vues : Livres / Collectionss

- Vue livres : liste des livres classé par ordre alphabétique
- Vue Collection : Liste des collections avec les livres associés à cette collections
  -- feature spécifique à la vue collection > Toggle : afficher les livres manquants

### Ajouter un livre

Scan du code barre afin de trouver la ref via une API (a tester).
Limiter au maximum les requetes API, les requete API ne seront faites qu'a l'ajout d'un nouveau livre.
Lors de l'ajout récupérer le code EAN / ISBN et vérifier que le livre n'est pas déja dans les base de donnée.

Si il est deja présent : vérifier l'état (possédé / manquant)

Si il est "possédé" : Livre deja dans la bibliothèque ;)
Si il est "manquant" :

- Récupérer les infos et les stocker
- Si le livre fait partie d'une collection et que c'est le premier à être scanné > récupérer TOUS les autres livres de la collection
- Si le le livre fait partie d'un collection mais que le collection existe chercher une correspondance avec un livre manquant
  -- Si il est manquant l'ajouter
  -- Si le livre existe envoyer une alerte

Pour les couvertures, lors d'un ajout n'ajouter que la couverture du livre en cours d'ajout.
Pour les colections, lors de la création de celle-ci ne pas récupérer toutes les couvertures, elle seront ajouter au fur et à mesure qu'on ajoute les livre.
Les couverture seront stocker dans un dossier (organisé par collection) et devront être optimisées (webp / avif 300x300px MAX)

## Stack technique :

- Astro
- Web app PWA instalable et fonctionnant hors ligne (pour la consultation)
- Base de donnée JSON à la racine du projet
- Tailwind pour le style
- Utiliser l'anglais pour la partie code, le français n'est utiliser que pour la partie FRONT.

## Informations complémentaires :

Ma bibliothèque contient :

- Des Comics
- Des manga
- Des BD
