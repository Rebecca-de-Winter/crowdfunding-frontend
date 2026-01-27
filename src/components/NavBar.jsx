import { Link } from "react-router-dom";

function NavBar() {
    return (
        <nav>
            <Link to="/">Home</Link>
            <Link to="/fundraiser">Fundraiser</Link>
        </nav>
    );
}
export default NavBar;