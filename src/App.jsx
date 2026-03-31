import { useState } from "react";
import CreateBill from "./CreateBills.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
    const [page, setPage] = useState("dashboard");

    return (
        <div style={{ padding: 20 }}>
            <h1>Equora 💰</h1>

            <button onClick={() => setPage("dashboard")}>
                Dashboard
            </button>

            <button onClick={() => setPage("create")}>
                Create Bill
            </button>

            <hr />

            {page === "dashboard" && <Dashboard />}
            {page === "create" && <CreateBill />}
        </div>
    );
}