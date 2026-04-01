# MinasLab — Documentación de actividades (catálogo)

**Carrera:** Ingeniería en Minas (PCE), Universidad de Aconcagua.  
**Plugin:** `mod_minaslab` (requiere **Moodle 4.5 o superior**).

## ¿Módulo de actividad (`mod`) o plugin local (`local`)?

Se usa **`mod_minaslab`** (actividad de curso), no un plugin `local`, porque debe:

- Aparecer en el **libro de calificaciones** y en **Finalización de actividad** del curso.
- Guardar **progreso por usuario e instancia** vinculado al **cmid** (módulo del curso).
- Respaldarse y restaurarse con el **curso** como el resto de actividades.

Un plugin `local` serviría para administración global o integraciones, pero no sustituye una actividad calificable por estudiante.

## Cómo funciona y cómo se avanza

1. El docente añade **MinasLab** al curso, define la **nota máxima** y elige **una** práctica del menú (84 opciones: 3 por asignatura del plan).
2. El estudiante interactúa con el escenario (arquetipo: túnel 3D, tajo 3D, taller, flujo, etc.).
3. **Guardar progreso (borrador):** guarda JSON de progreso en servidor **sin** fijar nota final.
4. **Enviar calificación final:** convierte el deslizador 0–100 % en nota sobre la escala de la actividad y la envía al **libro de calificaciones**. Los cuestionarios integrados pueden poner el deslizador al 100 % si la respuesta es correcta.
5. Una vez calificado, el estado queda **completado** (solo lectura del envío).

## Competencias del perfil de egreso (referencia)

- **C1** Operación y normativa · **C2** Proyectos y sustentabilidad · **C3** Seguridad · **C4** Diseño e innovación · **C5** Comunicación y liderazgo · **C6** Ética y ciudadanía.

---

## Listado por semestre


### Semestre 1

#### Bases de las Operaciones Mineras — `s1_bases_ops_a`

- **Título:** Túnel de acceso: aplicar DS 132 y señalética en desarrollo subterráneo
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C3
- **Resumen:** Actividad práctica para Bases de las Operaciones Mineras: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C3). Escenario: tunnel_3d.

#### Bases de las Operaciones Mineras — `s1_bases_ops_b`

- **Título:** Rajo abierto: ciclo perforación–carguío–transporte y botadero
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Bases de las Operaciones Mineras: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: pit_3d.

#### Bases de las Operaciones Mineras — `s1_bases_ops_c`

- **Título:** Escena integrada: cierre de faena y aspectos del plan de cierre
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C2, C3, C6
- **Resumen:** Actividad práctica para Bases de las Operaciones Mineras: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C3, C6). Escenario: pit_3d.

#### Elementos de Preparación de Minerales — `s1_prep_min_a`

- **Título:** Flujo en planta: chancado, cribado y concentración (diagrama interactivo)
- **Arquetipo:** `flow_process`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Elementos de Preparación de Minerales: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: flow_process.

#### Elementos de Preparación de Minerales — `s1_prep_min_b`

- **Título:** Laboratorio: hidrometalurgia vs pirometalurgia en mena de ejemplo
- **Arquetipo:** `flow_process`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Elementos de Preparación de Minerales: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: flow_process.

#### Elementos de Preparación de Minerales — `s1_prep_min_c`

- **Título:** Balance conceptual: recuperación y ley de concentrado
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Elementos de Preparación de Minerales: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Inglés Técnico — `s1_ingles_a`

- **Título:** Briefing en frente de trabajo: vocabulario de EPI y herramientas (HUD minero)
- **Arquetipo:** `english_mine`
- **Competencias perfil:** C5
- **Resumen:** Actividad práctica para Inglés Técnico: vinculada al programa de asignatura y al perfil de egreso (competencias C5). Escenario: english_mine.

#### Inglés Técnico — `s1_ingles_b`

