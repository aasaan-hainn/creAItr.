import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import PageTransition from "./components/PageTransition";
import Hyperspeed, { hyperspeedPresets } from "./components/Hyperspeed";

const Chat = lazy(() => import("./pages/Chat"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const Trends = lazy(() => import("./pages/Trends"));
const Auth = lazy(() => import("./pages/Auth"));
const Support = lazy(() => import("./pages/Support"));
const Settings = lazy(() => import("./pages/Settings"));

const RouteLoader = () => (
  <div className="min-h-screen w-full bg-black flex items-center justify-center">
    <div className="h-10 w-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
  </div>
);
const MotionDiv = motion.div;

const Background = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
      <AnimatePresence>
      {isHome && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed -top-[20%] left-0 right-0 bottom-0 z-0 pointer-events-none"
        >
          <Hyperspeed effectOptions={hyperspeedPresets.one} />
        </MotionDiv>
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
          path="/trends"
          element={
            <PageTransition>
              <Trends />
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
        <Route
          path="/settings"
          element={
            <PageTransition>
              <Settings />
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
          <Suspense fallback={<RouteLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
