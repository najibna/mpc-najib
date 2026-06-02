import { BrowserRouter } from "react-router-dom";
import HomePreload from "./components/HomePreload";
import Layout from "./components/layout/Layout";
import PersistentRoutes from "./components/PersistentRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <HomePreload />
      <Layout>
        <PersistentRoutes />
      </Layout>
    </BrowserRouter>
  );
}
