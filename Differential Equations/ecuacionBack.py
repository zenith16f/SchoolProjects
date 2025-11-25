from flask import Flask, request, jsonify
import numpy as np
import cmath
from flask_cors import CORS, cross_origin

# Inicialización de la aplicación Flask
app = Flask(__name__)

CORS(app)

def format_raiz(raiz):
    """
    Formatea la parte real de una raíz compleja o real.
    Devuelve un entero si es un número cerrado a un entero, 
    o un float redondeado a 4 decimales.
    """
    valor_real = raiz.real

    if np.isclose(valor_real % 1, 0):
        return int(valor_real)
    else:
        return round(valor_real, 4)

def solve_edo(a, b, c):
    """
    Resuelve la EDO homogénea ay'' + by' + cy = 0 y retorna
    los resultados como un diccionario.
    """
    results = {}
    
    # Ecuación característica
    results['ecuacion_original'] = f"{a}y'' + {b}y' + {c}y = 0"
    results['ecuacion_caracteristica'] = f"{a}m^2 + {b}m + {c} = 0"
    
    coeficientes = [a, b, c]
    raices = np.roots(coeficientes)

    # Caso 1: Raíces Reales e Iguales (m1 = m2 = m)
    if np.isclose(raices[0], raices[1]):
        m = format_raiz(raices[0])
        
        results['tipo_raices'] = "Reales e Iguales"
        results['raices'] = f"m1 = m2 = {m}"
        
        # Soluciones l.i. y general
        y_1 = f"C1 * e^({m}x)"
        y_2 = f"C2 * x*e^({m}x)"
        
        results['soluciones_li'] = {'y1': y_1, 'y2': y_2}
        results['solucion_general'] = f"y = {y_1} + {y_2}"

    # Caso 2: Raíces Complejas Conjugadas (m = alpha ± beta*i)
    elif not np.isclose(raices[0].imag, 0):
        alpha = format_raiz(raices[0])
        beta = format_raiz(abs(raices[0].imag)) 

        results['tipo_raices'] = "Complejas Conjugadas"
        results['raices'] = f"m = {alpha} +- {beta}i)"
        results['variables']=f"alpha={alpha},beta={beta}"
        
        # Soluciones l.i. y general
        y_1 = f"C1 * e^({alpha}x) * cos({beta}x)"
        y_2 = f"C2 * e^({alpha}x) * sen({beta}x)"
        
        results['soluciones_li'] = {'y1': y_1, 'y2': y_2}
        results['solucion_general'] = f"y = {y_1} + {y_2}"

    # Caso 3: Raíces Reales y Distintas (m1 != m2)
    else:
        raiz_1_formato = format_raiz(raices[0])
        raiz_2_formato = format_raiz(raices[1])
        
        results['tipo_raices'] = "Reales y Distintas"
        results['raices'] = f"m1 = {raiz_1_formato}, m2 = {raiz_2_formato}"
        
        # Soluciones l.i. y general
        y_1 = f"C1 * e^({raiz_1_formato}x)"
        y_2 = f"C2 * e^({raiz_2_formato}x)"
        
        results['soluciones_li'] = {'y1': y_1, 'y2': y_2}
        results['solucion_general'] = f"y = {y_1} + {y_2}"
        
    return results

# --- Endpoint de la API ---

@app.route('/solve', methods=['POST'])
@cross_origin() 
def solve_edo_api():
    """
    Endpoint para resolver la EDO ay'' + by' + cy = 0.
    Espera los coeficientes a, b, c como parámetros de consulta.
    Ejemplo de uso: /solve?a=1&b=3&c=2
    """
    data = request.json
    try:
        a = float(data.get('a'))
        b = float(data.get('b'))
        c = float(data.get('c'))
        
        if a == 0:
             # Una EDO de segundo orden requiere que 'a' sea distinto de 0
            return jsonify({'error': 'El coeficiente "a" debe ser diferente de cero para una EDO de segundo orden.'}), 400
            
        # Llamar a la función de lógica para resolver
        solution = solve_edo(a, b, c)
        
        # Devolver la solución en formato JSON
        return jsonify(solution)

    except (TypeError, ValueError):
        return jsonify({
            'error': 'Faltan parámetros o son inválidos. Asegúrese de proporcionar "a", "b" y "c" como números.'
        }), 400
    except Exception as e:
        # Manejo de cualquier otro error no esperado
        return jsonify({'error': f'Un error inesperado ocurrió: {str(e)}'}), 500

# --- Ejecutar la aplicación ---
if __name__ == '__main__':
    app.run(debug=True)