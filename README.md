# MetaFit - Aplicación de Nutrición Inteligente

MetaFit es una aplicación móvil desarrollada con React Native y Expo que ayuda a los usuarios a llevar un registro nutricional inteligente mediante análisis de imágenes con IA, escaneo de códigos de barras y feedback nutricional personalizado.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Despliegue](#despliegue)

## ✨ Características

- 📸 **Análisis de Imágenes con IA**: Toma una foto de tu comida y la IA extrae automáticamente los valores nutricionales
- 🏷️ **Análisis de Etiquetas Nutricionales**: Escanea o fotografía etiquetas nutricionales para extraer información
- 📊 **Escaneo de Códigos de Barras**: Busca productos en la base de datos de Open Food Facts
- 🤖 **Feedback Nutricional Personalizado**: Recibe recomendaciones nutricionales basadas en tus objetivos y perfil
- 📝 **Registro de Comidas**: Guarda tus comidas en un diario personalizado
- 📈 **Historial y Estadísticas**: Visualiza tus consumos anteriores con calificaciones nutricionales
- 👤 **Perfil Nutricional**: Configura tus objetivos, restricciones y preferencias nutricionales

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **pnpm**
- **Expo CLI** (se instala globalmente con `npm install -g expo-cli`)
- **Firebase CLI** (para desplegar funciones): `npm install -g firebase-tools`
- **Cuenta de Firebase** con un proyecto configurado
- **Cuenta de OpenAI** con una API key

### Para desarrollo móvil:

- **iOS**: Xcode (solo en macOS)
- **Android**: Android Studio

## 📦 Instalación

1. **Clonar el repositorio** (si aplica):
   ```bash
   git clone <url-del-repositorio>
   cd TFG-MetaFit
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Instalar dependencias de Firebase Functions**:
   ```bash
   cd functions
   npm install
   cd ..
   ```

## ⚙️ Configuración

### 1. Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)

2. Habilita los siguientes servicios:
   - **Authentication** (con Google Sign-In)
   - **Firestore Database**
   - **Cloud Functions**

3. Obtén las credenciales de Firebase:
   - Ve a Configuración del Proyecto > Tus aplicaciones
   - Crea una aplicación web y copia la configuración

4. Crea el archivo `firebase.ts` en la raíz del proyecto:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth, GoogleAuthProvider } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getFunctions } from 'firebase/functions';

   const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "TU_AUTH_DOMAIN",
     projectId: "TU_PROJECT_ID",
     storageBucket: "TU_STORAGE_BUCKET",
     messagingSenderId: "TU_MESSAGING_SENDER_ID",
     appId: "TU_APP_ID"
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const functions = getFunctions(app);
   ```

5. **Inicializar Firebase CLI**:
   ```bash
   firebase login
   firebase init
   ```
   - Selecciona Firestore y Functions
   - Usa el proyecto de Firebase que creaste

### 2. Configuración de OpenAI

1. Obtén tu API key de OpenAI desde [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Configurar el secret en Firebase**:
   ```bash
   cd functions
   firebase functions:secrets:set OPENAI_API_KEY
   ```
   Ingresa tu API key cuando se solicite.

3. **Desplegar las funciones de Firebase**:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

### 3. Configuración de Permisos

La aplicación requiere los siguientes permisos (ya configurados en `app.json`):

- **Cámara**: Para tomar fotos de comida y escanear códigos de barras
- **Galería**: Para seleccionar imágenes desde la galería

## 🚀 Scripts Disponibles

### Desarrollo

```bash
# Iniciar el servidor de desarrollo
npm start

# Iniciar con caché limpia (útil después de instalar nuevas dependencias)
npx expo start --clear

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios

# Iniciar en Web
npm run web
```

### Linting

```bash
# Ejecutar el linter
npm run lint
```

### Firebase Functions

```bash
# Compilar TypeScript
cd functions
npm run build

# Desplegar todas las funciones
firebase deploy --only functions

# Desplegar una función específica
firebase deploy --only functions:generarFeedbackNutricional

# Ver logs de las funciones
firebase functions:log
```

## 📁 Estructura del Proyecto

```
TFG-MetaFit/
├── app/                    # Pantallas y rutas (Expo Router)
│   ├── (tabs)/           # Navegación por pestañas
│   ├── registro-comida.tsx
│   ├── registro-manual.tsx
│   └── ...
├── components/            # Componentes reutilizables
│   ├── formulario-comida/
│   ├── formulario-info-nutricional/
│   ├── screens/
│   ├── tabla-consumos/
│   └── ui/
├── constants/            # Constantes y temas
├── functions/            # Firebase Cloud Functions
│   └── src/
│       └── index.ts     # Funciones de OpenAI y análisis
├── hooks/               # Custom hooks
├── utils/               # Utilidades y funciones helper
│   ├── comidas.ts      # Gestión de comidas
│   ├── consumos.ts     # Gestión de consumos
│   ├── feedback.ts     # Gestión de feedback
│   ├── image.ts        # Utilidades de imágenes
│   ├── openai.ts       # Cliente de OpenAI
│   └── nutritional-profile.ts
├── assets/             # Imágenes y recursos
└── firebase.ts         # Configuración de Firebase
```

## 🎯 Funcionalidades Principales

### 1. Registro de Comidas

- **Registro Manual**: Ingresa manualmente los valores nutricionales
- **Análisis de Imagen**: Toma una foto de tu comida y la IA extrae los datos
- **Análisis de Etiqueta**: Escanea o fotografía etiquetas nutricionales
- **Escaneo de Código de Barras**: Busca productos en Open Food Facts

### 2. Feedback Nutricional

- Análisis personalizado basado en tu perfil nutricional
- Calificaciones: Alta, Media, Baja
- Recomendaciones específicas para mejorar tu alimentación
- Considera el tipo de comida (Desayuno, Almuerzo, Cena, etc.)

### 3. Historial y Estadísticas

- Visualiza tus consumos anteriores
- Filtra por fecha
- Paginación de resultados
- Calificaciones nutricionales con colores

### 4. Perfil Nutricional

- Configura tus objetivos (perder peso, ganar masa, etc.)
- Establece restricciones alimentarias
- Define preferencias nutricionales
- Personaliza tu perfil con edad, peso, altura, etc.

## 🚢 Despliegue

### Desarrollo

Para desarrollo local, simplemente ejecuta:
```bash
npm start
```

Luego escanea el código QR con la app Expo Go en tu dispositivo móvil.

### Producción

#### Android

1. **Generar APK/AAB**:
   ```bash
   eas build --platform android
   ```

2. O usa:
   ```bash
   npx expo build:android
   ```

#### iOS

1. **Generar IPA**:
   ```bash
   eas build --platform ios
   ```

2. O usa:
   ```bash
   npx expo build:ios
   ```

### Firebase Functions

Las funciones se despliegan automáticamente cuando ejecutas:
```bash
cd functions
firebase deploy --only functions
```

## 🔐 Variables de Entorno

Las siguientes configuraciones se manejan a través de Firebase Secrets:

- `OPENAI_API_KEY`: API key de OpenAI (configurada en Firebase Secrets)

## 📝 Notas Importantes

- **Índices de Firestore**: Algunas consultas pueden requerir índices compuestos. Firebase te proporcionará un enlace para crearlos automáticamente cuando sea necesario.

- **Permisos de Cámara**: Asegúrate de que los permisos estén configurados correctamente en `app.json` y que el usuario los conceda en la primera ejecución.

- **Límites de OpenAI**: Ten en cuenta los límites de uso de la API de OpenAI para evitar costos inesperados.

## 🛠️ Tecnologías Utilizadas

- **React Native**: Framework para desarrollo móvil
- **Expo**: Plataforma y herramientas para React Native
- **TypeScript**: Tipado estático
- **Firebase**: Backend como servicio (Auth, Firestore, Functions)
- **OpenAI API**: Análisis de imágenes y generación de feedback
- **Open Food Facts**: Base de datos de productos alimenticios

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado (TFG).

## 👥 Autor

Desarrollado como parte del Trabajo de Fin de Grado.

---

Para más información sobre Expo, visita la [documentación oficial](https://docs.expo.dev/).
