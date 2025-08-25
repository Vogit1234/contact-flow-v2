import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import RestrictedAccess from './components/RestrictedAccess'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { IPRestrictionProvider } from './contexts/IPRestrictionContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <IPRestrictionProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/restricted" element={<RestrictedAccess />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </IPRestrictionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
