
// environments/environment.prod.ts
export const environment = {
  production: true,
  
  shipping: {
    useRealAPIs: true, // En producción usar APIs reales
    
    correoArgentino: {
      apiUrl: 'https://api.correoargentino.com.ar',
      apiKey: process.env['CORREO_ARGENTINO_API_KEY'] || '',
      enabled: true
    },
    
    oca: {
      apiUrl: 'https://api.oca.com.ar',
      apiKey: process.env['OCA_API_KEY'] || '',
      enabled: true
    },
    
    andreani: {
      apiUrl: 'https://apis.andreani.com',
      credentials: process.env['ANDREANI_CREDENTIALS'] || '',
      enabled: true
    },
    
    thirdPartyShipping: {
      envia: {
        apiUrl: 'https://api.envia.com/ship',
        apiKey: process.env['ENVIA_API_KEY'] || '',
        enabled: true
      },
      
      rapidapi: {
        apiUrl: 'https://transportistas-de-argentina.p.rapidapi.com',
        apiKey: process.env['RAPIDAPI_KEY'] || '',
        host: 'transportistas-de-argentina.p.rapidapi.com',
        enabled: false
      }
    }
  }
};