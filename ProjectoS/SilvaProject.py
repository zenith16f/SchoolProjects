import numpy as np

def entryD():
    print("--- Ingrese los coeficientes ---")
    
    a = int(input("Ingrese coeficiente para y'': "))
    b = int(input("Ingrese coeficiente para y': "))
    c = int(input("Ingrese coeficiente para y: "))
    
    print(f"\nLa ecuación es:")
    print(f"{a}y'' + {b}y' + {c}y = 0")
    sol1(a, b, c)
    
def format_raiz(raiz):
    
    valor_real = raiz.real

    if np.isclose(valor_real % 1, 0):
        return int(valor_real)
    else:
        # Si no es entero, lo devolvemos con un par de decimales
        return round(valor_real, 4)
    
def sol1(a,b,c):
    print(f"\nCambiamos a y por m y la ecuación es:")
    print(f"{a}m^2 + {b}m + {c} = 0")
    coeficientes=[a,b,c]
    raices = np.roots(coeficientes)
    
    #Sol2
    if np.isclose(raices[0], raices[1]):
        m = format_raiz(raices[0])
        print(f"\nLas raíces son reales e iguales: m1 = m2 = {m}")
        y_general = f"y = C1 * e^({m}x) + C2 * x * e^({m}x)"
    
    # 1. Aplicamos la función de formato a cada raíz
    raiz_1_formato = format_raiz(raices[0])
    raiz_2_formato = format_raiz(raices[1])
    
    print(f"Las raíces son: {raices}")
    
    # 2. Usamos las raíces formateadas en el string f
    y_general = f"y = C1 * e^({raiz_1_formato}x) + C2 * e^({raiz_2_formato}x)"
    
    print("\nSolución General:")
    print(y_general)
    
    

entryD()