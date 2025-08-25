import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotebookTabs, Users, Shield, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <NotebookTabs className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Address Book</h1>
          <p className="text-xl text-gray-600 mb-8">
            A secure, professional contact management system with role-based access control
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center bg-white">
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Contact Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Store and organize all your contacts with comprehensive search capabilities
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-white">
            <CardHeader>
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based permissions and IP restrictions ensure your data stays protected
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-white">
            <CardHeader>
              <Download className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Import & Export</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easily manage contacts in bulk with CSV import and export functionality
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-md mx-auto bg-white">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to access your address book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}