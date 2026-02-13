// src/pages/CallbackPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CallbackPage: React.FC = () => {
    const { user, isLoading, error } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading) {
            if (user) {
                // Success - redirect to home
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1000);
            } else if (error) {
                // Error - redirect to login
                setTimeout(() => {
                    navigate('/login', {
                        replace: true,
                        state: { error }
                    });
                }, 2000);
            }
        }
    }, [isLoading, user, error, navigate]);

    return (
        <div className="callback-container">
            <div className="callback-content">
                {isLoading ? (
                    <>
                        <div className="spinner-large"></div>
                        <h2>Completing authentication...</h2>
                        <p>Please wait while we complete the login process.</p>
                    </>
                ) : user ? (
                    <>
                        <div className="success-icon">✓</div>
                        <h2>Login Successful!</h2>
                        <p>Redirecting to application...</p>
                    </>
                ) : (
                    <>
                        <div className="error-icon">✗</div>
                        <h2>Login Failed</h2>
                        <p>{error || 'An error occurred during authentication'}</p>
                        <p>Redirecting to login page...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallbackPage;