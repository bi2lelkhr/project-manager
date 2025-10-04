import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicWrapper from "./features/hoc/UnProtected.tsx";
import Login from "./pages/Login.tsx";
import PrivateWrapper from "./features/hoc/Protected.tsx";
import Projects from "./pages/Projects.tsx";
import Quartiers from "./pages/Quartiers.tsx";
import Zones from "./pages/Zones.tsx";
import Risques from "./pages/Risques.tsx";
import Sprints from "./pages/Sprints.tsx";
import Deploiments from "./pages/Deploiments.tsx";
import Users from "./pages/Users.tsx";
import Board from "./pages/Board.tsx";
import Infrastructure from "./pages/Infrastructure.tsx";
import DevStack from "./pages/DevStack.tsx";
import Noeud from "./pages/Noeud.tsx";
import TypeNoeud from "./pages/TypeNoeud.tsx";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicWrapper>
              <Login />
            </PublicWrapper>
          }
        />

        {/* Private Routes */}
        <Route
          path="/home"
          element={
            <PrivateWrapper>
              <Board />
            </PrivateWrapper>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateWrapper>
              <Users />
            </PrivateWrapper>
          }
        />

        <Route
          path="/projects"
          element={
            <PrivateWrapper>
              <Projects />
            </PrivateWrapper>
          }
        />

        <Route
          path="/infrastructure"
          element={
            <PrivateWrapper>
              <Infrastructure />
            </PrivateWrapper>
          }
        />

        <Route
          path="/quartiers"
          element={
            <PrivateWrapper>
              <Quartiers />
            </PrivateWrapper>
          }
        />

        <Route
          path="/zones"
          element={
            <PrivateWrapper>
              <Zones />
            </PrivateWrapper>
          }
        />

        <Route
          path="/risques"
          element={
            <PrivateWrapper>
              <Risques />
            </PrivateWrapper>
          }
        />

        <Route
          path="/sprints"
          element={
            <PrivateWrapper>
              <Sprints />
            </PrivateWrapper>
          }
        />

        <Route
          path="/deploiements"
          element={
            <PrivateWrapper>
              <Deploiments />
            </PrivateWrapper>
          }
        />

        <Route
          path="/dev-stack"
          element={
            <PrivateWrapper>
              <DevStack />
            </PrivateWrapper>
          }
        />

        <Route
          path="/noeud"
          element={
            <PrivateWrapper>
              <Noeud />
            </PrivateWrapper>
          }
        />

        <Route
          path="/type-noeud"
          element={
            <PrivateWrapper>
              <TypeNoeud />
            </PrivateWrapper>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);
