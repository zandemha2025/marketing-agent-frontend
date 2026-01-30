import React, { useState, useEffect } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import KataLabPage from './pages/KataLabPage';
import './styles/global.css';

function App() {
    const [currentPage, setCurrentPage] = useState('onboarding');
    const [organizationId, setOrganizationId] = useState(null);

    // Check if we have a stored organization
    useEffect(() => {
        const storedOrgId = localStorage.getItem('organizationId');
        if (storedOrgId) {
            setOrganizationId(storedOrgId);
            setCurrentPage('dashboard');
        }
    }, []);

    const handleOnboardingComplete = (orgId) => {
        setOrganizationId(orgId);
        localStorage.setItem('organizationId', orgId);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('organizationId');
        setOrganizationId(null);
        setCurrentPage('onboarding');
    };

    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="app">
            {currentPage === 'onboarding' && (
                <OnboardingPage onComplete={handleOnboardingComplete} />
            )}
            {currentPage === 'dashboard' && organizationId && (
                <DashboardPage
                    organizationId={organizationId}
                    onLogout={handleLogout}
                    onNavigate={navigateTo}
                />
            )}
            {currentPage === 'kata-lab' && organizationId && (
                <KataLabPage
                    organizationId={organizationId}
                    onBack={() => navigateTo('dashboard')}
                />
            )}
        </div>
    );
}

export default App;
