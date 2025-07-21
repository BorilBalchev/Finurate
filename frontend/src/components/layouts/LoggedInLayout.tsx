import Navbar from "../navbar/Navbar";
import { Outlet } from 'react-router-dom';

const LoggedInLayout = () => {
    return (
        <>
            <Navbar content={<Outlet/>}/>
        </>
    )
}

export default LoggedInLayout