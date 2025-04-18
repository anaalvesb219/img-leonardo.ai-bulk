/**
 * IMG-LEONARDO.AI-BULK
 * Aplicativo para geraÃ§Ã£o em massa de imagens usando a API do Leonardo AI via proxy
 */

// VariÃ¡veis globais para a aplicaÃ§Ã£o
let elements;
let state;

// Tenta obter a chave da API direto do proxy e validar
async function carregarChaveApiDoProxy() {
  try {
    const res = await fetch('http://localhost:3001/proxy/apikey');
    if (!res.ok) throw new Error('Proxy nÃ£o retornou a chave');

    const data = await res.json();
    const apiKey = data.apiKey;

    if (!apiKey) throw new Error('Chave nÃ£o encontrada na resposta');

    // Preenche o input visual
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
      apiKeyInput.value = apiKey;
    }

    // ValidaÃ§Ã£o visual
    showApiKeyValidationFeedback(true, "Chave carregada automaticamente do proxy");

    // âœ… Usa o leonardoAPI para setar a chave e disparar o evento
    if (window.leonardoAPI && typeof window.leonardoAPI.setApiKey === 'function') {
      window.leonardoAPI.setApiKey(apiKey);
    } else {
      console.warn('leonardoAPI nÃ£o estÃ¡ disponÃ­vel no escopo global');
    }

  } catch (err) {
    console.warn("âŒ Erro ao carregar chave da API:", err.message);
    showApiKeyValidationFeedback(false, "NÃ£o foi possÃ­vel carregar a chave da API automaticamente.");
  }
}

// FunÃ§Ã£o para carregar a chave API do arquivo .env
async function carregarChaveApiDoArquivo() {
  try {
    console.log('Tentando carregar a chave API do arquivo .env via endpoint /api/key...');
    const response = await fetch('/api/key');
    
    // Verifica o status da resposta
    if (response.status === 401 || response.status === 404) {
      console.warn('Nenhuma chave API encontrada no arquivo .env');
      return null;
    }
    
    if (!response.ok) {
      console.warn(`Erro ao carregar a chave API: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Processa a resposta JSON
    try {
      const data = await response.json();
      const apiKey = data.key;
      
      if (apiKey) {
        console.log('Chave API carregada com sucesso do arquivo .env');
        
        // Preenche o campo de entrada com a chave
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) {
          apiKeyInput.value = apiKey;
          
          // Mostra feedback visual de validaÃ§Ã£o
          showApiKeyValidationFeedback(true, 'Chave API carregada com sucesso do arquivo .env');
        }
        
        // Aplica a chave na API
        if (window.leonardoAPI && typeof window.leonardoAPI.setApiKey === 'function') {
          window.leonardoAPI.setApiKey(apiKey);
          
          // Dispara evento de validaÃ§Ã£o para que o sistema continue o fluxo normal
          const event = new CustomEvent('keyValidated', {
            detail: { key: apiKey, valid: true }
          });
          document.dispatchEvent(event);
          
          // Tenta carregar os modelos agora que temos uma chave vÃ¡lida
          setTimeout(() => {
            loadModels();
          }, 500);
          
          return apiKey;
        }
      }
      
      return null;
    } catch (jsonError) {
      console.error('Erro ao processar a resposta JSON da API key:', jsonError);
      return null;
    }
  } catch (error) {
    console.error('Erro ao carregar a chave API do arquivo .env:', error);
    return null;
  }
}

// FunÃ§Ã£o para salvar a chave API no arquivo .env
async function salvarChaveApiNoArquivo(apiKey) {
  try {
    const response = await fetch('/api/key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: apiKey })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Chave API salva com sucesso no arquivo .env');
      showNotification('success', 'Chave API salva com sucesso!');
      return true;
    } else {
      console.error('Erro ao salvar a chave API:', data.error);
      showNotification('error', `Erro ao salvar a chave: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error('Erro ao salvar a chave API:', error);
    showNotification('error', 'Erro ao salvar a chave API. Verifique o console.');
    return false;
  }
}

// FunÃ§Ã£o para lidar com o salvamento e validaÃ§Ã£o da API key
async function handleKeyValidation() {
  const apiKeyInput = document.getElementById('api-key');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showApiKeyValidationFeedback(false, 'Por favor, insira uma chave API');
    return;
  }
  
  // Exibe feedback de carregamento
  const saveKeyBtn = document.getElementById('save-key');
  const originalBtnText = saveKeyBtn.innerHTML;
  saveKeyBtn.innerHTML = '<span class="spinner small"></span> Validando...';
  saveKeyBtn.disabled = true;
  
  try {
    // Tenta validar a chave
    if (window.leonardoAPI && typeof window.leonardoAPI.setApiKey === 'function') {
      window.leonardoAPI.setApiKey(apiKey);
      
      // Realiza uma requisiÃ§Ã£o de teste para validar a chave
      const isValid = await window.leonardoAPI.validateApiKey();
      
      if (isValid) {
        // Salva a chave no arquivo .env
        await salvarChaveApiNoArquivo(apiKey);
        
        showApiKeyValidationFeedback(true, 'Chave API vÃ¡lida!');
        
        // Dispara evento de validaÃ§Ã£o
        const event = new CustomEvent('keyValidated', {
          detail: { key: apiKey, valid: true }
        });
        document.dispatchEvent(event);
      } else {
        showApiKeyValidationFeedback(false, 'Chave API invÃ¡lida. Verifique e tente novamente.');
      }
    } else {
      showApiKeyValidationFeedback(false, 'Erro ao inicializar o gerenciador de API.');
    }
  } catch (error) {
    console.error('Erro ao validar a chave API:', error);
    showApiKeyValidationFeedback(false, 'Erro ao validar a chave API. Verifique o console.');
  } finally {
    // Restaura o botÃ£o
    saveKeyBtn.innerHTML = originalBtnText;
    saveKeyBtn.disabled = false;
  }
}

// FunÃ§Ã£o para exibir feedback visual da validaÃ§Ã£o da chave API
function showApiKeyValidationFeedback(isValid, message) {
  const feedbackElement = document.getElementById('api-key-feedback');
  
  if (!feedbackElement) return;
  
  feedbackElement.className = isValid 
    ? 'api-key-feedback valid' 
    : 'api-key-feedback invalid';
  
  feedbackElement.innerHTML = isValid 
    ? `<i class="fas fa-check-circle"></i> ${message}` 
    : `<i class="fas fa-exclamation-circle"></i> ${message}`;
  
  feedbackElement.classList.remove('hidden');
}

// Evento para carregar a chave API quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  carregarChaveApiDoArquivo();
  
  // Configura os event listeners para a chave API
  const saveKeyBtn = document.getElementById('save-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', handleKeyValidation);
  }
  
  const toggleKeyBtn = document.getElementById('toggle-key');
  const apiKeyInput = document.getElementById('api-key');
  
  if (toggleKeyBtn && apiKeyInput) {
    toggleKeyBtn.addEventListener('click', () => {
      const type = apiKeyInput.type === 'password' ? 'text' : 'password';
      apiKeyInput.type = type;
      toggleKeyBtn.querySelector('i').className = type === 'password' 
        ? 'fas fa-eye' 
        : 'fas fa-eye-slash';
    });
  }
  
  // Permite a tecla Enter para validar
  if (apiKeyInput) {
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyValidation();
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log("App iniciando...");
  
  // Com o novo proxy, nÃ£o precisamos mais gerenciar a chave API no front-end
  if (window.leonardoAPI) {
    console.log('API do Leonardo inicializada com proxy local');
  } else {
    console.error('InstÃ¢ncia leonardoAPI nÃ£o encontrada no escopo global!');
  }
  
  console.log('DOM completamente carregado, inicializando aplicaÃ§Ã£o...');
  
  // Tenta carregar a chave da API automaticamente do proxy
  carregarChaveApiDoProxy();
  
  // Ajustamos os eventos do ApiKeyManager para trabalhar com o proxy
  setupApiKeyManagerEvents();
  
  // Aguardar que o objeto leonardoAPI esteja disponÃ­vel
  checkAndInitialize();
});

/**
 * Configura os listeners de eventos do ApiKeyManager
 */
function setupApiKeyManagerEvents() {
  // Evento quando a chave Ã© alterada (mantido por compatibilidade)
  apiKeyManager.on('keyChanged', (data) => {
    console.log('Evento keyChanged recebido:', data);
    showNotification('Proxy configurado com sucesso', 'success');
  });
  
  // Evento quando a chave Ã© validada (adaptado para o proxy)
  apiKeyManager.on('keyValidated', (data) => {
    console.log('Evento keyValidated recebido:', data);
    
    if (data.isValid) {
      console.log('Proxy validado com sucesso, carregando modelos...');
      
      // Garante que a funÃ§Ã£o loadModels exista antes de chamÃ¡-la
      if (typeof loadModels === 'function') {
        showNotification('Proxy configurado. Carregando modelos...', 'success');
        setTimeout(() => {
          try {
            loadModels().catch(err => {
              console.error('Erro ao carregar modelos apÃ³s validaÃ§Ã£o:', err);
              showNotification('Erro ao carregar modelos, tente novamente', 'error');
            });
          } catch (error) {
            console.error('Erro ao chamar loadModels:', error);
          }
        }, 500);
      } else {
        console.error('FunÃ§Ã£o loadModels nÃ£o encontrada apÃ³s validaÃ§Ã£o do proxy');
      }
    } else {
      console.error('ValidaÃ§Ã£o do proxy falhou');
      showNotification('NÃ£o foi possÃ­vel conectar ao proxy', 'error');
    }
  });
}

/**
 * Verifica se o objeto leonardoAPI estÃ¡ disponÃ­vel e inicializa a aplicaÃ§Ã£o
 */
function checkAndInitialize() {
  if (typeof window.leonardoAPI === 'undefined') {
    console.log('Objeto leonardoAPI ainda nÃ£o disponÃ­vel, aguardando...');
    
    // Verificar novamente em 100ms
    setTimeout(checkAndInitialize, 100);
    return;
  }
  
  console.log('Objeto leonardoAPI disponÃ­vel, inicializando aplicaÃ§Ã£o...');
  initializeApp();
}

/**
 * Inicializa a aplicaÃ§Ã£o
 */
