# 🏠 Finanzas Casa

Aplicación web para gestionar las finanzas del hogar. Dashboard con gráficos de evolución mensual y gestor de categorías de gastos.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior
- npm (viene con Node.js)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/finanzas-casa.git
cd finanzas-casa

# Instalar dependencias
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abre http://localhost:5173/finanzas-casa/ en tu navegador.

## Despliegue en GitHub Pages

### Opción A: Con gh-pages (recomendado)

1. Crea un repositorio en GitHub llamado `finanzas-casa`

2. Sube el código:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/finanzas-casa.git
git push -u origin main
```

3. Despliega:
```bash
npm run deploy
```

4. Ve a tu repositorio en GitHub → Settings → Pages → verifica que la fuente es la rama `gh-pages`

5. Tu app estará en: `https://TU_USUARIO.github.io/finanzas-casa/`

### Opción B: Con GitHub Actions (automático en cada push)

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Estructura del proyecto

```
finanzas-casa/
├── index.html            # Punto de entrada HTML
├── package.json          # Dependencias y scripts
├── vite.config.js        # Configuración de Vite (base URL para GitHub Pages)
├── src/
│   ├── main.jsx          # Entry point React
│   ├── index.css         # Estilos globales (con dark mode)
│   ├── App.jsx           # Layout principal con navegación
│   ├── lib/
│   │   └── storage.js    # Wrapper de localStorage
│   └── pages/
│       ├── Dashboard.jsx # Dashboard financiero con gráficos
│       └── Categorias.jsx # Gestor de categorías
```

## Uso

### Dashboard
- Los datos de Enero 2025 vienen precargados
- Para añadir un nuevo mes: pestaña "Importar mes" → copia las filas de tu Google Sheet y pega

### Categorías
- Busca, filtra y edita descripciones bancarias
- Crea nuevas categorías y subcategorías
- Marca descripciones para revisar con la banderita

## Notas

- Los datos se guardan en `localStorage` del navegador
- Funciona offline una vez cargada
- Soporta modo oscuro automáticamente
- Si cambias el nombre del repositorio, actualiza `base` en `vite.config.js`