- **Título:** Lectura de manual: especificaciones de bomba y válvula en inglés
- **Arquetipo:** `english_mine`
- **Competencias perfil:** C5
- **Resumen:** Actividad práctica para Inglés Técnico: vinculada al programa de asignatura y al perfil de egreso (competencias C5). Escenario: english_mine.

#### Inglés Técnico — `s1_ingles_c`

- **Título:** Comunicación por radio: frases de corto alcance en faena simulada
- **Arquetipo:** `english_mine`
- **Competencias perfil:** C5
- **Resumen:** Actividad práctica para Inglés Técnico: vinculada al programa de asignatura y al perfil de egreso (competencias C5). Escenario: english_mine.

#### Prevención de Riesgos — `s1_prev_riesgos_a`

- **Título:** Inspección en galería: identificar fuentes de riesgo y controles
- **Arquetipo:** `safety_module`
- **Competencias perfil:** C3, C6
- **Resumen:** Actividad práctica para Prevención de Riesgos: vinculada al programa de asignatura y al perfil de egreso (competencias C3, C6). Escenario: safety_module.

#### Prevención de Riesgos — `s1_prev_riesgos_b`

- **Título:** Plan de emergencia: simulacro de evacuación y puntos de encuentro
- **Arquetipo:** `safety_module`
- **Competencias perfil:** C3, C5
- **Resumen:** Actividad práctica para Prevención de Riesgos: vinculada al programa de asignatura y al perfil de egreso (competencias C3, C5). Escenario: safety_module.

#### Prevención de Riesgos — `s1_prev_riesgos_c`

- **Título:** Evaluación de riesgo en rajo: caída de roca y distancia de seguridad
- **Arquetipo:** `safety_module`
- **Competencias perfil:** C3
- **Resumen:** Actividad práctica para Prevención de Riesgos: vinculada al programa de asignatura y al perfil de egreso (competencias C3). Escenario: safety_module.

#### Topografía e Interpretación de Planos — `s1_topo_planos_a`

- **Título:** Mesa de planos: escalas, norte y lectura de galerías en planta
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Topografía e Interpretación de Planos: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: survey_field.

#### Topografía e Interpretación de Planos — `s1_topo_planos_b`

- **Título:** Replanteo: ángulos y distancias en túnel (polígono simplificado)
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Topografía e Interpretación de Planos: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: survey_field.

#### Topografía e Interpretación de Planos — `s1_topo_planos_c`

- **Título:** Sección transversal: correlacionar perfil con vista en planta
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Topografía e Interpretación de Planos: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: survey_field.

#### Álgebra — `s1_algebra_a`

- **Título:** Galería 3D: matrices para programar cargas en voladura (sistemas 2×2)
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Álgebra: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: tunnel_3d.

#### Álgebra — `s1_algebra_b`

- **Título:** Taller: trigonometría del barreno respecto al plano de banco
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Álgebra: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Álgebra — `s1_algebra_c`

- **Título:** Simulación numérica: complejos y fasores en arranque de motor de ventilador
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Álgebra: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.


### Semestre 2

#### Cálculo — `s2_calculo_a`

- **Título:** Derivadas: tasa de cambio del tonelaje transportado en correa
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C2, C4
- **Resumen:** Actividad práctica para Cálculo: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2, C4). Escenario: math_mine.

#### Cálculo — `s2_calculo_b`

- **Título:** Integrales: acumulado de producción en turno (área bajo curva)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Cálculo: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Cálculo — `s2_calculo_c`

- **Título:** Optimización: punto de mínimo costo por tonelada (conceptual)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Cálculo: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Física Superior — `s2_fisica_sup_a`

- **Título:** Ondas y vibración: riesgo de resonancia en estructura de soporte
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Física Superior: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Física Superior — `s2_fisica_sup_b`

- **Título:** Campo y circuito: potencia del motor de compresor (conceptual)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Física Superior: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Física Superior — `s2_fisica_sup_c`

- **Título:** Energía: balance trabajo–energía en elevación de mineral
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Física Superior: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Geología Estructural y de Minas — `s2_geo_est_a`