async function init() {
  console.log("Inicializando aplicaÃ§Ã£o...");

  // Verifica se o objeto leonardoAPI estÃ¡ disponÃ­vel
  if (typeof window.leonardoAPI === 'undefined' || !window.leonardoAPI) {
    console.error("Objeto leonardoAPI nÃ£o encontrado!");
    showNotification('Erro ao inicializar a API. Recarregue a pÃ¡gina.', 'error');
    
    // Ãšltima tentativa de criar uma instÃ¢ncia manualmente
    try {
      console.log("Tentando criar instÃ¢ncia de LeonardoAPI manualmente...");
      window.leonardoAPI = new LeonardoAPI();
      console.log("InstÃ¢ncia de LeonardoAPI criada com sucesso como fallback:", window.leonardoAPI);
    } catch (error) {
      console.error("Erro fatal ao criar instÃ¢ncia de LeonardoAPI:", error);
      alert("Erro crÃ­tico ao inicializar a aplicaÃ§Ã£o. Por favor, recarregue a pÃ¡gina.");
      return; // Interrompe a execuÃ§Ã£o da funÃ§Ã£o
    }
  } else {
    console.log("LeonardoAPI jÃ¡ estÃ¡ disponÃ­vel:", window.leonardoAPI);
  }

  // Tenta carregar a chave da API automaticamente do proxy novamente (caso o DOMContentLoaded tenha falhado)
  try {
    await carregarChaveApiDoProxy();
  } catch (error) {
    console.warn("Falha ao carregar chave da API durante inicializaÃ§Ã£o:", error);
  }

  // Tenta validar a conexÃ£o com o proxy automaticamente na inicializaÃ§Ã£o
  try {
    console.log('Verificando conexÃ£o com o proxy automaticamente...');
    
    // Verifica se a API estÃ¡ funcionando
    const isValid = await window.leonardoAPI.validateApiKey();
      
      if (isValid) {
      console.log('API validada com sucesso!');
        // loadModels serÃ¡ chamado pelo evento keyValidated
      } else {
      console.error('NÃ£o foi possÃ­vel validar a API');
      showNotification('Falha ao verificar a API. Tente validar manualmente.', 'warning');
      }
    } catch (error) {
    console.error('Erro ao verificar a API:', error);
    showNotification('Erro ao verificar a API. Tente validar manualmente.', 'warning');
  }
}

/**
 * Inicializa a aplicaÃ§Ã£o
 */
function initializeApp() {
  console.log("Inicializando elementos da aplicaÃ§Ã£o...");
  
  // Inicializa elementos globais
  elements = {
    // ConfiguraÃ§Ãµes da API
    apiKey: document.getElementById('api-key'),
    saveKey: document.getElementById('save-key'),
    toggleKey: document.getElementById('toggle-key'),
    
    // ConfiguraÃ§Ãµes de geraÃ§Ã£o
    modelSelect: document.getElementById('model-select'),
    modelLoadingSpinner: document.getElementById('model-loading-spinner'),
    presetDimensions: document.getElementById('preset-dimensions'),
    numImages: document.getElementById('num-images'),
    guidanceScale: document.getElementById('guidance-scale'),
    guidanceValue: document.getElementById('guidance-value'),
    negativePrompt: document.getElementById('negative-prompt'),
    seed: document.getElementById('seed'),
    
    // ConfiguraÃ§Ãµes de PhotoReal
    photoRealCheckbox: document.getElementById('photoreal-checkbox'),
    photoRealOptions: document.getElementById('photoreal-options'),
    photoRealStyle: document.getElementById('photoreal-style'),
    
    // ConfiguraÃ§Ãµes de Phoenix
    phoenixCheckbox: document.getElementById('phoenix-checkbox'),
    phoenixOptions: document.getElementById('phoenix-options'),
    phoenixContrast: document.getElementById('phoenix-contrast'),
    phoenixStyle: document.getElementById('phoenix-style'),
    phoenixAlchemyCheckbox: document.getElementById('phoenix-alchemy-checkbox'),
    phoenixUltraCheckbox: document.getElementById('phoenix-ultra-checkbox'),
    phoenixEnhancePromptCheckbox: document.getElementById('phoenix-enhance-prompt-checkbox'),
    
    // ConfiguraÃ§Ãµes de Flux
    fluxCheckbox: document.getElementById('flux-checkbox'),
    fluxOptions: document.getElementById('flux-options'),
    fluxContrast: document.getElementById('flux-contrast'),
    fluxStyle: document.getElementById('flux-style'),
    fluxEnhancePromptCheckbox: document.getElementById('flux-enhance-prompt-checkbox'),
    fluxUltraCheckbox: document.getElementById('flux-ultra-checkbox'),
    
    // Exemplo de requisiÃ§Ã£o - Verificar se o elemento existe antes de tentar acessar
    sampleRequest: document.getElementById('sample-request') ? 
      document.getElementById('sample-request').querySelector('code') : null,
    
    // Prompts
    promptsTextarea: document.getElementById('prompts'),
    generateButton: document.getElementById('generate-button'),
    cancelButton: document.getElementById('cancel-button'),
    
    // Progresso
    progressSection: document.querySelector('.progress-section'),
    progressBar: document.querySelector('.progress-bar'),
    currentPrompt: document.getElementById('current-prompt'),
    progressCount: document.getElementById('progress-count'),
    
    // Galeria de imagens
    gallery: document.querySelector('.gallery'),
    generatedImagesCount: document.getElementById('generated-images-count'),
    clearGalleryButton: document.getElementById('clear-gallery'),
    downloadAllButton: document.getElementById('download-all')
  };
  
  // Inicializa o estado da aplicaÃ§Ã£o
  state = {
    isGenerating: false,
    generationQueue: [],
    currentGeneration: null,
    cancelGeneration: false,
    generatedImages: [],
    totalImagesGenerated: 0
  };
  
  // Valida elementos obrigatÃ³rios
  if (!elements.saveKey || !elements.modelSelect || 
      !elements.promptsTextarea || !elements.generateButton) {
    console.error("Elementos essenciais nÃ£o encontrados!");
    alert("Erro ao carregar elementos da interface. Por favor, recarregue a pÃ¡gina.");
    return;
  }
  
  // Inicializa funÃ§Ãµes especÃ­ficas
  setupModelSelectEvents();
  setupDimensionSelect();
  setupRangeSliders();
  setupPhotoRealToggle();
  setupPhoenixToggle();
  setupFluxToggle();
  
  // Inicializa os event listeners principais
  if (elements.saveKey) {
    elements.saveKey.addEventListener('click', handleKeyValidation);
  }
  
  if (elements.generateButton) {
    elements.generateButton.addEventListener('click', startImageGeneration);
  }
  
  if (elements.cancelButton) {
    elements.cancelButton.addEventListener('click', cancelGeneration);
  }
  
  if (elements.clearGalleryButton) {
    elements.clearGalleryButton.addEventListener('click', clearGeneratedImages);
  }
  
  if (elements.downloadAllButton) {
    elements.downloadAllButton.addEventListener('click', downloadAllImages);
  }
  
  // Define a visualizaÃ§Ã£o inicial correta para componentes opcionais
  const hasPhotoReal = !!elements.photoRealCheckbox;
  const hasPhoenix = !!elements.phoenixCheckbox;
  const hasFlux = !!elements.fluxCheckbox;
  
  if (hasPhotoReal && elements.photoRealOptions) {
    elements.photoRealOptions.style.display = 'none';
  }
  
  if (hasPhoenix && elements.phoenixOptions) {
    elements.phoenixOptions.style.display = 'none';
  }
  
  // Inicializa a aplicaÃ§Ã£o
  init();
  
  console.log("AplicaÃ§Ã£o inicializada com sucesso!");
}

/**
 * Configura os event listeners para interaÃ§Ã£o do usuÃ¡rio
 */
function setupEventListeners() {
  console.log("Configurando event listeners...");

  // Toggle para mostrar/esconder a chave de API
  const toggleKeyButton = document.getElementById('toggle-key');
  if (toggleKeyButton) {
    console.log("Adicionando event listener ao botÃ£o toggleKey");
    toggleKeyButton.addEventListener('click', toggleApiKeyVisibility);
  }

  // Salvar a chave de API
  if (elements.saveKey) {
    console.log("Adicionando event listener ao botÃ£o saveKey");
    elements.saveKey.addEventListener('click', handleKeyValidation);
  } else {
    console.error("Elemento saveKey nÃ£o encontrado!");
  }

  // Atualiza o valor do Guidance Scale quando o slider muda
  if (elements.guidanceScale && elements.guidanceValue) {
    elements.guidanceScale.addEventListener('input', () => {
      elements.guidanceValue.textContent = elements.guidanceScale.value;
    });
  }

  // BotÃ£o para gerar imagens
  if (elements.generateButton) {
    elements.generateButton.addEventListener('click', startImageGeneration);
  }

  // BotÃ£o para baixar todas as imagens
  if (elements.downloadAllButton) {
    elements.downloadAllButton.addEventListener('click', downloadAllImages);
  }
  
  // BotÃ£o para cancelar a geraÃ§Ã£o
  const cancelButton = document.getElementById('cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', cancelGeneration);
  }

  // Configura o event listener para o checkbox PhotoReal
  if (elements.photoRealCheckbox) {
    elements.photoRealCheckbox.addEventListener('change', function() {
      if (elements.photoRealOptions) {
        elements.photoRealOptions.classList.toggle('active', this.checked);
      }
      
      // Atualiza o exemplo de payload quando o checkbox for alterado
      if (elements.modelSelect && elements.modelSelect.value) {
        updateSampleRequest(elements.modelSelect.value);
      }
    });
  }
  
  // Configura o event listener para o checkbox Phoenix
  if (elements.phoenixCheckbox) {
    elements.phoenixCheckbox.addEventListener('change', function() {
      if (elements.phoenixOptions) {
        elements.phoenixOptions.classList.toggle('active', this.checked);
      }
      
      // Quando Phoenix Ã© marcado, desmarca o PhotoReal para evitar conflitos
      if (this.checked && elements.photoRealCheckbox) {
        elements.photoRealCheckbox.checked = false;
        if (elements.photoRealOptions) {
          elements.photoRealOptions.classList.remove('active');
        }
      }
      
      // Atualiza o exemplo de payload quando o checkbox for alterado
      if (elements.modelSelect && elements.modelSelect.value) {
        updateSampleRequest(elements.modelSelect.value);
      }
    });
  }
  
  // Configura o event listener para o checkbox de Alchemy do Phoenix
  if (elements.phoenixAlchemyCheckbox) {
    elements.phoenixAlchemyCheckbox.addEventListener('change', function() {
      // Se alchemy estÃ¡ marcado, verifica se o contraste Ã© adequado
      if (this.checked) {
        const contrast = parseFloat(elements.phoenixContrast.value);
        if (contrast < 2.5) {
          showNotification('warning', 'O modo Alchemy requer contraste de 2.5 ou maior. Ajustando automaticamente.');
          elements.phoenixContrast.value = '2.5';
        }
      }
      
      // Atualiza o exemplo de payload
      if (elements.modelSelect && elements.modelSelect.value) {
        updateSampleRequest(elements.modelSelect.value);
      }
    });
  }
  
  // Configura o event listener para o contraste do Phoenix
  if (elements.phoenixContrast) {
    elements.phoenixContrast.addEventListener('change', function() {
      // Verifica se alchemy estÃ¡ marcado e ajusta o contraste se necessÃ¡rio
      if (elements.phoenixAlchemyCheckbox && elements.phoenixAlchemyCheckbox.checked) {
        const contrast = parseFloat(this.value);
        if (contrast < 2.5) {
          showNotification('warning', 'O modo Alchemy requer contraste de 2.5 ou maior. Ajustando automaticamente.');
          this.value = '2.5';
        }
      }
      
      // Atualiza o exemplo de payload
      if (elements.modelSelect && elements.modelSelect.value) {
        updateSampleRequest(elements.modelSelect.value);
      }
    });
  }
}

