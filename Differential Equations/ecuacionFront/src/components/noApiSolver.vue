<script setup>
import { BookOpen, Calculator, Zap } from "lucide-vue-next";
import { computed, ref } from "vue";

const a = ref("");
const b = ref("");
const c = ref("");

const result = ref < any > null;
const loading = ref(false);
const currentStep = ref(0);
const showStepByStep = ref(false);

const steps = computed(() => [
  {
    title: "Paso 1: Ecuación característica",
    content: "Planteamos la ecuación característica am² + bm + c = 0",
    formula: `${a.value || "a"}m² + ${b.value || "b"}m + ${c.value || "c"} = 0`,
  },
  // {
  //   title: "Paso 2: Calcular el discriminante",
  //   content: "Calculamos Δ = b² - 4ac para determinar el tipo de raíces",
  //   formula: `Δ = (${b.value || "b"})² - 4(${a.value || "a"})(${
  //     c.value || "c"
  //   }) = ${result.value?.discriminant || "..."}`,
  // },
  {
    title: "Paso 2: Encontrar las raíces",
    content: "Usamos la fórmula general: m = (-b ± √Δ) / (2a)",
    formula: `m₁ = ${result.value?.r1 || "..."}, m₂ = ${
      result.value?.r2 || "..."
    }`,
  },
  {
    title: "Paso 3: Soluciones linealmente independientes",
    content:
      result.value?.solutionType ||
      "Determinamos las soluciones linealmente independientes según el tipo de raíces",
    formula: result.value?.independentSolutions || "y₁(x) = ..., y₂(x) = ...",
    explanation: result.value?.independentExplanation || "",
  },
  {
    title: "Paso 4: Solución general",
    content:
      "Formamos la solución general como combinación lineal: y(x) = C₁y₁(x) + C₂y₂(x)",
    formula: result.value?.general || "y(x) = ...",
  },
]);

const handleSolve = (stepByStep = false) => {
  if (!a.value || !b.value || !c.value) {
    alert("Por favor ingresa todos los coeficientes");
    return;
  }

  loading.value = true;
  showStepByStep.value = stepByStep;
  currentStep.value = 0;

  setTimeout(() => {
    const aVal = parseFloat(a.value);
    const bVal = parseFloat(b.value);
    const cVal = parseFloat(c.value);

    const discriminant = bVal ** 2 - 4 * aVal * cVal;

    let r1,
      r2,
      solutionType,
      independentSolutions,
      independentExplanation,
      general;

    if (discriminant > 0) {
      r1 = ((-bVal + Math.sqrt(discriminant)) / (2 * aVal)).toFixed(2);
      r2 = ((-bVal - Math.sqrt(discriminant)) / (2 * aVal)).toFixed(2);
      solutionType =
        "Como Δ > 0, tenemos dos raíces reales distintas. Las soluciones son:";
      independentSolutions = `y₁(x) = e^(${r1}x), y₂(x) = e^(${r2}x)`;
      independentExplanation =
        "Estas funciones son linealmente independientes porque su Wronskiano es diferente de cero.";
      general = `y(x) = C₁e^(${r1}x) + C₂e^(${r2}x)`;
    } else if (discriminant === 0) {
      r1 = r2 = (-bVal / (2 * aVal)).toFixed(2);
      solutionType =
        "Como Δ = 0, tenemos una raíz real repetida. Las soluciones son:";
      independentSolutions = `y₁(x) = e^(${r1}x), y₂(x) = xe^(${r1}x)`;
      independentExplanation =
        "La segunda solución se obtiene multiplicando la primera por x.";
      general = `y(x) = C₁e^(${r1}x) + C₂xe^(${r1}x)`;
    } else {
      const real = (-bVal / (2 * aVal)).toFixed(2);
      const imag = (Math.sqrt(-discriminant) / (2 * aVal)).toFixed(2);
      r1 = `${real} + ${imag}i`;
      r2 = `${real} - ${imag}i`;
      solutionType =
        "Como Δ < 0, tenemos raíces complejas conjugadas α ± βi. Las soluciones son:";
      independentSolutions = `y₁(x) = e^(${real}x)cos(${imag}x), y₂(x) = e^(${real}x)sin(${imag}x)`;
      independentExplanation =
        "Usamos la fórmula de Euler: e^(α±βi)x = e^(αx)[cos(βx) ± i sin(βx)].";
      general = `y(x) = e^(${real}x)[C₁cos(${imag}x) + C₂sin(${imag}x)]`;
    }

    result.value = {
      general,
      r1,
      r2,
      discriminant: discriminant.toFixed(2),
      type:
        discriminant > 0
          ? "Raíces reales distintas"
          : discriminant === 0
          ? "Raíces reales repetidas"
          : "Raíces complejas conjugadas",
      solutionType,
      independentSolutions,
      independentExplanation,
    };

    loading.value = false;
  }, 1000);
};

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--;
};
</script>