- **Título:** Túnel de exploración: mapear pliegue y falla en el macizo
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Geología Estructural y de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: tunnel_3d.

#### Geología Estructural y de Minas — `s2_geo_est_b`

- **Título:** Pit: orientación de estructuras y control del talud
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Geología Estructural y de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: pit_3d.

#### Geología Estructural y de Minas — `s2_geo_est_c`

- **Título:** Corte geológico: correlacionar litología con geometría del yacimiento
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Geología Estructural y de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: pit_3d.

#### Probabilidad y Estadística — `s2_prob_est_a`

- **Título:** Distribución de leyes de sondaje: media e intervalo en bloque ficticio
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Probabilidad y Estadística: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Probabilidad y Estadística — `s2_prob_est_b`

- **Título:** Muestreo: error estándar y confianza en contenido de metal
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Probabilidad y Estadística: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Probabilidad y Estadística — `s2_prob_est_c`

- **Título:** Control de proceso: gráficos y alertas en planta (simulación)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C5
- **Resumen:** Actividad práctica para Probabilidad y Estadística: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C5). Escenario: math_mine.

#### Resistencia de Materiales — `s2_res_mat_a`

- **Título:** Pilar minero: esfuerzo admisible y factor de seguridad (caso guiado)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Resistencia de Materiales: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Resistencia de Materiales — `s2_res_mat_b`

- **Título:** Viga de pasarela: flexión en estructura de acceso a galería
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Resistencia de Materiales: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: tunnel_3d.

#### Resistencia de Materiales — `s2_res_mat_c`

- **Título:** Estado de esfuerzos en roca: conceptual con Mohr simplificado
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Resistencia de Materiales: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Topografía de Minas — `s2_topo_min_a`

- **Título:** Polígono en superficie: compensación de ángulos en campamento minero
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Topografía de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: survey_field.

#### Topografía de Minas — `s2_topo_min_b`

- **Título:** GNSS y coordenadas: paso UTM en borde de tajo
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Topografía de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: survey_field.

#### Topografía de Minas — `s2_topo_min_c`

- **Título:** Replanteo de barreno: ángulo y azimut en malla de perforación
- **Arquetipo:** `survey_field`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Topografía de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: survey_field.


### Semestre 3

#### Ecuaciones Diferenciales — `s3_edo_a`

- **Título:** Modelo de mezcla en estanque de proceso (EDO de primer orden)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Ecuaciones Diferenciales: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Ecuaciones Diferenciales — `s3_edo_b`

- **Título:** Enfriamiento de equipo: ley de Newton aplicada a motor
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Ecuaciones Diferenciales: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Ecuaciones Diferenciales — `s3_edo_c`

- **Título:** Crecimiento de población de bacterias en lixiviación (logístico conceptual)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Ecuaciones Diferenciales: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Elementos Mecánicos de Rocas — `s3_mec_rocas_a`

- **Título:** Arco de excavación: empuje de roca y sostenimiento en túnel 3D
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Elementos Mecánicos de Rocas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: tunnel_3d.

#### Elementos Mecánicos de Rocas — `s3_mec_rocas_b`

- **Título:** Pilares y estribos: dimensionamiento conceptual en cámara
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Elementos Mecánicos de Rocas: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: tunnel_3d.

#### Elementos Mecánicos de Rocas — `s3_mec_rocas_c`

- **Título:** Clasificación RMR aplicada a tramo de galería (flujo guiado)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Elementos Mecánicos de Rocas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Mecánica de Fluidos y Termodinámica — `s3_mec_fluidos_a`

- **Título:** Bernoulli en tubería de impulsión de agua de mina
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Mecánica de Fluidos y Termodinámica: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: math_mine.

#### Mecánica de Fluidos y Termodinámica — `s3_mec_fluidos_b`

- **Título:** Pérdidas en conducto: caudal y diámetro (ejercicio interactivo)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Mecánica de Fluidos y Termodinámica: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Mecánica de Fluidos y Termodinámica — `s3_mec_fluidos_c`