/**
 * Alterna a visibilidade da chave de API
 */
function toggleApiKeyVisibility() {
  console.log("Alternando visibilidade da chave API");
  
  if (!elements.apiKey) {
    console.error("Elemento apiKey nÃ£o encontrado");
    return;
  }
  
  const toggleButton = document.getElementById('toggle-key');
  if (!toggleButton) {
    console.error("BotÃ£o toggle nÃ£o encontrado");
    return;
  }
  
  if (elements.apiKey.type === 'password') {
    elements.apiKey.type = 'text';
    toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    toggleButton.title = 'Esconder Chave';
  } else {
    elements.apiKey.type = 'password';
    toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
    toggleButton.title = 'Mostrar Chave';
  }
}

/**
 * Lida com o clique no botÃ£o de validaÃ§Ã£o
 */
async function handleKeyValidation() {
  console.log("Validando chave da API...");
  
  // Reseta qualquer feedback visual anterior
  resetApiKeyFeedback();
  
  try {
  // Obter o valor do campo
  const apiKeyInput = document.getElementById('api-key');
  
  if (!apiKeyInput) {
    console.error("Elemento api-key nÃ£o encontrado!");
    showNotification('Erro ao acessar o campo da chave API', 'error');
    return;
  }
  
  const apiKey = apiKeyInput.value.trim();
  
  // ValidaÃ§Ã£o bÃ¡sica
  if (!apiKey) {
    console.error("Chave API vazia!");
      showNotification('Por favor, aguarde enquanto carregamos a chave do proxy ou insira uma manualmente', 'warning');
      
      // Tentar carregar do proxy automaticamente
      try {
        await carregarChaveApiDoProxy();
      } catch (error) {
        console.error("Erro ao carregar chave do proxy:", error);
        showApiKeyValidationFeedback(false, 'NÃ£o foi possÃ­vel carregar a chave do proxy');
      }
    return;
  }

    // Mostrar notificaÃ§Ã£o de que estÃ¡ tentando validar
    showNotification('Validando chave API...', 'info');
    
    // Aplicar a chave ao objeto leonardoAPI e validar
    if (window.leonardoAPI) {
      window.leonardoAPI.apiKey = apiKey;
      const isValid = await window.leonardoAPI.validateApiKey();
    
    if (isValid) {
        console.log("Chave API validada com sucesso");
        showApiKeyValidationFeedback(true, "Chave API validada com sucesso");
        showNotification('Chave API validada com sucesso!', 'success');
      } else {
        console.error("Falha ao validar a chave API");
        showApiKeyValidationFeedback(false, "Chave API invÃ¡lida. Verifique se estÃ¡ correta.");
        showNotification('Falha ao validar a chave API. Verifique se estÃ¡ correta.', 'error');
      }
    } else {
      console.error("Objeto leonardoAPI nÃ£o disponÃ­vel");
      showApiKeyValidationFeedback(false, "Falha na inicializaÃ§Ã£o da API");
      showNotification('Erro ao inicializar a API. Recarregue a pÃ¡gina.', 'error');
    }
  } catch (error) {
    console.error("Erro ao validar a chave API:", error);
    showApiKeyValidationFeedback(false, `Erro: ${error.message}`);
    showNotification(`Erro ao validar a chave API: ${error.message}`, 'error');
  }
}

/**
 * Exibe feedback visual sobre a validaÃ§Ã£o da chave API
 * @param {boolean} isValid - Se a chave Ã© vÃ¡lida
 * @param {string} message - Mensagem a ser exibida
 */
