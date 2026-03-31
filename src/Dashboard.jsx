import { useEffect, useState } from "react";
import { subscribeBills } from "./firebase";

export default function Dashboard() {
    const [bills, setBills] = useState([]);

    useEffect(() => {
        const unsub = subscribeBills(setBills);
        return () => unsub();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2>Dashboard</h2>

            {bills.map((bill) => (
                <div key={bill.id} style={{ border: "1px solid gray", margin: 10 }}>
                    <h3>{bill.title}</h3>
                    <p>₹{bill.totalAmount}</p>
                    <p>{bill.category}</p>
                    <p>
                        Paid:{" "}
                        {bill.members?.filter((m) => m.paid).length}/
                        {bill.members?.length}
                    </p>
                </div>
            ))}
        </div>
    );
}