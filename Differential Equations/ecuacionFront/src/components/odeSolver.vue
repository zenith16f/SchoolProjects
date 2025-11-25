<script setup lang="ts">
import { BookOpen, Calculator, Zap } from "lucide-vue-next";
import { computed, ref } from "vue";

const a = ref<string>("");
const b = ref<string>("");
const c = ref<string>("");

const result = ref<any>(null);
const loading = ref(false);
const error = ref("");
const showStepByStep = ref(false);
const currentStep = ref(0);

// -------------------- Utils -------------------- //
function getDiscriminantType(aVal: string, bVal: string, cVal: string) {
  const discriminant =
    Math.pow(parseFloat(bVal), 2) - 4 * parseFloat(aVal) * parseFloat(cVal);

  if (discriminant > 0) return "Raíces reales distintas";
  if (discriminant === 0) return "Raíces reales repetidas";
  return "Raíces complejas conjugadas";
}

// -------------------- API Handler -------------------- //
async function handleSolve(stepByStep = false) {
  if (!a.value || !b.value || !c.value) {
    error.value = "Por favor ingresa todos los coeficientes";
    return;
  }

  loading.value = true;
  error.value = "";
  showStepByStep.value = stepByStep;
  currentStep.value = 0;

  try {
    const response = await fetch(`http://localhost:5000/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        a: parseFloat(a.value),
        b: parseFloat(b.value),
        c: parseFloat(c.value),
      }),
    });

    if (!response.ok) throw new Error("Error al resolver la ecuación");

    const data = await response.json();
    const discriminantType = getDiscriminantType(a.value, b.value, c.value);

    result.value = {
      ...data,
      discriminantType,
    };
  } catch (err: any) {
    error.value = "Error al conectar con el servidor: " + err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// -------------------- Step Navigation -------------------- //
const steps = computed(() => {
  if (!result.value) return [];

  const s: any[] = [];

  if (result.value.solucion_original)
    s.push({
      title: "Ecuación Diferencial Original",
      content: "Esta es la ecuación diferencial que queremos resolver",
      data: result.value.solucion_original,
      color: "purple",
    });

  if (result.value.ecuacion_caracteristica)
    s.push({
      title: "Ecuación Característica",
      content: "Planteamos la ecuación característica ",
      data: result.value.ecuacion_caracteristica,
      color: "indigo",
    });

  if (result.value.raices)
    s.push({
      title: "Raíces de la Ecuación",
      content: "Resolvemos la ecuación característica",
      data: `${result.value.raices}`,
      color: "blue",
    });

  if (result.value.tipo_raices)
    s.push({
      title: "Tipo de Raíces",
      content: "Clasificamos el tipo de raíces obtenidas",
      data: result.value.tipo_raices,
      color: "cyan",
    });

  if (result.value.soluciones_li)
    s.push({
      title: "Soluciones Linealmente Independientes",
      content: "Determinamos las soluciones linealmente independientes",
      data: `y₁ = ${result.value.soluciones_li.y1}\ny₂ = ${result.value.soluciones_li.y2}`,
      color: "orange",
    });

  if (result.value.solucion_general)
    s.push({
      title: "Solución General",
      content: "Formamos la solución general como combinación lineal",
      data: result.value.solucion_general,
      color: "green",
    });

  return s;
});

function nextStep() {
  if (currentStep.value < steps.value.length - 1) currentStep.value++;
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--;
}
</script>

<template>
  <div
    class="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
  >
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-6 py-16">
      <div class="text-center mb-12">
        <h2 class="text-5xl font-extrabold text-gray-900 mb-6">
          Resuelve Ecuaciones Diferenciales
          <span class="block text-indigo-600 mt-2">de Segundo Orden</span>
        </h2>
        <p class="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          Obtén la solución general de EDOs lineales homogéneas de segundo orden
          con coeficientes constantes. Ingresa los coeficientes de tu ecuación
          <span class="font-mono font-semibold">ay'' + by' + cy = 0</span>.
        </p>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-6 mb-16">
        <div
          class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <Zap class="w-10 h-10 text-yellow-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2 text-gray-800">
            Solución Instantánea
          </h3>
          <p class="text-gray-600">
            Resultados en segundos con análisis completo
          </p>
        </div>

        <div
          class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <BookOpen class="w-10 h-10 text-green-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2 text-gray-800">
            Proceso Detallado
          </h3>
          <p class="text-gray-600">Ve cada paso del proceso de solución</p>
        </div>

        <div
          class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <Calculator class="w-10 h-10 text-blue-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2 text-gray-800">
            Todos los Casos
          </h3>
          <p class="text-gray-600">Raíces reales, complejas y repetidas</p>
        </div>
      </div>

      <!-- Solver Form -->
      <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
        <h3 class="text-3xl font-bold text-gray-800 mb-8 text-center">
          Ingresa los Coeficientes
        </h3>

        <div
          class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-8"
        >
          <p
            class="text-center text-2xl font-mono font-semibold text-indigo-900"
          >
            <span class="text-indigo-600">a</span>y'' +
            <span class="text-indigo-600">b</span>y' +
            <span class="text-indigo-600">c</span>y = 0
          </p>
        </div>

        <div class="space-y-6">
          <div class="grid md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Coeficiente a
              </label>
              <input
                type="number"
                step="any"
                v-model="a"
                placeholder="Ej: 1"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Coeficiente b
              </label>
              <input
                type="number"
                step="any"
                v-model="b"
                placeholder="Ej: -5"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Coeficiente c
              </label>
              <input
                type="number"
                step="any"
                v-model="c"
                placeholder="Ej: 6"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="p-4 bg-red-50 border-l-4 border-red-500 rounded"
          >
            <p class="text-red-700">{{ error }}</p>
          </div>

          <!-- Buttons -->
          <div class="grid md:grid-cols-2 gap-4">
            <button
              @click="handleSolve(true)"
              :disabled="loading"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg"
            >
              <div class="flex items-center justify-center gap-2">
                <BookOpen class="w-5 h-5" />
                {{ loading ? "Resolviendo..." : "Resolver Paso a Paso" }}
              </div>
            </button>

            <button
              @click="handleSolve(false)"
              :disabled="loading"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg"
            >
              <div class="flex items-center justify-center gap-2">
                <Zap class="w-5 h-5" />
                {{ loading ? "Resolviendo..." : "Mostrar Solución Completa" }}
              </div>
            </button>
          </div>
        </div>

        <!-- Step-by-step -->
        <div
          v-if="result && showStepByStep"
          class="mt-8 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg"
        >
          <div class="flex items-center justify-between mb-6">
            <h4 class="text-xl font-bold text-indigo-800">
              Resolución Paso a Paso
            </h4>
            <span
              class="text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full"
            >
              Paso {{ currentStep + 1 }} de {{ steps.length }}
            </span>
          </div>

          <div v-if="steps.length > 0">
            <div class="bg-white p-6 rounded-lg shadow-md mb-6 min-h-[200px]">
              <h5 class="text-lg font-bold text-gray-800 mb-3">
                {{ steps[currentStep].title }}
              </h5>

              <p class="text-gray-700 mb-4">{{ steps[currentStep].content }}</p>

              <div
                class="p-4 rounded-lg border-2"
                :class="[
                  `bg-${steps[currentStep].color}-50`,
                  `border-${steps[currentStep].color}-200`,
                ]"
              >
                <p
                  class="text-xl font-mono font-semibold text-gray-800 whitespace-pre-line"
                >
                  {{ steps[currentStep].data }}
                </p>
              </div>

              <div
                v-if="currentStep === steps.length - 1"
                class="mt-4 p-4 bg-green-100 border-2 border-green-300 rounded-lg"
              >
                <p class="text-green-800 font-semibold">
                  ✅ Tipo de raíces: {{ result.discriminantType }}
                </p>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                @click="prevStep"
                :disabled="currentStep === 0"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg disabled:bg-gray-300"
              >
                ← Anterior
              </button>

              <button
                @click="nextStep"
                :disabled="currentStep === steps.length - 1"
                class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg disabled:bg-gray-300"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        <!-- Complete solution -->
        <div
          v-if="result && !showStepByStep"
          class="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg"
        >
          <h4 class="text-xl font-bold text-green-800 mb-4">Solución:</h4>

          <div class="space-y-4">
            <div
              v-if="result.ecuacion_caracteristica"
              class="bg-white p-4 rounded-lg border-l-4 border-indigo-500"
            >
              <p class="text-sm font-semibold text-gray-600">
                Ecuación característica:
              </p>
              <p class="text-lg font-mono text-gray-800">
                {{ result.ecuacion_caracteristica }}
              </p>
            </div>

            <div
              v-if="result.raices"
              class="bg-white p-4 rounded-lg border-l-4 border-blue-500"
            >
              <p class="text-sm font-semibold text-gray-600">Raíces:</p>
              <p class="text-lg font-mono">{{ result.raices }}</p>
            </div>

            <div
              v-if="result.soluciones_li"
              class="bg-white p-4 rounded-lg border-l-4 border-orange-500"
            >
              <p class="text-sm font-semibold">
                Soluciones Linealmente Independientes:
              </p>
              <p class="font-mono">y₁ = {{ result.soluciones_li.y1 }}</p>
              <p class="font-mono">y₂ = {{ result.soluciones_li.y2 }}</p>
            </div>

            <div
              v-if="result.solucion_general"
              class="bg-white p-4 rounded-lg border-l-4 border-green-500"
            >
              <p class="text-sm font-semibold">Solución General:</p>
              <p class="text-xl font-mono">{{ result.solucion_general }}</p>
            </div>

            <div
              v-if="result.solucion_original"
              class="bg-white p-4 rounded-lg border-l-4 border-purple-500"
            >
              <p class="text-sm font-semibold">Solución Original:</p>
              <p class="font-mono">{{ result.solucion_original }}</p>
            </div>

            <p
              class="text-sm text-green-700 font-semibold bg-white p-3 rounded-lg"
              v-if="result.tipo_raices"
            >
              Tipo : {{ result.tipo_raices }}
            </p>

            <!-- <p
              class="text-sm text-indigo-700 font-semibold bg-white p-3 rounded-lg"
            >
              🔍 Tipo (Discriminante): {{ result.discriminantType }}
            </p> -->
          </div>
        </div>
      </div>

      <!-- Example -->
      <div
        class="mt-12 max-w-4xl mx-auto bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg"
      >
        <h4 class="font-bold text-blue-900 mb-2">💡 Ejemplo:</h4>
        <p class="text-blue-800">
          Para la ecuación <span class="font-mono">y'' - 5y' + 6y = 0</span>,
          ingresa: a=1, b=-5, c=6
        </p>
      </div>
    </section>
  </div>
</template>