- **Título:** Ciclo termodinámico del aire comprimido en perforadoras (conceptual)
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Mecánica de Fluidos y Termodinámica: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Perforación y Tronadura — `s3_perf_tron_a`

- **Título:** Frente de perforación: malla, burden y esquiva en túnel
- **Arquetipo:** `drill_site`
- **Competencias perfil:** C1, C3
- **Resumen:** Actividad práctica para Perforación y Tronadura: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C3). Escenario: drill_site.

#### Perforación y Tronadura — `s3_perf_tron_b`

- **Título:** Carga y secuencia de disparo: retardo y vibración
- **Arquetipo:** `drill_site`
- **Competencias perfil:** C1, C3
- **Resumen:** Actividad práctica para Perforación y Tronadura: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C3). Escenario: drill_site.

#### Perforación y Tronadura — `s3_perf_tron_c`

- **Título:** Seguridad en tronadura: perímetro de exclusión y señalización
- **Arquetipo:** `safety_module`
- **Competencias perfil:** C3, C5
- **Resumen:** Actividad práctica para Perforación y Tronadura: vinculada al programa de asignatura y al perfil de egreso (competencias C3, C5). Escenario: safety_module.

#### Prospección y Evaluación de Yacimientos Mineros — `s3_prosp_yac_a`

- **Título:** Modelo de recurso: ley media y volumen en bloque 3D simplificado
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2, C4
- **Resumen:** Actividad práctica para Prospección y Evaluación de Yacimientos Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2, C4). Escenario: pit_3d.

#### Prospección y Evaluación de Yacimientos Mineros — `s3_prosp_yac_b`

- **Título:** Geoestadística básica: variograma y kriging explicado paso a paso
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C4
- **Resumen:** Actividad práctica para Prospección y Evaluación de Yacimientos Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C4). Escenario: math_mine.

#### Prospección y Evaluación de Yacimientos Mineros — `s3_prosp_yac_c`

- **Título:** Cut-off y VAN preliminar: decisión de explotar o no el bloque
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Prospección y Evaluación de Yacimientos Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: office_sim.

#### Sistema de Explotación Subterráneo — `s3_exp_sub_a`

- **Título:** Secuencia de extracción: niveles, panel y relleno hidráulico (vista 3D)
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Sistema de Explotación Subterráneo: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: tunnel_3d.

#### Sistema de Explotación Subterráneo — `s3_exp_sub_b`

- **Título:** Selección de método: cámara y pilar vs sublevel stoping (comparador)
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C4
- **Resumen:** Actividad práctica para Sistema de Explotación Subterráneo: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C4). Escenario: tunnel_3d.

#### Sistema de Explotación Subterráneo — `s3_exp_sub_c`

- **Título:** Programación de producción: turnos y equipos en frente
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C1, C2, C5
- **Resumen:** Actividad práctica para Sistema de Explotación Subterráneo: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2, C5). Escenario: office_sim.


### Semestre 4

#### Diseño y Evaluación de Proyectos — `s4_diseno_proy_a`

- **Título:** Flujo de evaluación: mercado, técnico, legal y ambiental
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C4, C6
- **Resumen:** Actividad práctica para Diseño y Evaluación de Proyectos: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4, C6). Escenario: office_sim.

#### Diseño y Evaluación de Proyectos — `s4_diseno_proy_b`

- **Título:** VAN, TIR y sensibilidad del precio del metal
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Diseño y Evaluación de Proyectos: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: office_sim.

#### Diseño y Evaluación de Proyectos — `s4_diseno_proy_c`

- **Título:** Matriz FODA de proyecto minero ficticio
- **Arquetipo:** `innovation_board`
- **Competencias perfil:** C2, C5
- **Resumen:** Actividad práctica para Diseño y Evaluación de Proyectos: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C5). Escenario: innovation_board.

#### Economía General — `s4_eco_gral_a`

- **Título:** Oferta y demanda del cobre: equilibrio y shocks
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C6
- **Resumen:** Actividad práctica para Economía General: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C6). Escenario: office_sim.

#### Economía General — `s4_eco_gral_b`

- **Título:** Elasticidad e impacto en ingreso de la mina
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2
- **Resumen:** Actividad práctica para Economía General: vinculada al programa de asignatura y al perfil de egreso (competencias C2). Escenario: math_mine.

#### Economía General — `s4_eco_gral_c`

- **Título:** Costo de oportunidad: invertir en faena vs alternativa financiera
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C6
- **Resumen:** Actividad práctica para Economía General: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C6). Escenario: office_sim.

#### Innovación y Tecnología — `s4_innov_tec_a`

- **Título:** Mapa de I+D+i: desde idea a prototipo en minería
- **Arquetipo:** `innovation_board`
- **Competencias perfil:** C2, C4, C5
- **Resumen:** Actividad práctica para Innovación y Tecnología: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4, C5). Escenario: innovation_board.

#### Innovación y Tecnología — `s4_innov_tec_b`

- **Título:** Transferencia tecnológica y alianzas universidad–industria
- **Arquetipo:** `innovation_board`
- **Competencias perfil:** C2, C5
- **Resumen:** Actividad práctica para Innovación y Tecnología: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C5). Escenario: innovation_board.

#### Innovación y Tecnología — `s4_innov_tec_c`

- **Título:** Emprendimiento: pitch de producto para servicio minero
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C5, C6
- **Resumen:** Actividad práctica para Innovación y Tecnología: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C5, C6). Escenario: office_sim.

#### Procesos Metalúrgicos — `s4_proc_metal_a`

- **Título:** Flotación: reactivos y recuperación en celda (flujo animado)
- **Arquetipo:** `flow_process`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Procesos Metalúrgicos: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: flow_process.

#### Procesos Metalúrgicos — `s4_proc_metal_b`

- **Título:** Lixiviación: cinética y tiempo de residencia
- **Arquetipo:** `flow_process`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Procesos Metalúrgicos: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: flow_process.

#### Procesos Metalúrgicos — `s4_proc_metal_c`

- **Título:** Balance metalúrgico global: ley cabeza vs cola
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Procesos Metalúrgicos: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.

#### Sistema de Explotación a Rajo Abierto — `s4_exp_rajo_a`

- **Título:** Diseño de bancos, bermas y ancho de rampa en tajo 3D
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Sistema de Explotación a Rajo Abierto: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: pit_3d.

#### Sistema de Explotación a Rajo Abierto — `s4_exp_rajo_b`

- **Título:** Secuencia de fases y botadero interno
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Sistema de Explotación a Rajo Abierto: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: pit_3d.

#### Sistema de Explotación a Rajo Abierto — `s4_exp_rajo_c`

- **Título:** Estabilidad de talud: factores y monitoreo superficial
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C2, C3
- **Resumen:** Actividad práctica para Sistema de Explotación a Rajo Abierto: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C3). Escenario: pit_3d.

#### Ventilación de Minas — `s4_vent_mina_a`

- **Título:** Red de conductos: pérdidas y ventilador principal (modelo conceptual)
- **Arquetipo:** `vent_shaft`
- **Competencias perfil:** C1, C3, C4
- **Resumen:** Actividad práctica para Ventilación de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C3, C4). Escenario: vent_shaft.

#### Ventilación de Minas — `s4_vent_mina_b`

- **Título:** Gases, polvo y control en frente de trabajo
- **Arquetipo:** `vent_shaft`
- **Competencias perfil:** C3
- **Resumen:** Actividad práctica para Ventilación de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C3). Escenario: vent_shaft.

#### Ventilación de Minas — `s4_vent_mina_c`

- **Título:** Costo energético del ventilador: decisión de caudal óptimo
- **Arquetipo:** `math_mine`
- **Competencias perfil:** C2, C4
- **Resumen:** Actividad práctica para Ventilación de Minas: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4). Escenario: math_mine.


### Semestre 5

#### Dirección y Gestión de Empresas — `s5_dir_emp_a`

- **Título:** Funciones de administración aplicadas a faena minera
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C1, C5, C6
- **Resumen:** Actividad práctica para Dirección y Gestión de Empresas: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C5, C6). Escenario: office_sim.

#### Dirección y Gestión de Empresas — `s5_dir_emp_b`

- **Título:** Cultura organizacional y seguridad como valor
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C5, C6
- **Resumen:** Actividad práctica para Dirección y Gestión de Empresas: vinculada al programa de asignatura y al perfil de egreso (competencias C5, C6). Escenario: office_sim.

#### Dirección y Gestión de Empresas — `s5_dir_emp_c`

- **Título:** RSC y actores: comunidad, Estado y empresa
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C6
- **Resumen:** Actividad práctica para Dirección y Gestión de Empresas: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C6). Escenario: office_sim.

#### Proyecto Minero — `s5_proy_min_a`

- **Título:** Integración 3D: yacimiento–mina–planta–cierre (recorrido)
- **Arquetipo:** `pit_3d`
- **Competencias perfil:** C1, C2, C4
- **Resumen:** Actividad práctica para Proyecto Minero: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2, C4). Escenario: pit_3d.

#### Proyecto Minero — `s5_proy_min_b`

- **Título:** Cronograma y dependencias del proyecto de inversión
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C4, C5
- **Resumen:** Actividad práctica para Proyecto Minero: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C4, C5). Escenario: office_sim.

#### Proyecto Minero — `s5_proy_min_c`

- **Título:** Evaluación ambiental y social en ciclo de vida
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C2, C6
- **Resumen:** Actividad práctica para Proyecto Minero: vinculada al programa de asignatura y al perfil de egreso (competencias C2, C6). Escenario: office_sim.

#### Proyecto de Título — `s5_proy_tit_a`

- **Título:** Diseño de pregunta de investigación aplicada a minería
- **Arquetipo:** `thesis_lab`
- **Competencias perfil:** C4, C5, C6
- **Resumen:** Actividad práctica para Proyecto de Título: vinculada al programa de asignatura y al perfil de egreso (competencias C4, C5, C6). Escenario: thesis_lab.

#### Proyecto de Título — `s5_proy_tit_b`

- **Título:** Metodología: fuentes, datos y ética del estudio
- **Arquetipo:** `thesis_lab`
- **Competencias perfil:** C5, C6
- **Resumen:** Actividad práctica para Proyecto de Título: vinculada al programa de asignatura y al perfil de egreso (competencias C5, C6). Escenario: thesis_lab.

#### Proyecto de Título — `s5_proy_tit_c`

- **Título:** Comunicación científica: estructura del informe final
- **Arquetipo:** `thesis_lab`
- **Competencias perfil:** C5, C6
- **Resumen:** Actividad práctica para Proyecto de Título: vinculada al programa de asignatura y al perfil de egreso (competencias C5, C6). Escenario: thesis_lab.

#### Servicios Mineros — `s5_serv_min_a`

- **Título:** Red de agua interior mina: bombas y estaciones
- **Arquetipo:** `tunnel_3d`
- **Competencias perfil:** C1, C2
- **Resumen:** Actividad práctica para Servicios Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2). Escenario: tunnel_3d.

#### Servicios Mineros — `s5_serv_min_b`

- **Título:** Subestación eléctrica: transformación y normativa Sernageomin
- **Arquetipo:** `safety_module`
- **Competencias perfil:** C3, C4
- **Resumen:** Actividad práctica para Servicios Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C3, C4). Escenario: safety_module.

#### Servicios Mineros — `s5_serv_min_c`

- **Título:** Mantenimiento e inventario crítico de repuestos
- **Arquetipo:** `office_sim`
- **Competencias perfil:** C1, C2, C5
- **Resumen:** Actividad práctica para Servicios Mineros: vinculada al programa de asignatura y al perfil de egreso (competencias C1, C2, C5). Escenario: office_sim.

