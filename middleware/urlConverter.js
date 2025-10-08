// Middleware to convert relative URLs to absolute URLs for production
const convertUrlsToAbsolute = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data) {
      data = convertUrlsInObject(data, req);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

function convertUrlsInObject(obj, req) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertUrlsInObject(item, req));
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertUrlsInObject(obj[key], req);
      }
    }
    return converted;
  }
  
  if (typeof obj === 'string' && obj.startsWith('/uploads/')) {
    // Get the base URL from environment or construct from request
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}${obj}`;
  }
  
  return obj;
}

module.exports = convertUrlsToAbsolute;