function showApiKeyValidationFeedback(isValid, message) {
  const apiKeyInput = document.getElementById('api-key');
  const keyContainer = document.querySelector('.key-container');
  
  if (!apiKeyInput || !keyContainer) return;
  
  // Adicionar classes aos elementos
  apiKeyInput.classList.add(isValid ? 'api-key-valid' : 'api-key-invalid');
  apiKeyInput.classList.remove(isValid ? 'api-key-invalid' : 'api-key-valid');
  
  keyContainer.classList.add(isValid ? 'key-container-valid' : 'key-container-invalid');
  keyContainer.classList.remove(isValid ? 'key-container-invalid' : 'key-container-valid');
  
  // Criar elemento de feedback
  const feedbackId = 'api-key-feedback';
  let feedbackEl = document.getElementById(feedbackId);
  
  // Se jÃ¡ existe, remove para recriar
  if (feedbackEl) feedbackEl.remove();
  
  // Criar novo elemento de feedback
  feedbackEl = document.createElement('div');
  feedbackEl.id = feedbackId;
  feedbackEl.className = `api-key-feedback ${isValid ? 'valid' : 'invalid'}`;
  feedbackEl.innerHTML = `
    <i class="fas ${isValid ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Inserir apÃ³s o container da chave
  keyContainer.parentNode.insertBefore(feedbackEl, keyContainer.nextSibling);
  
  // Configurar timer para remover feedback depois de um tempo
  setTimeout(() => resetApiKeyFeedback(), 8000);
}

/**
 * Limpa o feedback visual da validaÃ§Ã£o da chave API
 */
function resetApiKeyFeedback() {
  const apiKeyInput = document.getElementById('api-key');
  const keyContainer = document.querySelector('.key-container');
  const feedbackEl = document.getElementById('api-key-feedback');
  
  if (apiKeyInput) {
    apiKeyInput.classList.remove('api-key-valid', 'api-key-invalid');
  }
  
  if (keyContainer) {
    keyContainer.classList.remove('key-container-valid', 'key-container-invalid');
  }
  
  if (feedbackEl) {
    feedbackEl.classList.add('fade-out');
    setTimeout(() => {
      if (feedbackEl.parentNode) {
        feedbackEl.parentNode.removeChild(feedbackEl);
      }
    }, 500);
  }
}

/**
 * Carrega os modelos disponÃ­veis da API Leonardo
 */
async function loadModels() {
  console.log("Carregando modelos...");
  
  // Verificar se a variÃ¡vel elements estÃ¡ definida
  if (typeof elements === 'undefined') {
    console.error("Objeto 'elements' nÃ£o estÃ¡ definido. Executando initializeApp() primeiro.");
    initializeApp();
    
    // Verificar novamente se o objeto elements foi inicializado corretamente
    if (typeof elements === 'undefined') {
      console.error("Falha ao inicializar o objeto 'elements'");
      return;
    }
  }
  
  // Verificar se os elementos necessÃ¡rios existem
  if (!elements.modelSelect) {
    console.error("Elemento modelSelect nÃ£o encontrado");
    return;
  }
  
  // Verificar se o spinner existe
  const modelLoadingSpinner = elements.modelLoadingSpinner || 
    document.getElementById('model-loading-spinner');
  
  // Prepara a interface
  elements.modelSelect.disabled = true;
  if (modelLoadingSpinner) {
    modelLoadingSpinner.style.display = 'inline-block';
  }
  elements.modelSelect.innerHTML = '<option value="">Carregando modelos...</option>';
  
  try {
    // ObtÃ©m modelos do endpoint especÃ­fico que criamos no servidor
    console.log("Obtendo modelos via endpoint /proxy/models...");
    const response = await fetch('/proxy/models');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar modelos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.models)) {
      console.warn("Resposta do endpoint nÃ£o contÃ©m array de modelos:", data);
      throw new Error("Formato de resposta invÃ¡lido");
    }
    
    const models = data.models;
    console.log(`Recebidos ${models.length} modelos do servidor`);
    
    // Verifica se o elemento modelSelect ainda existe
    if (!elements.modelSelect) {
      console.error("Elemento modelSelect nÃ£o encontrado apÃ³s carregar modelos");
      return;
    }
    
    // Agrupa os modelos por categoria
    const modelsByCategory = {};
    models.forEach(model => {
      const category = model.modelType || "Outros";
      if (!modelsByCategory[category]) {
        modelsByCategory[category] = [];
      }
      modelsByCategory[category].push(model);
    });
    
    // Limpa o select de modelos
    elements.modelSelect.innerHTML = '<option value="">Selecione um modelo</option>';
    
    // Adiciona cada categoria como um optgroup
    Object.keys(modelsByCategory).sort().forEach(category => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      
      // Adiciona cada modelo na categoria, ordenados por nome
      modelsByCategory[category]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = model.name;
          optgroup.appendChild(option);
        });
      
      elements.modelSelect.appendChild(optgroup);
    });
    
    console.log(`Carregados ${models.length} modelos com sucesso`);
    showNotification('Modelos carregados com sucesso!', 'success');
    
  } catch (error) {
    console.error("Erro ao carregar modelos:", error);
    showNotification('Falha ao carregar modelos. Usando modelos padrÃ£o.', 'warning');
    
    // Verificar novamente se o elemento modelSelect existe
    if (!elements.modelSelect) {
      console.error("Elemento modelSelect nÃ£o estÃ¡ disponÃ­vel para carregar modelos padrÃ£o");
      return;
    }
    
    // Usa modelos padrÃ£o em caso de erro
    const defaultModels = [
      { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Leonardo Phoenix 1.0', modelType: 'Phoenix' },
      { id: '6b645e3a-d64f-4341-a6d8-7a3690fbf042', name: 'Leonardo Phoenix 0.9', modelType: 'Phoenix' },
      { id: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', name: 'Leonardo Anime XL', modelType: 'Anime' },
      { id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', name: 'Leonardo Lightning XL', modelType: 'Texto para Imagem' },
      { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Kino XL', modelType: 'PhotoReal' },
      { id: '5c232a9e-9061-4777-980a-ddc8e65647c6', name: 'Leonardo Vision XL', modelType: 'PhotoReal' },
      { id: '1e60896f-3c26-4296-8ecc-53e2afecc132', name: 'Leonardo Diffusion XL', modelType: 'PhotoReal' },
      { id: '2067ae52-33fd-4a82-bb92-c2c55e7d2786', name: 'AlbedoBase XL', modelType: 'Texto para Imagem' },
      { id: 'f1929ea3-b169-4c18-a16c-5d58b4292c69', name: 'RPG v5', modelType: 'RPG' },
      { id: 'b2614463-296c-462a-9586-aafdb8f00e36', name: 'Flux Dev', modelType: 'Flux' },
      { id: '1dd50843-d653-4516-a8e3-f0238ee453ff', name: 'Flux Schnell', modelType: 'Flux' }
    ];
    
    // Simula um pequeno atraso para dar feedback ao usuÃ¡rio
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Usa modelos padrÃ£o para contornar problemas de API
    const models = defaultModels;
    console.log(`Usando ${models.length} modelos padrÃ£o porque o servidor falhou`);
    
    try {
      // Limpa o select de modelos
      elements.modelSelect.innerHTML = '<option value="">Selecione um modelo</option>';
      
      // Agrupa os modelos por categoria
      const modelsByCategory = {};
      models.forEach(model => {
        const category = model.modelType || "Outros";
        if (!modelsByCategory[category]) {
          modelsByCategory[category] = [];
        }
        modelsByCategory[category].push(model);
      });
      
      // Adiciona cada categoria como um optgroup
      Object.keys(modelsByCategory).sort().forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        // Adiciona cada modelo na categoria
        modelsByCategory[category]
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            optgroup.appendChild(option);
          });
        
        elements.modelSelect.appendChild(optgroup);
      });
    } catch (innerError) {
      console.error("Erro ao carregar modelos padrÃ£o:", innerError);
    }
    
  } finally {
    // Restaura a interface
    if (elements && elements.modelSelect) {
      elements.modelSelect.disabled = false;
    }
    
    if (modelLoadingSpinner) {
      modelLoadingSpinner.style.display = 'none';
    }
    
    // Dispara evento para informar que os modelos foram carregados
    document.dispatchEvent(new CustomEvent('modelsLoaded'));
  }
}

/**
 * ObtÃ©m as dimensÃµes selecionadas
 * @returns {Object} Objeto com width e height
 */
function getSelectedDimensions() {
  const dimensionValue = elements.presetDimensions.value;
  if (!dimensionValue) {
    showNotification('Selecione uma dimensÃ£o para a imagem', 'error');
    return null;
  }
  
  const [width, height] = dimensionValue.split(':').map(Number);
  return { width, height };
}

/**
 * Inicia o processo de geraÃ§Ã£o de imagens
 */
async function startImageGeneration() {
  // Valida os inputs
  const prompts = getPrompts();
  if (prompts.length === 0) {
    showNotification('error', 'Por favor, adicione pelo menos um prompt antes de gerar imagens.');
    return;
  }

  const modelId = getSelectedModelId();
  if (!modelId) {
    showNotification('error', 'Por favor, selecione um modelo antes de gerar imagens.');
    return;
  }

  const dimensions = getSelectedDimensions();
  if (!dimensions) {
    showNotification('error', 'Por favor, selecione as dimensÃµes da imagem.');
    return;
  }
  
  const numImages = parseInt(elements.numImages.value) || 1;
  if (numImages > 4) {
    showNotification('warning', 'MÃ¡ximo de 4 imagens por prompt permitido. O valor serÃ¡ ajustado.');
    elements.numImages.value = 4;
  }

  // ValidaÃ§Ã£o adicional para garantir que todos os campos obrigatÃ³rios estejam preenchidos
  if (!prompts[0] || !modelId || !dimensions.width || !dimensions.height) {
    showNotification('error', 'Preencha todos os campos obrigatÃ³rios.');
    return;
  }

  // ValidaÃ§Ã£o para modelos Flux
  const fluxModelIds = [
    'b2614463-296c-462a-9586-aafdb8f00e36', // Flux Dev (Flux Precision)
    '1dd50843-d653-4516-a8e3-f0238ee453ff'  // Flux Schnell (Flux Speed)
  ];
  
  if (elements.fluxCheckbox && elements.fluxCheckbox.checked) {
    if (!fluxModelIds.includes(modelId)) {
      showNotification('error', 'Flux requer um dos seguintes modelos: Flux Dev (Precision) ou Flux Schnell (Speed).');
      return;
    }
    
    // ValidaÃ§Ã£o para contraste do Flux
    if (elements.fluxContrast) {
      const validContrasts = [1.0, 1.3, 1.8, 2.5, 3, 3.5, 4, 4.5];
      const selectedContrast = parseFloat(elements.fluxContrast.value);
      
      if (!validContrasts.includes(selectedContrast)) {
        showNotification('warning', 'Valor de contraste invÃ¡lido para Flux. Ajustando para 3.5 (MÃ©dio).');
        elements.fluxContrast.value = "3.5";
      }
    }
  }

  // ValidaÃ§Ã£o para PhotoReal v2
  if (elements.photoRealCheckbox && elements.photoRealCheckbox.checked) {
    const xlModelsIds = [
      'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL
      '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
      '1e60896f-3c26-4296-8ecc-53e2afecc132'  // Leonardo Diffusion XL
    ];
    
    if (!xlModelsIds.includes(modelId)) {
      showNotification('error', 'PhotoReal v2 requer um dos seguintes modelos: Leonardo Kino XL, Leonardo Vision XL ou Leonardo Diffusion XL.');
      return;
    }
  }

  // ValidaÃ§Ã£o para Phoenix
  if (elements.phoenixCheckbox && elements.phoenixCheckbox.checked) {
    const phoenixModelIds = [
      'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Leonardo Phoenix 1.0
      '6b645e3a-d64f-4341-a6d8-7a3690fbf042'  // Leonardo Phoenix 0.9
    ];
    
    if (!phoenixModelIds.includes(modelId)) {
      showNotification('error', 'Phoenix requer um dos seguintes modelos: Leonardo Phoenix 1.0 ou Leonardo Phoenix 0.9.');
      return;
    }
    
    // ValidaÃ§Ã£o para Alchemy e contraste
    if (elements.phoenixAlchemyCheckbox && elements.phoenixAlchemyCheckbox.checked) {
      const contrast = parseFloat(elements.phoenixContrast.value);
      if (contrast < 2.5) {
        showNotification('warning', 'O modo Alchemy requer contraste de 2.5 ou maior. Ajustando automaticamente.');
        elements.phoenixContrast.value = '2.5';
      }
    }
  }

  // Atualiza a interface para o modo de geraÃ§Ã£o
  updateInterfaceForGeneration(true);
  clearGeneratedImages();

  try {
    // Utiliza a funÃ§Ã£o processPrompts para gerar as imagens
    const stats = await processPrompts(
      prompts, 
      modelId, 
      dimensions,
      numImages,
      // Callback de progresso
      (percentage, message) => {
        updateProgressBar(percentage, message);
      },
      // Callback quando uma imagem Ã© gerada
      (imageUrl, prompt) => {
        console.log(`Imagem gerada para "${truncateText(prompt, 30)}"`);
      }
    );

    // Atualiza a interface com os resultados
    const message = `GeraÃ§Ã£o concluÃ­da: ${stats.success} sucesso, ${stats.failed} falhas.`;
    showNotification('success', message);
    console.log(message);
  } catch (error) {
    console.error('Erro durante a geraÃ§Ã£o de imagens:', error);
    showNotification('error', 'Ocorreu um erro durante a geraÃ§Ã£o de imagens. Verifique o console para mais detalhes.');
  } finally {
    // Restaura a interface apÃ³s a geraÃ§Ã£o
    updateInterfaceForGeneration(false);
  }
}

/**
 * Baixa todas as imagens geradas como um arquivo ZIP
 */
async function downloadAllImages() {
  if (state.generatedImages.length === 0) {
    showNotification('NÃ£o hÃ¡ imagens para baixar', 'warning');
    return;
  }

  try {
    showNotification('Preparando download...', 'info');
    
    // Carrega a biblioteca JSZip dinamicamente
    if (typeof JSZip === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }
    
    const zip = new JSZip();
    const downloadPromises = [];
    
    // Adiciona cada imagem ao ZIP
    for (let i = 0; i < state.generatedImages.length; i++) {
      const image = state.generatedImages[i];
      showNotification(`Preparando imagem ${i + 1}/${state.generatedImages.length}...`, 'info');
      
      // Faz o download da imagem como blob
      const promise = window.leonardoAPI.downloadImage(image.url)
        .then(blob => {
          // Cria um nome de arquivo com base no ID da imagem
          const filename = `leonardo_${image.id}.png`;
          zip.file(filename, blob);
        });
      
      downloadPromises.push(promise);
    }
    
    // Espera todos os downloads completarem
    await Promise.all(downloadPromises);
    
    // Gera o arquivo ZIP
    showNotification('Gerando arquivo ZIP...', 'info');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Cria um link para download e clica nele
    const downloadUrl = URL.createObjectURL(zipBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `leonardo_images_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showNotification('Download iniciado!', 'success');
  } catch (error) {
    showNotification(`Erro ao baixar imagens: ${error.message}`, 'error');
  }
}

/**
 * Carrega um script externo
 * @param {string} url - URL do script
 * @returns {Promise<void>}
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Falha ao carregar o script: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Cria um placeholder para uma imagem que estÃ¡ sendo gerada
 * @param {string} id - ID Ãºnico para o placeholder
 * @param {string} prompt - O prompt usado para gerar a imagem
 */
function createImagePlaceholder(id, prompt) {
  const placeholder = document.createElement('div');
  placeholder.className = 'image-card generating-card';
  placeholder.id = id;
  
  placeholder.innerHTML = `
    <div class="placeholder-content">
      <div class="spinner"></div>
      <div class="progress-indicator">0%</div>
      <div class="prompt-text-placeholder">${truncateText(prompt, 30)}</div>
    </div>
  `;
  
  elements.gallery.appendChild(placeholder);
}

/**
 * Remove um placeholder da galeria
 * @param {string} id - ID do placeholder
 */
function removeImagePlaceholder(id) {
  const placeholder = document.getElementById(id);
  if (placeholder) {
    placeholder.remove();
  }
}

/**
 * Atualiza um placeholder com mensagem de erro
 * @param {string} id - ID do placeholder
 * @param {string} errorMessage - Mensagem de erro
 */
