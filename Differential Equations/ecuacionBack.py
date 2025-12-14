from flask import Flask, request, jsonify
import numpy as np
import cmath
from flask_cors import CORS, cross_origin

# Inicialización de la aplicación Flask
app = Flask(__name__)
CORS(app)

def format_coef(c, variable='y'):
    """
    Formatea un coeficiente para LaTeX: omite '1' o '-1' (manteniendo el signo), 
    maneja el signo '+' automáticamente, y omite el término si es '0'.
    """
    if np.isclose(c, 0):
        return ""
    
    abs_c = abs(c)
    
    # Manejar el signo
    signo = " + " if c > 0 else " - "
    
    if np.isclose(abs_c, 1):
        # Coeficiente es 1 o -1
        if variable in ['y', 'y\'', 'y\'\'']:
            # No mostrar el 1, solo el signo (si no es el primer término)
            return f"{signo}{variable}"
        else:
            # Para términos constantes (e.g., parte de la solución)
            return f"{signo}1"
    else:
        # Coeficiente es diferente de 1 o -1 o 0
        formatted_c = str(round(abs_c, 4))
        return f"{signo}{formatted_c}{variable}"

def format_ecuacion_original(a, b, c):
    """Formatea la EDO ay'' + by' + cy = 0 en LaTeX."""
    parts = []

    # Coeficiente 'a' (siempre el primer término, no lleva signo '+' inicial)
    if not np.isclose(a, 0):
        a_abs = abs(a)
        if np.isclose(a_abs, 1):
            parts.append(r"y''")
        else:
            parts.append(f"{round(a_abs, 4)}y''")
        
        # Si 'a' es negativo, agregar el signo al inicio
        if a < 0:
            parts[0] = f"-{parts[0]}"

    # Coeficiente 'b'
    if not np.isclose(b, 0):
        b_formatted = format_coef(b, 'y\'')
        parts.append(b_formatted)

    # Coeficiente 'c'
    if not np.isclose(c, 0):
        c_formatted = format_coef(c, 'y')
        parts.append(c_formatted)

    # Si la ecuación no tiene partes, es un caso trivial
    if not parts:
        return "0 = 0" 

    # Ensamblar y simplificar signos
    ecuacion = "".join(parts).strip()
    
    # Limpiar signos iniciales
    if ecuacion.startswith(" + "):
        ecuacion = ecuacion[3:]
    elif ecuacion.startswith(" - "):
        ecuacion = "-" + ecuacion[3:]
    
    return f"{ecuacion} = 0"

def format_caracteristica(a, b, c):
    """Formatea la ecuación característica en LaTeX usando 'm'."""
    parts = []

    # Coeficiente 'a' (siempre el primer término, no lleva signo '+' inicial)
    if not np.isclose(a, 0):
        a_abs = abs(a)
        if np.isclose(a_abs, 1):
            parts.append(r"m^2")
        else:
            parts.append(f"{round(a_abs, 4)}m^2")
        
        if a < 0:
            parts[0] = f"-{parts[0]}"

    # Coeficiente 'b'
    if not np.isclose(b, 0):
        b_formatted = format_coef(b, 'm')
        parts.append(b_formatted)

    # Coeficiente 'c'
    if not np.isclose(c, 0):
        c_formatted = format_coef(c, '') # Constante
        parts.append(c_formatted)

    ecuacion = "".join(parts).strip()
    
    if ecuacion.startswith(" + "):
        ecuacion = ecuacion[3:]
    elif ecuacion.startswith(" - "):
        ecuacion = "-" + ecuacion[3:]

    return f"{ecuacion} = 0"

def format_raiz_number(raiz):
    """
    Formatea el valor numérico de una raíz real o compleja (parte real o imaginaria).
    """
    valor = raiz.real

    if np.isclose(valor % 1, 0):
        return str(int(valor))
    else:
        return str(round(valor, 4))

def solve_edo(a, b, c):
    """
    Resuelve la EDO homogénea ay'' + by' + cy = 0 y retorna
    los resultados en formato LaTeX.
    """
    results = {}
    
    # Ecuación característica
    results['solucion_original'] = format_ecuacion_original(a, b, c)
    results['ecuacion_caracteristica'] = format_caracteristica(a, b, c)
    
    coeficientes = [a, b, c]
    raices = np.roots(coeficientes)

    # Caso 1: Raíces Reales e Iguales (m1 = m2 = m)
    if np.isclose(raices[0], raices[1]):
        m = format_raiz_number(raices[0])
        
        results['tipo_raices'] = "Reales e Iguales"
        results['raices'] = f"m_1 = m_2 = {m}"
        
        # Soluciones l.i. y general (Usando \text{C}_1 y \text{C}_2 para constantes)
        y_1 = f"e^{{{m}x}}"
        y_2 = f"x e^{{{m}x}}"
        
        results['soluciones_li'] = {'y1': y_1, 'y2': y_2}
        results['solucion_general'] = f"y(x) = \\text{{C}}_1 {y_1} + \\text{{C}}_2 {y_2}"

    # Caso 2: Raíces Complejas Conjugadas (m = alpha ± beta*i)
    elif not np.isclose(raices[0].imag, 0):
        alpha = format_raiz_number(raices[0].real)
        beta = format_raiz_number(abs(raices[0].imag)) 

        # Si alpha es cero, simplificar la notación de la raíz
        if np.isclose(raices[0].real, 0):
            raiz_latex = f"m = \pm {beta}i"
            e_alpha_x = ""
        else:
            raiz_latex = f"m = {alpha} \pm {beta}i"
            e_alpha_x = f"e^{{{alpha}x}}"
        
        # Si beta es uno, simplificar la notación del cos/sin
        beta_x = "" if np.isclose(float(beta), 1) else f"{beta}x"
        
        results['tipo_raices'] = "Complejas Conjugadas"
        results['raices'] = raiz_latex
        
        # Soluciones l.i. y general
        y_1 = f"{e_alpha_x} \\cos({beta_x})"
        y_2 = f"{e_alpha_x} \\sin({beta_x})"

        # Limpiar caso e^{0x} que es 1
        if e_alpha_x == "":
            y_1 = y_1.strip()
            y_2 = y_2.strip()
        
        results['soluciones_li'] = {'y1': y_1, 'y2': y_2}
        
        # Si e^{alpha x} = 1, la solución general es C1*cos(...) + C2*sin(...)
        if e_alpha_x == "":
            results['solucion_general'] = f"y(x) = \\text{{C}}_1 \\cos({beta_x}) + \\text{{C}}_2 \\sin({beta_x})"
        else:
            results['solucion_general'] = f"y(x) = {e_alpha_x} (\\text{{C}}_1 \\cos({beta_x}) + \\text{{C}}_2 \\sin({beta_x}))"
            

    # Caso 3: Raíces Reales y Distintas (m1 != m2)
    else:
        # Asegurar que las raíces estén ordenadas para una presentación consistente
        m1_val = format_raiz_number(raices[0])
        m2_val = format_raiz_number(raices[1])
        
        results['tipo_raices'] = "Reales y Distintas"
        results['raices'] = f"m_1 = {m1_val}, \quad m_2 = {m2_val}"
        
        # Soluciones l.i. y general
        y_1 = f"e^{{{m1_val}x}}"
        y_2 = f"e^{{{m2_val}x}}"
        
        # Simplificar si el exponente es 0 o 1
        y_1_final = "1" if m1_val == "0" else y_1
        y_2_final = "1" if m2_val == "0" else y_2

        results['soluciones_li'] = {'y1': y_1_final, 'y2': y_2_final}
        results['solucion_general'] = f"y(x) = \\text{{C}}_1 {y_1_final} + \\text{{C}}_2 {y_2_final}"
        
    return results

# --- Endpoint de la API ---

@app.route('/solve', methods=['POST'])
@cross_origin() 
def solve_edo_api():
    """
    Endpoint para resolver la EDO ay'' + by' + cy = 0.
    """
    data = request.json
    try:
        # Usamos .get() para evitar KeyError si falta una clave
        a = float(data.get('a', 0))
        b = float(data.get('b', 0))
        c = float(data.get('c', 0))
        
        if np.isclose(a, 0):
            # Una EDO de segundo orden requiere que 'a' sea distinto de 0
            return jsonify({'error': 'El coeficiente "a" debe ser diferente de cero para una EDO de segundo orden.'}), 400
            
        # Llamar a la función de lógica para resolver
        solution = solve_edo(a, b, c)
        
        # Devolver la solución en formato JSON
        return jsonify(solution)

    except (TypeError, ValueError, AttributeError):
        return jsonify({
            'error': 'Faltan parámetros o son inválidos. Asegúrese de proporcionar "a", "b" y "c" como números.'
        }), 400
    except Exception as e:
        # Manejo de cualquier otro error no esperado
        return jsonify({'error': f'Un error inesperado ocurrió: {str(e)}'}), 500

# --- Ejecutar la aplicación ---
if __name__ == '__main__':
    # Usar el puerto 5000 como se menciona en el frontend
    app.run(host='0.0.0.0', port=5000, debug=True)