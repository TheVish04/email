import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layout/SidebarLayout';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/NewTicket';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SidebarLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="new-ticket" element={<NewTicket />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
