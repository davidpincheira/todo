// environments/environment.ts
export const environment = {
  production: false,
  
  // APIs de Shipping Argentinas
  shipping: {
    // Usar APIs reales o fallback
    useRealAPIs: false, // Cambiar a true cuando tengas credenciales
    
    // Correo Argentino
    correoArgentino: {
      apiUrl: 'https://api.correoargentino.com.ar',
      apiKey: '', // Tu API key de MiCorreo
      enabled: false
    },
    
    // OCA
    oca: {
      apiUrl: 'https://api.oca.com.ar',
      apiKey: '', // Tu API key de OCA
      enabled: false
    },
    
    // Andreani (requiere mínimo 300 envíos mensuales)
    andreani: {
      apiUrl: 'https://apis.andreani.com',
      credentials: '', // Tu token de Andreani
      enabled: false
    },
    
    // Servicios de terceros (más fácil para empezar)
    thirdPartyShipping: {
      // Envia.com - Recomendado para emprendedores
      envia: {
        apiUrl: 'https://api.envia.com/ship',
        apiKey: '', // Tu API key de Envia
        enabled: false
      },
      
      // RapidAPI - Transportistas de Argentina
      rapidapi: {
        apiUrl: 'https://transportistas-de-argentina.p.rapidapi.com',
        apiKey: '', // Tu API key de RapidAPI
        host: 'transportistas-de-argentina.p.rapidapi.com',
        enabled: false
      }
    }
  }
};
