# Evaluaciones prácticas semestrales MinasLab

Guía docente de las cinco evaluaciones prácticas 3D (una por semestre) de Ingeniería en Minas / Ingeniería Civil en Minas.

## Base curricular

Cada evaluación se ancla en la **asignatura con Prueba Nacional (PNA)** del semestre e integra asignaturas de apoyo del mismo nivel.

Los resultados de aprendizaje (RA) provienen de las **Rutas de Aprendizaje** del PCE 2021. Las competencias C1–C6 son las seis competencias numeradas del **Perfil de Egreso**:

| Código | Competencia del perfil de egreso |
|---|---|
| C1 | Dirigir procesos de perforación, tronadura, carguío y transporte según normativa vigente |
| C2 | Desarrollar programas de trabajo para el personal técnico a su cargo |
| C3 | Aplicar normas de prevención de riesgos, seguridad e higiene industrial |
| C4 | Integrar instrumentos de diseño y evaluación de proyectos con enfoque innovador |
| C5 | Comunicación efectiva y resolución de problemas, trabajo en equipo y liderazgo |
| C6 | Habilidades ciudadanas y compromiso con el desarrollo humano sostenible |

> **Alcance de la tributación**
> - Los documentos institucionales no traen una matriz oficial asignatura → competencia para el PCE 2021. La asignación de competencias a cada tarea es una **alineación propuesta** que el comité curricular debe validar.
> - Los programas tampoco fijan parámetros numéricos (altura de banco, factor de carga, etc.). Los rangos usados son valores de referencia de la industria chilena.

## Funcionamiento común

- **Caso único por estudiante.** Los datos (geometría, leyes, costos, etc.) se generan con una semilla estable por estudiante. La semilla se guarda en su estado, de modo que el caso se mantiene entre sesiones y tras un respaldo y restauración del curso.
- **Corrección en servidor.** Las respuestas correctas nunca viajan al navegador antes de cerrar la tarea.
  - Las tareas numéricas aceptan coma o punto decimal y tienen tolerancia absoluta o relativa. Fuera de la tolerancia, pero dentro de 2,5 veces ella, reciben 50 %.
  - Las de selección múltiple restan los errores a los aciertos.
  - Las de ordenamiento otorgan crédito parcial por pares en orden relativo correcto.
- **Intentos y penalización** configurables (por defecto 3 intentos y 20 % por reintento); se conserva el mejor puntaje.
- **Guardado automático del avance.** Se guardan respuestas en borrador, mediciones, lecturas de brújula, notas de la libreta de campo, la tarea activa y la vista de cámara. El guardado ocurre con cada cambio, periódicamente y al cerrar la pestaña.
- **Nota.** Se publica en el libro de calificaciones (escala de la actividad). Además se muestra en escala chilena 1,0–7,0 con exigencia configurable (60 % por defecto) y con el logro por RA.
- **Instrumentos virtuales**:
  - *Explorar* (fichas de inspección).
  - *Medir* (distancia inclinada, DH, ΔZ, azimut y pendiente). Se ajusta a líneas de cresta y pata, estacas e hitos.
  - *Brújula* (dirección de manteo y manteo).
  - Vistas isométrica, en planta y de perfil; capas.
- **Informes docentes.** *Resultados de la evaluación* muestra por estudiante el puntaje de cada tarea, el logro por RA, la nota 1–7, la calificación y la exportación CSV. Desde ahí se accede a *Revisar*, que muestra la respuesta, la respuesta correcta con su desarrollo, los borradores y las notas. *Reiniciar* entrega un caso nuevo con otros datos.

## Semestre I — Bases de las Operaciones Mineras

**Apoyo:** Topografía e Interpretación de Planos, Prevención de Riesgos.

**Escena:** faena escuela a rajo con portal de galería exploratoria, bloque de tronadura, pala, camiones y muestreo por canal.

