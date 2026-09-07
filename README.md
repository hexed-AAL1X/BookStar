<a id="readme-top"></a>

<img src="https://github.com/AnderMendoza/AnderMendoza/raw/main/assets/line-neon.gif" width="100%">

<p align="center">
  <img alt="GitHub Repo contributors" src="https://img.shields.io/github/contributors/hexed-AAL1X/BookStar-Front?style=for-the-badge">&nbsp;
  <img alt="GitHub Repo forks" src="https://img.shields.io/github/forks/hexed-AAL1X/BookStar-Front?style=for-the-badge">&nbsp;
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hexed-AAL1X/BookStar-Front?style=for-the-badge">&nbsp;
  <img alt="GitHub Repo issues" src="https://img.shields.io/github/issues/hexed-AAL1X/BookStar-Front?style=for-the-badge">&nbsp;
</p>

<br>

<div align="center">
  <img src="public/icons/BookStarIcon2.png" alt="BookStar" width="220" />
  <h3 align="center">BookStar Frontend</h3>
  <p align="center">
    Frontend web (Angular) para biblioteca digital: libros, pedidos, posts y usuarios.
    <br>
    <a href="https://github.com/hexed-AAL1X/BookStar-Front"><strong>Explorar repositorio »</strong></a>
    <br><br>
    <a href="https://github.com/hexed-AAL1X/BookStar-Front">Ver código</a>
    ·
    <a href="https://github.com/hexed-AAL1X/BookStar-Front/issues/new?labels=bug">Reportar bug</a>
    ·
    <a href="https://github.com/hexed-AAL1X/BookStar-Front/issues/new?labels=enhancement">Pedir feature</a>
  </p>
</div>

<details>
  <summary>Tabla de contenidos</summary>
  <ol>
    <li><a href="#about-the-project">About the project</a></li>
    <li><a href="#built-with">Built with</a></li>
    <li><a href="#important-notices">Important notices</a></li>
    <li>
      <a href="#getting-started">Getting started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#available-scripts">Available scripts</a></li>
      </ul>
    </li>
    <li><a href="#environments">Environments</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>
<br>

<a id="about-the-project"></a>***About the project***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

<p align="center" style="margin: 7px;">
  <img src="docs/dashboard-preview.png" alt="Dashboard de BookStar" width="900" style="margin: 7px;" />
</p>

BookStar es una aplicación web enfocada en gestionar una biblioteca digital personal y de autores.

Incluye:

- Autenticación (login / registro).
- Dashboard de inicio con métricas.
- Módulos de libros, pedidos, posts y usuarios/perfil.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="built-with"></a>***Built with***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

- ![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
- ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
- ![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
- ![jsPDF](https://img.shields.io/badge/jsPDF-PDF_export-red?style=for-the-badge)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="important-notices"></a>***Important notices***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

> [!NOTE]
> No necesitas instalar `ng` globalmente. Este proyecto ya incluye Angular CLI en `devDependencies`.
>
> Usa `npm run start` para levantar el servidor local.

> [!IMPORTANT]
> Este repo es el **frontend**. Para autenticarte y usar el dashboard necesitas el backend de BookStar corriendo y configurar `apiUrl` en los environments.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="getting-started"></a>***Getting started***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">
<a id="prerequisites"></a>

### Prerequisites

- Node.js (recomendado: LTS)
- npm
- Backend de BookStar en ejecución (por defecto `http://localhost:3000`)

<a id="installation"></a>

### Installation

1) Clonar el repositorio

```bash
git clone https://github.com/hexed-AAL1X/BookStar-Front.git
cd BookStar-Front
```

2) Instalar dependencias

```bash
npm install
```

3) Ejecutar en modo desarrollo

```bash
npm run start
```

4) Abrir en el navegador

- `http://localhost:4200/`

<a id="available-scripts"></a>

### Available scripts

```bash
npm run start   # ng serve
npm run build   # build producción
npm run watch   # build en modo watch (development)
npm run test    # tests unitarios (Karma)
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="environments"></a>***Environments***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

Los environments están en:

- `src/app/env/enviroment.ts` (dev / local)
- `src/app/env/enviroment.prod.ts` (prod)

Variable relevante:

- `apiUrl`: URL del backend (local: `http://localhost:3000`)

En producción (`ng build`) se usa `enviroment.prod.ts` vía `fileReplacements` en `angular.json`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="deployment"></a>***Deployment***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

### Netlify (gratis)

1) Edita `src/app/env/enviroment.prod.ts` con la URL real de tu API en Render
2) Conecta el repo `BookStar-Front` en Netlify

Config (también en `netlify.toml`):

- Build command: `npm run build`
- Publish directory: `dist/bookstar-front/browser`

3) En el backend (Render), pon `FRONTEND_URL` con la URL de Netlify

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="contributing"></a>***Contributing***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

Contribuciones bienvenidas.

1) Fork del proyecto
2) Crear una rama (`git checkout -b feature/nueva-feature`)
3) Commit (`git commit -m "Add: ..."`)
4) Push (`git push origin feature/nueva-feature`)
5) Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="contact"></a>***Contact***
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">
<p align="center">
  <a href="mailto:hexed_aal1x.ops@proton.me"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white&color=black" /></a>
  <a href="https://www.instagram.com/hexed_aal1x"><img src="https://img.shields.io/badge/instagram-%2312100E.svg?&style=for-the-badge&logo=instagram&logoColor=white&color=black" /></a>
  <a href="https://www.linkedin.com/in/leonardo-bravo-4120b8228/"><img src="https://img.shields.io/badge/linkedin-%2312100E.svg?&style=for-the-badge&logo=linkedin&logoColor=white&color=black" /></a>
</p>
<p align="right">(<a href="#readme-top">back to top</a>)</p>
