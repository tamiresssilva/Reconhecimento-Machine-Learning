const CONFIG = {
    WEBCAM_WIDTH: 300,
    WEBCAM_HEIGHT: 300,
    // Modelo pré-treinado do Teachable Machine (MobileNet)
    MODEL_URL: "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/",
};

let state = {
    model: null,
    webcam: null,
    labelContainer: null,
    maxPredictions: 0,
    isRunning: false,
    animationId: null,
};

// ============================================
// INICIALIZAÇÃO DO MODELO
// ============================================

async function initModel() {
    try {
        console.log("🧠 Carregando modelo pré-treinado...");
        
        // Usar modelo COCO-SSD para detecção de objetos
        const model = await cocoSsd.load();
        state.model = model;
        state.maxPredictions = 90; // COCO tem ~90 classes
        
        initializeLabelContainer();
        showStatus("✅ Modelo carregado! Pronto para reconhecer objetos.");
        console.log("✓ Modelo COCO-SSD carregado!");
        
    } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        showStatus("❌ Erro ao carregar modelo");
    }
}

function initializeLabelContainer() {
    state.labelContainer = document.getElementById("label-container");
    state.labelContainer.innerHTML = "";
}

function reloadModel() {
    if (state.model) {
        state.model = null;
    }
    stopWebcam();
    initModel();
}

function clearModelCache() {
    if (confirm("Limpar cache?")) {
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }
        alert("✓ Cache limpo!");
    }
}

// ============================================
// WEBCAM
// ============================================

async function startWebcam() {
    if (!state.model) {
        alert("⚠️ Carregue o modelo primeiro!");
        return;
    }
    
    try {
        const flip = true;
        state.webcam = new tmImage.Webcam(CONFIG.WEBCAM_WIDTH, CONFIG.WEBCAM_HEIGHT, flip);
        await state.webcam.setup();
        await state.webcam.play();
        
        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        container.appendChild(state.webcam.canvas);
        
        state.isRunning = true;
        console.log("✓ Webcam iniciada");
        loop();
        
    } catch (error) {
        console.error("Erro webcam:", error);
        alert("❌ Erro ao acessar webcam");
    }
}

function stopWebcam() {
    if (state.webcam) {
        state.webcam.stop();
        state.isRunning = false;
        
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        
        document.getElementById("webcam-container").innerHTML = "<p>Webcam parada</p>";
    }
}

async function loop() {
    if (state.isRunning && state.webcam && state.model) {
        state.webcam.update();
        await predictFromWebcam();
        state.animationId = window.requestAnimationFrame(loop);
    }
}

async function predictFromWebcam() {
    const canvas = state.webcam.canvas;
    await predict(canvas);
}

// ============================================
// UPLOAD DE IMAGEM
// ============================================

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!state.model) {
        alert("⚠️ Carregue o modelo primeiro!");
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                const previewContainer = document.getElementById("preview-container");
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; border-radius: 8px;">`;
                
                if (state.isRunning) {
                    stopWebcam();
                }
                
                await predict(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error("Erro:", error);
    }
}

// ============================================
// PREDIÇÃO COM COCO-SSD
// ============================================

async function predict(source) {
    if (!state.model) return;
    
    try {
        showStatus("⏳ Detectando objetos...");
        
        const predictions = await state.model.detect(source);
        displayPredictions(predictions);
        
        showStatus(`✅ ${predictions.length} objeto(s) detectado(s)`);
        
    } catch (error) {
        console.error("Erro na predição:", error);
        showStatus("❌ Erro ao detectar objetos");
    }
}

function displayPredictions(predictions) {
    state.labelContainer.innerHTML = "";
    
    if (predictions.length === 0) {
        state.labelContainer.innerHTML = "<p style='color: #999;'>Nenhum objeto detectado</p>";
        return;
    }
    
    // Ordenar por confiança
    predictions.sort((a, b) => b.score - a.score);
    
    // Mostrar top 5
    const topPredictions = predictions.slice(0, 5);
    
    topPredictions.forEach((prediction, index) => {
        const confidence = (prediction.score * 100).toFixed(2);
        const className = prediction.class;
        
        const element = document.createElement("div");
        element.className = "prediction-item";
        
        element.innerHTML = `
            <div class="prediction-label">
                ${index + 1}. ${className}
            </div>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${confidence}%"></div>
            </div>
            <div class="prediction-value">${confidence}%</div>
        `;
        
        state.labelContainer.appendChild(element);
    });
}

// ============================================
// TREINO (Desabilitado)
// ============================================

async function addTrainingImages() {
    alert("ℹ️ Este app usa modelo pré-treinado COCO-SSD.\nNão é necessário treinar!");
}

function downloadModel() {
    alert("ℹ️ O modelo é carregado online.\nNada para salvar.");
}

function showTrainingData() {
    showModal(`
        <h3>ℹ️ Modelo Pré-treinado</h3>
        <p><strong>Tipo:</strong> COCO-SSD (TensorFlow.js)</p>
        <p><strong>Classes:</strong> ~90 objetos</p>
        <p><strong>Fonte:</strong> Google/TensorFlow</p>
        <hr>
        <p>Este modelo reconhece objetos comuns como:</p>
        <ul style="text-align: left;">
            <li>Pessoas, animais, veículos</li>
            <li>Móveis, utensílios</li>
            <li>Alimentos, plantas</li>
            <li>E muito mais...</li>
        </ul>
    `);
}

function removeTrainingClass(className) {
    alert("ℹ️ Modelo pré-treinado não pode ser modificado.");
}

function clearAllTrainingData() {
    alert("ℹ️ Nada para limpar.");
}

// ============================================
// MODAL
// ============================================

function showModal(content) {
    const modal = document.getElementById("modal");
    document.getElementById("modal-body").innerHTML = content;
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// ============================================
// UTILIDADES
// ============================================

function showStatus(message) {
    const statusDiv = document.getElementById("training-status");
    if (statusDiv) {
        statusDiv.innerHTML = message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("✓ Página carregada");
    initModel();
});