| Tarea | Tipo | Cálculo / criterio | Tolerancia | RA | Comp. | Peso |
|---|---|---|---|---|---|---|
| Inspección DS 132 | múltiple | 6 puntos con observación; marcar las condiciones subestándar | — | PR-RA2, BOM-RA1 | C3 | 20 |
| Ángulo interrampa | numérica | θ = arctan[H/(H/tan α + B)] con H y B medidos | ±0,8° | BOM-RA1, BOM-RA2 | C1 | 15 |
| Cubicación del bloque | numérica | T = L·A·H·ρ (L y A medidos entre estacas) | ±4 % | BOM-RA1, TOP-OBJ | C1 | 20 |
| Viajes de camión | numérica | ⌈T / capacidad⌉ | ±0,5 | BOM-RA1 | C1, C2 | 10 |
| Pendiente de rampa | numérica | i = ΔZ/DH·100 entre hitos A y B | ±0,4 pp | TOP-OBJ, BOM-RA2 | C1 | 15 |
| Muestreo por canal | numérica | Σ(l·ley)/Σl | ±0,01 % | BOM-RA3 | C1 | 10 |
| Ciclo de operaciones | orden | perforación → tronadura → carguío → transporte → chancado/botadero | — | BOM-RA1 | C1 | 10 |

## Semestre II — Geología Estructural y de Minas

**Apoyo:** Topografía de Minas, Probabilidad y Estadística.

**Escena:** pared norte de una fase con tres familias de diaclasas, estación topográfica, caja porta-testigos y perfil geotécnico.

| Tarea | Tipo | Cálculo / criterio | Tolerancia | RA | Comp. | Peso |
|---|---|---|---|---|---|---|
| Rumbo de J3 | numérica | rumbo RHR = dirección de manteo − 90° (con brújula) | ±2° | GEM-RA1 | C1 | 15 |
| Manteo aparente de J1 | numérica | tan α = tan δ·cos(Δ azimut) | ±1° | GEM-RA1, GEM-RA2 | C1 | 15 |
| Markland de J2 | selección | \|Δ dir. manteo\| ≤ 20° y φ < δ < talud | — | GEM-RA1, GEM-RA2 | C3 | 15 |
| FS falla plana (J1) | numérica | W = ½γH²(cot ψp − cot ψf); FS = (cA + W cos ψp tan φ)/(W sen ψp) | ±4 % | GEM-RA1 | C3, C1 | 20 |
| RQD | numérica | Σ trozos ≥ 10 cm / corrida | ±1 pp | GEM-RA3, GEM-RA1 | C1 | 15 |
| Q de Barton | numérica | (RQD/Jn)(Jr/Ja)(Jw/SRF) | ±5 % | GEM-RA1 | C1 | 10 |
| Replanteo de pozo | numérica | N = N₀ + DH·cos Az | ±0,05 m | TPM-OBJ, GEM-RA3 | C2 | 10 |

## Semestre III — Prospección y Evaluación de Yacimientos Mineros

**Apoyo:** Perforación y Tronadura.

**Escena:** campaña de 6 sondajes diamantinos sobre un pórfido. La capa *Ver subsuelo* muestra el cuerpo mineralizado, los tramos ensayados y las secciones. Incluye un banco piloto con malla de perforación.

| Tarea | Tipo | Cálculo / criterio | Tolerancia | RA | Comp. | Peso |
|---|---|---|---|---|---|---|
| Compósito | numérica | Σ(l·ley)/Σl del intercepto | ±0,01 % | PEY-RA1, PEY-RA2 | C4 | 15 |
| QA/QC | múltiple | lotes con estándar fuera de ±2σ (carta de control) | — | PEY-RA1 | C4 | 15 |
| Cubicación por secciones | numérica | V = d(A1+A2)/2 + d(A2+A3)/2; T = V·ρ | ±1 % | PEY-RA2 | C4 | 20 |
| Ley de corte crítica | numérica | (Cm+Cp)/[(P−CR)·R·2.204,62]·100 | ±0,005 % | PEY-RA2 | C4 | 15 |
| Categorización | selección | distancia al sondaje: ≤ 50 m medido; 50–100 m indicado; > 100 m inferido | — | PEY-RA2 | C4 | 10 |
| Factor de carga | numérica | q = π/4·d²·ρ; Q = q(H+J−T); FC = Q/(B·S·H) | ±3 % | PYT-RA2 | C1 | 15 |
| Secuencia de carguío | orden | aislar → verificar/soplar → primar → columna → taco → amarre y evacuación | — | PYT-RA2 | C3, C1 | 10 |

