# Actualización Firebase — Compartir datos en tiempo real

Copia estos ficheros a tu proyecto `finanzas-casa`:

1. `src/lib/storage.js` → reemplaza el existente
2. `src/pages/Dashboard.jsx` → reemplaza el existente
3. `src/pages/Categorias.jsx` → reemplaza el existente
4. `package.json` → reemplaza el existente (añade la dependencia de Firebase)

Luego en la terminal:

```bash
cd finanzas-casa
npm install
git add .
git commit -m "Add Firebase for shared data"
git push
```

Vercel se reconstruye automáticamente. Cuando esté listo:

- Tú importas los datos de enero y febrero desde Google Sheet
- Ana Belén abre la misma URL y los ve en tiempo real
- Cualquier cambio en categorías se sincroniza al instante

NOTA: Las reglas de seguridad de Firebase están en modo prueba
(expiran el 23/04/2026). Antes de esa fecha, ve a Firebase Console →
Realtime Database → Reglas y extiende la fecha o pon reglas permanentes.
