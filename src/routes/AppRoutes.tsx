import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Team from "../pages/Teams";
import Login from "../pages/Login";
import NotFoundPage from "../pages/NotFoundPage";
import ProjectDetails from "../pages/ProjectDetails";
import Signup from "../pages/SignUp";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
