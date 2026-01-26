import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import Chat from "./pages/Chat";
import LandingPage from "./pages/LandingPage";
import MyProjects from "./pages/MyProjects";
import Auth from "./pages/Auth";
import Support from "./pages/Support";
import PageTransition from "./components/PageTransition";
import Hyperspeed, { hyperspeedPresets } from "./components/Hyperspeed";

const Background = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <AnimatePresence>
      {isHome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed -top-[20%] left-0 right-0 bottom-0 z-0 pointer-events-none"
        >
          <Hyperspeed effectOptions={hyperspeedPresets.one} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />
        <Route
          path="/auth"
          element={
            <PageTransition>
              <Auth />
            </PageTransition>
          }
        />
        <Route
          path="/my-projects"
          element={
            <PageTransition>
              <MyProjects />
            </PageTransition>
          }
        />
        <Route
          path="/chat"
          element={
            <PageTransition>
              <Chat />
            </PageTransition>
          }
        />
        <Route
          path="/support"
          element={
            <PageTransition>
              <Support />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="bg-black min-h-screen">
        <BrowserRouter>
          <Background />
          <AnimatedRoutes />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
