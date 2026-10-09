# Raleway

Police variable normale fournie par le dépôt officiel Google Fonts :
https://github.com/google/fonts/tree/main/ofl/raleway

`Raleway-Variable.ttf` est une copie non modifiée de `Raleway[wght].ttf`.
Licence SIL Open Font License 1.1, reproduite dans `OFL.txt`.

Le layout charge les graisses 400, 600 et 700 avec `next/font/local`, en
conservant la variable CSS `--font-raleway`. Le fichier est embarqué pour que
le build ne dépende ni du réseau ni du format des URL de Google Fonts.

`Raleway-Medium.ttf` (500) et `Raleway-Bold.ttf` (700) sont des instances
statiques dérivées de ce fichier, utilisées par les images de partage
(`lib/og.tsx`) : le moteur de `next/og` ne sait pas choisir une graisse dans
une police variable et rendrait l'instance par défaut, Thin (100). Pour les
régénérer :

```sh
pip install fonttools
fonttools varLib.instancer app/fonts/Raleway-Variable.ttf wght=500 --static --update-name-table -o app/fonts/Raleway-Medium.ttf
fonttools varLib.instancer app/fonts/Raleway-Variable.ttf wght=700 --static --update-name-table -o app/fonts/Raleway-Bold.ttf
```
