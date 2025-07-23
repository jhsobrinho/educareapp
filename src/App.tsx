import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/providers/CustomAuthProvider";
import "@/utils/authStorage"; // Importar utilitários de armazenamento de autenticação
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import BlogPost from "./pages/BlogPost";
import EducareApp from "./pages/educare-app/EducareApp";
import EducareAuth from "./pages/educare-app/auth/EducareAuth";
import EducareAppDashboard from "./pages/educare-app/EducareAppDashboard";
import ChildrenManagement from "./pages/educare-app/ChildrenManagement";
import ChildProfile from "./pages/educare-app/ChildProfile";
import ChildForm from "./pages/educare-app/ChildForm";
import JourneyBotPage from "./pages/educare-app/JourneyBotPage";
import EducareActivitiesPage from "./pages/educare-app/ActivitiesPage";
import EducareSettingsPage from "./pages/educare-app/SettingsPage";
import ProfessionalDashboard from "./pages/educare-app/professional/ProfessionalDashboard";
import ChildAnalysis from "./pages/educare-app/professional/ChildAnalysis";
import EducareAppLayout from "./pages/educare-app/EducareAppLayout";
import AprendizadoLanding from "./pages/educare-app/AprendizadoLanding";
import WhatsAppJourneyBotPage from "./pages/WhatsAppJourneyBotPage";

// Admin Pages
import OwnerDashboard from "./pages/admin/OwnerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import SubscriptionPlansManagement from "./pages/admin/SubscriptionPlansManagement";
import UserManagement from "./pages/admin/UserManagement";
import AdminProfessionals from "./pages/admin/AdminProfessionals";
import ProfessionalOnlyGuard from "./components/auth/ProfessionalOnlyGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main Route - Redirect to Official Landing Page */}
              <Route path="/" element={<Navigate to="/educare-app" replace />} />
              
              {/* Contact Page */}
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Blog Routes */}
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/blog/category/:category" element={<BlogPage />} />
              
              {/* Official Educare App Landing Page */}
              <Route path="/educare-app" element={<EducareApp />} />
              <Route path="/educare-app/auth" element={<EducareAuth />} />
              
              {/* Protected Educare App Routes */}
              <Route path="/educare-app" element={<EducareAppLayout />}>
                <Route path="dashboard" element={<EducareAppDashboard />} />
                <Route path="children" element={<ChildrenManagement />} />
                <Route path="child/:id" element={<ChildProfile />} />
                <Route path="child/new" element={<ChildForm />} />
                <Route path="child/:id/edit" element={<ChildForm />} />
                <Route path="journey-bot" element={<JourneyBotPage />} />
                <Route path="journey-bot-whatsapp/:childId" element={<WhatsAppJourneyBotPage />} />
                <Route path="activities" element={<EducareActivitiesPage />} />
                <Route path="settings" element={<EducareSettingsPage />} />
                
                {/* Professional Routes - Protected */}
                <Route path="professional/dashboard" element={
                  <ProfessionalOnlyGuard>
                    <ProfessionalDashboard />
                  </ProfessionalOnlyGuard>
                } />
                <Route path="professional/analysis/:childId" element={
                  <ProfessionalOnlyGuard>
                    <ChildAnalysis />
                  </ProfessionalOnlyGuard>
                } />
                
                {/* Admin Routes */}
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/professionals" element={<AdminProfessionals />} />
                <Route path="admin/plans" element={<SubscriptionPlansManagement />} />
                <Route path="owner/dashboard" element={<OwnerDashboard />} />
                <Route path="owner/users" element={<UserManagement />} />
                <Route path="owner/professionals" element={<AdminProfessionals />} />
                <Route path="owner/plans" element={<SubscriptionPlansManagement />} />
                <Route path="super-admin/dashboard" element={<SuperAdminDashboard />} />
              </Route>
              
              {/* Academia Educare+ Routes */}
              <Route path="/educare-app/academia" element={<AprendizadoLanding />} />
              <Route path="/educare-app/academia/*" element={<Navigate to="/educare-app/academia" replace />} />
              
              {/* Existing Aprendizado routes (keeping for backward compatibility) */}
              <Route path="/educare-app/aprendizado" element={<AprendizadoLanding />} />
              
              {/* Loja Educare+ - Enhanced placeholder */}
              <Route path="/educare-app/loja" element={
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  <div className="text-center max-w-2xl px-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-white font-bold text-2xl">E+</span>
                    </div>
                    <h1 className="text-4xl font-bold text-emerald-600 mb-4">Loja Educare+</h1>
                    <p className="text-xl text-gray-600 mb-6">
                      Em breve! Recursos educacionais, materiais didáticos e ferramentas especializadas 
                      para apoiar o desenvolvimento infantil.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={() => window.history.back()}
                        className="bg-emerald-600 text-white px-8 py-4 rounded-full hover:bg-emerald-700 transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={() => window.location.href = '/contact'}
                        className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-4 rounded-full hover:bg-emerald-50 transition-colors"
                      >
                        Entre em Contato
                      </button>
                    </div>
                  </div>
                </div>
              } />
              
              {/* Support/Help Route */}
              <Route path="/educare-app/support" element={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <div className="text-center max-w-2xl px-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-white font-bold text-2xl">?</span>
                    </div>
                    <h1 className="text-4xl font-bold text-blue-600 mb-4">Suporte Educare+</h1>
                    <p className="text-xl text-gray-600 mb-6">
                      Precisa de ajuda? Estamos aqui para apoiar sua jornada no desenvolvimento infantil.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={() => window.history.back()}
                        className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={() => window.location.href = '/contact'}
                        className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        Contato
                      </button>
                    </div>
                  </div>
                </div>
              } />
              
              {/* Catch all - redirect to official landing */}
              <Route path="*" element={<Navigate to="/educare-app" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
