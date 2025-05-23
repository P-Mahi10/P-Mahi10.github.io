
import { Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { useData } from "@/context/DataContext";

export default function Index() {
  const { currentUser } = useData();
  
  // Show dashboard if logged in, otherwise show login
  return currentUser ? <Dashboard /> : <Login />;
}
