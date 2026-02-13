// src/config/auth.ts
export interface AuthConfig {
    authority: string;
    clientId: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
    silentRedirectUri: string;
    responseType: string;
    scope: string;
    automaticSilentRenew: boolean;
    loadUserInfo: boolean;
    monitorSession: boolean;
    audience: string;
}

// Configuration for your external OAuth provider
export const authConfig: AuthConfig = {
    authority: 'https://quoll.datakiosk.com/oauth', // From your .NET app config
    clientId: 'A03D34FD-8AE0-415C-83CE-F95E0B08BD2C', // Different from .NET app!
    redirectUri: 'https://localhost:5174/signin-oidc',
    postLogoutRedirectUri: 'https://localhost:5174',
    silentRedirectUri: 'https://localhost:5174/authentication/silent-callback.html',
    responseType: 'code',
    scope: 'ec_profile ec7api.super ec7api.read ec7api.write offline_access',
    automaticSilentRenew: true,
    loadUserInfo: true,
    monitorSession: true,
    audience: 'ec7api' // From your .NET app config
};