#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera activity_catalog_data.php: 84 actividades (3×28) alineadas a programas y perfil."""

from pathlib import Path

# (título, arquetipo, competencias perfil 1-6)
# Arquetipos: tunnel_3d | pit_3d | math_mine | flow_process | safety_module | survey_field |
#             vent_shaft | office_sim | english_mine | drill_site | thesis_lab | innovation_board

ENTRIES = [
    # I Semestre
    ("algebra", "Álgebra", [
        ("Galería 3D: matrices para programar cargas en voladura (sistemas 2×2)", "tunnel_3d", [1, 4]),
        ("Taller: trigonometría del barreno respecto al plano de banco", "math_mine", [1, 4]),
        ("Simulación numérica: complejos y fasores en arranque de motor de ventilador", "math_mine", [4]),
    ]),
    ("bases_ops", "Bases de las Operaciones Mineras", [
        ("Túnel de acceso: aplicar DS 132 y señalética en desarrollo subterráneo", "tunnel_3d", [1, 3]),
        ("Rajo abierto: ciclo perforación–carguío–transporte y botadero", "pit_3d", [1, 2]),
        ("Escena integrada: cierre de faena y aspectos del plan de cierre", "pit_3d", [2, 3, 6]),
    ]),
    ("prep_min", "Elementos de Preparación de Minerales", [
        ("Flujo en planta: chancado, cribado y concentración (diagrama interactivo)", "flow_process", [1, 2]),
        ("Laboratorio: hidrometalurgia vs pirometalurgia en mena de ejemplo", "flow_process", [2, 4]),
        ("Balance conceptual: recuperación y ley de concentrado", "math_mine", [2, 4]),
    ]),
    ("ingles", "Inglés Técnico", [
        ("Briefing en frente de trabajo: vocabulario de EPI y herramientas (HUD minero)", "english_mine", [5]),
        ("Lectura de manual: especificaciones de bomba y válvula en inglés", "english_mine", [5]),
        ("Comunicación por radio: frases de corto alcance en faena simulada", "english_mine", [5]),
    ]),
    ("prev_riesgos", "Prevención de Riesgos", [
        ("Inspección en galería: identificar fuentes de riesgo y controles", "safety_module", [3, 6]),
        ("Plan de emergencia: simulacro de evacuación y puntos de encuentro", "safety_module", [3, 5]),
        ("Evaluación de riesgo en rajo: caída de roca y distancia de seguridad", "safety_module", [3]),
    ]),
    ("topo_planos", "Topografía e Interpretación de Planos", [
        ("Mesa de planos: escalas, norte y lectura de galerías en planta", "survey_field", [1, 4]),
        ("Replanteo: ángulos y distancias en túnel (polígono simplificado)", "survey_field", [1, 4]),
        ("Sección transversal: correlacionar perfil con vista en planta", "survey_field", [4]),
    ]),
    # II Semestre
    ("calculo", "Cálculo", [
        ("Derivadas: tasa de cambio del tonelaje transportado en correa", "math_mine", [1, 2, 4]),
        ("Integrales: acumulado de producción en turno (área bajo curva)", "math_mine", [2, 4]),
        ("Optimización: punto de mínimo costo por tonelada (conceptual)", "math_mine", [2, 4]),
    ]),
    ("fisica_sup", "Física Superior", [
        ("Ondas y vibración: riesgo de resonancia en estructura de soporte", "math_mine", [1, 4]),
        ("Campo y circuito: potencia del motor de compresor (conceptual)", "math_mine", [4]),
        ("Energía: balance trabajo–energía en elevación de mineral", "math_mine", [2, 4]),
    ]),
    ("geo_est", "Geología Estructural y de Minas", [
        ("Túnel de exploración: mapear pliegue y falla en el macizo", "tunnel_3d", [1, 4]),
        ("Pit: orientación de estructuras y control del talud", "pit_3d", [1, 2]),
        ("Corte geológico: correlacionar litología con geometría del yacimiento", "pit_3d", [4]),
    ]),
    ("prob_est", "Probabilidad y Estadística", [
        ("Distribución de leyes de sondaje: media e intervalo en bloque ficticio", "math_mine", [1, 4]),
        ("Muestreo: error estándar y confianza en contenido de metal", "math_mine", [2, 4]),
        ("Control de proceso: gráficos y alertas en planta (simulación)", "math_mine", [2, 5]),
    ]),
    ("res_mat", "Resistencia de Materiales", [
        ("Pilar minero: esfuerzo admisible y factor de seguridad (caso guiado)", "math_mine", [1, 4]),
        ("Viga de pasarela: flexión en estructura de acceso a galería", "tunnel_3d", [4]),
        ("Estado de esfuerzos en roca: conceptual con Mohr simplificado", "math_mine", [4]),
    ]),
    ("topo_min", "Topografía de Minas", [
        ("Polígono en superficie: compensación de ángulos en campamento minero", "survey_field", [1, 4]),
        ("GNSS y coordenadas: paso UTM en borde de tajo", "survey_field", [4]),
        ("Replanteo de barreno: ángulo y azimut en malla de perforación", "survey_field", [1, 4]),
    ]),
    # III Semestre
    ("edo", "Ecuaciones Diferenciales", [
        ("Modelo de mezcla en estanque de proceso (EDO de primer orden)", "math_mine", [2, 4]),
        ("Enfriamiento de equipo: ley de Newton aplicada a motor", "math_mine", [4]),
        ("Crecimiento de población de bacterias en lixiviación (logístico conceptual)", "math_mine", [2, 4]),
    ]),
    ("mec_rocas", "Elementos Mecánicos de Rocas", [
        ("Arco de excavación: empuje de roca y sostenimiento en túnel 3D", "tunnel_3d", [1, 4]),
        ("Pilares y estribos: dimensionamiento conceptual en cámara", "tunnel_3d", [4]),
        ("Clasificación RMR aplicada a tramo de galería (flujo guiado)", "math_mine", [1, 4]),
    ]),
    ("mec_fluidos", "Mecánica de Fluidos y Termodinámica", [
        ("Bernoulli en tubería de impulsión de agua de mina", "math_mine", [1, 4]),
        ("Pérdidas en conducto: caudal y diámetro (ejercicio interactivo)", "math_mine", [4]),
        ("Ciclo termodinámico del aire comprimido en perforadoras (conceptual)", "math_mine", [4]),
    ]),
    ("perf_tron", "Perforación y Tronadura", [
        ("Frente de perforación: malla, burden y esquiva en túnel", "drill_site", [1, 3]),
        ("Carga y secuencia de disparo: retardo y vibración", "drill_site", [1, 3]),
        ("Seguridad en tronadura: perímetro de exclusión y señalización", "safety_module", [3, 5]),
    ]),
    ("prosp_yac", "Prospección y Evaluación de Yacimientos Mineros", [
        ("Modelo de recurso: ley media y volumen en bloque 3D simplificado", "pit_3d", [1, 2, 4]),
        ("Geoestadística básica: variograma y kriging explicado paso a paso", "math_mine", [4]),
        ("Cut-off y VAN preliminar: decisión de explotar o no el bloque", "office_sim", [2, 4]),
    ]),
    ("exp_sub", "Sistema de Explotación Subterráneo", [
        ("Secuencia de extracción: niveles, panel y relleno hidráulico (vista 3D)", "tunnel_3d", [1, 2]),
        ("Selección de método: cámara y pilar vs sublevel stoping (comparador)", "tunnel_3d", [1, 4]),
        ("Programación de producción: turnos y equipos en frente", "office_sim", [1, 2, 5]),
    ]),
    # IV Semestre
    ("diseno_proy", "Diseño y Evaluación de Proyectos", [
        ("Flujo de evaluación: mercado, técnico, legal y ambiental", "office_sim", [2, 4, 6]),
        ("VAN, TIR y sensibilidad del precio del metal", "office_sim", [2, 4]),
        ("Matriz FODA de proyecto minero ficticio", "innovation_board", [2, 5]),
    ]),
    ("eco_gral", "Economía General", [
        ("Oferta y demanda del cobre: equilibrio y shocks", "office_sim", [2, 6]),
        ("Elasticidad e impacto en ingreso de la mina", "math_mine", [2]),
        ("Costo de oportunidad: invertir en faena vs alternativa financiera", "office_sim", [2, 6]),
    ]),
    ("innov_tec", "Innovación y Tecnología", [
        ("Mapa de I+D+i: desde idea a prototipo en minería", "innovation_board", [2, 4, 5]),
        ("Transferencia tecnológica y alianzas universidad–industria", "innovation_board", [2, 5]),
        ("Emprendimiento: pitch de producto para servicio minero", "office_sim", [2, 5, 6]),
    ]),
    ("proc_metal", "Procesos Metalúrgicos", [
        ("Flotación: reactivos y recuperación en celda (flujo animado)", "flow_process", [1, 2]),
        ("Lixiviación: cinética y tiempo de residencia", "flow_process", [2, 4]),
        ("Balance metalúrgico global: ley cabeza vs cola", "math_mine", [2, 4]),
    ]),
    ("exp_rajo", "Sistema de Explotación a Rajo Abierto", [
        ("Diseño de bancos, bermas y ancho de rampa en tajo 3D", "pit_3d", [1, 2]),
        ("Secuencia de fases y botadero interno", "pit_3d", [1, 2]),
        ("Estabilidad de talud: factores y monitoreo superficial", "pit_3d", [2, 3]),
    ]),
    ("vent_mina", "Ventilación de Minas", [
        ("Red de conductos: pérdidas y ventilador principal (modelo conceptual)", "vent_shaft", [1, 3, 4]),
        ("Gases, polvo y control en frente de trabajo", "vent_shaft", [3]),
        ("Costo energético del ventilador: decisión de caudal óptimo", "math_mine", [2, 4]),
    ]),
    # V Semestre
    ("dir_emp", "Dirección y Gestión de Empresas", [
        ("Funciones de administración aplicadas a faena minera", "office_sim", [1, 5, 6]),
        ("Cultura organizacional y seguridad como valor", "office_sim", [5, 6]),
        ("RSC y actores: comunidad, Estado y empresa", "office_sim", [2, 6]),
    ]),
    ("proy_min", "Proyecto Minero", [
        ("Integración 3D: yacimiento–mina–planta–cierre (recorrido)", "pit_3d", [1, 2, 4]),
        ("Cronograma y dependencias del proyecto de inversión", "office_sim", [2, 4, 5]),
        ("Evaluación ambiental y social en ciclo de vida", "office_sim", [2, 6]),
    ]),
    ("proy_tit", "Proyecto de Título", [
        ("Diseño de pregunta de investigación aplicada a minería", "thesis_lab", [4, 5, 6]),
        ("Metodología: fuentes, datos y ética del estudio", "thesis_lab", [5, 6]),
        ("Comunicación científica: estructura del informe final", "thesis_lab", [5, 6]),
    ]),
    ("serv_min", "Servicios Mineros", [
        ("Red de agua interior mina: bombas y estaciones", "tunnel_3d", [1, 2]),
        ("Subestación eléctrica: transformación y normativa Sernageomin", "safety_module", [3, 4]),
        ("Mantenimiento e inventario crítico de repuestos", "office_sim", [1, 2, 5]),
    ]),
]


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main():
    lines = [
        "<?php",
        "// Generado por tools/generate_catalog.py — MinasLab catálogo curricular.",
        "",
        "namespace mod_minaslab\\local;",
        "",
        "defined('MOODLE_INTERNAL') || die();",
        "",
        "final class activity_catalog_data {",
        "",
        "    /** @return array<string, array<string, mixed>> */",
        "    public static function entries(): array {",
        "        return [",
    ]

    sem_map = {k: 1 for k in ["algebra", "bases_ops", "prep_min", "ingles", "prev_riesgos", "topo_planos"]}
    sem_map.update({k: 2 for k in ["calculo", "fisica_sup", "geo_est", "prob_est", "res_mat", "topo_min"]})
    sem_map.update({k: 3 for k in ["edo", "mec_rocas", "mec_fluidos", "perf_tron", "prosp_yac", "exp_sub"]})
    sem_map.update({k: 4 for k in ["diseno_proy", "eco_gral", "innov_tec", "proc_metal", "exp_rajo", "vent_mina"]})
    sem_map.update({k: 5 for k in ["dir_emp", "proy_min", "proy_tit", "serv_min"]})

    suf = ("a", "b", "c")
    for slug, subj, triples in ENTRIES:
        sm = sem_map[slug]
        for i, (title, arch, prof) in enumerate(triples):
            key = f"s{sm}_{slug}_{suf[i]}"
            summary = (
                f"Actividad práctica para {subj}: vinculada al programa de asignatura y al perfil de egreso "
                f"(competencias {', '.join('C'+str(p) for p in prof)}). Escenario: {arch}."
            )
            pl = ", ".join(str(p) for p in prof)
            lines.append(f"            '{key}' => [")
            lines.append(f"                'semester' => {sm},")
            lines.append(f"                'subject_slug' => '{slug}',")
            lines.append(f"                'subject_name' => '{esc(subj)}',")
            lines.append(f"                'title' => '{esc(title)}',")
            lines.append(f"                'archetype' => '{arch}',")
            lines.append(f"                'profile' => [{pl}],")
            lines.append(f"                'summary' => '{esc(summary)}',")
            lines.append("            ],")

    lines += [
        "        ];",
        "    }",
        "}",
        "",
    ]

    out = Path(__file__).resolve().parent.parent / "classes" / "local" / "activity_catalog_data.php"
    out.write_text("\n".join(lines), encoding="utf-8")
    print("OK", out, "count", len(ENTRIES) * 3)


if __name__ == "__main__":
    main()