function updateImagePlaceholderWithError(id, errorMessage) {
  const placeholder = document.getElementById(id);
  if (placeholder) {
    placeholder.classList.add('error-card');
    placeholder.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-exclamation-circle error-icon"></i>
        <div class="error-message">${errorMessage}</div>
      </div>
    `;
  }
}

/**
 * Adiciona uma imagem Ã  galeria e ao estado da aplicaÃ§Ã£o
 * @param {object} image - Dados da imagem (url, id)
 * @param {string} prompt - O prompt usado para gerar a imagem
 */
function addImageToGallery(image, prompt) {
  if (!image || !image.url) {
    console.error("Tentativa de adicionar imagem sem URL Ã  galeria");
    return;
  }

  // Adiciona a imagem ao estado para download posterior
  if (state) {
    state.generatedImages.push(image);
  }
  
  // Cria o card da imagem
  const imageCard = document.createElement('div');
  imageCard.className = 'image-card';
  
  imageCard.innerHTML = `
    <img src="${image.url}" alt="Imagem gerada" loading="lazy">
    <div class="image-overlay">
      <div class="prompt-text">${truncateText(prompt, 50)}</div>
      <div class="image-actions">
        <button class="download-image" data-url="${image.url}" data-id="${image.id}">
          <i class="fas fa-download"></i>
        </button>
        <button class="open-image" data-url="${image.url}">
          <i class="fas fa-external-link-alt"></i>
        </button>
      </div>
    </div>
  `;
  
  // Adiciona event listeners para os botÃµes
  imageCard.querySelector('.download-image').addEventListener('click', (e) => {
    const url = e.currentTarget.getAttribute('data-url');
    const id = e.currentTarget.getAttribute('data-id');
    downloadSingleImage(url, id);
  });
  
  imageCard.querySelector('.open-image').addEventListener('click', (e) => {
    const url = e.currentTarget.getAttribute('data-url');
    window.open(url, '_blank');
  });
  
  // Adiciona o card Ã  galeria
  if (elements && elements.gallery) {
    elements.gallery.appendChild(imageCard);
  } else {
    // Tenta adicionar Ã  galeria pelo ID como alternativa
    const galleryElement = document.getElementById('image-gallery');
    if (galleryElement) {
      galleryElement.appendChild(imageCard);
    } else {
      console.error("Elemento gallery nÃ£o encontrado para adicionar imagem");
    }
  }
  
  // Mostra o botÃ£o de download se houver pelo menos uma imagem
  if (elements && elements.downloadAllButton && state && state.generatedImages.length > 0) {
    elements.downloadAllButton.classList.remove('hidden');
  }
}

/**
 * Baixa uma Ãºnica imagem
 * @param {string} url - URL da imagem
 * @param {string} id - ID da imagem
 */
async function downloadSingleImage(url, id) {
  try {
    showNotification('Baixando imagem...', 'info');
    
    const blob = await window.leonardoAPI.downloadImage(url);
    const downloadUrl = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `leonardo_${id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Libera o objeto URL
    URL.revokeObjectURL(downloadUrl);
    
    showNotification('Download concluÃ­do!', 'success');
  } catch (error) {
    showNotification(`Erro ao baixar: ${error.message}`, 'error');
  }
}

/**
 * Trunca um texto para um comprimento mÃ¡ximo
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento mÃ¡ximo
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Mostra uma notificaÃ§Ã£o para o usuÃ¡rio
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificaÃ§Ã£o (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // Procura por uma notificaÃ§Ã£o existente
  let notification = document.querySelector('.notification');
  
  // Se nÃ£o existir, cria uma nova
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Define a classe de acordo com o tipo
  notification.className = `notification ${type}`;
  
  // Define o conteÃºdo
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Mostra a notificaÃ§Ã£o
  notification.classList.add('show');
  
  // Remove apÃ³s 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

/**
 * Retorna o Ã­cone adequado para o tipo de notificaÃ§Ã£o
 * @param {string} type - Tipo de notificaÃ§Ã£o
 * @returns {string} Classe do Ã­cone FontAwesome
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'info':
    default: return 'fa-info-circle';
  }
}

/**
 * Processa uma lista de prompts e gera imagens para cada um
 * @param {Array<string>} prompts - Lista de prompts para gerar imagens
 * @param {string} modelId - ID do modelo a ser usado
 * @param {Object} dimensions - DimensÃµes das imagens {width, height}
 * @param {number} numImages - NÃºmero de imagens a serem geradas
 * @param {Function} onProgress - Callback para atualizar o progresso
 * @param {Function} onImageGenerated - Callback chamado quando uma imagem for gerada
 * @returns {Promise<{success: number, failed: number}>} - EstatÃ­sticas da geraÃ§Ã£o
 */
async function processPrompts(prompts, modelId, dimensions, numImages, onProgress, onImageGenerated) {
  let stats = { success: 0, failed: 0 };
  // Inicializa a variÃ¡vel de cancelamento
  window.cancelGeneration = false;
  
  // Configura a chave da API
  window.leonardoAPI.apiKey = apiKeyManager.getApiKey();
  
  // Processa cada prompt sequencialmente
  for (let i = 0; i < prompts.length; i++) {
    if (window.cancelGeneration) {
      console.log('Processo de geraÃ§Ã£o cancelado');
      break;
    }
    
    const prompt = prompts[i].trim();
    if (!prompt) continue;
    
    try {
      // Atualiza o progresso
      const progress = Math.floor(((i + 1) / prompts.length) * 100);
      onProgress(progress, `Gerando imagem ${i + 1} de ${prompts.length}: "${truncateText(prompt, 30)}"`);
      
      // Cria um placeholder para a imagem que serÃ¡ gerada
      const placeholderId = addImagePlaceholder(prompt);
      
      // ValidaÃ§Ãµes fortes antes de enviar para a API
      if (!prompt || !modelId || !dimensions.width || !dimensions.height) {
        console.error('ParÃ¢metros obrigatÃ³rios ausentes:',
          !prompt ? 'prompt ' : '',
          !modelId ? 'modelId ' : '',
          !dimensions.width ? 'width ' : '',
          !dimensions.height ? 'height ' : ''
        );
        updatePlaceholderStatus(placeholderId, 'Erro: ParÃ¢metros obrigatÃ³rios faltando', 'error');
        stats.failed++;
        continue;
      }
      
      if (parseInt(numImages) > 4) {
        console.warn('NÃºmero de imagens limitado a 4. Valor ajustado.');
        numImages = 4;
        showNotification('MÃ¡ximo de 4 imagens por prompt permitido.', 'warning');
      }
      
      // Define o payload para a API
      const payload = {
        prompt: prompt,
        modelId: modelId,
        width: dimensions.width,
        height: dimensions.height,
        num_images: parseInt(numImages),
        guidance_scale: 7
      };
      
      // Adiciona prompt negativo se estiver preenchido
      const negativePrompt = elements.negativePrompt?.value?.trim();
      if (negativePrompt) {
        console.log(`ðŸ’¥ Adicionando prompt negativo ao payload: "${negativePrompt}"`);
        payload.negative_prompt = negativePrompt;
        
        // VerificaÃ§Ã£o dupla para garantir que foi adicionado
        if (payload.negative_prompt) {
          console.log('âœ… Prompt negativo adicionado com sucesso ao payload');
        } else {
          console.warn('âš ï¸ Falha ao adicionar prompt negativo ao payload');
        }
      } else {
        console.log('âš ï¸ Nenhum prompt negativo fornecido pelo usuÃ¡rio');
      }
      
      // Verifica se Flux estÃ¡ ativo e adiciona parÃ¢metros necessÃ¡rios
      if (elements.fluxCheckbox && elements.fluxCheckbox.checked) {
        // Verifica se o modelo Ã© compatÃ­vel com Flux
        const fluxModelIds = [
          'b2614463-296c-462a-9586-aafdb8f00e36', // Flux Dev (Flux Precision)
          '1dd50843-d653-4516-a8e3-f0238ee453ff'  // Flux Schnell (Flux Speed)
        ];
        
        if (!fluxModelIds.includes(modelId)) {
          updatePlaceholderStatus(placeholderId, 'Erro: Modelo selecionado nÃ£o Ã© compatÃ­vel com Flux', 'error');
          showNotification('error', 'Modelo selecionado nÃ£o Ã© compatÃ­vel com Flux. Use Flux Dev ou Flux Schnell.');
          stats.failed++;
          continue;
        }
        
        // Configura dimensÃµes recomendadas para Flux
        payload.width = 1472;
        payload.height = 832;
        
        // Adiciona o contraste (obrigatÃ³rio para Flux)
        const validContrasts = [1.0, 1.3, 1.8, 2.5, 3, 3.5, 4, 4.5];
        let selectedContrast = 3.5; // valor mÃ©dio padrÃ£o
        
        if (elements.fluxContrast && elements.fluxContrast.value) {
          const parsedContrast = parseFloat(elements.fluxContrast.value);
          if (validContrasts.includes(parsedContrast)) {
            selectedContrast = parsedContrast;
          } else {
            console.warn('Valor de contraste invÃ¡lido para Flux, utilizando 3.5 (MÃ©dio)');
          }
        }
        
        payload.contrast = selectedContrast;
        
        // Adiciona Ultra Mode
        if (elements.fluxUltraCheckbox && elements.fluxUltraCheckbox.checked) {
          payload.ultra = true;
        }
        
        // Adiciona Enhance Prompt
        if (elements.fluxEnhancePromptCheckbox && elements.fluxEnhancePromptCheckbox.checked) {
          payload.enhancePrompt = true;
        }
        
        // Adiciona estilo selecionado
        if (elements.fluxStyle && elements.fluxStyle.value) {
          payload.styleUUID = elements.fluxStyle.value;
        } else {
          // Define o estilo Dynamic como padrÃ£o
          payload.styleUUID = '111dc692-d470-4eec-b791-3475abac4c46';
        }
      }
      // Verifica se Phoenix estÃ¡ ativo e adiciona parÃ¢metros necessÃ¡rios
      else if (elements.phoenixCheckbox && elements.phoenixCheckbox.checked) {
        // Adiciona o contraste
        if (elements.phoenixContrast && elements.phoenixContrast.value) {
          payload.contrast = parseFloat(elements.phoenixContrast.value);
        } else {
          payload.contrast = 3.5; // valor mÃ©dio padrÃ£o
        }
        
        // Adiciona modo Alchemy (Quality Mode)
        if (elements.phoenixAlchemyCheckbox && elements.phoenixAlchemyCheckbox.checked) {
          payload.alchemy = true;
          
          // Garantir que o contraste Ã© adequado para Alchemy
          if (payload.contrast < 2.5) {
            payload.contrast = 2.5;
            console.warn('Ajustando contraste para 2.5 (mÃ­nimo para Alchemy)');
          }
        }
        
        // Adiciona Ultra Mode
        if (elements.phoenixUltraCheckbox && elements.phoenixUltraCheckbox.checked) {
          payload.ultra = true;
        }
        
        // Adiciona Enhance Prompt
        if (elements.phoenixEnhancePromptCheckbox && elements.phoenixEnhancePromptCheckbox.checked) {
          payload.enhancePrompt = true;
        }
        
        // Adiciona estilo se selecionado
        if (elements.phoenixStyle && elements.phoenixStyle.value) {
          payload.styleUUID = elements.phoenixStyle.value;
        }
      }
      // Verifica se PhotoReal estÃ¡ ativo e adiciona parÃ¢metros necessÃ¡rios
      else if (elements.photoRealCheckbox && elements.photoRealCheckbox.checked) {
        // Adiciona parÃ¢metros do PhotoReal v2
        payload.photoReal = true;
        payload.photoRealVersion = "v2";
        payload.alchemy = true;
        
        // Adiciona estilo do PhotoReal se selecionado
        if (elements.photoRealStyle && elements.photoRealStyle.value) {
          payload.presetStyle = elements.photoRealStyle.value;
        }
      }

      console.log("Enviando payload para a API:", JSON.stringify(payload, null, 2));
      
      try {
        // Inicia a geraÃ§Ã£o e obtÃ©m o ID da geraÃ§Ã£o
        const generation = await window.leonardoAPI.generateImage(payload);
        
        // Extrai o ID da geraÃ§Ã£o com verificaÃ§Ã£o de diferentes formatos de resposta
        let generationId;
        if (generation && generation.sdGenerationJob && generation.sdGenerationJob.generationId) {
          generationId = generation.sdGenerationJob.generationId;
        } else if (generation && generation.id) {
          generationId = generation.id;
        } else if (generation && generation.data && generation.data.id) {
          generationId = generation.data.id;
        } else {
          throw new Error('Formato de resposta desconhecido da API de geraÃ§Ã£o');
        }
        
        console.log(`GeraÃ§Ã£o iniciada com ID: ${generationId}`);
        
        // Verifica o status atÃ© que seja concluÃ­do
        let isComplete = false;
        let statusCheckCount = 0;
        const maxStatusChecks = 30;  // MÃ¡ximo de verificaÃ§Ãµes (60 segundos em total com espera de 2s)
        
        while (!isComplete && !window.cancelGeneration && statusCheckCount < maxStatusChecks) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos
          statusCheckCount++;
          
          try {
            const statusResult = await window.leonardoAPI.checkGenerationStatus(generationId);
            
            // Verifica diferentes formatos de resposta para o status
            let status = null;
            let generatedImages = [];
            
            // Formato da documentaÃ§Ã£o oficial (nova versÃ£o): campos status e generated_images no nÃ­vel raiz
            if (statusResult.status) {
              status = statusResult.status;
              
              if (status === "COMPLETE" && statusResult.generated_images) {
                generatedImages = statusResult.generated_images;
              }
            } 
            // Formato legado 1: generations_by_pk
            else if (statusResult.generations_by_pk) {
              status = statusResult.generations_by_pk.status;
              
              if (status === "COMPLETE" && statusResult.generations_by_pk.generated_images) {
                generatedImages = statusResult.generations_by_pk.generated_images;
              }
            } 
            // Formato legado 2: sdGenerationJob
            else if (statusResult.sdGenerationJob) {
              status = statusResult.sdGenerationJob.status;
              
              if (status === "COMPLETE" && statusResult.sdGenerationJob.generatedImages) {
                generatedImages = statusResult.sdGenerationJob.generatedImages;
              }
            } else {
              console.error("Formato de resposta desconhecido para status:", statusResult);
              updatePlaceholderStatus(placeholderId, 'Formato de resposta desconhecido', 'error');
              throw new Error("NÃ£o foi possÃ­vel determinar o status da geraÃ§Ã£o");
            }
            
            if (!status) {
              console.error("Formato de resposta desconhecido para status:", statusResult);
              updatePlaceholderStatus(placeholderId, 'Formato de resposta desconhecido', 'error');
              throw new Error("NÃ£o foi possÃ­vel determinar o status da geraÃ§Ã£o");
            }
            
            isComplete = status === "COMPLETE";
            
            // Atualiza o progresso com base nas tentativas
            const progress = isComplete ? 100 : Math.min(90, Math.floor((statusCheckCount / maxStatusChecks) * 100));
            updatePlaceholderProgress(placeholderId, progress);
            
            if (isComplete) {
              // Se a geraÃ§Ã£o foi bem-sucedida e hÃ¡ imagens
              if (generatedImages && generatedImages.length > 0) {
                // Pega a primeira imagem da lista
                const image = generatedImages[0];
                
                // Adiciona a imagem Ã  galeria
                addImageToGallery({
                  url: image.url,
                  id: image.id || generationId
                }, prompt);
                
                // Remove o placeholder
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) placeholder.remove();
                
                stats.success++;
                
                if (onImageGenerated) {
                  onImageGenerated(image.url, prompt);
                }
              } else {
                // Atualiza o placeholder com erro
                updatePlaceholderStatus(placeholderId, 'Falha: Sem imagens geradas', 'error');
                stats.failed++;
              }
            }
          } catch (statusError) {
            console.error(`Erro ao verificar status da geraÃ§Ã£o (tentativa ${statusCheckCount}):`, statusError);
            // Continua tentando nas prÃ³ximas iteraÃ§Ãµes
          }
        }
        
        // Se saiu do loop sem completar
        if (!isComplete) {
          if (window.cancelGeneration) {
            updatePlaceholderStatus(placeholderId, 'GeraÃ§Ã£o cancelada', 'warning');
            stats.failed++;
          } else {
            updatePlaceholderStatus(placeholderId, 'Tempo limite excedido', 'error');
            stats.failed++;
          }
        }
      } catch (error) {
        console.error(`Erro ao processar prompt "${prompt}":`, error);
        updatePlaceholderStatus(placeholderId, `Erro: ${error.message}`, 'error');
        stats.failed++;
      }
    } catch (error) {
      console.error(`Erro ao processar prompt "${prompt}":`, error);
      showNotification('error', `Erro ao gerar imagem para: "${truncateText(prompt, 30)}"`);
      stats.failed++;
    }
  }
  
  // Limpa a funÃ§Ã£o de cancelamento
  window.cancelGeneration = null;
  
  return stats;
}

