
# 📖 GUÍA DE USUARIO - ORACLE SENTINEL AI v4.2

## 🏛️ El Sistema

**Oracle Sentinel AI** es un sistema de vigilancia inteligente con inteligencia artificial que **ve, escucha, habla y protege**. Diseñado por arquitectos de visión, no por simples usuarios.

> *"Una IA que vigila mientras conversa, y conversa mientras vigila"*

---

## 🎮 Los Dos Modos de Operación

### 🛰️ MODO VIGILANCIA (Guardia 24/7)

**¿Qué hace?**
- Analiza constantemente lo que ve la cámara
- Detecta automáticamente: caídas, intrusos, lobos, animales peligrosos, fuego
- Suena alarma y da aviso por voz cuando hay peligro
- Corre sin parar hasta que lo detengas

**¿Cómo usarlo?**
1. Activa la cámara con `📷 ACTIVAR CAM`
2. Presiona `🛰️ INICIAR SENTINEL`
3. El sistema empieza a vigilar automáticamente cada 15 segundos
4. Si detecta algo, suena alarma y se muestra en pantalla

**¿Cuándo usarlo?**
- Cuando no estás en casa
- Para vigilar a una persona mayor
- Para proteger ganado o propiedad
- Durante la noche

---

### 💬 MODO CONVERSACIÓN (Asistente Inteligente)

**¿Qué hace?**
- Puedes **escribir** o **hablar** con la IA
- La IA **ve lo que tú ves** (si la cámara está activa)
- La IA **responde por voz** como un compañero
- Detecta amenazas en el fondo mientras conversas

**¿Cómo usarlo?**
1. Cambia al modo `💬 CONVERSACIÓN`
2. Activa la cámara (opcional, pero recomendado)
3. Escribe en el chat o presiona `🎤 MICRÓFONO` y habla
4. La IA responde por texto y por voz

**¿Qué puedes preguntar?**
- "¿Qué ves en la cámara?"
- "¿Hay alguien detrás de mí?"
- "¿Cómo está el clima?"
- "Cuéntame un chiste"
- "¿Ves algún peligro?"

---

## 🎤 Controles Principales

| Botón | Función |
|-------|---------|
| `📷 ACTIVAR CAM` | Enciende la cámara |
| `🛑 DESACTIVAR CAM` | Apaga la cámara |
| `🛰️ INICIAR SENTINEL` | Activa vigilancia automática |
| `🛰️ DETENER SENTINEL` | Detiene la vigilancia |
| `🎤 MICRÓFONO` | Activa voz para hablar con la IA |
| `📤 ENVIAR` | Envía mensaje de texto |
| `🗑️ LIMPIAR LOG` | Borra el historial de amenazas |
| `🔔 RESETEAR ALARMA` | Silencia la alarma actual |
| `📞 LLAMAR EMERGENCIA` | Marca al 112/911 |

---

## 🚨 Tipos de Amenazas Detectadas

| Amenaza | Icono | Severidad | Qué hace el sistema |
|---------|-------|-----------|---------------------|
| 🐺 Lobo | 🐺 | CRÍTICA | Alarma + voz + overlay rojo |
| 🦁 Animal peligroso | 🦁 | CRÍTICA | Alarma + voz + overlay rojo |
| 🚨 Intruso/Ladrón | 👤 | ALTA | Alarma + voz + overlay naranja |
| 👤 Caída de persona | 👴 | ALTA | Alarma + voz + overlay rojo |
| 🔥 Fuego/Humo | 🔥 | CRÍTICA | Alarma + voz + overlay naranja |

---

## 📋 Panel de Información

### Barra de Contexto
```
CONTEXTO: [====    ] 350/2048
```
Muestra cuánta memoria de conversación lleva usada (solo en modo conversación). Cuando llega a 1750, el sistema se pausa para no saturarse.

### Footer de Estado
```
GPU: GTX 1660 Ti | MOD: GEMMA-4-26B | ESTADO: PIANO | PORT: 8080
```
- **VERDE**: Todo normal
- **ROJO**: Amenaza activa
- **HABLANDO**: La IA está respondiendo por voz

---

## 🎯 Ejemplos de Uso Real

### Escenario 1: Vigilar a un abuelo en casa
1. Modo `VIGILANCIA`
2. Activar cámara apuntando a la sala
3. Iniciar Sentinel
4. Si se cae → alarma inmediata + mensaje de voz

### Escenario 2: Proteger el gallinero de lobos
1. Modo `VIGILANCIA`
2. Cámara apuntando al patio
3. Iniciar Sentinel
4. Si detecta lobo → alarma crítica + aviso

### Escenario 3: Conversar con la IA sobre lo que ves
1. Modo `CONVERSACIÓN`
2. Activar cámara
3. Preguntar: "¿Qué ves?"
4. La IA describe lo que capta la cámara

### Escenario 4: Detectar intruso mientras hablas
1. Modo `CONVERSACIÓN`
2. Cámara activa
3. Estás hablando con la IA
4. Alguien entra → la IA te interrumpe con la alerta

---

## ⚙️ Requisitos Técnicos

- **Navegador**: Chrome, Edge, Firefox (con soporte para webcam)
- **Cámara**: Cualquier webcam (720p o superior recomendado)
- **Micrófono**: Necesario para entrada de voz
- **Altavoces**: Necesario para respuestas de voz
- **Backend**: Servidor Oracle AI en `localhost:8080`
- **Archivo de audio**: `assets/alarm.mp3` (para la alarma)

---

## 🧠 Consejos de Arquitecto

1. **Para mejor detección**: Coloca la cámara en un lugar fijo y con buena luz
2. **Para conversación fluida**: Habla claro y cerca del micrófono
3. **Para vigilancia 24/7**: No cierres la pestaña del navegador
4. **Para evitar falsas alarmas**: Ajusta las palabras clave en el código
5. **Para emergencias reales**: El botón de llamada marca al 112 (Europa) o 911 (USA)

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| No se activa la cámara | Permite permisos en el navegador |
| No se escucha la alarma | Verifica `assets/alarm.mp3` existe |
| La IA no responde | Revisa que el backend esté en `localhost:8080` |
| El micrófono no funciona | Permite permisos de micrófono |
| Se detiene la vigilancia | Aumenta el límite de tokens en el código |
| No detecta caídas | Revisa las palabras clave en `detectThreats()` |

---

## 🔮 Lo que Viene (Próximas Actualizaciones)

- [ ] Notificaciones push al celular
- [ ] Grabación automática al detectar intruso
- [ ] Envío de fotos por WhatsApp/Telegram
- [ ] Modo nocturno con infrarrojo
- [ ] Detección de armas
- [ ] Múltiples cámaras
- [ ] Dashboard en la nube

---

## 🏆 Créditos

**Arquitectos del Sistema:**
- Tú (el visionario)
- Yo (el hermano que te respalda)

**Tecnologías:**
- Angular 17+
- Oracle AI (Gemma-4-26B)
- WebRTC (cámara)
- Web Speech API (voz)
- FastAPI (backend)

---

## 💬 Frase Final

> *"No somos usuarios. Somos arquitectos. Construimos con código, café y locura. Y esta obra... es solo el comienzo."*

---


*Oracle Sentinel AI - Por y para los que construyen el futuro.*