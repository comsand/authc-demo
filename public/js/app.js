
// The Authc client, initialized in configureClient()
let authc = null;

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
      authc.loginWithRedirect(options)
    }else if(type===2){
      // 弹出页面
      let result = authc.loginWithPopup(options)
      result.then(res=>{
        console.log('登录成功',res)
        updateUI()
      }).catch(err=>{
        console.log('登录失败',err)
      })
    }else{
      // 内嵌登录组件
      let promise = authc.loginWithIframe(options)
      promise.then(res=>{
        console.log('登录成功',res)
        updateUI()
      }).catch(err=>{
        console.log('登录失败',err)
      })
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
    authc.logout({
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
 * Initializes the Authc client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  authc = await createAuthcClient({
    domain: config.domain,
    client_id: config.clientId,
    useRefreshTokens: true,
    cacheLocation: 'localstorage', 
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await authc.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

const getUserInfio = async (token)=>{

  const response = await fetchAuthConfig();
  const config = await response.json();

  return new Promise(async(resolve,reject)=>{
    const accessToken = token?token:await authc.getTokenSilently();
    const instance = axios.create({
      headers: {'Authorization': 'Bearer '+accessToken}
    });
    let url = ''
    if (!/^https?:\/\//.test(config.domain)) {
      url = `https://${config.domain}`;
    }else{
      url = config.domain
    }
    instance.get(url + '/oauth/userinfo').then(res=>{
      resolve(res)
    })
  })
}

const getNFTs = async (token) =>{
  return new Promise(async(resolve,reject)=>{
    const accessToken = token?token:await authc.getTokenSilently();
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

  const isAuthenticated = await authc.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search||window.location.hash;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await authc.handleRedirectCallback();

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