## Semestre IV — Sistema de Explotación a Rajo Abierto

**Apoyo:** Ventilación de Minas, Diseño y Evaluación de Proyectos.

**Escena:** rajo de cobre en operación con rampa tallada en la pared, camiones de alto tonelaje animados, pala, despacho, botadero, chancado y portal de rampa subterránea.

| Tarea | Tipo | Cálculo / criterio | Tolerancia | RA | Comp. | Peso |
|---|---|---|---|---|---|---|
| Ángulo interrampa | numérica | arctan[H/(H/tan α + B)] | ±0,8° | RAJ-RA4 | C1 | 10 |
| Ángulo global | numérica | arctan[nH/(nH/tan α + (n−1)B + Wr)] | ±0,8° | RAJ-RA4, RAJ-RA1 | C1 | 15 |
| Ancho de rampa | numérica | 3,5·W + D/tan 41° + cuneta | ±0,3 m | RAJ-RA3, RAJ-RA4 | C3, C1 | 10 |
| Regla de Taylor | numérica | VOE = 5,35·R^0,273; ROP = R/VOE | ±2 % | RAJ-RA2 | C4 | 15 |
| Flota | numérica | ⌈t·día / (carga·60/ciclo · 2·h efectivas)⌉ | ±0,5 | RAJ-RA3, RAJ-RA2 | C1, C2 | 20 |
| Destino de bloques | múltiple | ley ≥ ley de corte → planta | — | RAJ-RA2, RAJ-RA4 | C4 | 20 |
| Caudal de ventilación | numérica | Q = 3·personas + 2,83·HP (m³/min, DS 132) | ±1 % | VEN-RA3 | C3 | 10 |

La geometría 3D es coherente con la fórmula del ángulo global: bajo la rampa, los bancos interiores se desplazan hacia el centro en el ancho de la rampa, como en un diseño real.

## Semestre V — Proyecto Minero

**Apoyo:** Servicios Mineros, Diseño y Evaluación de Proyectos, Dirección y Gestión de Empresas.

**Escena:** emplazamiento del proyecto con rajo, sumidero y cañería de drenaje, planta concentradora, correa, río, campamento, botadero y tres sitios candidatos para el depósito de relaves.

| Tarea | Tipo | Cálculo / criterio | Tolerancia | RA | Comp. | Peso |
|---|---|---|---|---|---|---|
| Vida útil (Taylor) | numérica | VOE = 5,35·R^0,273 | ±2 % | PM-RA1, PM-RA3 | C4 | 15 |
| Ingreso anual | numérica | ROP·ley·R·2.204,62·(P−CR) | ±2 % | PM-RA2 | C4 | 15 |
| VAN | numérica | FC = (EBITDA−D)(1−t)+D; VAN = −I₀ + FC·[1−(1+i)^−n]/i | ±1,5 % del CAPEX | PM-RA2, DEP-RA7 | C4 | 20 |
| TIR | numérica | tasa que anula el VAN | ±0,3 pp | DEP-RA7, PM-RA2 | C4 | 10 |
| Sensibilidad al precio | selección | VAN con precio −15 % | — | PM-RA2, PM-RA1 | C4, C5 | 10 |
| Potencia de bombeo | numérica | P = ρ·g·Q·H/η con H medida + pérdidas | ±3 % | SM-RA1 | C2 | 15 |
| Sitio de relaves | selección en escena | bajo la cota de descarga, a más de 500 m del río y aguas abajo del campamento | — | PM-RA1, PM-RA3 | C6, C4 | 10 |
| Ciclo de vida | orden | prospección → ingeniería → SEIA → construcción → operación → cierre (Ley 20.551) | — | PM-RA3 | C6 | 5 |

## Recomendaciones de uso

1. Crear la actividad: *Añadir actividad → MinasLab*, elegir una práctica marcada con ★ y definir la calificación máxima e intentos.
2. Activar la finalización por calificación (*Recibir calificación* o *Aprobar*) si se usa como requisito.
3. Antes de abrirla, probarla en vista previa docente: las respuestas del docente no aparecen en los resultados.
4. Para retroalimentación formativa, mantener activo *Mostrar desarrollo al cerrar la tarea*. Para evaluación sumativa estricta, desactivarlo y usar 1 o 2 intentos.
