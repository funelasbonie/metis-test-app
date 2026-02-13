// src/services/authService.ts
import { UserManager, WebStorageStateStore, User, SigninResponse } from 'oidc-client-ts';
import { authConfig } from '../config/auth';

class AuthService {
    private userManager: UserManager;
    private user: User | null = null;
    private isInitializing: boolean = false;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.userManager = new UserManager({
            authority: authConfig.authority,
            client_id: authConfig.clientId,
            redirect_uri: authConfig.redirectUri,
            post_logout_redirect_uri: authConfig.postLogoutRedirectUri,
            silent_redirect_uri: authConfig.silentRedirectUri,
            response_type: authConfig.responseType,
            scope: authConfig.scope,
            automaticSilentRenew: authConfig.automaticSilentRenew,
            loadUserInfo: authConfig.loadUserInfo,
            monitorSession: authConfig.monitorSession,
            userStore: new WebStorageStateStore({ store: window.localStorage }),

            // Metadata - we'll use discovery endpoint
            metadata: {
                issuer: authConfig.authority,
                authorization_endpoint: `${authConfig.authority}/connect/authorize`,
                token_endpoint: `${authConfig.authority}/connect/token`,
                userinfo_endpoint: `${authConfig.authority}/connect/verify/user`,
                end_session_endpoint: `${authConfig.authority}/v2/logout`,
                jwks_uri: `${authConfig.authority}/.well-known/jwks.json`
            }
        });

        this.setupEvents();
    }

    private setupEvents(): void {
        this.userManager.events.addUserLoaded((user) => {
            console.log('User loaded:', user);
            this.user = user;
        });

        this.userManager.events.addUserUnloaded(() => {
            console.log('User unloaded');
            this.user = null;
        });

        this.userManager.events.addAccessTokenExpiring(() => {
            console.log('Access token expiring, attempting silent renew...');
            this.silentRenew().catch(error => {
                console.error('Silent renew failed:', error);
            });
        });

        this.userManager.events.addAccessTokenExpired(() => {
            console.log('Access token expired');
            this.user = null;
        });

        this.userManager.events.addSilentRenewError((error) => {
            console.error('Silent renew error:', error);
        });

        this.userManager.events.addUserSignedOut(() => {
            console.log('User signed out');
            this.user = null;
            localStorage.removeItem('oauth_state');
            localStorage.removeItem('pkce_code_verifier');
        });
    }

    async initialize(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('Initializing auth service...');

                // Check URL parameters for SSO from .NET app
                const urlParams = new URLSearchParams(window.location.search);
                const ssoEnabled = urlParams.get('sso') === 'true';
                const state = urlParams.get('state');
                const codeChallenge = urlParams.get('code_challenge');

                if (ssoEnabled && state && codeChallenge) {
                    console.log('SSO flow detected from .NET app');
                    await this.handleSsoFlow(state, codeChallenge);
                } else {
                    // Normal OAuth flow
                    await this.handleNormalFlow();
                }

                resolve();
            } catch (error) {
                console.error('Auth initialization failed:', error);
                reject(error);
            } finally {
                this.isInitializing = false;
            }
        });

        return this.initPromise;
    }

    private async handleSsoFlow(state: string, _codeChallenge: string): Promise<void> {
        // Store SSO parameters
        localStorage.setItem('oauth_state', state);

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);

        // Try silent authentication first
        // oidc-client-ts handles PKCE (code_challenge/code_verifier) automatically
        try {
            console.log('Attempting silent authentication...');
            await this.userManager.signinSilent({
                state
            });

            console.log('Silent authentication successful');

            // Notify .NET app that SSO completed
            if (window.opener) {
                window.opener.postMessage({
                    type: 'SSO_COMPLETE',
                    timestamp: new Date().toISOString()
                }, '*');
            }

        } catch (silentError) {
            console.log('Silent auth failed, falling back to redirect:', silentError);

            // Fallback to redirect with SSO parameters
            await this.userManager.signinRedirect({
                state
            });
        }
    }

    private async handleNormalFlow(): Promise<void> {
        // Check for existing user
        const user = await this.userManager.getUser();

        if (user && !user.expired) {
            this.user = user;
            return;
        }

        // Handle callback if we're on callback page
        if (window.location.pathname.includes('/signin-oidc')) {
            try {
                console.log('Handling signin callback, URL:', window.location.href);
                const response = await this.userManager.signinCallback();
                console.log('signinCallback response:', response);
                this.user = response ?? null;
                window.history.replaceState({}, '', '/');
            } catch (error) {
                console.error('Error handling callback:', error);
                console.error('Current URL:', window.location.href);
                // Check if state exists in storage
                const keys = Object.keys(localStorage).filter(k => k.startsWith('oidc.'));
                console.error('OIDC localStorage keys:', keys);
                throw error;
            }
        }
    }

    async login(): Promise<void> {
        await this.userManager.signinRedirect();
    }

    async logout(): Promise<void> {
        await this.userManager.signoutRedirect();
    }

    async silentRenew(): Promise<User | null> {
        try {
            const user = await this.userManager.signinSilent();
            this.user = user;
            return user;
        } catch (error) {
            console.error('Silent renew failed:', error);

            // If silent renew fails, try regular redirect
            if (this.user) {
                await this.login();
            }

            return null;
        }
    }

    async getAccessToken(): Promise<string | null> {
        const user = await this.userManager.getUser();

        if (user && user.access_token && !user.expired) {
            this.user = user;
            return user.access_token;
        }

        return null;
    }

    async getUser(): Promise<User | null> {
        if (!this.user) {
            this.user = await this.userManager.getUser();
        }

        return this.user;
    }

    isAuthenticated(): boolean {
        return !!(this.user && !this.user.expired);
    }

    // For testing - get user info
    async getUserInfo(): Promise<any> {
        const user = await this.getUser();
        return user?.profile;
    }
}

// Singleton instance
export const authService = new AuthService();