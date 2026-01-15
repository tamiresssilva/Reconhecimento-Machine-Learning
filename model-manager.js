/**
 * Sistema de Gerenciamento de Modelo
 * Permite treinar, atualizar e salvar modelos localmente
 */

class ModelManager {
    constructor() {
        this.trainingData = this.loadTrainingData();
        this.modelVersion = this.getModelVersion();
    }

    /**
     * Carrega dados de treinamento do localStorage
     */
    loadTrainingData() {
        const data = localStorage.getItem('trainingData');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Salva dados de treinamento no localStorage
     */
    saveTrainingData() {
        localStorage.setItem('trainingData', JSON.stringify(this.trainingData));
        this.modelVersion = this.getModelVersion();
        localStorage.setItem('modelVersion', this.modelVersion);
    }

    /**
     * Obtém versão do modelo (baseada em hash dos dados)
     */
    getModelVersion() {
        const version = localStorage.getItem('modelVersion');
        return version ? parseInt(version) : 0;
    }

    /**
     * Adiciona imagens de treinamento
     */
    async addImages(className, files) {
        if (!className.trim()) {
            alert('Por favor, insira o nome da classe!');
            return false;
        }

        if (!this.trainingData[className]) {
            this.trainingData[className] = [];
        }

        for (const file of files) {
            try {
                const base64 = await this.fileToBase64(file);
                this.trainingData[className].push({
                    data: base64,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                });
            } catch (error) {
                console.error(`Erro ao processar ${file.name}:`, error);
            }
        }

        this.saveTrainingData();
        return true;
    }

    /**
     * Converte arquivo para Base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Remove uma imagem de treinamento
     */
    removeImage(className, index) {
        if (this.trainingData[className]) {
            this.trainingData[className].splice(index, 1);
            if (this.trainingData[className].length === 0) {
                delete this.trainingData[className];
            }
            this.saveTrainingData();
            return true;
        }
        return false;
    }

    /**
     * Remove uma classe inteira
     */
    removeClass(className) {
        if (this.trainingData[className]) {
            delete this.trainingData[className];
            this.saveTrainingData();
            return true;
        }
        return false;
    }

    /**
     * Obtém estatísticas dos dados de treinamento
     */
    getStatistics() {
        const stats = {
            totalClasses: Object.keys(this.trainingData).length,
            totalImages: 0,
            classeDetails: {},
        };

        for (const [className, images] of Object.entries(this.trainingData)) {
            const count = images.length;
            stats.classeDetails[className] = count;
            stats.totalImages += count;
        }

        return stats;
    }

    /**
     * Exporta dados de treinamento como JSON
     */
    exportData() {
        const data = {
            trainingData: this.trainingData,
            exportDate: new Date().toISOString(),
            version: this.modelVersion,
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Importa dados de treinamento de JSON
     */
    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.trainingData) {
                throw new Error('Formato inválido');
            }
            this.trainingData = data.trainingData;
            this.saveTrainingData();
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados de treinamento
     */
    clearAllData() {
        if (confirm('⚠️ Tem certeza que deseja limpar TODOS os dados de treinamento?\nEsta ação não pode ser desfeita!')) {
            this.trainingData = {};
            localStorage.removeItem('trainingData');
            localStorage.removeItem('modelVersion');
            this.modelVersion = 0;
            return true;
        }
        return false;
    }

    /**
     * Obtém dados de uma classe em formato para predição
     */
    getClassImages(className) {
        return this.trainingData[className] || [];
    }

    /**
     * Obtém todas as classes
     */
    getClasses() {
        return Object.keys(this.trainingData);
    }

    /**
     * Retorna tamanho total dos dados em MB
     */
    getStorageSize() {
        const data = JSON.stringify(this.trainingData);
        return (new Blob([data]).size / (1024 * 1024)).toFixed(2);
    }
}

// Instância global
const modelManager = new ModelManager();