/**
 * ObtÃ©m o ID do modelo selecionado
 * @returns {string|null} ID do modelo selecionado ou null se nenhum modelo foi selecionado
 */
function getSelectedModelId() {
  const modelSelect = document.getElementById('model-select');
  
  if (!modelSelect) {
    console.error("Elemento model-select nÃ£o encontrado");
    return null;
  }
  
  return modelSelect.value || null;
}

/**
 * Atualiza a barra de progresso
 * @param {number} percentage - Porcentagem de conclusÃ£o (0-100)
 * @param {string} message - Mensagem a ser exibida
 */
function updateProgressBar(percentage, message) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
  }
  
  if (progressText) {
    progressText.textContent = message || `${percentage}% concluÃ­do`;
  }
  
  // TambÃ©m atualiza outros elementos de progresso na interface
  if (elements && elements.progressBar) {
    elements.progressBar.style.width = `${percentage}%`;
  }
  
  if (elements && elements.progressCount) {
    // Atualiza o contador de progresso se estiver presente
    const completedCount = Math.round((percentage / 100) * state.totalPrompts);
    elements.progressCount.textContent = `${completedCount}/${state.totalPrompts}`;
  }
}

/**
 * Atualiza a interface para o modo de geraÃ§Ã£o
 * @param {boolean} isGenerating - Se estÃ¡ gerando imagens
 */
function updateInterfaceForGeneration(isGenerating) {
  // ObtÃ©m os elementos e verifica se existem antes de manipulÃ¡-los
  const generationProgress = document.getElementById('generation-progress');
  const generationStatus = document.getElementById('generation-status');
  const generateButton = document.getElementById('generate-button');
  const cancelButton = document.getElementById('cancel-button');
  const generationError = document.getElementById('generation-error');
  
  if (generationProgress) {
    generationProgress.classList.toggle('hidden', !isGenerating);
  }
  
  if (generationStatus) {
    generationStatus.classList.toggle('hidden', !isGenerating);
  }
  
  if (generateButton) {
    generateButton.classList.toggle('hidden', isGenerating);
  }
  
  if (cancelButton) {
    cancelButton.classList.toggle('hidden', !isGenerating);
  }
  
  if (generationError && isGenerating) {
    generationError.classList.add('hidden');
    generationError.textContent = '';
  }
}

/**
 * Limpa as imagens geradas anteriormente
 */
function clearGeneratedImages() {
  const galleryElement = document.getElementById('gallery');
  
  // Limpa a lista de imagens no estado da aplicaÃ§Ã£o
  if (state) {
    state.generatedImages = [];
  }
  
  // Remove apenas os elementos que nÃ£o sÃ£o placeholders
  if (galleryElement) {
    const itemsToRemove = galleryElement.querySelectorAll('.gallery-item:not(.placeholder)');
    itemsToRemove.forEach(item => item.remove());
  } else {
    console.error("Elemento gallery nÃ£o encontrado");
  }
}

/**
 * Atualiza o sample request com o modelo selecionado
 * @param {string} modelId - ID do modelo selecionado
 */
function updateSampleRequest(modelId) {
  // Verifica se o elemento sampleRequest existe
  if (!elements || !elements.sampleRequest) {
    console.log("Elemento sampleRequest nÃ£o encontrado, ignorando atualizaÃ§Ã£o");
    return;
  }
  
  // ObtÃ©m valores dos campos
  const prompt = "uma bela floresta ao pÃ´r do sol";
  const dimensions = getSelectedDimensions() || { width: 1024, height: 1024 };
  const numImages = elements.numImages ? parseInt(elements.numImages.value) || 1 : 1;
  const guidanceScale = elements.guidanceScale ? parseFloat(elements.guidanceScale.value) || 7 : 7;
  const negativePrompt = elements.negativePrompt ? elements.negativePrompt.value : "";
  const seed = elements.seed ? (elements.seed.value ? parseInt(elements.seed.value) : null) : null;
  
  // Cria o objeto de payload bÃ¡sico
  const payload = {
    prompt: prompt,
    modelId: modelId || "Selecione um modelo acima",
    width: dimensions.width,
    height: dimensions.height,
    num_images_to_generate: numImages,
    guidance_scale: guidanceScale,
    public: false
  };
  
  // Adiciona campos opcionais se estiverem preenchidos
  if (negativePrompt) {
    payload.negative_prompt = negativePrompt;
  }
  
  if (seed) {
    payload.seed = seed;
  }
  
  // Adiciona configuraÃ§Ãµes especÃ­ficas do Phoenix se estiver selecionado
  if (elements.phoenixCheckbox && elements.phoenixCheckbox.checked) {
    if (elements.phoenixContrast) {
      payload.contrast = parseFloat(elements.phoenixContrast.value);
    }
    
    if (elements.phoenixStyle && elements.phoenixStyle.value) {
      payload.styleUUID = elements.phoenixStyle.value;
    }
    
    if (elements.phoenixAlchemyCheckbox && elements.phoenixAlchemyCheckbox.checked) {
      payload.alchemy = true;
    }
    
    if (elements.phoenixUltraCheckbox && elements.phoenixUltraCheckbox.checked) {
      payload.ultraDetailed = true;
    }
    
    if (elements.phoenixEnhancePromptCheckbox && elements.phoenixEnhancePromptCheckbox.checked) {
      payload.enhancePrompt = true;
    }
  }
  
  // Adiciona configuraÃ§Ãµes especÃ­ficas do Flux se estiver selecionado
  if (elements.fluxCheckbox && elements.fluxCheckbox.checked) {
    if (elements.fluxContrast) {
      payload.contrast = parseFloat(elements.fluxContrast.value);
    }
    
    if (elements.fluxStyle && elements.fluxStyle.value) {
      payload.styleUUID = elements.fluxStyle.value;
    }
    
    if (elements.fluxUltraCheckbox && elements.fluxUltraCheckbox.checked) {
      payload.ultraDetailed = true;
    }
    
    if (elements.fluxEnhancePromptCheckbox && elements.fluxEnhancePromptCheckbox.checked) {
      payload.enhancePrompt = true;
    }
  }
  
  // Adiciona configuraÃ§Ãµes especÃ­ficas do PhotoReal se estiver selecionado
  if (elements.photoRealCheckbox && elements.photoRealCheckbox.checked) {
    if (elements.photoRealStyle && elements.photoRealStyle.value) {
      payload.presetStyle = elements.photoRealStyle.value;
    }
  }
  
  // Atualiza o conteÃºdo do elemento
  elements.sampleRequest.textContent = JSON.stringify(payload, null, 2);
}

