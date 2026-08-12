import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/verifications")({
  component: () => <Outlet />,
});
