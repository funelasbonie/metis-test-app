// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/';

    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, from]);

    const handleLogin = async () => {
        try {
            clearError();
            await login();
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    // Check for SSO parameters from .NET app
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ssoEnabled = urlParams.get('sso') === 'true';

        if (ssoEnabled && !isLoading) {
            // If SSO is enabled but we're not authenticated, trigger login
            if (!isAuthenticated) {
                handleLogin();
            }
        }
    }, [isLoading, isAuthenticated]);

    return (
        <div className= "login-container" >
        <div className="login-card" >
            <h1>Welcome to React App </h1>

    {
        error && (
            <div className="alert alert-error" >
                <p>{ error } </p>
                < button onClick = { clearError } className = "close-btn" >& times; </button>
                    </div>
        )}

<div className="login-content" >
    <p>This application requires authentication.</p>
        < p > You will be redirected to your identity provider.</p>

            < button
onClick = { handleLogin }
disabled = { isLoading }
className = "login-button"
    >
    { isLoading? 'Redirecting...': 'Login with SSO' }
    </button>

    < div className = "login-info" >
        <p className="info-text" >
            <small>
            If you came from the.NET app, authentication should happen automatically.
                < br />
                If not, click the button above.
              </small>
                    </p>
                    </div>
                    </div>
                    </div>
                    </div>
  );
};

export default LoginPage;