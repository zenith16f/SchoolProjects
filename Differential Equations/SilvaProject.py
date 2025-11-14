import numpy as np
import cmath

def entryD():
    print("--- Ingrese los coeficientes ---")
    
    a = float(input("Ingrese coeficiente para y'': "))
    b =float(input("Ingrese coeficiente para y': "))
    c = float(input("Ingrese coeficiente para y: "))
    
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
    print(f"\n{a}m^2 + {b}m + {c} = 0")
    coeficientes=[a,b,c]
    raices = np.roots(coeficientes)
    
    #Sol2
    if np.isclose(raices[0], raices[1]):
        m = format_raiz(raices[0])
        print(f"\nLas raíces son reales e iguales: m1 = m2 = {m}")
        
        #Soluciones l.i
        y_1=f"C1 * e^({m}x)"
        y_2=f"C2 * xe^({m}x)"
            
        print("\nSoluciones l.i. :")
        print(f"y1 = {y_1}")
        print(f"y2 = {y_2}")
        
        #Sol gral
        y_general = f"y = {y_1} + {y_2}"
        print("\nSolución General:")
        print(y_general)
        return
    #Sol3
    elif not np.isclose(raices[0].imag, 0):
            alpha = format_raiz(raices[0])      # α = Parte Real
            beta = format_raiz(abs(raices[0].imag)) # β = Valor absoluto de la Parte Imaginaria
    
            print(f"\nLas raíces son complejas conjugadas: m = {alpha} ± {beta}i")

            print(f"\nDonde α = {alpha} y β = {beta}")
            
            #Soluciones l.i
            y_1=f"C1 * e^({alpha}x) * cos({beta}x)"
            y_2=f"C2 * e^({alpha}x) * sen({beta}x)"
            
            print("\nSoluciones l.i. :")
            print(f"y1 = {y_1}")
            print(f"y2 = {y_2}")
            
            #Sol gral
                  
            y_general = f"y = {y_1}  + {y_2}"
            
            print("\nSolución General:")
            print(y_general)
            return
    else:
        # 1. Aplicamos la función de formato a cada raíz
        raiz_1_formato = format_raiz(raices[0])
        raiz_2_formato = format_raiz(raices[1])
        
        print(f"\nLas raíces son:\nm1 = {raiz_1_formato}\nm2 = {raiz_2_formato}")   
        
        # 2. Soluciones l.i.
        
        y_1=f"C1 * e^({raiz_1_formato}x)"
        y_2=f"C2 * e^({raiz_2_formato}x)"
        
        print("\nSoluciones l.i. :")
        print(f"y1 = {y_1}")
        print(f"y2 = {y_2}")
        
        # 3. Usamos las raíces formateadas en el string f
        y_general = f"y = {y_1} + {y_2}"
        
        print("\nSolución General:")
        print(y_general)
    
entryD()