
// The Auth0 client, initialized in configureClient()
let auth0 = null;

/**
 * Starts the authentication flow
 */
const login = async (targetUrl,type=1) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      redirect_uri: window.location.origin,
      acr_values:'',
      authorization_endpoint:'oauth/authorize',
      response_mode:'fragment'
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }
    if(type===1){
      // 登录托管
      auth0.loginWithRedirect(options)
    }else if(type===2){
      // 弹出页面
      auth0.loginWithPopup(options)
    }else{
      // 内嵌登录组件
      auth0.loginWithIframe(options)
    }
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      post_logout_redirect_uri: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    issuer: "https://" + config.domain,
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

const getUserInfio = async (token)=>{
  return new Promise(async(resolve,reject)=>{
    const accessToken = token?token:await auth0.getTokenSilently();
    const instance = axios.create({
      headers: {'Authorization': 'Bearer '+accessToken}
    });
    instance.get('https://ucollex.stage.authc.io/oauth/userinfo').then(res=>{
      resolve(res)
    })
  })
}

const getNFTs = async (token) =>{
  return new Promise(async(resolve,reject)=>{
    const accessToken = token?token:await auth0.getTokenSilently();
    const instance = axios.create({
      headers: {'Authorization': 'Bearer '+accessToken}
    });
    instance.get('https://apiv2-stage.ucollex.io/nft/api/v2/me/tokens').then(res=>{
      resolve(res)
    })
  })
}

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }
      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
