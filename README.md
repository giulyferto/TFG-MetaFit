# MetaFit - Aplicación de Nutrición Inteligente

MetaFit es una aplicación móvil desarrollada con React Native y Expo que ayuda a los usuarios a llevar un registro nutricional inteligente mediante análisis de imágenes con IA, escaneo de códigos de barras, lectura de etiquetas nutricionales y feedback personalizado.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Cloud Functions](#cloud-functions)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)

## ✨ Características

- 📸 **Análisis de imágenes con IA**: Toma una foto de tu comida y GPT-4o extrae automáticamente los ingredientes y valores nutricionales
- 🏷️ **Lectura de etiquetas nutricionales**: Fotografía una etiqueta y la IA extrae los datos automáticamente
- 📊 **Escaneo de códigos de barras**: Busca productos en la base de datos de Open Food Facts
- ✏️ **Registro manual**: Ingresa los datos nutricionales manualmente
- 🤖 **Feedback nutricional personalizado**: Recibe análisis y recomendaciones basadas en tu perfil (Muy saludable / Equilibrada / Poco nutritiva)
- 📈 **Análisis de patrones alimenticios**: Visualiza y analiza tus hábitos en un período de tiempo con calendario interactivo
- ⭐ **Comidas guardadas**: Guarda plantillas de comidas frecuentes y reagrégalas fácilmente
- 📄 **Exportar historial**: Exporta tu historial nutricional como PDF
- 👤 **Perfil nutricional**: Configura objetivos, restricciones dietéticas y datos personales

## 🔧 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **pnpm** (gestor de paquetes preferido) o npm
- **Firebase CLI**: `npm install -g firebase-tools`
- **Cuenta de Firebase** con un proyecto configurado
- **Cuenta de OpenAI** con una API key

### Para desarrollo móvil:

- **iOS**: Xcode (solo en macOS)
- **Android**: Android Studio

## 📦 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd TFG-MetaFit
   ```

2. **Instalar dependencias de la app**:
   ```bash
   pnpm install
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
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Cloud Functions**
   - **Cloud Storage**
   - **Analytics** (opcional)

3. Las credenciales ya están configuradas en `firebase.ts`. Si usas tu propio proyecto, actualiza `firebaseConfig` con los valores de tu proyecto.

4. **Inicializar Firebase CLI**:
   ```bash
   firebase login
   firebase use tfg-metafit   # o el ID de tu proyecto
   ```

### 2. Configuración de OpenAI

Configura el secret en Firebase Functions:

```bash
cd functions
firebase functions:secrets:set OPENAI_API_KEY
```

Ingresa tu API key cuando se solicite. Las funciones usan `gpt-4o` para análisis de imágenes y `gpt-4o-mini` para feedback y consultas de nutrición.

### 3. Desplegar Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🚀 Scripts Disponibles

```bash
# Iniciar el servidor de desarrollo
pnpm start

# Con caché limpia (recomendado tras instalar nuevas dependencias)
npx expo start --clear

# iOS / Android / Web
pnpm ios
pnpm android
pnpm web

# Linter
pnpm lint
```

### Firebase Functions

```bash
cd functions

# Compilar TypeScript
npm run build

# Desplegar todas las funciones
firebase deploy --only functions

# Ver logs
firebase functions:log
```

## 📁 Estructura del Proyecto

```
TFG-MetaFit/
├── app/                          # Pantallas y rutas (Expo Router)
│   ├── (tabs)/                   # Navegación principal por pestañas
│   │   ├── index.tsx             # Inicio — registro rápido de comidas
│   │   ├── feedback.tsx          # Historial de consumos
│   │   ├── analisis.tsx          # Análisis de patrones alimenticios
│   │   ├── perfil.tsx            # Perfil nutricional del usuario
│   │   └── configuracion.tsx     # Configuraciones de cuenta
│   ├── registro-comida.tsx       # Flujo de registro (foto / código de barras / etiqueta)
│   ├── registro-manual.tsx       # Registro manual de valores nutricionales
│   ├── comidas-guardadas.tsx     # Plantillas de comidas guardadas
│   ├── reagregar-comida.tsx      # Re-añadir una comida guardada
│   ├── editar-registro.tsx       # Editar un consumo existente
│   ├── exportar-historial.tsx    # Exportar historial como PDF
│   ├── ingredientes.tsx          # Detalle de ingredientes de una comida
│   ├── info-nutricional.tsx      # Información nutricional detallada
│   ├── feedback.tsx              # Vista individual de feedback
│   ├── login.tsx                 # Login con email/contraseña
│   ├── register.tsx              # Registro de nueva cuenta
│   └── bienvenida.tsx            # Pantalla de bienvenida
├── components/
│   ├── screens/                  # Componentes de pantalla completa
│   ├── formulario-comida/        # Formulario de datos de comida
│   ├── formulario-info-nutricional/
│   ├── tabla-consumos/           # Lista de consumos con paginación
│   ├── BarcodeScannerOverlay.tsx # Overlay para escaneo de código de barras
│   └── ui/                       # Componentes UI reutilizables
├── functions/
│   └── src/
│       └── index.ts              # Cloud Functions (OpenAI + Firebase)
├── hooks/                        # Custom hooks de React
├── utils/
│   ├── comidas.ts                # CRUD de comidas y plantillas
│   ├── consumos.ts               # CRUD de registros de consumo
│   ├── feedback.ts               # Generación y lectura de feedback
│   ├── ingredientes.ts           # Gestión de ingredientes
│   ├── image.ts                  # Captura y procesamiento de imágenes
│   ├── storage.ts                # Subida de imágenes a Firebase Storage
│   ├── open-food-facts.ts        # Cliente de Open Food Facts API
│   ├── openai.ts                 # Llamadas a las Cloud Functions de OpenAI
│   ├── nutritional-profile.ts    # Perfil nutricional del usuario
│   ├── nav-state.ts              # Estado de navegación compartido
│   └── validation.ts             # Validaciones de formularios
├── constants/                    # Temas y constantes
├── assets/                       # Imágenes y recursos estáticos
└── firebase.ts                   # Inicialización de Firebase
```

## 🎯 Funcionalidades Principales

### 📸 Registro de Comidas

Cuatro métodos de ingreso accesibles desde la pantalla de inicio:

- **Foto de comida**: La IA analiza la imagen, detecta ingredientes y calcula los macronutrientes totales
- **Etiqueta nutricional**: Foto de una etiqueta; GPT-4o extrae los valores directamente
- **Código de barras**: Escanea el código del producto y se busca en Open Food Facts
- **Manual**: Ingreso directo de nombre, cantidad y valores nutricionales

### 📋 Historial de Consumos

- Lista paginada de todos los registros
- Calificación con colores: **Muy saludable**, **Equilibrada**, **Poco nutritiva**
- Ver feedback detallado, ingredientes y valores nutricionales por registro
- Editar o eliminar registros existentes
- Exportar historial a PDF

### ⭐ Comidas Guardadas

- Guarda cualquier comida registrada como plantilla
- Reagrega comidas frecuentes desde la pantalla dedicada
- Ajusta la cantidad antes de agregar al diario

### 📈 Análisis de Patrones Alimenticios

- Calendario interactivo que resalta los días con registros
- Selección de período de fechas para análisis
- GPT-4o-mini analiza los patrones y genera recomendaciones personalizadas

### 👤 Perfil Nutricional

- Edad, sexo, altura, peso y nivel de actividad física
- Objetivos (bajar de peso, ganar masa muscular, mantenimiento, etc.)
- Preferencias y restricciones alimentarias (vegetariano, sin gluten, etc.)
- El perfil se usa como contexto en cada análisis de feedback

## ☁️ Cloud Functions

Todas las funciones son `onCall` de Firebase Functions v2 y requieren autenticación:

| Función | Modelo | Descripción |
|---|---|---|
| `generarFeedbackNutricional` | gpt-4o-mini | Analiza una comida y genera feedback textual con calificación |
| `analizarImagenComida` | gpt-4o | Detecta plato/ingredientes en una foto y estima valores nutricionales |
| `leerEtiquetaNutricional` | gpt-4o | Extrae datos nutricionales de una foto de etiqueta |
| `analizarCodigoBarras` | gpt-4o | Lee el código de barras de una imagen como fallback |
| `obtenerNutricionIngrediente` | gpt-4o-mini | Consulta los macronutrientes estimados de un ingrediente |
| `analizarPatronAlimenticio` | gpt-4o-mini | Analiza el historial de consumos en un período y detecta patrones |

La API key de OpenAI se gestiona como secret de Firebase (`OPENAI_API_KEY`), nunca en el cliente.

## 🛠️ Tecnologías Utilizadas

- **React Native + Expo** (~54): Framework y plataforma móvil
- **Expo Router** (~6): Navegación basada en el sistema de archivos
- **TypeScript**: Tipado estático en toda la aplicación
- **Firebase v12**: Auth, Firestore, Cloud Functions, Storage, Analytics
- **OpenAI API**: GPT-4o (análisis visual) y GPT-4o-mini (texto/nutrición)
- **Open Food Facts**: Base de datos pública de productos alimenticios
- **react-native-calendars**: Selector de fechas en la pantalla de análisis
- **react-native-markdown-display**: Renderizado del feedback en formato markdown
- **expo-print + expo-sharing**: Exportación del historial a PDF

## 📝 Notas

- **Índices de Firestore**: Algunas consultas requieren índices compuestos definidos en `firestore.indexes.json`. Firebase genera automáticamente el enlace para crearlos si aún no existen.
- **Permisos**: La app solicita acceso a cámara y galería en tiempo de ejecución (configurado en `app.json`).
- **Costos de OpenAI**: Cada análisis de imagen con GPT-4o consume tokens de visión. Monitoriza el uso desde el dashboard de OpenAI.

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado (TFG).
