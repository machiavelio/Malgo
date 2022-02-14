import storage from "../common/storage-sync";
import { callApi } from "../common/call-api";

const clientId = "d17aeabc292e2928d936f61d4d410fab";
const clientSecret = "a09e3458367bbd5eccb06484fecbc5fa4069cfdd4efe9bb863fb242cd9fcd1a1";

function getAuthorizeUrl(): { url: string; nouce: string } {
  const baseUrl = "https://myanimelist.net/v1/oauth2/authorize";
  const redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());
  const nouce = Array(16)
    .fill(0)
    .map(() => Math.random().toString(36).substring(2, 10))
    .join("");

  const url = `${baseUrl}?client_id=${clientId}&code_challenge=${nouce}&redirect_uri=${redirectUrl}&response_type=code&code_challenge_method=plain`;

  return { url, nouce };
}

async function retrieveTokens(authorizeResponseUrl: string, nouce: string) {
  const code = new URL(authorizeResponseUrl).searchParams.get("code");
  const redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());

  const tokensResponse = await callApi("https://myanimelist.net/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirectUrl}&code_verifier=${nouce}`,
  });

  return tokensResponse;
}

async function getTokens(responseUrl: string, nouce: string) {
  const tokens = await retrieveTokens(responseUrl, nouce);

  const saveTokens = {
    expiresAt: Date.now() + tokens.expires_in * 1000,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };

  await storage.set(saveTokens);

  const { name } = await callApi("https://api.myanimelist.net/v2/users/@me");

  await storage.set({ username: name });
}

chrome.runtime.onMessage.addListener((request, _, response) => {
  if (request === "mal-logout") {
    storage.clear().then(() => {
      response(true);
    });
  }

  if (request === "mal-login") {
    const { url, nouce } = getAuthorizeUrl();

    chrome.identity.launchWebAuthFlow(
      {
        url: url,
        interactive: true,
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          response(false);
        }

        getTokens(responseUrl as string, nouce).then(() => {
          response(true);
        });
      },
    );
  }

  return true;
});