/**
 * Adiciona um placeholder para uma imagem em processo de geraÃ§Ã£o
 * @param {string} prompt - O prompt usado para gerar a imagem
 * @returns {string} - ID do placeholder criado
 */
function addImagePlaceholder(prompt) {
  const id = 'placeholder-' + Math.random().toString(36).substring(2, 15);
  
  const placeholder = document.createElement('div');
  placeholder.className = 'gallery-item placeholder';
  placeholder.id = id;
  
  placeholder.innerHTML = `
    <div class="placeholder-content">
      <div class="spinner"></div>
      <div class="progress-text">Iniciando...</div>
      <div class="prompt-preview">${truncateText(prompt, 50)}</div>
    </div>
  `;
  
  const galleryElement = document.getElementById('gallery');
  if (galleryElement) {
    galleryElement.appendChild(placeholder);
  } else {
    console.error("Elemento gallery nÃ£o encontrado ao adicionar placeholder");
    // Tenta adicionar ao elemento gallery da variÃ¡vel elements como alternativa
    if (elements && elements.gallery) {
      elements.gallery.appendChild(placeholder);
    } else {
      console.error("Nenhum elemento gallery encontrado para adicionar o placeholder");
    }
  }
  
  return id;
}

/**
 * Atualiza o status de um placeholder
 * @param {string} id - ID do placeholder
 * @param {string} status - Texto de status
 * @param {string} className - Classe opcional a ser adicionada
 */
function updatePlaceholderStatus(id, status, className = null) {
  const placeholder = document.getElementById(id);
  if (!placeholder) return;
  
  const statusElement = placeholder.querySelector('.progress-text');
  if (statusElement) {
    statusElement.textContent = status;
  }
  
  if (className) {
    placeholder.classList.add(className);
  }
}

/**
 * Atualiza o progresso de um placeholder
 * @param {string} id - ID do placeholder
 * @param {number} progress - Valor do progresso (0-100)
 */
function updatePlaceholderProgress(id, progress) {
  const placeholder = document.getElementById(id);
  if (!placeholder) return;
  
  const statusElement = placeholder.querySelector('.progress-text');
  if (statusElement) {
    statusElement.textContent = `Progresso: ${progress}%`;
  }
}

/**
 * Extrai prompts da Ã¡rea de texto
 * @returns {Array<string>} Lista de prompts vÃ¡lidos
 */
function getPrompts() {
  const promptsText = elements.promptsTextarea.value.trim();
  
  if (!promptsText) {
    return [];
  }
  
  // Divide os prompts em linhas nÃ£o vazias
  const promptsList = promptsText.split('\n')
    .map(prompt => prompt.trim())
    .filter(prompt => prompt.length > 0);
    
  console.log(`ExtraÃ­dos ${promptsList.length} prompts vÃ¡lidos`);
  
  return promptsList;
}

/**
 * Cancela o processo de geraÃ§Ã£o em andamento
 */
function cancelGeneration() {
  console.log("Cancelando geraÃ§Ã£o de imagens...");
  window.cancelGeneration = true;
  showNotification('info', 'Cancelando geraÃ§Ã£o... Aguarde a finalizaÃ§Ã£o da imagem atual.');
  
  // Atualiza o status
  const statusElement = document.getElementById('generation-status');
  if (statusElement) {
    statusElement.textContent = 'Cancelando...';
    statusElement.classList.add('cancelling');
  } else {
    console.error("Elemento generation-status nÃ£o encontrado");
  }
}

