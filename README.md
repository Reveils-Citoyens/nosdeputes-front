
# Documentation

## Run the project locally

### Get the code

To get the full project locally, you need to clone the following repository:

- This repository: The frontend
- [tricoteuses-api parlement](https://git.tricoteuses.fr/logiciels/tricoteuses-api-parlement/): This repository is the backend that manage a DB with all the needed data and provide an API the get them.
- [tricoteuses-assemblee](https://git.tricoteuses.fr/logiciels/tricoteuses-assemblee): Is a toolbox to download and manipulate data from the assemblée nationale.

### Get the data

You can follow the instruction from the [tricoteuses-api parlement](https://git.tricoteuses.fr/logiciels/tricoteuses-api-parlement/) repository to get a working API.

If like me you're not that good with DB management, you can install docker, and run the following command:

```
docker run -d \
 --name assemblee_postgres \
 -e POSTGRES_PASSWORD=postgres \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_DB=assemblee \
 -v pg_data:/var/lib/postgresql/data \
 -p 5431:5432 \
 ankane/pgvector:latest
```

It create a DB that you will be able to start with `docker start assemblee_postgres` command. The DB will be accessible at `postgres://postgres:postgres@localhost:5431/assemblee?schema=public`.

### Run the website

## Install

Run the following command to install the project.

```bash
npm run install
```

Replace the `.env.example` by a `.env` with a correct value to your locale version of the API with `NEXT_PUBLIC_TRICOTEUSES_API_URL`

## Start dev server

Run the folowing command to start the dev server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Visite guidé de la codebase

### Communiquer avec le backend

L'API utilise [Prisma](https://www.prisma.io/) comme ORM.
On peut récupérer les types généré par l'ORM dans notre projet grace à `@prisma/client`.

Par example si on veut manipuler des amendements, on peut faire.

```ts
import { Amendement } from "@prisma/client";
```

Attention, le typage correspond à la DB. L'API renvoit évidement une version séréalisée. Ils faut donc transformer les chaines de characteres en `Date`.

### Structure des dossiers

- `/app` Le routing system de NextJS
- `/components` An attempt to have some components shared between multiple pages.
- `/data` All the functions calling the API to get data and type them using the.
- `/utils` Des petits bouts de code bien pratique.

Pour info:

- La séparation entre `app` et `component` est pas tres propre pour des raison de mauvaise habitude au début du projet
- Il y a un mixte entre les server components et client components. Je ne suis pas un expert du sujet. Je fais probablement des choses peu optimale.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
