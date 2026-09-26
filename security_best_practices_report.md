# Reporte de seguridad — Mi presupuesto

**Fecha:** 24 de septiembre de 2026  
**Alcance:** aplicación React 19 / Vite 8, código cliente estático y dependencias npm.  
**Fuera de alcance:** configuración del servidor, hosting, CDN y los encabezados HTTP efectivos, que no existen en este repositorio.

## Resumen ejecutivo

No se identificaron vulnerabilidades críticas ni altas en el código revisado. La aplicación es una SPA local sin autenticación, backend ni llamadas de red; no contiene secretos, tokens, rutas de redirección, mensajería entre ventanas ni inyección directa de HTML. React renderiza los textos introducidos por el usuario de forma escapada.

`npm audit --omit=dev` se ejecutó contra el registro de npm y reportó **0 vulnerabilidades conocidas** para las dependencias instaladas.

Se encontraron tres oportunidades de endurecimiento para considerar antes de publicar la app en Internet. Ninguna impide el uso local actual.

## Hallazgos

### SEC-001 — Faltan controles de encabezados para un eventual despliegue público

**Severidad:** Media (endurecimiento; no explotable por sí solo en el uso local actual)  
**Reglas:** REACT-CSP-001, REACT-HEADERS-001  
**Ubicación:** [index.html](index.html#L1-L13), [vite.config.js](vite.config.js#L1-L6)

**Evidencia:** el documento HTML únicamente define metadatos de charset, viewport y theme-color; no hay una política CSP. El repositorio tampoco contiene configuración de hosting/edge que establezca `Content-Security-Policy`, `X-Content-Type-Options`, defensa contra clickjacking, `Referrer-Policy` o `Permissions-Policy`.

**Impacto:** si la aplicación se expone públicamente, la ausencia de estas capas reduce la protección frente a futuros errores de XSS, incrustación en iframes y carga accidental de recursos no esperados. No hay un vector XSS identificado hoy.

**Corrección recomendada:** configurar los encabezados en el servidor o plataforma de hosting al desplegar. Como base inicial, usar una CSP ajustada a los recursos reales, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` (si no se permite embeber), `Referrer-Policy: strict-origin-when-cross-origin` y una `Permissions-Policy` restrictiva.

**Verificación / falsos positivos:** estas cabeceras pueden ser aplicadas por el proveedor de hosting; deben verificarse sobre la respuesta HTTP de producción antes de clasificarlo como incumplimiento definitivo.

### SEC-002 — Dependencia remota de Google Fonts sin política de recursos

**Severidad:** Baja  
**Reglas:** REACT-SRI-001, REACT-3P-001  
**Ubicación:** [src/styles.css](src/styles.css#L1)

**Evidencia:**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans...');
```

**Impacto:** cada visita pública contacta a un tercero y la hoja CSS remota queda fuera del control de versión del proyecto. No es una vulnerabilidad de ejecución de JavaScript en el estado actual, pero añade dependencia de disponibilidad y privacidad.

**Corrección recomendada:** autoalojar las fuentes si se prioriza privacidad y operación sin terceros. Si se conservan, limitar `style-src` y `font-src` a los dominios necesarios mediante CSP.

**Verificación / falsos positivos:** es aceptable para una app de uso personal local si se acepta la conexión externa a Google Fonts.

### SEC-003 — Datos locales sin validación estructural al restaurar estado

**Severidad:** Baja  
**Reglas:** JS-STORAGE-001, REACT-AUTH-001  
**Ubicación:** [src/App.jsx](src/App.jsx#L35-L41), [src/App.jsx](src/App.jsx#L45-L46)

**Evidencia:**

```jsx
const data = JSON.parse(stored)
if (data.incomes) setIncomes(data.incomes)
if (Array.isArray(data.expenses)) setExpenses(data.expenses)
```

**Impacto:** un valor manipulado en `localStorage` puede causar datos incoherentes o una experiencia rota. No se almacenan credenciales ni tokens, y los nombres se renderizan mediante JSX normal —no mediante HTML crudo—, por lo que no se identificó riesgo de XSS por esta vía.

**Corrección recomendada:** validar el esquema (tipo de objetos, lista permitida de meses, números finitos, límite de longitud de nombres) antes de aceptar datos almacenados. Añadir una opción visible de “restablecer datos locales” como recuperación.

**Verificación / falsos positivos:** para una aplicación personal en un dispositivo confiable, el riesgo es de integridad/disponibilidad local y no de acceso remoto.

### SEC-004 — Versiones declaradas como `latest`

**Severidad:** Baja  
**Regla:** cadena de suministro / reproducibilidad  
**Ubicación:** [package.json](package.json#L11-L15)

**Evidencia:** React, React DOM, Vite y el plugin React están declarados como `latest`.

**Impacto:** una instalación futura puede obtener versiones distintas sin revisión explícita, introduciendo cambios incompatibles o una dependencia inesperada. El `package-lock.json` actual fija la instalación presente, pero `package.json` sigue siendo abierto.

**Corrección recomendada:** fijar rangos de versiones revisados y actualizar dependencias de forma deliberada con `npm audit` y pruebas antes de publicar.

## Controles verificados sin hallazgos

- No se encontraron `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `new Function` ni temporizadores con cadenas.
- No se encontraron `fetch`, Axios, WebSockets, redirecciones, `window.open`, `postMessage` ni service workers.
- No se encontraron secretos, claves API, credenciales, tokens o variables de entorno expuestas.
- `localStorage` contiene únicamente presupuesto local; no contiene autenticación ni secretos.
- No hay scripts de terceros en `index.html`; el único recurso externo detectado son las fuentes de Google.
- La compilación de producción finaliza correctamente con `npm run build`.

## Próximos pasos recomendados

1. Antes de publicar, definir el proveedor de hosting y añadir los encabezados de SEC-001 en esa capa.
2. Decidir si autoalojar las fuentes o permitir explícitamente Google Fonts mediante CSP.
3. Aplicar validación del esquema local y fijar versiones de dependencias.

No se efectuó ningún cambio al código de la aplicación como parte de esta auditoría.
