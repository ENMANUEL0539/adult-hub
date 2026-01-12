const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const url = event.queryStringParameters.url;
    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'URL parameter is required' }) };
    }

    // Usamos un User-Agent de navegador real para evitar ser bloqueados
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      // Si TeraBox devuelve un error, lo propagamos
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` })
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. EXTRAER TÍTULO
    let title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                'Contenido Exclusivo'; // Título por defecto

    // Limpiar el título de posibles sufijos no deseados
    title = title.replace(/\s-\sTeraBox.*$/i, '').trim();


    // 2. EXTRAER DESCRIPCIÓN
    let description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="twitter:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content') ||
                      `Accede al contenido exclusivo alojado en TeraBox. Tamaño y formato disponibles al hacer clic.`; // Descripción por defecto


    // 3. EXTRAER IMAGEN
    let image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('content');

    // Si no hay meta-imagen, buscar la primera imagen en el contenido
    if (!image) {
        const firstImg = $('.file-list img, .share-file img, img').first();
        if (firstImg.length) {
            image = firstImg.attr('src');
        }
    }
    
    // Convertir URLs relativas a absolutas
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).toString();
      } catch (e) {
        image = null; // Si la URL es inválida, la descartamos
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Importante para llamadas desde el frontend
      },
      body: JSON.stringify({
        success: true,
        title,
        description,
        image: image || '/assets/img/placeholder.jpg' // Imagen por defecto si no se encuentra
      })
    };

  } catch (error) {
    console.error('Error en preview.js:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Server error while fetching preview.',
        message: error.message
      })
    };
  }
};
