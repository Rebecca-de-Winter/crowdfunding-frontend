import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

function Layout() {
  return (
    <div>
      <NavBar />
      <Outlet />
      <footer>
        By Becky Cole
      </footer>
    </div>
  );
}

export default Layout;