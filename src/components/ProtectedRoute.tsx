// src/components/ProtectedRoute.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className= "loading-container" >
            <div className="spinner" > </div>
                < p > Loading authentication...</p>
                    </div>
    );
  }

if (!isAuthenticated) {
    // Save the location they tried to visit
    return <Navigate to="/login" state = {{ from: location }
} replace />;
  }

return <>{ children } </>;
};

export default ProtectedRoute;