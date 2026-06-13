import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { VersionList, VersionCompare, RequirementEdit, ReviewResult, IssueList, ReportView } from "@/pages";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/versions" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/versions" element={<VersionList />} />
          <Route path="/versions/compare" element={<VersionCompare />} />
          <Route path="/versions/:id/requirements" element={<RequirementEdit />} />
          <Route path="/versions/:id/review" element={<ReviewResult />} />
          <Route path="/versions/:id/issues" element={<IssueList />} />
          <Route path="/versions/:id/report" element={<ReportView />} />
        </Route>
      </Routes>
    </Router>
  );
}