// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
    const { user, logout } = useAuth();
    const [apiData, setApiData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (endpoint: string) => {
        setLoading(true);
        setError(null);

        try {
            let data;

            switch (endpoint) {
                case 'protected':
                    data = await apiService.getProtectedData();
                    break;
                case 'shared':
                    data = await apiService.getSharedData();
                    break;
                case 'public':
                    data = await apiService.getPublicData();
                    break;
                case 'userinfo':
                    data = await apiService.getUserInfo();
                    break;
                default:
                    throw new Error('Invalid endpoint');
            }

            setApiData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Notify .NET app that we're ready
    useEffect(() => {
        if (user && window.opener) {
            window.opener.postMessage({
                type: 'SSO_COMPLETE',
                timestamp: new Date().toISOString(),
                user: user.profile
            }, '*');
        }
    }, [user]);

    return (
        <div className="home-container">
            <header className="header">
                <div className="header-content">
                    <h1>React Application</h1>
                    <div className="user-info">
                        {user && (
                            <>
                                <span className="user-name">{user.profile.name || user.profile.email}</span>
                                <button onClick={logout} className="logout-button">
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="user-panel">
                    <h2>User Information</h2>
                    {user ? (
                        <div className="user-details">
                            <pre className="user-profile">
                                {JSON.stringify(user.profile, null, 2)}
                            </pre>
                            <div className="token-info">
                                <p><strong>Access Token:</strong> {user.access_token ? '✓ Present' : '✗ Missing'}</p>
                                <p><strong>Token Expires:</strong> {user.expires_at ? new Date(user.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                                <p><strong>Scopes:</strong> {user.scope}</p>
                            </div>
                        </div>
                    ) : (
                        <p>No user information available</p>
                    )}
                </div>

                <div className="api-panel">
                    <h2>API Testing</h2>

                    <div className="api-buttons">
                        <button
                            onClick={() => fetchData('protected')}
                            disabled={loading}
                            className="api-button"
                        >
                            Get Protected Data
                        </button>
                        <button
                            onClick={() => fetchData('shared')}
                            disabled={loading}
                            className="api-button"
                        >
                            Get Shared Data
                        </button>
                        <button
                            onClick={() => fetchData('public')}
                            disabled={loading}
                            className="api-button"
                        >
                            Get Public Data
                        </button>
                        <button
                            onClick={() => fetchData('userinfo')}
                            disabled={loading}
                            className="api-button"
                        >
                            Get User Info from .NET
                        </button>
                    </div>

                    {loading && (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Loading data...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-alert">
                            <p><strong>Error:</strong> {error}</p>
                        </div>
                    )}

                    {apiData && (
                        <div className="api-response">
                            <h3>API Response</h3>
                            <pre className="response-data">
                                {JSON.stringify(apiData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="sso-info">
                    <h2>SSO Information</h2>
                    <p>
                        This app was opened from your .NET application using Single Sign-On.
                        The authentication happened automatically because you were already logged in.
                    </p>
                    <div className="window-info">
                        <p>
                            <strong>Window Status:</strong> {window.opener ? 'Opened from .NET app' : 'Independent window'}
                        </p>
                        {window.opener && (
                            <button
                                onClick={() => window.opener?.postMessage({ type: 'PING' }, '*')}
                                className="test-button"
                            >
                                Test .NET App Connection
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;