<template>
  <div
    class="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
  >
    <!-- HERO SECTION -->
    <section class="max-w-6xl mx-auto px-6 py-16">
      <div class="text-center mb-12">
        <h2 class="text-5xl font-extrabold text-gray-900 mb-6">
          Resuelve Ecuaciones Diferenciales
          <span class="block text-indigo-600 mt-2">de Segundo Orden</span>
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Obtén la solución general de EDOs lineales homogéneas de segundo orden
          con coeficientes constantes. Ingresa los coeficientes de tu ecuación
          <span class="font-mono font-semibold">ay'' + by' + cy = 0</span>
          y obtén la solución paso a paso.
        </p>
      </div>

      <!-- FEATURES -->
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
            Explicación Detallada
          </h3>
          <p class="text-gray-600">
            Comprende cada paso del proceso de solución
          </p>
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

      <!-- FORM -->
      <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
        <h3 class="text-3xl font-bold text-gray-800 mb-8 text-center">
          Ingresa los Coeficientes
        </h3>

        <div
          class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-8 text-center text-2xl font-mono font-semibold text-indigo-900"
        >
          <span class="text-indigo-600">a</span>y'' +
          <span class="text-indigo-600">b</span>y' +
          <span class="text-indigo-600">c</span>y = 0
        </div>

        <div class="space-y-6">
          <div class="grid md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Coeficiente a</label
              >
              <input
                type="number"
                step="any"
                v-model="a"
                placeholder="Ej: 1"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Coeficiente b</label
              >
              <input
                type="number"
                step="any"
                v-model="b"
                placeholder="Ej: 5"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Coeficiente c</label
              >
              <input
                type="number"
                step="any"
                v-model="c"
                placeholder="Ej: 6"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
              />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <button
              @click="handleSolve(true)"
              :disabled="loading"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <BookOpen class="w-5 h-5" />
              {{ loading ? "Resolviendo..." : "Resolver Paso a Paso" }}
            </button>

            <button
              @click="handleSolve(false)"
              :disabled="loading"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap class="w-5 h-5" />
              {{ loading ? "Resolviendo..." : "Mostrar Solución Completa" }}
            </button>
          </div>
        </div>

        <!-- RESULTADO COMPLETO -->
        <div
          v-if="result && !showStepByStep"
          class="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg"
        >
          <h4 class="text-xl font-bold text-green-800 mb-4">
            Solución Completa:
          </h4>

          <div class="space-y-4">
            <div class="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
              <p class="text-sm font-semibold text-gray-600 mb-2">
                Ecuación característica:
              </p>
              <p class="text-lg font-mono">
                {{ a }}m² + {{ b }}m + {{ c }} = 0
              </p>
            </div>

            <!-- <div class="bg-white p-4 rounded-lg border-l-4 border-purple-500">
              <p class="text-sm font-semibold text-gray-600 mb-2">
                Discriminante:
              </p>
              <p class="text-lg font-mono">Δ = {{ result.discriminant }}</p>
            </div> -->

            <div class="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p class="text-sm font-semibold text-gray-600 mb-2">Raíces:</p>
              <div class="grid md:grid-cols-2 gap-3">
                <p class="text-lg font-mono">m₁ = {{ result.r1 }}</p>
                <p class="text-lg font-mono">m₂ = {{ result.r2 }}</p>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border-l-4 border-orange-500">
              <p class="text-sm font-semibold text-gray-600 mb-2">
                Soluciones Linealmente Independientes:
              </p>
              <p class="text-lg font-mono mb-2">
                {{ result.independentSolutions }}
              </p>
              <p class="text-xs text-gray-600 italic">
                {{ result.independentExplanation }}
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <p class="text-sm font-semibold text-gray-600 mb-2">
                Solución General:
              </p>
              <p class="text-2xl font-mono font-semibold">
                {{ result.general }}
              </p>
            </div>

            <p
              class="text-sm text-green-700 font-semibold bg-white p-3 rounded-lg"
            >
              📊 Tipo: {{ result.type }}
            </p>
          </div>
        </div>

        <!-- PASO A PASO -->
        <div
          v-if="result && showStepByStep"
          class="mt-8 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg"
        >
          <div class="flex justify-between items-center mb-6">
            <h4 class="text-xl font-bold text-indigo-800">
              Resolución Paso a Paso
            </h4>
            <span
              class="text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full"
            >
              Paso {{ currentStep + 1 }} de {{ steps.length }}
            </span>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md mb-6 min-h-[200px]">
            <h5 class="text-lg font-bold text-gray-800 mb-3">
              {{ steps[currentStep].title }}
            </h5>
            <p class="text-gray-700 mb-4">{{ steps[currentStep].content }}</p>

            <div class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <p class="text-xl font-mono font-semibold text-center">
                {{ steps[currentStep].formula }}
              </p>
            </div>

            <div
              v-if="steps[currentStep].explanation"
              class="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded"
            >
              <p class="text-sm text-blue-900">
                <strong>💡 Nota: </strong>
                {{ steps[currentStep].explanation }}
              </p>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="prevStep"
              :disabled="currentStep === 0"
              class="flex-1 bg-gray-600 text-white font-bold py-3 rounded-lg disabled:bg-gray-300"
            >
              ← Anterior
            </button>

            <button
              @click="nextStep"
              :disabled="currentStep === steps.length - 1"
              class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg disabled:bg-gray-300"
            >
              Siguiente →
            </button>
          </div>

          <div
            v-if="currentStep === steps.length - 1"
            class="mt-4 p-4 bg-green-100 border-2 border-green-300 rounded-lg"
          >
            <p class="text-green-800 font-semibold text-center">
              ✅ ¡Solución completa! Tipo: {{ result.type }}
            </p>
          </div>
        </div>
      </div>

      <!-- EJEMPLO -->
      <div
        class="mt-12 max-w-4xl mx-auto bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg"
      >
        <h4 class="font-bold text-blue-900 mb-2">💡 Ejemplo:</h4>
        <p class="text-blue-800">
          Para la ecuación
          <span class="font-mono font-semibold">y'' + 5y' + 6y = 0</span>,
          ingresa: a=1, b=5, c=6
        </p>
      </div>
    </section>
  </div>
</template>
