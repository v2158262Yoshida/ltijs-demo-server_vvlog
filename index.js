require('dotenv').config();
const path = require('path');
const routes = require('./src/routes');
const lti = require('ltijs').Provider;
const cors = require('cors');

// CORSの設定
const corsOptions = {
    origin: 'http://3.219.14.197/moodle', // Moodleの正しいドメインを指定
    credentials: true,
};

// Setup
lti.setup(process.env.LTI_KEY,
  {
    url: 'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME + '?authSource=admin',
    connection: { user: process.env.DB_USER, pass: process.env.DB_PASS }
  }, {
    staticPath: path.join(__dirname, './public'), // Path to static files
    cookies: {
      secure: false, // Set secure to true if using https
      sameSite: '' // Set sameSite to 'None' if testing platform is in a different domain
    },
    devMode: true, // Set DevMode to true for non-https testing
    dynamicRegistration: true // Enable dynamic registration
  });

// CORSとルート設定をlti.setupの後に追加
lti.app.use(cors(corsOptions));
lti.app.use(routes);

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  return res.sendFile(path.join(__dirname, './public/index.html'));
});

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  return lti.redirect(res, '/deeplink', { newResource: true });
});

// Setup function
const setup = async () => {
  // サーバーを0.0.0.0でリッスン
  await lti.deploy({ port: process.env.PORT, serverHost: '0.0.0.0' });

  /**
   * Register platform
   */
  await lti.registerPlatform({
    url: 'http://3.219.14.197/moodle',
    name: 'Moodle',
    clientId: 'GTvYcTLFdTVnlUD', // MoodleのクライアントID
    authenticationEndpoint: 'http://3.219.14.197/moodle/mod/lti/auth.php',
    accesstokenEndpoint: 'http://3.219.14.197/moodle/mod/lti/token.php',
    authConfig: { method: 'JWK_SET', key: 'http://3.219.14.197/moodle/mod/lti/certs.php' }
  });
};