// Inicializa a aplicaÃ§Ã£o quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// Envia a lista de modelos personalizados para o proxy
async function enviarModelosParaProxy() {
  const modelosPersonalizados = [
    { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Leonardo Phoenix 1.0', modelType: 'Phoenix' },
    { id: '6b645e3a-d64f-4341-a6d8-7a3690fbf042', name: 'Leonardo Phoenix 0.9', modelType: 'Phoenix' },
    { id: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', name: 'Leonardo Anime XL', modelType: 'Anime' },
    { id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', name: 'Leonardo Lightning XL', modelType: 'Texto para Imagem' },
    { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Kino XL', modelType: 'PhotoReal' },
    { id: '5c232a9e-9061-4777-980a-ddc8e65647c6', name: 'Leonardo Vision XL', modelType: 'PhotoReal' },
    { id: '1e60896f-3c26-4296-8ecc-53e2afecc132', name: 'Leonardo Diffusion XL', modelType: 'PhotoReal' },
    { id: '2067ae52-33fd-4a82-bb92-c2c55e7d2786', name: 'AlbedoBase XL', modelType: 'Texto para Imagem' },
    { id: 'f1929ea3-b169-4c18-a16c-5d58b4292c69', name: 'RPG v5', modelType: 'RPG' },
    { id: '16e7060a-803e-4df3-97ee-edcfa5dc9cc8', name: 'SDXL 1.0', modelType: 'Texto para Imagem' },
    { id: 'b63f7119-31dc-4540-969b-2a9df997e173', name: 'SDXL 0.9', modelType: 'Texto para Imagem' },
    { id: 'ac614f96-1082-45bf-be9d-757f2d31c174', name: 'DreamShaper v7', modelType: 'Texto para Imagem' },
    { id: 'b2614463-296c-462a-9586-aafdb8f00e36', name: 'Flux Dev', modelType: 'Flux' },
    { id: '1dd50843-d653-4516-a8e3-f0238ee453ff', name: 'Flux Schnell', modelType: 'Flux' },
    { id: 'd69c8273-6b17-4a30-a13e-d6637ae1c644', name: '3D Animation Style', modelType: 'Estilizado' },
    { id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', name: 'Leonardo Creative', modelType: 'Texto para Imagem' },
    { id: 'cd2b2a15-9760-4174-a5ff-4d2925057376', name: 'Leonardo Select', modelType: 'Texto para Imagem' },
    { id: '291be633-cb24-434f-898f-e662799936ad', name: 'Leonardo Signature', modelType: 'Texto para Imagem' }
  ];

  try {
    // NÃ£o enviamos modelos diretamente para o proxy, ao invÃ©s disso carregamos via GET
    // Isso Ã© mais robusto e evita possÃ­veis erros de comunicaÃ§Ã£o
    console.log('Carregando modelos diretamente do proxy via GET...');
    const response = await fetch('/proxy/models');
    
    if (!response.ok) {
      console.warn(`O proxy retornou status ${response.status} ao buscar modelos. Usando modelos locais.`);
      
      // Caso o carregamento falhe, podemos usar os modelos definidos localmente
      // ao chamar a funÃ§Ã£o loadModels()
      loadModels();
      return;
    }
    
    const responseData = await response.json();
    console.log(`Modelos recebidos do proxy: ${responseData.models ? responseData.models.length : 0}`);
    
    // Se o proxy jÃ¡ tem os modelos, nÃ£o precisamos fazer mais nada
  } catch (err) {
    console.error('âŒ Erro ao comunicar com o proxy de modelos:', err);
    
    // Em caso de erro, carregamos os modelos localmente
    setTimeout(() => {
      console.log('Iniciando carregamento de modelos local apÃ³s falha no proxy...');
      loadModels();
    }, 500);
  }
}

// Chama a funÃ§Ã£o quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  enviarModelosParaProxy();
});

/**
 * Configura o toggle e os listeners para as opÃ§Ãµes do PhotoReal
 */
function setupPhotoRealToggle() {
  console.log("Configurando PhotoReal Toggle...");
  
  // Verifica se os elementos necessÃ¡rios existem
  if (!elements.photoRealCheckbox || !elements.photoRealOptions) {
    console.log("Elementos PhotoReal nÃ£o encontrados na pÃ¡gina");
    return;
  }
  
  // Configura o evento de toggle
  elements.photoRealCheckbox.addEventListener('change', function() {
    if (elements.photoRealOptions) {
      elements.photoRealOptions.classList.toggle('active', this.checked);
    }
    
    // Quando PhotoReal Ã© marcado, desmarca Phoenix e Flux para evitar conflitos
    if (this.checked) {
      if (elements.phoenixCheckbox) {
        elements.phoenixCheckbox.checked = false;
        if (elements.phoenixOptions) {
          elements.phoenixOptions.classList.remove('active');
        }
      }
      
      if (elements.fluxCheckbox) {
        elements.fluxCheckbox.checked = false;
        if (elements.fluxOptions) {
          elements.fluxOptions.classList.remove('active');
        }
      }
    }
    
    // Atualiza o exemplo de requisiÃ§Ã£o
    updateSampleRequest(elements.modelSelect.value);
  });
  
  // Configura o evento para o estilo do PhotoReal
  if (elements.photoRealStyle) {
    elements.photoRealStyle.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  console.log("PhotoReal Toggle configurado com sucesso");
}

/**
 * Configura o toggle e os listeners para as opÃ§Ãµes do Phoenix
 */
function setupPhoenixToggle() {
  console.log("Configurando Phoenix Toggle...");
  
  // Verifica se os elementos necessÃ¡rios existem
  if (!elements.phoenixCheckbox || !elements.phoenixOptions) {
    console.log("Elementos Phoenix nÃ£o encontrados na pÃ¡gina");
    return;
  }
  
  // Configura o evento de toggle
  elements.phoenixCheckbox.addEventListener('change', function() {
    if (elements.phoenixOptions) {
      elements.phoenixOptions.classList.toggle('active', this.checked);
    }
    
    // Quando Phoenix Ã© marcado, desmarca PhotoReal e Flux para evitar conflitos
    if (this.checked) {
      if (elements.photoRealCheckbox) {
        elements.photoRealCheckbox.checked = false;
        if (elements.photoRealOptions) {
          elements.photoRealOptions.classList.remove('active');
        }
      }
      
      if (elements.fluxCheckbox) {
        elements.fluxCheckbox.checked = false;
        if (elements.fluxOptions) {
          elements.fluxOptions.classList.remove('active');
        }
      }
    }
    
    // Atualiza o exemplo de requisiÃ§Ã£o
    updateSampleRequest(elements.modelSelect.value);
  });
  
  // Configura o evento para o contraste
  if (elements.phoenixContrast) {
    elements.phoenixContrast.addEventListener('change', function() {
      // ValidaÃ§Ã£o para o modo Alchemy
      if (elements.phoenixAlchemyCheckbox && elements.phoenixAlchemyCheckbox.checked) {
        const contrast = parseFloat(this.value);
        if (contrast < 2.5) {
          showNotification('warning', 'O modo Alchemy requer contraste de 2.5 ou maior. Ajustando automaticamente.');
          this.value = '2.5';
        }
      }
      
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o alchemy
  if (elements.phoenixAlchemyCheckbox) {
    elements.phoenixAlchemyCheckbox.addEventListener('change', function() {
      // Verifica se o contraste Ã© adequado quando alchemy Ã© ativado
      if (this.checked && elements.phoenixContrast) {
        const contrast = parseFloat(elements.phoenixContrast.value);
        if (contrast < 2.5) {
          showNotification('warning', 'O modo Alchemy requer contraste de 2.5 ou maior. Ajustando automaticamente.');
          elements.phoenixContrast.value = '2.5';
        }
      }
      
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o ultra mode
  if (elements.phoenixUltraCheckbox) {
    elements.phoenixUltraCheckbox.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o enhance prompt
  if (elements.phoenixEnhancePromptCheckbox) {
    elements.phoenixEnhancePromptCheckbox.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o estilo
  if (elements.phoenixStyle) {
    elements.phoenixStyle.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  console.log("Phoenix Toggle configurado com sucesso");
}

/**
 * Configura o toggle e os listeners para as opÃ§Ãµes do Flux
 */
function setupFluxToggle() {
  console.log("Configurando Flux Toggle...");
  
  // Verifica se os elementos necessÃ¡rios existem
  if (!elements.fluxCheckbox || !elements.fluxOptions) {
    console.log("Elementos Flux nÃ£o encontrados na pÃ¡gina");
    return;
  }
  
  // Configura o evento de toggle
  elements.fluxCheckbox.addEventListener('change', function() {
    if (elements.fluxOptions) {
      elements.fluxOptions.classList.toggle('active', this.checked);
    }
    
    // Quando Flux Ã© marcado, desmarca Phoenix e PhotoReal para evitar conflitos
    if (this.checked) {
      if (elements.phoenixCheckbox) {
        elements.phoenixCheckbox.checked = false;
        if (elements.phoenixOptions) {
          elements.phoenixOptions.style.display = 'none';
        }
      }
      
      if (elements.photoRealCheckbox) {
        elements.photoRealCheckbox.checked = false;
        if (elements.photoRealOptions) {
          elements.photoRealOptions.style.display = 'none';
        }
      }
    }
    
    // Atualiza o exemplo de requisiÃ§Ã£o
    updateSampleRequest(elements.modelSelect.value);
  });
  
  // Configura o evento para o contraste
  if (elements.fluxContrast) {
    elements.fluxContrast.addEventListener('change', function() {
      // Valida o valor de contraste selecionado
      const validContrasts = [1.0, 1.3, 1.8, 2.5, 3, 3.5, 4, 4.5];
      const selectedContrast = parseFloat(this.value);
      
      // Verifica se o valor Ã© vÃ¡lido, caso contrÃ¡rio usa 3.5 (MÃ©dio)
      if (!validContrasts.includes(selectedContrast)) {
        console.warn("Valor de contraste invÃ¡lido para Flux, definindo para 3.5 (MÃ©dio)");
        this.value = "3.5";
      }
      
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o enhance prompt
  if (elements.fluxEnhancePromptCheckbox) {
    elements.fluxEnhancePromptCheckbox.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o ultra mode
  if (elements.fluxUltraCheckbox) {
    elements.fluxUltraCheckbox.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  // Configura o evento para o estilo
  if (elements.fluxStyle) {
    elements.fluxStyle.addEventListener('change', function() {
      // Atualiza o exemplo de requisiÃ§Ã£o
      updateSampleRequest(elements.modelSelect.value);
    });
  }
  
  console.log("Flux Toggle configurado com sucesso");
}

/**
 * Configura eventos para o select de modelos
 */
function setupModelSelectEvents() {
  console.log("Configurando eventos de select de modelos...");
  
  // Verifica se o elemento modelSelect existe
  if (!elements.modelSelect) {
    console.error("Elemento modelSelect nÃ£o encontrado");
    return;
  }
  
  // Evento change para quando o modelo Ã© alterado
  elements.modelSelect.addEventListener('change', function() {
    const selectedModel = this.value;
    console.log(`Modelo selecionado: ${selectedModel}`);
    
    // Verifica a compatibilidade dos checkboxes (Phoenix, PhotoReal, Flux) com o modelo selecionado
    checkModelCompatibility(selectedModel);
    
    // Atualiza o exemplo de requisiÃ§Ã£o
    updateSampleRequest(selectedModel);
  });
  
  console.log("Eventos de select de modelos configurados com sucesso");
}

/**
 * Verifica a compatibilidade do modelo selecionado com as opÃ§Ãµes Phoenix, PhotoReal e Flux
 * @param {string} modelId - ID do modelo selecionado
 */
function checkModelCompatibility(modelId) {
  if (!modelId) return;
  
  // Modelos compatÃ­veis com Phoenix
  const phoenixModelIds = [
    'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Leonardo Phoenix 1.0
    '6b645e3a-d64f-4341-a6d8-7a3690fbf042'  // Leonardo Phoenix 0.9
  ];
  
  // Modelos compatÃ­veis com PhotoReal
  const photoRealModelIds = [
    'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL
    '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
    '1e60896f-3c26-4296-8ecc-53e2afecc132'  // Leonardo Diffusion XL
  ];
  
  // Modelos compatÃ­veis com Flux
  const fluxModelIds = [
    'b2614463-296c-462a-9586-aafdb8f00e36', // Flux Dev (Flux Precision)
    '1dd50843-d653-4516-a8e3-f0238ee453ff'  // Flux Schnell (Flux Speed)
  ];
  
  // Verifica e ajusta o Phoenix
  if (elements.phoenixCheckbox && elements.phoenixCheckbox.checked) {
    if (!phoenixModelIds.includes(modelId)) {
      console.warn(`Modelo ${modelId} nÃ£o Ã© compatÃ­vel com Phoenix. Desmarcando.`);
      elements.phoenixCheckbox.checked = false;
      if (elements.phoenixOptions) {
        elements.phoenixOptions.classList.remove('active');
      }
      showNotification('warning', 'O modelo selecionado nÃ£o Ã© compatÃ­vel com Phoenix. A opÃ§Ã£o foi desmarcada.');
    }
  }
  
  // Verifica e ajusta o PhotoReal
  if (elements.photoRealCheckbox && elements.photoRealCheckbox.checked) {
    if (!photoRealModelIds.includes(modelId)) {
      console.warn(`Modelo ${modelId} nÃ£o Ã© compatÃ­vel com PhotoReal. Desmarcando.`);
      elements.photoRealCheckbox.checked = false;
      if (elements.photoRealOptions) {
        elements.photoRealOptions.classList.remove('active');
      }
      showNotification('warning', 'O modelo selecionado nÃ£o Ã© compatÃ­vel com PhotoReal. A opÃ§Ã£o foi desmarcada.');
    }
  }
  
  // Verifica e ajusta o Flux
  if (elements.fluxCheckbox && elements.fluxCheckbox.checked) {
    if (!fluxModelIds.includes(modelId)) {
      console.warn(`Modelo ${modelId} nÃ£o Ã© compatÃ­vel com Flux. Desmarcando.`);
      elements.fluxCheckbox.checked = false;
      if (elements.fluxOptions) {
        elements.fluxOptions.classList.remove('active');
      }
      showNotification('warning', 'O modelo selecionado nÃ£o Ã© compatÃ­vel com Flux. A opÃ§Ã£o foi desmarcada.');
    }
  }
}

/**
 * Configura o seletor de dimensÃµes da imagem
 */
function setupDimensionSelect() {
  console.log("Configurando select de dimensÃµes...");
  
  // Verifica se o elemento presetDimensions existe
  if (!elements.presetDimensions) {
    console.error("Elemento presetDimensions nÃ£o encontrado");
    return;
  }
  
  // Inicializa com as dimensÃµes predefinidas
  const presetDimensions = [
    { width: 512, height: 512, label: "512 x 512 (1:1 Quadrado)" },
    { width: 768, height: 768, label: "768 x 768 (1:1 Quadrado)" },
    { width: 1024, height: 1024, label: "1024 x 1024 (1:1 Quadrado)" },
    { width: 1152, height: 768, label: "1152 x 768 (3:2 Paisagem)" },
    { width: 912, height: 512, label: "912 x 512 (16:9 Paisagem)" },
    { width: 1024, height: 576, label: "1024 x 576 (16:9 Paisagem)" },
    { width: 1344, height: 768, label: "1344 x 768 (16:9 Paisagem)" },
    { width: 1920, height: 1080, label: "1920 x 1080 (16:9 Paisagem)" },
    { width: 768, height: 1152, label: "768 x 1152 (2:3 Retrato)" },
    { width: 512, height: 912, label: "512 x 912 (9:16 Retrato)" },
    { width: 576, height: 1024, label: "576 x 1024 (9:16 Retrato)" },
    { width: 768, height: 1344, label: "768 x 1344 (9:16 Retrato)" },
    { width: 1080, height: 1920, label: "1080 x 1920 (9:16 Retrato)" },
    // DimensÃµes recomendadas para Flux
    { width: 1472, height: 832, label: "1472 x 832 (Recomendado para Flux)" }
  ];
  
  // Limpa o select
  elements.presetDimensions.innerHTML = '';
  
  // Adiciona uma opÃ§Ã£o vazia/padrÃ£o
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecione uma dimensÃ£o';
  elements.presetDimensions.appendChild(defaultOption);
  
  // Adiciona as dimensÃµes predefinidas
  presetDimensions.forEach(dimension => {
    const option = document.createElement('option');
    option.value = `${dimension.width}:${dimension.height}`;
    option.textContent = dimension.label;
    elements.presetDimensions.appendChild(option);
  });
  
  // Seleciona a primeira dimensÃ£o por padrÃ£o
  elements.presetDimensions.value = '1024:1024';
  
  // Adiciona o event listener para mudanÃ§as
  elements.presetDimensions.addEventListener('change', function() {
    console.log(`DimensÃµes alteradas para: ${this.value}`);
  });
  
  console.log("Select de dimensÃµes configurado com sucesso");
}

/**
 * Configura os sliders de intervalo da aplicaÃ§Ã£o
 */
function setupRangeSliders() {
  console.log("Configurando sliders de intervalo...");
  
  // Configura o slider de Guidance Scale
  if (elements.guidanceScale && elements.guidanceValue) {
    elements.guidanceScale.addEventListener('input', function() {
      elements.guidanceValue.textContent = this.value;
    });
    
    // Define o valor inicial
    elements.guidanceValue.textContent = elements.guidanceScale.value;
  }
  
  console.log("Sliders de intervalo configurados com sucesso");
}

// Fim do arquivo 
// Fim do arquivo 
